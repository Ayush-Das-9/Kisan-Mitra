import main

P = {"state": "Punjab", "district": "Ludhiana", "main_crop": "paddy", "soil": "loamy", "stage": "harvest"}


def test_menu_endpoint_sends_profile_but_not_name(client, fake_groq):
    r = client.post("/api/menu/1", json={"lang": "en", "profile": {**P, "name": "Gurpreet"}})
    assert r.status_code == 200
    sent = str(fake_groq.messages)
    assert "paddy" in sent and "Gurpreet" not in sent


def test_menu_endpoint_survives_tampered_profile(client, fake_groq):
    r = client.post("/api/menu/1", json={"lang": "en", "profile": {"other_crops": [["x"]], "state": {"a": 1}}})
    assert r.status_code == 200


def test_menu_endpoint_unknown_option_404(client, fake_groq):
    assert client.post("/api/menu/42", json={"lang": "en"}).status_code == 404


def test_menu_endpoint_without_profile_still_answers(client, fake_groq):
    r = client.post("/api/menu/7", json={"lang": "hi"})
    assert r.status_code == 200 and r.json()["result"] == "ok"


def test_index_page_is_always_revalidated(client):
    # A stale cached page paired with a newer app.js breaks the app after a deploy
    assert "no-cache" in client.get("/").headers.get("cache-control", "")


def test_profile_from_form_ignores_bad_json():
    assert main.profile_from_form("{not json") == {}
    assert main.profile_from_form("") == {}
    assert main.profile_from_form('{"state": "Punjab", "name": "X"}') == {"state": "Punjab"}


def test_old_get_menu_route_still_answers(client, fake_groq):
    # Browsers holding the previous app.js still call GET /api/menu/{option}?lang=…
    r = client.get("/api/menu/7?lang=hi")
    assert r.status_code == 200 and r.json()["result"] == "ok"
