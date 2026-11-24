import pytest

from prompts import build_menu_messages

P = {"state": "Punjab", "district": "Ludhiana", "main_crop": "paddy", "soil": "loamy", "stage": "harvest"}


def test_personalized_option1_mentions_crop_context_language():
    sys, user = build_menu_messages("1", "pa", P)
    assert "paddy" in user["content"] and "Punjabi" in user["content"]
    assert "Ludhiana, Punjab" in sys["content"]


def test_no_profile_uses_default_task():
    _, user = build_menu_messages("1", "hi", {})
    assert "wheat" in user["content"].lower()


def test_partial_profile_without_crop_uses_default():
    _, user = build_menu_messages("3", "en", {"state": "Punjab"})
    assert "cotton" in user["content"].lower()


def test_option4_with_and_without_live_data():
    assert "Using only these numbers" in build_menu_messages("4", "en", P, "Paddy: Muktsar ₹2461")[1]["content"]
    assert "approximate" in build_menu_messages("4", "en", P)[1]["content"]


def test_unknown_option_raises():
    with pytest.raises(KeyError):
        build_menu_messages("42", "en", P)
