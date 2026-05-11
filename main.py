import base64
import mimetypes
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from groq import Groq
import os

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

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# ── Prompts for each menu option ──────────────────────────────────────────────
PROMPTS = {
    "1": "गेहूं की फसल के बारे में बुनियादी जानकारी ठीक 20 शब्दों में हिंदी में दें। किसान के अनुकूल भाषा में लिखें।",
    "2": "किसानों से संबंधित एक हालिया सनसनीखेज समाचार शीर्षक हिंदी में लिखें, जो 20 से 30 शब्दों का हो। केवल शीर्षक लिखें किसी भी न्यूज़ पेपर की, और कुछ नहीं।",
    "3": "कपास की खेती में उपयोग होने वाले उर्वरक के बारे में ठीक 20 शब्दों में हिंदी में बताएं। संक्षिप्त और व्यावहारिक रहें।",
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
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": "You are a helpful agricultural assistant. Always respond in Hindi using Devanagari script."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=100,
        )
        text = completion.choices[0].message.content.strip()
        return JSONResponse(content={"status": "success", "option": option, "result": text})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq API error: {str(e)}")


@app.post("/api/upload-image")
async def upload_image(file: UploadFile = File(...)):
    """
    Accepts an image, sends it to Groq Llama 4 Scout vision model,
    and returns the plant disease diagnosis in Hindi.
    """
    contents = await file.read()

    # Guess MIME type from filename
    mime_type, _ = mimetypes.guess_type(file.filename or "image.jpg")
    if mime_type is None:
        mime_type = "image/jpeg"

    # Convert to base64 data URL
    encoded = base64.b64encode(contents).decode("utf-8")
    image_data_url = f"data:{mime_type};base64,{encoded}"

    try:
        completion = client.chat.completions.create(
            model="meta-llama/llama-4-scout-17b-16e-instruct",
            messages=[
                {
                    "role": "system",
                    "content": (
                        "You are an agricultural plant disease expert. "
                        "Reply ONLY with the disease name in Hindi, exactly one short sentence, nothing else. "
                        "No explanation, no symptoms, no extra words."
                    )
                },
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": "इस फसल की तस्वीर देखकर केवल बीमारी का नाम हिंदी में एक वाक्य में बताओ।"
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": image_data_url
                            }
                        }
                    ]
                }
            ],
            temperature=0,
            max_completion_tokens=50,
            top_p=1,
        )
        result_text = completion.choices[0].message.content.strip()
        return JSONResponse(
            content={
                "status": "success",
                "result": result_text,
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Groq Vision API error: {str(e)}")



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
