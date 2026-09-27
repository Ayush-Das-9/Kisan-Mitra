import base64
import mimetypes
import logging
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from groq import Groq
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

# ── Prompts for each menu option ──────────────────────────────────────────────
PROMPTS = {
    "1": "गेहूं की फसल के बारे में बुनियादी जानकारी ठीक 20 शब्दों में हिंदी में दें। किसान के अनुकूल भाषा में लिखें।",
    "2": "किसानों से संबंधित एक हालिया सनसनीखेज समाचार शीर्षक हिंदी में लिखें, जो 20 से 30 शब्दों का हो। केवल शीर्षक लिखें किसी भी न्यूज़ पेपर की, और कुछ नहीं।",
    "3": "कपा स की खेती में उपयोग होने वाले उर्वरक के बारे में ठीक 20 शब्दों में हिंदी में बताएं। संक्षिप्त और व्यावहारिक रहें।",
    "4": "आज के प्रमुख अनाज मंडियों में गेहूं, धान और सरसों के अनुमानित भाव ठीक 20 शब्दों में हिंदी में बताएं।",
    "5": "उत्तर भारत के किसानों के लिए आज के मौसम का संक्षिप्त अनुमान ठीक 20 शब्दों में हिंदी में दें।",
    "6": "गेहूं और धान की फसल में लगने वाले 2 प्रमुख रोगों के नाम और एक-एक लक्षण ठीक 20 शब्दों में हिंदी में बताएं।",
    "7": "खरीफ फसलों के लिए सही सिंचाई के 2 व्यावहारिक सुझाव ठीक 20 शब्दों में हिंदी में दें।",
    "9": "किसानों के लिए 2 प्रमुख सरकारी योजनाओं के नाम और एक-एक लाभ ठीक 20 शब्दों में हिंदी में बताएं।",
    "10": "प्रधानमंत्री फसल बीमा योजना के बारे में ठीक 20 शब्दों में हिंदी में बताएं। सरल और स्पष्ट भाषा में।",
}


@app.get("/")
async def root():
    return FileResponse(os.path.join(STATIC_DIR, "index.html"))


@app.get("/api/menu/{option}")
async def get_menu_response(option: str):
    """
    Calls Groq API for the given menu option (1, 2, or 3)
    and returns the AI-generated text response.
    """
    prompt = PROMPTS.get(option)
    if not prompt:
        raise HTTPException(status_code=404, detail=f"Option '{option}' not found.")

    try:
        completion = client.chat.completions.create(
            model="qwen/qwen3.8-27b",
            messages=[
                {"role": "system", "content": "You are a helpful agricultural assistant. Always respond in Hindi using Devanagari script."},
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
async def upload_image(file: UploadFile = File(...)):
    """
    Accepts an image and returns a default Hindi response.
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
                        "Reply ONLY in Hindi using Devanagari script, exactly one short sentence. "
                        "No explanation, no extra words."
                    )
                },
                {
                    "role": "user",
                    "content": (
                        "फसल में रोग की पहचान अभी उपलब्ध नहीं है। "
                        "कृपया किसान को एक सामान्य सलाह दें कि वे अपनी फसल की सुरक्षा के लिए क्या करें।"
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
                "result": f"⚠️ छवि विश्लेषण अभी उपलब्ध नहीं है। सुझाव: {result_text}",
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")


# ── Voice Chat: STT + LLM pipeline ────────────────────────────────────────────
@app.post("/api/voice-chat")
async def voice_chat(file: UploadFile = File(...)):
    """
    Accepts audio from the browser mic, transcribes it via Groq Whisper,
    sends the transcription to the LLM, and returns the text response.
    Browser handles Hindi TTS via Web Speech API.
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
            language="hi",
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
                        "You are Kisan Mitra, a helpful Hindi-speaking agricultural assistant. "
                        "Always respond in Hindi using Devanagari script. "
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
