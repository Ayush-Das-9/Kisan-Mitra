import base64
import io
import mimetypes
import logging
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse, Response
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
from gtts import gTTS
import os

# ── Logging setup ──────────────────────────────────────────────────────────────
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)
import asyncio
import urllib.request

load_dotenv()

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if not GROQ_API_KEY:
    raise RuntimeError("GROQ_API_KEY not set in .env file")

client = Groq(api_key=GROQ_API_KEY)

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

# ── Supported UI languages ────────────────────────────────────────────────────
# "prompt": how the LLM is told which language/script to answer in.
# "whisper": ISO-639-1 code for Groq Whisper STT.  "tts": gTTS language code.
LANGUAGES = {
    "hi": {"prompt": "Hindi (Devanagari script)", "whisper": "hi", "tts": "hi"},
    "pa": {"prompt": "Punjabi (Gurmukhi script)", "whisper": "pa", "tts": "pa"},
    "en": {"prompt": "English", "whisper": "en", "tts": "en"},
}
DEFAULT_LANG = "hi"


def get_language(lang: str) -> dict:
    return LANGUAGES.get(lang, LANGUAGES[DEFAULT_LANG])


def language_rule(lang: str) -> str:
    return f"Always respond only in {get_language(lang)['prompt']}."


# ── Prompts for each menu option ({language} is filled per request) ───────────
PROMPTS = {
    "1": "Give basic information about the wheat crop in exactly 20 words in {language}. Use farmer-friendly language.",
    "2": "Write one recent sensational news headline related to farmers, as printed in any newspaper, in {language}, 20 to 30 words long. Write only the headline, nothing else.",
    "3": "Describe the fertilizers used in cotton farming in exactly 20 words in {language}. Be brief and practical.",
    "4": "Give today's estimated prices of wheat, paddy and mustard in the major grain mandis in exactly 20 words in {language}.",
    "5": "Give a short weather forecast for today for farmers in North India in exactly 20 words in {language}.",
    "6": "Name 2 major diseases of wheat and paddy crops with one symptom each, in exactly 20 words in {language}.",
    "7": "Give 2 practical irrigation tips for Kharif crops in exactly 20 words in {language}.",
    "9": "Name 2 major government schemes for farmers with one benefit each, in exactly 20 words in {language}.",
    "10": "Explain the Pradhan Mantri Fasal Bima Yojana in exactly 20 words in {language}, in simple and clear language.",
}

IMAGE_UNAVAILABLE_PREFIX = {
    "hi": "⚠️ छवि विश्लेषण अभी उपलब्ध नहीं है। सुझाव:",
    "pa": "⚠️ ਤਸਵੀਰ ਵਿਸ਼ਲੇਸ਼ਣ ਹਾਲੇ ਉਪਲਬਧ ਨਹੀਂ ਹੈ। ਸੁਝਾਅ:",
    "en": "⚠️ Image analysis is not available yet. Tip:",
}


@app.get("/")
async def root():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


@app.get("/api/menu/{option}")
async def get_menu_response(option: str, lang: str = DEFAULT_LANG):
    """
    Calls Groq API for the given menu option and returns the AI-generated
    text response in the requested UI language (hi / pa / en).
    """
    prompt = PROMPTS.get(option)
    if not prompt:
        raise HTTPException(status_code=404, detail=f"Option '{option}' not found.")
    prompt = prompt.format(language=get_language(lang)["prompt"])

    try:
        completion = client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=[
                {"role": "system", "content": f"You are a helpful agricultural assistant. {language_rule(lang)}"},
                {"role": "user", "content": prompt}
            ],
            temperature=0.6,
            max_completion_tokens=2048,
            top_p=0.95,
            reasoning_effort="default",
            stream=True,
            stop=None,
        )
        text = ""
        for chunk in completion:
            text += chunk.choices[0].delta.content or ""
        text = text.strip()
        return JSONResponse(content={"status": "success", "option": option, "result": text})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")


@app.post("/api/upload-image")
async def upload_image(file: UploadFile = File(...), lang: str = Form(DEFAULT_LANG)):
    """
    Accepts an image and returns a default advisory in the requested language.
    Note: No vision model is currently available on this Groq account.
    Using qwen/qwen3.8-27b (text-only) for a general advisory response.
    """
    # Read the file to validate it's a real upload
    contents = await file.read()
    if len(contents) < 100:
        raise HTTPException(status_code=400, detail="अमान्य छवि फ़ाइल।")

    try:
        # qwen3.8-27b is text-only; it cannot analyze the actual image.
        # We ask it to give a general plant disease advisory in Hindi.
        completion = client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an agricultural plant disease expert. "
                        f"Reply ONLY in {get_language(lang)['prompt']}, exactly one short sentence. "
                        "No explanation, no extra words."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        "Crop disease detection from photos is not available yet. "
                        "Give the farmer one general tip on what to do to protect their crop."
                    )
                }
            ],
            temperature=0.6,
            max_completion_tokens=100,
            top_p=0.95,
            reasoning_effort="default",
            stream=True,
            stop=None,
        )
        result_text = ""
        for chunk in completion:
            result_text += chunk.choices[0].delta.content or ""
        result_text = result_text.strip()

        return JSONResponse(
            content={
                "status": "success",
                "result": f"{IMAGE_UNAVAILABLE_PREFIX.get(lang, IMAGE_UNAVAILABLE_PREFIX[DEFAULT_LANG])} {result_text}",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")


# ── Voice Chat: STT + LLM pipeline ────────────────────────────────────────────
@app.post("/api/voice-chat")
async def voice_chat(file: UploadFile = File(...), lang: str = Form(DEFAULT_LANG)):
    """
    Accepts audio from the browser mic, transcribes it via Groq Whisper,
    sends the transcription to the LLM, and returns the text response.
    The browser speaks the reply (Web Speech API, or /api/tts as fallback).
    """
    logger.info("Voice chat request received: %s", file.filename)

    contents = await file.read()
    if len(contents) < 1000:
        logger.warning("Audio file too small (%d bytes), likely empty", len(contents))
        raise HTTPException(status_code=400, detail="रिकॉर्डिंग बहुत छोटी है। कृपया पुनः बोलें।")

    try:
        # Step 1: Speech-to-Text via Groq Whisper
        logger.info("Starting STT transcription...")
        transcription = client.audio.transcriptions.create(
            file=(file.filename or "recording.webm", contents),
            model="whisper-large-v3-turbo",
            language=get_language(lang)["whisper"],
        )
        user_text = transcription.text.strip()
        logger.info("STT result: %s", user_text)

        if not user_text:
            raise HTTPException(status_code=400, detail="कोई आवाज़ नहीं सुनाई दी। कृपया पुनः बोलें।")

        # Step 2: LLM response via Groq
        logger.info("Sending to LLM...")
        completion = client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are Kisan Mitra, a helpful agricultural assistant. "
                        f"{language_rule(lang)} "
                        "Keep responses concise (2-3 sentences max). "
                        "Be friendly and practical."
                    ),
                },
                {"role": "user", "content": user_text},
            ],
            temperature=0.6,
            max_completion_tokens=2048,
            top_p=0.95,
            reasoning_effort="default",
            stream=True,
            stop=None,
        )
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
