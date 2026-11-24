import asyncio
import time

import httpx
import pytest

import live_data
import main

LUDHIANA_UP = {"name": "Ludhiāna", "admin1": "Uttar Pradesh", "latitude": 28.49, "longitude": 77.85}
LUDHIANA_PB = {"name": "Ludhiana", "admin1": "Punjab", "latitude": 30.91, "longitude": 75.85}
FORECAST = {
    "current": {"temperature_2m": 14.0, "relative_humidity_2m": 82, "wind_speed_10m": 3.3, "weather_code": 0},
    "daily": {"time": ["2026-11-25", "2026-11-26", "2026-11-27"], "weather_code": [61, 0, 3],
              "temperature_2m_max": [25.3, 24.9, 24.9], "temperature_2m_min": [13.0, 13.0, 12.6],
              "precipitation_sum": [4.2, 0.0, 0.0], "precipitation_probability_max": [70, 0, 5]},
}
PADDY = {"total": 1, "records": [{"state": "Punjab", "district": "Muktsar", "market": "Muktsar APMC",
                                  "commodity": "Paddy(Common)", "variety": "Paddy", "arrival_date": "24/11/2026",
                                  "min_price": 2461, "max_price": 2461, "modal_price": 2461}]}
EMPTY = {"total": 0, "records": []}


def run(coro):
    return asyncio.run(coro)


@pytest.fixture
def api(monkeypatch):
    """Fake Open-Meteo + data.gov.in: ["hits"] counts requests per host, ["fail"] makes every
    call time out at once, ["delay"] makes every response that many seconds slow."""
    state = {"hits": {}, "fail": False, "delay": 0, "geocode": {"Ludhiana": [LUDHIANA_UP, LUDHIANA_PB]}}

    async def handler(request: httpx.Request):
        host = request.url.host
        state["hits"][host] = state["hits"].get(host, 0) + 1
        state["user_agent"] = request.headers.get("user-agent", "")
        if state["delay"]:
            await asyncio.sleep(state["delay"])
        if state["fail"]:
            raise httpx.ConnectTimeout("simulated timeout", request=request)
        if host == "geocoding-api.open-meteo.com":
            return httpx.Response(200, json={"results": state["geocode"].get(request.url.params["name"], [])})
        if host == "api.open-meteo.com":
            return httpx.Response(200, json=FORECAST)
        if host == "api.data.gov.in":
            commodity = request.url.params["filters[commodity]"]
            if not commodity.startswith("Paddy"):
                return httpx.Response(200, json=EMPTY)
            return httpx.Response(200, json={**PADDY, "records": PADDY["records"] + state.get("extra_rows", [])})
        return httpx.Response(404)

    live_data.set_transport(httpx.MockTransport(handler))
    yield state
    live_data.set_transport(None)


def test_geocode_prefers_result_in_chosen_state(api):
    assert run(live_data.fetch_weather("Ludhiana", "Punjab"))["place"] == "Ludhiana, Punjab"


def test_unknown_district_falls_back_to_state(api):
    w = run(live_data.fetch_weather("Ludhyana", "Punjab"))
    assert w is not None and "Punjab" in w["place"]


def test_weather_service_down_returns_none(api):
    api["fail"] = True
    assert run(live_data.fetch_weather("Ludhiana", "Punjab")) is None


def test_describe_weather_words(api):
    text = live_data.describe_weather(run(live_data.fetch_weather("Ludhiana", "Punjab")))
    assert "rain" in text and "25" in text and "13" in text and "Ludhiana, Punjab" in text


def test_prices_records_and_empty(api):
    paddy = run(live_data.fetch_mandi_prices("Punjab", ["paddy"]))
    assert len(paddy) >= 1 and "2461" in live_data.describe_prices(paddy)
    wheat = run(live_data.fetch_mandi_prices("Punjab", ["wheat"]))
    assert wheat == [] and live_data.describe_prices(wheat) == ""


def test_prices_cache_avoids_second_call(api):
    run(live_data.fetch_mandi_prices("Punjab", ["paddy"]))
    run(live_data.fetch_mandi_prices("Punjab", ["paddy"]))
    assert api["hits"]["api.data.gov.in"] == 1


def test_requests_do_not_use_default_httpx_user_agent(api):
    # data.gov.in stalls requests whose User-Agent is httpx's default ("python-httpx/...")
    run(live_data.fetch_mandi_prices("Punjab", ["paddy"]))
    assert api["user_agent"] and not api["user_agent"].startswith("python-httpx")


def test_prices_service_down_returns_empty(api):
    api["fail"] = True
    assert run(live_data.fetch_mandi_prices("Punjab", ["paddy"])) == []


PROFILE = {"state": "Punjab", "district": "Ludhiana", "main_crop": "paddy", "other_crops": ["wheat"], "stage": "harvest"}


def test_menu_option5_falls_back_when_weather_none(client, fake_groq, monkeypatch):
    async def no_weather(district, state):
        return None
    monkeypatch.setattr(main, "fetch_weather", no_weather)
    r = client.post("/api/menu/5", json={"lang": "en", "profile": PROFILE})
    assert r.status_code == 200 and "not a live forecast" in str(fake_groq.messages)


def test_menu_option4_uses_live_prices_and_names_missing_crops(client, fake_groq, monkeypatch):
    async def prices(state, crops):
        return [{**live_data.parse_price_record(PADDY["records"][0]), "crop": "paddy"}]
    monkeypatch.setattr(main, "fetch_mandi_prices", prices)
    r = client.post("/api/menu/4", json={"lang": "en", "profile": PROFILE})
    sent = str(fake_groq.messages)
    assert r.status_code == 200 and "Using only these numbers" in sent and "2461" in sent
    assert "No mandi data today for: wheat" in sent


def test_slow_price_service_is_bounded(api, monkeypatch):
    monkeypatch.setattr(live_data, "LOOKUP_DEADLINE_SECONDS", 0.5, raising=False)
    api["delay"] = 2
    start = time.monotonic()
    assert run(live_data.fetch_mandi_prices("Punjab", ["paddy", "wheat", "cotton"])) == []
    assert time.monotonic() - start < 1.5


def test_failed_price_lookup_is_not_retried_on_every_press(api):
    api["fail"] = True
    run(live_data.fetch_mandi_prices("Punjab", ["paddy"]))
    hits = api["hits"]["api.data.gov.in"]
    assert run(live_data.fetch_mandi_prices("Punjab", ["paddy"])) == []
    assert api["hits"]["api.data.gov.in"] == hits


def test_slow_weather_service_is_bounded(api, monkeypatch):
    monkeypatch.setattr(live_data, "LOOKUP_DEADLINE_SECONDS", 0.5, raising=False)
    api["delay"] = 2
    start = time.monotonic()
    assert run(live_data.fetch_weather("Ludhiana", "Punjab")) is None
    assert time.monotonic() - start < 1.5


def test_menu_survives_unexpected_live_data_error(client, fake_groq, monkeypatch):
    async def broken(state, crops):
        raise AttributeError("odd payload")
    monkeypatch.setattr(main, "fetch_mandi_prices", broken)
    r = client.post("/api/menu/4", json={"lang": "en", "profile": PROFILE})
    assert r.status_code == 200 and "approximate" in str(fake_groq.messages)


def test_price_rows_from_other_states_are_dropped(api):
    # data.gov.in's state filter matches loosely ("Arunachal Pradesh" returned Andhra Pradesh rows)
    api["extra_rows"] = [{**PADDY["records"][0], "state": "Haryana", "market": "Karnal APMC", "modal_price": 9999}]
    rows = run(live_data.fetch_mandi_prices("Punjab", ["paddy"]))
    assert rows and all(r["market"] != "Karnal APMC" for r in rows)
