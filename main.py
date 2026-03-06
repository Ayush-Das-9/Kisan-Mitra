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
    "1": "Give me basic crop information about wheat in exactly 20 words. Be concise and farmer-friendly.",
    "2": "Give me 1 recent news headline about wheat crop in 10 to 15 words. Just the headline, nothing else.",
    "3": "Tell me about the best fertilizer for wheat crop in exactly 20 words. Be concise and practical.",
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
                {"role": "system", "content": "You are a helpful agricultural assistant."},
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
    Placeholder endpoint for image-based disease detection.
    """
    contents = await file.read()
    return JSONResponse(
        content={
            "status": "success",
            "message": "Image received. ML analysis coming soon!",
            "filename": file.filename,
            "size_bytes": len(contents),
            "diagnosis": None,
        }
    )



if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
