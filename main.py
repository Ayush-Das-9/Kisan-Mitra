import base64
import io
import json
import mimetypes
import logging
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq, AuthenticationError, RateLimitError
from gtts import gTTS
import os

from farmer_profile import CHOICES, clean_profile
from live_data import (describe_prices, describe_weather, fetch_mandi_prices,
                       fetch_weather, missing_price_crops)
from prompts import (DEFAULT_LANG, assistant_background, build_menu_messages,
                     get_language, language_rule)

# ── Logging setup ──────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)
import asyncio
import urllib.request

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY not set in .env file")

# Optional second key, used only when the main key is rate-limited (429) or
# rejected (401). Groq applies rate limits per *organization*, so a backup key
# only adds capacity if it was created in a different Groq organization.
GROQ_API_KEY_BACKUP = os.getenv("GROQ_API_KEY_BACKUP")

groq_clients = [Groq(api_key=GROQ_API_KEY)]
if GROQ_API_KEY_BACKUP and GROQ_API_KEY_BACKUP != GROQ_API_KEY:
    groq_clients.append(Groq(api_key=GROQ_API_KEY_BACKUP))


def groq_call(make_request):
    """Run make_request(client) with the main Groq key; if that key is
    rate-limited or rejected, retry the same request with the backup key."""
    for i, groq_client in enumerate(groq_clients):
        try:
            return make_request(groq_client)
        except (RateLimitError, AuthenticationError) as e:
            if i == len(groq_clients) - 1:
                raise
            logger.warning("Groq key #%d failed (%s); retrying with backup key",
                           i + 1, type(e).__name__)

app = FastAPI(title="Kisan Mitra", description="Farmer's Digital Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

async def keep_alive():
    while True:
        await asyncio.sleep(12 * 60)  # 12 minutes
        try:
            # Using asyncio.to_thread to avoid blocking the event loop (Python 3.9+)
            await asyncio.to_thread(urllib.request.urlopen, "https://webapp-python.onrender.com")
            print("Pinged https://webapp-python.onrender.com to keep alive.")
        except Exception as e:
            print(f"Failed to ping keep-alive: {e}")

@app.on_event("startup")
async def startup_event():
    asyncio.create_task(keep_alive())

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


def profile_from_form(raw: str) -> dict:
    """Farm details sent as a JSON form field (photo / voice requests); bad JSON -> {}."""
    try:
        return clean_profile(json.loads(raw)) if raw else {}
    except ValueError:
        return {}


@app.get("/")
async def root():
    # Always revalidate the page so a cached old page is never paired with a
    # newer app.js after a deploy (asset URLs in index.html carry a ?v= tag).
    return FileResponse(os.path.join(STATIC_DIR, "index.html"),
                        headers={"Cache-Control": "no-cache"})


@app.get("/api/profile-options")
async def profile_options():
    """Choice lists (with hi/pa/en labels) for the one-time farm details form."""
    return {"fields": CHOICES}


async def live_data_for(option: str, profile: dict):
    """Real prices (option 4) or weather (option 5) as prompt text, or None.
    Never raises: any surprise from the data services means an AI-only answer."""
    try:
        return await _live_data_for(option, profile)
    except Exception as e:
        logger.warning("Live data for option %s failed: %r", option, e)
        return None


async def _live_data_for(option: str, profile: dict):
    if not profile.get("main_crop"):
        return None
    if option == "4" and profile.get("state"):
        crops = [profile["main_crop"]] + profile.get("other_crops", [])
        records = await fetch_mandi_prices(profile["state"], crops)
        return describe_prices(records, missing_price_crops(crops, records)) or None
    if option == "5" and (profile.get("district") or profile.get("state")):
        weather = await fetch_weather(profile.get("district", ""), profile.get("state", ""))
        return describe_weather(weather) if weather else None
    return None


class MenuRequest(BaseModel):
    lang: str = DEFAULT_LANG
    profile: dict | None = None


@app.post("/api/menu/{option}")
async def get_menu_response(option: str, req: MenuRequest):
    """
    Calls Groq API for the given menu option and returns the AI-generated
    text response in the requested UI language (hi / pa / en), personalized
    with the farmer's details when the browser sends them.
    """
    return await menu_answer(option, req.lang, clean_profile(req.profile))


@app.get("/api/menu/{option}")
async def get_menu_response_legacy(option: str, lang: str = DEFAULT_LANG):
    """Old GET form, kept for browsers still running the previous app.js
    (generic answers, no farm details). Safe to remove in a later release."""
    return await menu_answer(option, lang, {})


async def menu_answer(option: str, lang: str, profile: dict):
    live_text = await live_data_for(option, profile)
    try:
        messages = build_menu_messages(option, lang, profile, live_text)
    except KeyError:
        raise HTTPException(status_code=404, detail=f"Option '{option}' not found.")

    try:
        completion = groq_call(lambda c: c.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=messages,
            temperature=0.6,
            # Groq's on-demand tier refuses any request whose max output exceeds
            # the account's 1000 output-tokens-per-minute limit; ~20-30 words needs ~150.
            max_completion_tokens=400,
            top_p=0.95,
            reasoning_effort="default",
            stream=True,
            stop=None,
        ))
        text = ""
        for chunk in completion:
            text += chunk.choices[0].delta.content or ""
        text = text.strip()
        return JSONResponse(content={"status": "success", "option": option, "result": text})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")


# Groq rejects inline (base64) image requests over ~4 MB; the browser shrinks
# photos to ~1024 px before upload, so this only trips on unusual uploads.
MAX_IMAGE_BYTES = 3_500_000


@app.post("/api/upload-image")
async def upload_image(
    file: UploadFile = File(...),
    lang: str = Form(DEFAULT_LANG),
    profile: str = Form(""),
):
    """
    Accepts a crop photo and asks the vision-capable Qwen model to identify the
    disease or pest and suggest treatment, in the requested language.
    """
    contents = await file.read()
    if len(contents) < 100:
        raise HTTPException(status_code=400, detail="अमान्य छवि फ़ाइल।")
    if len(contents) > MAX_IMAGE_BYTES:
        raise HTTPException(status_code=413, detail="फ़ोटो बहुत बड़ी है। कृपया छोटी फ़ोटो भेजें।")

    mime = file.content_type if (file.content_type or "").startswith("image/") else (
        mimetypes.guess_type(file.filename or "")[0] or "image/jpeg"
    )
    image_url = f"data:{mime};base64,{base64.b64encode(contents).decode('ascii')}"

    try:
        completion = groq_call(lambda c: c.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an expert plant pathologist helping Indian farmers. "
                        f"{language_rule(lang)} "
                        "Plain text only, no markdown or bullet points."
                        f"{assistant_background(profile_from_form(profile))}"
                    ),
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": (
                                "Look at this photo from a farmer. In about 40 words: name the crop, "
                                "the most likely disease or pest (or say it looks healthy), and 1-2 "
                                "practical treatment steps. If the photo does not show a plant or is "
                                "too unclear to judge, say so and ask for a clear close-up of one "
                                "affected leaf in daylight."
                            ),
                        },
                        {"type": "image_url", "image_url": {"url": image_url}},
                    ],
                },
            ],
            temperature=0.6,
            # Groq's on-demand tier refuses any request whose max output exceeds
            # the account's 1000 output-tokens-per-minute limit; ~40 words needs ~200.
            max_completion_tokens=500,
            top_p=0.95,
            reasoning_effort="default",
            stream=True,
            stop=None,
        ))
        result_text = ""
        for chunk in completion:
            result_text += chunk.choices[0].delta.content or ""
        return JSONResponse(content={"status": "success", "result": result_text.strip()})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")


# ── Voice Chat: STT + LLM pipeline ────────────────────────────────────────────
MAX_HISTORY_MESSAGES = 10      # last 5 exchanges
MAX_HISTORY_CHARS = 1000       # per message


def parse_history(raw: str) -> list:
    """Turn the client's JSON conversation history into safe chat messages."""
    try:
        items = json.loads(raw) if raw else []
    except ValueError:
        return []
    if not isinstance(items, list):
        return []
    messages = []
    for item in items[-MAX_HISTORY_MESSAGES:]:
        if (isinstance(item, dict)
                and item.get("role") in ("user", "assistant")
                and isinstance(item.get("content"), str)):
            messages.append({"role": item["role"], "content": item["content"][:MAX_HISTORY_CHARS]})
    return messages


@app.post("/api/voice-chat")
async def voice_chat(
    file: UploadFile = File(...),
    lang: str = Form(DEFAULT_LANG),
    history: str = Form(""),
    profile: str = Form(""),
):
    """
    Accepts audio from the browser mic, transcribes it via Groq Whisper,
    sends the transcription to the LLM, and returns the text response.
    The browser speaks the reply (Web Speech API, or /api/tts as fallback).
    `history` (optional JSON list of {role, content}) carries the earlier turns
    of a live conversation so follow-up questions have context.
    """
    logger.info("Voice chat request received: %s", file.filename)

    contents = await file.read()
    if len(contents) < 1000:
        logger.warning("Audio file too small (%d bytes), likely empty", len(contents))
        raise HTTPException(status_code=400, detail="रिकॉर्डिंग बहुत छोटी है। कृपया पुनः बोलें।")

    try:
        # Step 1: Speech-to-Text via Groq Whisper
        logger.info("Starting STT transcription...")
        transcription = groq_call(lambda c: c.audio.transcriptions.create(
            file=(file.filename or "recording.webm", contents),
            model="whisper-large-v3-turbo",
            language=get_language(lang)["whisper"],
        ))
        user_text = transcription.text.strip()
        logger.info("STT result: %s", user_text)

        if not user_text:
            raise HTTPException(status_code=400, detail="कोई आवाज़ नहीं सुनाई दी। कृपया पुनः बोलें।")

        # Step 2: LLM response via Groq
        logger.info("Sending to LLM...")
        completion = groq_call(lambda c: c.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are Kisan Mitra, a helpful agricultural assistant "
                        "talking with a farmer in a live spoken conversation. "
                        f"{language_rule(lang)} "
                        "Keep responses concise (2-3 sentences max). "
                        "Be friendly and practical. Plain text only, no markdown, "
                        "because your reply is read aloud."
                        f"{assistant_background(profile_from_form(profile))}"
                    ),
                },
                *parse_history(history),
                {"role": "user", "content": user_text},
            ],
            temperature=0.6,
            # Groq's on-demand tier refuses any request whose max output exceeds
            # the account's 1000 output-tokens-per-minute limit.
            max_completion_tokens=400,
            top_p=0.95,
            reasoning_effort="default",
            stream=True,
            stop=None,
        ))
        response_text = ""
        for chunk in completion:
            response_text += chunk.choices[0].delta.content or ""
        response_text = response_text.strip()
        logger.info("LLM response: %s", response_text)

        return JSONResponse(
            content={
                "status": "success",
                "transcription": user_text,
                "response": response_text,
            }
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Voice chat error: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail=f"Voice processing error: {str(e)}")


# ── Text-to-Speech fallback ───────────────────────────────────────────────────
# Most desktop browsers (and many phones) ship no Punjabi voice for the
# Web Speech API, so the frontend falls back to this endpoint (MP3 via gTTS)
# whenever the browser has no voice for the selected language.
TTS_MAX_CHARS = 3000


class TTSRequest(BaseModel):
    text: str
    lang: str = DEFAULT_LANG


@app.post("/api/tts")
async def text_to_speech(req: TTSRequest):
    text = req.text.strip()[:TTS_MAX_CHARS]
    if not text:
        raise HTTPException(status_code=400, detail="No text to speak.")

    def synthesize() -> bytes:
        buf = io.BytesIO()
        gTTS(text=text, lang=get_language(req.lang)["tts"]).write_to_fp(buf)
        return buf.getvalue()

    try:
        audio = await asyncio.to_thread(synthesize)
    except Exception as e:
        logger.error("TTS error: %s", str(e), exc_info=True)
        raise HTTPException(status_code=502, detail=f"TTS error: {str(e)}")
    return Response(content=audio, media_type="audio/mpeg")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
