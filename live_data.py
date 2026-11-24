"""
Live data for the menu: weather from Open-Meteo (free, no key) and mandi
prices from the government's Agmarknet feed on data.gov.in. Every failure
returns None / [] so the menu can fall back to an AI-only answer.
"""

import asyncio
import logging
import os
import time
from datetime import date

import httpx

from farmer_profile import crop_name

logger = logging.getLogger(__name__)

TIMEOUT_SECONDS = 8
USER_AGENT = "KisanMitra/1.0"
GEOCODE_URL = "https://geocoding-api.open-meteo.com/v1/search"
FORECAST_URL = "https://api.open-meteo.com/v1/forecast"
PRICES_URL = "https://api.data.gov.in/resource/9ef84268-d588-465a-a308-a864a43d0070"
# data.gov.in's public sample key works (shared, 10 rows per request); a free
# personal key from data.gov.in is more reliable — set DATA_GOV_IN_API_KEY.
SAMPLE_PRICES_KEY = "579b464db66ec23bdd000001cdd3946e44ce4aad7209ff7b23ac571b"

LOOKUP_DEADLINE_SECONDS = 8   # a whole weather or price lookup, however many requests
GEOCODE_TTL = 24 * 3600
WEATHER_TTL = 30 * 60
PRICES_TTL = 30 * 60
FAILURE_TTL = 5 * 60          # don't retry a failed price lookup on every press
PRICE_ROWS_PER_CROP = 5

# Crop key -> Agmarknet commodity name (crops not listed have no price feed)
COMMODITY = {
    "wheat": "Wheat",
    "paddy": "Paddy(Dhan)(Common)",
    "cotton": "Cotton",
    "maize": "Maize",
    "mustard": "Mustard",
    "potato": "Potato",
    "pulses": "Bengal Gram(Gram)(Whole)",
}
AGMARKNET_STATE = {"Kerala": "Keralam"}

# Fallback location when a district can't be found: the state capital.
STATE_CAPITAL = {
    "Andhra Pradesh": ("Amaravati", 16.51, 80.52), "Arunachal Pradesh": ("Itanagar", 27.08, 93.61),
    "Assam": ("Dispur", 26.14, 91.79), "Bihar": ("Patna", 25.59, 85.14),
    "Chandigarh": ("Chandigarh", 30.73, 76.78), "Chhattisgarh": ("Raipur", 21.25, 81.63),
    "Delhi": ("New Delhi", 28.61, 77.21), "Goa": ("Panaji", 15.49, 73.83),
    "Gujarat": ("Gandhinagar", 23.22, 72.65), "Haryana": ("Chandigarh", 30.73, 76.78),
    "Himachal Pradesh": ("Shimla", 31.10, 77.17), "Jammu and Kashmir": ("Srinagar", 34.08, 74.80),
    "Jharkhand": ("Ranchi", 23.34, 85.31), "Karnataka": ("Bengaluru", 12.97, 77.59),
    "Kerala": ("Thiruvananthapuram", 8.52, 76.94), "Ladakh": ("Leh", 34.15, 77.58),
    "Madhya Pradesh": ("Bhopal", 23.26, 77.41), "Maharashtra": ("Mumbai", 19.08, 72.88),
    "Manipur": ("Imphal", 24.82, 93.94), "Meghalaya": ("Shillong", 25.58, 91.89),
    "Mizoram": ("Aizawl", 23.73, 92.72), "Nagaland": ("Kohima", 25.67, 94.11),
    "Odisha": ("Bhubaneswar", 20.30, 85.82), "Puducherry": ("Puducherry", 11.94, 79.81),
    "Punjab": ("Chandigarh", 30.73, 76.78), "Rajasthan": ("Jaipur", 26.91, 75.79),
    "Sikkim": ("Gangtok", 27.33, 88.61), "Tamil Nadu": ("Chennai", 13.08, 80.27),
    "Telangana": ("Hyderabad", 17.39, 78.49), "Tripura": ("Agartala", 23.83, 91.29),
    "Uttar Pradesh": ("Lucknow", 26.85, 80.95), "Uttarakhand": ("Dehradun", 30.32, 78.03),
    "West Bengal": ("Kolkata", 22.57, 88.36),
}

_transport = None      # tests swap in an httpx.MockTransport
_cache: dict = {}


def set_transport(transport) -> None:
    """Use a different HTTP transport (tests) and forget cached answers."""
    global _transport
    _transport = transport
    _cache.clear()


def _cache_get(key):
    hit = _cache.get(key)
    return hit[1] if hit and hit[0] > time.monotonic() else None


def _cache_put(key, value, ttl):
    _cache[key] = (time.monotonic() + ttl, value)


def _client() -> httpx.AsyncClient:
    # data.gov.in stalls requests carrying httpx's default "python-httpx/..."
    # User-Agent until they time out, so identify the app instead.
    return httpx.AsyncClient(timeout=TIMEOUT_SECONDS, transport=_transport,
                             headers={"User-Agent": USER_AGENT})


async def _get_json(client: httpx.AsyncClient, url: str, params: dict) -> dict:
    response = await client.get(url, params=params)
    response.raise_for_status()
    return response.json()


# ── Weather ───────────────────────────────────────────────────────────────────
def weather_words(code: int) -> str:
    if code == 0:
        return "clear sky"
    if code in (1, 2, 3):
        return "partly cloudy"
    if code in (45, 48):
        return "fog"
    if 51 <= code <= 57:
        return "drizzle"
    if 61 <= code <= 67:
        return "rain"
    if 71 <= code <= 77:
        return "snow"
    if 80 <= code <= 82:
        return "rain showers"
    if 95 <= code <= 99:
        return "thunderstorm"
    return "mixed weather"


async def _locate(client: httpx.AsyncClient, district: str, state: str):
    """(place label, lat, lon) for a district (preferring one in the given
    state), else the state capital, else None."""
    key = ("geo", district.lower(), state)
    cached = _cache_get(key)
    if cached:
        return cached

    location = None
    if district:
        data = await _get_json(client, GEOCODE_URL, {"name": district, "count": 10, "language": "en",
                                                     "format": "json", "countryCode": "IN"})
        results = data.get("results") or []
        if state:
            results = [r for r in results if state.lower() in (r.get("admin1") or "").lower()]
        if results:
            r = results[0]
            place = ", ".join(p for p in (r.get("name"), r.get("admin1")) if p)
            location = (place, r["latitude"], r["longitude"])
    if location is None and state in STATE_CAPITAL:
        city, lat, lon = STATE_CAPITAL[state]
        location = (f"{state} (around {city})", lat, lon)

    if location:
        _cache_put(key, location, GEOCODE_TTL)
    return location


async def _weather(client: httpx.AsyncClient, district: str, state: str):
    location = await _locate(client, district, state)
    if not location:
        return None
    place, lat, lon = location
    key = ("weather", round(lat, 2), round(lon, 2))
    cached = _cache_get(key)
    if cached:
        return {**cached, "place": place}

    data = await _get_json(client, FORECAST_URL, {
        "latitude": lat, "longitude": lon, "timezone": "Asia/Kolkata", "forecast_days": 3,
        "current": "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,"
                 "precipitation_sum,precipitation_probability_max",
    })
    now, daily = data["current"], data["daily"]
    weather = {
        "place": place,
        "current": {"temp": now["temperature_2m"], "humidity": now["relative_humidity_2m"],
                    "wind": now["wind_speed_10m"], "code": now["weather_code"]},
        "daily": [
            {"date": day, "code": daily["weather_code"][i],
             "tmin": daily["temperature_2m_min"][i], "tmax": daily["temperature_2m_max"][i],
             "rain_mm": daily["precipitation_sum"][i],
             "rain_prob": daily["precipitation_probability_max"][i]}
            for i, day in enumerate(daily["time"])
        ],
    }
    _cache_put(key, weather, WEATHER_TTL)
    return weather


async def fetch_weather(district: str, state: str):
    """Current conditions + 3-day forecast for the farmer's district, or None
    (also None if the whole lookup takes longer than LOOKUP_DEADLINE_SECONDS)."""
    try:
        async with _client() as client:
            return await asyncio.wait_for(
                _weather(client, (district or "").strip(), state or ""), LOOKUP_DEADLINE_SECONDS)
    except (asyncio.TimeoutError, httpx.HTTPError, ValueError, KeyError, TypeError) as e:
        logger.warning("Weather lookup failed for %r, %r: %r", district, state, e)
        return None


def describe_weather(weather: dict) -> str:
    now = weather["current"]
    lines = [
        f"Live weather for {weather['place']} (Open-Meteo).",
        f"Now: {now['temp']}°C, {weather_words(now['code'])}, humidity {now['humidity']}%, "
        f"wind {now['wind']} km/h.",
    ]
    for day in weather["daily"]:
        lines.append(f"{day['date']}: {weather_words(day['code'])}, {day['tmin']}–{day['tmax']}°C, "
                     f"rain {day['rain_mm']} mm ({day['rain_prob']}% chance).")
    return "\n".join(lines)


# ── Mandi prices ──────────────────────────────────────────────────────────────
def parse_price_record(record: dict) -> dict:
    return {
        "commodity": record.get("commodity"), "variety": record.get("variety"),
        "market": record.get("market"), "district": record.get("district"),
        "date": record.get("arrival_date"),
        "min": record.get("min_price"), "max": record.get("max_price"), "modal": record.get("modal_price"),
    }


async def _prices_for(client: httpx.AsyncClient, state: str, crop: str, day: str) -> list:
    key = ("prices", state, crop, day)
    rows = _cache_get(key)
    if rows is not None:
        return rows
    try:
        data = await _get_json(client, PRICES_URL, {
            "api-key": os.getenv("DATA_GOV_IN_API_KEY") or SAMPLE_PRICES_KEY,
            "format": "json", "limit": PRICE_ROWS_PER_CROP,
            "filters[state]": AGMARKNET_STATE.get(state, state),
            "filters[commodity]": COMMODITY[crop],
        })
        # The API's state filter matches loosely ("Arunachal Pradesh" returned
        # Andhra Pradesh rows), so keep only rows for exactly this state.
        wanted_state = AGMARKNET_STATE.get(state, state).lower()
        rows = [{**parse_price_record(r), "crop": crop} for r in data.get("records") or []
                if str(r.get("state") or "").strip().lower() == wanted_state]
        _cache_put(key, rows, PRICES_TTL)
    except (httpx.HTTPError, ValueError) as e:
        logger.warning("Mandi price lookup failed for %s / %s: %r", state, crop, e)
        rows = []
        _cache_put(key, rows, FAILURE_TTL)
    return rows


async def fetch_mandi_prices(state: str, crops: list) -> list:
    """Today's Agmarknet prices in the farmer's state for each crop that has a
    price feed (up to 5 markets per crop). Each record also carries 'crop'.
    All crops are looked up at once, within LOOKUP_DEADLINE_SECONDS."""
    wanted = [crop for crop in dict.fromkeys(crops) if crop in COMMODITY]
    if not wanted:
        return []
    day = date.today().isoformat()
    try:
        async with _client() as client:
            groups = await asyncio.wait_for(
                asyncio.gather(*(_prices_for(client, state, crop, day) for crop in wanted)),
                LOOKUP_DEADLINE_SECONDS)
    except asyncio.TimeoutError:
        logger.warning("Mandi price lookup timed out for %s / %s", state, wanted)
        for crop in wanted:
            if _cache_get(("prices", state, crop, day)) is None:
                _cache_put(("prices", state, crop, day), [], FAILURE_TTL)
        return []
    return [row for rows in groups for row in rows]


def describe_prices(records: list, missing_crops=None) -> str:
    """Price lines for the AI prompt; '' when there is no data at all."""
    if not records:
        return ""
    lines = ["Live mandi prices (government Agmarknet data, rupees per quintal):"]
    for r in records:
        lines.append(f"- {r['commodity']} ({r['variety']}), {r['market']}, {r['date']}: "
                     f"modal {r['modal']} (min {r['min']}, max {r['max']})")
    if missing_crops:
        lines.append("No mandi data today for: " + ", ".join(missing_crops) + ".")
    return "\n".join(lines)


def missing_price_crops(crops: list, records: list) -> list:
    """English names of the farmer's crops that got no price rows."""
    found = {r.get("crop") for r in records}
    return [crop_name(c) for c in dict.fromkeys(crops) if c not in found]
