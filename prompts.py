"""
Prompt building for the menu options: language rules, the generic tasks used
when no farm details are known, and the personalized tasks built from the
farmer's profile (plus real weather / price data for options 5 and 4).
"""

from farmer_profile import crop_name, farmer_context

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


# ── Generic tasks (no farm details known) ─────────────────────────────────────
DEFAULT_TASKS = {
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

# ── Personalized tasks (profile has a main crop) ──────────────────────────────
PERSONAL_TASKS = {
    "1": "Give basic information about growing {crop} for this farmer, in exactly 20 words in {language}.",
    "2": "Write one recent sensational farming news headline relevant to farmers in {state} who grow {crop}, 20 to 30 words, in {language}. Only the headline.",
    "3": "Recommend fertilizers for {crop} suited to this farmer's soil, crop stage and farming method, in exactly 25 words in {language}.",
    "4": "Give approximate current mandi prices for {crops} in {state}, clearly saying they are approximate, in about 25 words in {language}.",
    "5": "Give a short general weather outlook for farmers in {place} for this season, saying it is not a live forecast, in about 25 words in {language}.",
    "6": "Name 2 common diseases or pests of {crop} at this crop stage, with one symptom each, in exactly 25 words in {language}.",
    "7": "Give 2 practical irrigation tips for {crop} for this farmer's soil, irrigation source and crop stage, in exactly 25 words in {language}.",
}

# Options 4 and 5 when real data was fetched
LIVE_DATA_TASKS = {
    "4": "Using only these numbers, tell the farmer today's mandi prices for their crops in rupees per quintal, naming the markets, in about 30 words in {language}. Present them only as today's mandi rates; do not say any office or department set them.",
    "5": "Using only these numbers, give the farmer a short forecast and one farming tip for their crop stage, in about 30 words in {language}.",
}


def assistant_background(profile: dict) -> str:
    """Extra system-prompt text describing the farmer, or '' if nothing is known."""
    context = farmer_context(profile)
    return f" Background about the farmer you are helping: {context}" if context else ""


def _personal_task(option: str, profile: dict, live_text, language: str):
    main_crop = profile.get("main_crop")
    if not main_crop or option not in PERSONAL_TASKS:
        return None
    if live_text and option in LIVE_DATA_TASKS:
        return f"Here is real data:\n{live_text}\n" + LIVE_DATA_TASKS[option].format(language=language)
    crops = [main_crop] + profile.get("other_crops", [])
    return PERSONAL_TASKS[option].format(
        crop=crop_name(main_crop),
        crops=", ".join(crop_name(c) for c in crops),
        state=profile.get("state") or "India",
        place=profile.get("district") or profile.get("state") or "North India",
        language=language,
    )


def build_menu_messages(option: str, lang: str, profile: dict, live_text: str | None = None) -> list:
    """[system, user] chat messages for a menu option. Raises KeyError for an unknown option."""
    if option not in DEFAULT_TASKS:
        raise KeyError(option)
    language = get_language(lang)["prompt"]
    task = (_personal_task(option, profile, live_text, language)
            or DEFAULT_TASKS[option].format(language=language))
    system = f"You are a helpful agricultural assistant. {language_rule(lang)}{assistant_background(profile)}"
    return [{"role": "system", "content": system}, {"role": "user", "content": task}]
