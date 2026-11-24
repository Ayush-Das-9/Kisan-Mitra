"""
Farmer profile: the fixed choice lists shown in the one-time form (with
Hindi / Punjabi / English labels), validation of what the browser sends,
and the one-line "farmer details" context given to the AI.

Stored values are fixed English keys; the farmer's name is never accepted here.
"""


def _choices(rows):
    return [{"key": key, "label": {"en": en, "hi": hi, "pa": pa}} for key, en, hi, pa in rows]


STATES = _choices([
    ("Andhra Pradesh", "Andhra Pradesh", "आंध्र प्रदेश", "ਆਂਧਰਾ ਪ੍ਰਦੇਸ਼"),
    ("Arunachal Pradesh", "Arunachal Pradesh", "अरुणाचल प्रदेश", "ਅਰੁਣਾਚਲ ਪ੍ਰਦੇਸ਼"),
    ("Assam", "Assam", "असम", "ਅਸਾਮ"),
    ("Bihar", "Bihar", "बिहार", "ਬਿਹਾਰ"),
    ("Chandigarh", "Chandigarh", "चंडीगढ़", "ਚੰਡੀਗੜ੍ਹ"),
    ("Chhattisgarh", "Chhattisgarh", "छत्तीसगढ़", "ਛੱਤੀਸਗੜ੍ਹ"),
    ("Delhi", "Delhi", "दिल्ली", "ਦਿੱਲੀ"),
    ("Goa", "Goa", "गोवा", "ਗੋਆ"),
    ("Gujarat", "Gujarat", "गुजरात", "ਗੁਜਰਾਤ"),
    ("Haryana", "Haryana", "हरियाणा", "ਹਰਿਆਣਾ"),
    ("Himachal Pradesh", "Himachal Pradesh", "हिमाचल प्रदेश", "ਹਿਮਾਚਲ ਪ੍ਰਦੇਸ਼"),
    ("Jammu and Kashmir", "Jammu and Kashmir", "जम्मू और कश्मीर", "ਜੰਮੂ ਅਤੇ ਕਸ਼ਮੀਰ"),
    ("Jharkhand", "Jharkhand", "झारखंड", "ਝਾਰਖੰਡ"),
    ("Karnataka", "Karnataka", "कर्नाटक", "ਕਰਨਾਟਕ"),
    ("Kerala", "Kerala", "केरल", "ਕੇਰਲ"),
    ("Ladakh", "Ladakh", "लद्दाख", "ਲੱਦਾਖ"),
    ("Madhya Pradesh", "Madhya Pradesh", "मध्य प्रदेश", "ਮੱਧ ਪ੍ਰਦੇਸ਼"),
    ("Maharashtra", "Maharashtra", "महाराष्ट्र", "ਮਹਾਰਾਸ਼ਟਰ"),
    ("Manipur", "Manipur", "मणिपुर", "ਮਣੀਪੁਰ"),
    ("Meghalaya", "Meghalaya", "मेघालय", "ਮੇਘਾਲਿਆ"),
    ("Mizoram", "Mizoram", "मिज़ोरम", "ਮਿਜ਼ੋਰਮ"),
    ("Nagaland", "Nagaland", "नगालैंड", "ਨਾਗਾਲੈਂਡ"),
    ("Odisha", "Odisha", "ओडिशा", "ਓਡੀਸ਼ਾ"),
    ("Puducherry", "Puducherry", "पुडुचेरी", "ਪੁਡੂਚੇਰੀ"),
    ("Punjab", "Punjab", "पंजाब", "ਪੰਜਾਬ"),
    ("Rajasthan", "Rajasthan", "राजस्थान", "ਰਾਜਸਥਾਨ"),
    ("Sikkim", "Sikkim", "सिक्किम", "ਸਿੱਕਮ"),
    ("Tamil Nadu", "Tamil Nadu", "तमिलनाडु", "ਤਾਮਿਲਨਾਡੂ"),
    ("Telangana", "Telangana", "तेलंगाना", "ਤੇਲੰਗਾਨਾ"),
    ("Tripura", "Tripura", "त्रिपुरा", "ਤ੍ਰਿਪੁਰਾ"),
    ("Uttar Pradesh", "Uttar Pradesh", "उत्तर प्रदेश", "ਉੱਤਰ ਪ੍ਰਦੇਸ਼"),
    ("Uttarakhand", "Uttarakhand", "उत्तराखंड", "ਉੱਤਰਾਖੰਡ"),
    ("West Bengal", "West Bengal", "पश्चिम बंगाल", "ਪੱਛਮੀ ਬੰਗਾਲ"),
])

LAND = _choices([
    ("<1", "Less than 1 acre", "1 एकड़ से कम", "1 ਏਕੜ ਤੋਂ ਘੱਟ"),
    ("1-2", "1–2 acres", "1–2 एकड़", "1–2 ਏਕੜ"),
    ("2-5", "2–5 acres", "2–5 एकड़", "2–5 ਏਕੜ"),
    ("5-10", "5–10 acres", "5–10 एकड़", "5–10 ਏਕੜ"),
    ("10-25", "10–25 acres", "10–25 एकड़", "10–25 ਏਕੜ"),
    ("25+", "More than 25 acres", "25 एकड़ से ज़्यादा", "25 ਏਕੜ ਤੋਂ ਵੱਧ"),
])

CROPS = _choices([
    ("wheat", "Wheat", "गेहूं", "ਕਣਕ"),
    ("paddy", "Paddy (rice)", "धान", "ਝੋਨਾ"),
    ("cotton", "Cotton", "कपास", "ਕਪਾਹ"),
    ("maize", "Maize", "मक्का", "ਮੱਕੀ"),
    ("sugarcane", "Sugarcane", "गन्ना", "ਗੰਨਾ"),
    ("mustard", "Mustard", "सरसों", "ਸਰ੍ਹੋਂ"),
    ("potato", "Potato", "आलू", "ਆਲੂ"),
    ("vegetables", "Vegetables", "सब्ज़ियां", "ਸਬਜ਼ੀਆਂ"),
    ("pulses", "Pulses (gram, moong)", "दालें (चना, मूंग)", "ਦਾਲਾਂ (ਛੋਲੇ, ਮੂੰਗੀ)"),
    ("fruits", "Fruits / orchard", "फल / बाग", "ਫਲ / ਬਾਗ਼"),
    ("fodder", "Fodder", "चारा", "ਚਾਰਾ"),
])

STAGES = _choices([
    ("preparing", "Preparing land", "खेत की तैयारी", "ਖੇਤ ਦੀ ਤਿਆਰੀ"),
    ("sowing", "Sowing", "बुवाई", "ਬਿਜਾਈ"),
    ("growing", "Growing", "बढ़वार", "ਵਾਧਾ"),
    ("flowering", "Flowering / fruiting", "फूल / फल आना", "ਫੁੱਲ / ਫਲ ਲੱਗਣਾ"),
    ("harvest", "Ready to harvest", "कटाई के लिए तैयार", "ਵਾਢੀ ਲਈ ਤਿਆਰ"),
    ("empty", "Field empty", "खेत खाली", "ਖੇਤ ਖਾਲੀ"),
])

SOILS = _choices([
    ("loamy", "Alluvial / loamy", "जलोढ़ / दोमट", "ਮੈਰਾ / ਦੋਮਟ"),
    ("sandy", "Sandy", "बलुई", "ਰੇਤਲੀ"),
    ("clay", "Clay", "चिकनी", "ਚੀਕਣੀ"),
    ("black", "Black", "काली", "ਕਾਲੀ"),
    ("red", "Red", "लाल", "ਲਾਲ"),
    ("saline", "Saline / alkaline", "खारी / क्षारीय", "ਖਾਰੀ / ਕੱਲਰ ਵਾਲੀ"),
    ("unknown", "Don't know", "पता नहीं", "ਪਤਾ ਨਹੀਂ"),
])

IRRIGATION = _choices([
    ("canal", "Canal", "नहर", "ਨਹਿਰ"),
    ("tubewell", "Tubewell / borewell", "ट्यूबवेल / बोरवेल", "ਟਿਊਬਵੈੱਲ / ਬੋਰਵੈੱਲ"),
    ("rainfed", "Rain-fed (no irrigation)", "बारिश पर निर्भर", "ਮੀਂਹ 'ਤੇ ਨਿਰਭਰ"),
    ("drip", "Drip / sprinkler", "ड्रिप / स्प्रिंकलर", "ਡ੍ਰਿੱਪ / ਸਪ੍ਰਿੰਕਲਰ"),
])

METHODS = _choices([
    ("conventional", "Conventional (chemical)", "रासायनिक (सामान्य)", "ਰਸਾਇਣਕ (ਆਮ)"),
    ("organic", "Organic", "जैविक", "ਜੈਵਿਕ"),
    ("natural", "Natural farming", "प्राकृतिक खेती", "ਕੁਦਰਤੀ ਖੇਤੀ"),
    ("mixed", "Mixed", "मिश्रित", "ਮਿਲੀ-ਜੁਲੀ"),
])

LIVESTOCK = _choices([
    ("cattle", "Cows / buffaloes", "गाय / भैंस", "ਗਾਂ / ਮੱਝ"),
    ("goats", "Goats / sheep", "बकरी / भेड़", "ਬੱਕਰੀ / ਭੇਡ"),
    ("poultry", "Poultry", "मुर्गी पालन", "ਮੁਰਗੀ ਪਾਲਣ"),
    ("none", "None", "कोई नहीं", "ਕੋਈ ਨਹੀਂ"),
])

CHOICES = {
    "state": STATES,
    "land": LAND,
    "main_crop": CROPS,
    "other_crops": CROPS,
    "stage": STAGES,
    "soil": SOILS,
    "irrigation": IRRIGATION,
    "method": METHODS,
    "livestock": LIVESTOCK,
}

SINGLE_FIELDS = ("state", "land", "main_crop", "stage", "soil", "irrigation", "method")
LIST_FIELDS = ("other_crops", "livestock")
MAX_DISTRICT_CHARS = 60

_KEYS = {field: {c["key"] for c in items} for field, items in CHOICES.items()}
_EN = {field: {c["key"]: c["label"]["en"] for c in items} for field, items in CHOICES.items()}


def crop_name(key: str) -> str:
    """English crop name used in prompts, e.g. 'paddy' -> 'paddy (rice)'."""
    return _EN["main_crop"].get(key, key).lower()


def clean_profile(raw) -> dict:
    """Keep only known fields with allowed values; drop the name and anything else."""
    if not isinstance(raw, dict):
        return {}
    profile = {}
    for field in SINGLE_FIELDS:
        value = raw.get(field)
        if isinstance(value, str) and value in _KEYS[field]:
            profile[field] = value

    district = raw.get("district")
    if isinstance(district, str):
        district = " ".join(district.split())[:MAX_DISTRICT_CHARS].strip()
        if district:
            profile["district"] = district

    for field in LIST_FIELDS:
        values = raw.get(field)
        if isinstance(values, list):
            # Filter to strings before de-duplicating: nested lists/dicts are unhashable
            strings = (v for v in values if isinstance(v, str))
            kept = [v for v in dict.fromkeys(strings)
                    if v in _KEYS[field]
                    and not (field == "other_crops" and v == profile.get("main_crop"))]
            if kept:
                profile[field] = kept
    return profile


def farmer_context(profile: dict) -> str:
    """One English line describing the farmer for the AI, or '' if nothing is known."""
    parts = []
    place = ", ".join(p for p in (profile.get("district"), profile.get("state")) if p)
    if place:
        parts.append(f"from {place}")

    land = profile.get("land")
    if land == "<1":
        parts.append("land under 1 acre")
    elif land == "25+":
        parts.append("land over 25 acres")
    elif land:
        parts.append(f"land {land} acres")

    if profile.get("main_crop"):
        parts.append(f"main crop {crop_name(profile['main_crop'])}")
    if profile.get("other_crops"):
        parts.append("also grows " + ", ".join(crop_name(c) for c in profile["other_crops"]))
    if profile.get("stage"):
        parts.append("crop stage: " + _EN["stage"][profile["stage"]].lower())
    if profile.get("soil") and profile["soil"] != "unknown":
        parts.append("soil: " + _EN["soil"][profile["soil"]].lower())
    if profile.get("irrigation"):
        parts.append("irrigation: " + _EN["irrigation"][profile["irrigation"]].lower())
    if profile.get("method"):
        parts.append("farming method: " + _EN["method"][profile["method"]].lower())
    animals = [a for a in profile.get("livestock", []) if a != "none"]
    if animals:
        parts.append("livestock: " + ", ".join(_EN["livestock"][a].lower() for a in animals))

    return ("Farmer details: " + "; ".join(parts) + ".") if parts else ""
