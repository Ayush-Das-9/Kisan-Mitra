# Kisan Mitra (किसान मित्र)

A simple digital assistant for Indian farmers. The whole idea is that a farmer shouldn't need to learn a new interface — they just press a number (like on a phone keypad) and get useful agricultural info spoken back to them in Hindi.

## What it does

- **Numpad-based UI** — 10 options mapped to numbers 1–10. Tap a number, press OK, get an answer. No typing needed.
- **AI responses in Hindi** — Each option triggers a specific farming-related prompt (crop info, weather, market prices, govt schemes, etc.) that gets sent to Groq's LLaMA model. The response comes back in Hindi.
- **Plant disease detection** — Option 8 lets the user upload a photo of a plant. A vision model identifies the disease and returns the name in Hindi.
- **Voice output** — The browser reads out the response using the Web Speech API, so the farmer doesn't even need to read the screen.

## How it works

1. Farmer taps a number on the numpad and presses ✓
2. Frontend sends a request to the FastAPI backend (`/api/menu/{number}`)
3. Backend picks the matching Hindi prompt and sends it to Groq's API
4. AI response comes back → displayed on screen + read aloud

For disease detection, the image is base64-encoded and sent to Groq's vision model (`llama-4-scout`), which returns a one-line diagnosis in Hindi.

## Tech stack

| Layer    | Tech                                                                 |
|----------|----------------------------------------------------------------------|
| Backend  | Python, FastAPI, Uvicorn                                             |
| Frontend | HTML, CSS, vanilla JS (no frameworks)                                |
| AI       | Groq API — `llama-3.3-70b-versatile` (text), `llama-4-scout` (vision) |

## Project structure

```
WEBAPP_python/
├── main.py              # FastAPI app — routes, Groq API calls, keep-alive ping
├── requirements.txt     # Python deps
├── .env                 # Groq API key (not in git)
├── .gitignore
└── static/
    ├── index.html       # Numpad UI
    ├── style.css        # Dark theme, numpad grid, animations
    └── app.js           # Input handling, API calls, text-to-speech
```

## Running locally

1. Clone the repo

2. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

3. Create a `.env` file in the root with your Groq key:
   ```
   GROQ_API_KEY=your_key_here
   ```

4. Start the server:
   ```
   uvicorn main:app --reload
   ```

5. Open `http://localhost:8000` in your browser

## Deployment note

There's a built-in keep-alive task that pings the Render deployment URL every 12 minutes to prevent the free-tier instance from sleeping. If you're not deploying to Render, you can safely ignore or remove that part from `main.py`.
