# Personalized answers from a one-time farmer profile — design

Date: 2026-11-25 · Status: awaiting approval

## Intent

Answers are generic today (always wheat, always cotton, "North India"). The app
should ask the farmer once about themselves and their farm, then tailor every
menu answer to their crop, place, soil and situation, and greet them by name.

## Goals

- A one-time "farm details" form, mostly dropdowns and checkboxes.
- Options 1–7 change to fit the farmer (labels and answers); 8 and 9 keep their
  labels and behaviour but the AI also gets the farm details as background.
- Real weather (option 5) and real mandi prices (option 4) where available.
- Greeting by name on screen and in the spoken menu.

## Non-goals

- Accounts, login, database, or syncing between phones.
- Remembering the language choice between visits (unchanged: asked each visit).

## Anti-goals

- Making farmers type a lot.
- Sending the farmer's name to the AI.
- Presenting made-up prices or weather as real data.

## Approaches considered

| Choice | Options | Decision |
|---|---|---|
| Where details live | Phone (browser storage) · server database + login | **Phone** — no database; details stay on that phone/browser and are lost if browser data is cleared |
| How details reach the AI | Fill each detail into one sentence (owner's example) · a "farmer details" line plus each option's task | **Details line + task** — copes with blanks ("Don't know") and several crops, works in all 3 languages, also usable by options 8/9 |
| Weather data | AI guess · Open-Meteo (free, no key) | **Open-Meteo** |
| Price data | AI guess · data.gov.in Agmarknet daily prices (free) | **Agmarknet**, falling back to an AI estimate, clearly worded as approximate, when there's no data for that crop today |

## The form (shown once, after the language screen)

Labels in the language just chosen; stored values are fixed English keys.

| Field | Input | Choices |
|---|---|---|
| Name | text | — (kept on the phone only, used for greetings) |
| State | dropdown | all states and union territories |
| District | text | free text (a full district dropdown needs a 700+ entry list; text is simpler) — used for weather |
| Land | dropdown | <1 acre, 1–2, 2–5, 5–10, 10–25, 25+ acres |
| Main crop | dropdown | Wheat, Paddy, Cotton, Maize, Sugarcane, Mustard, Potato, Vegetables, Pulses, Fruits/orchard, Fodder |
| Other crops | checkboxes | same list |
| Current crop stage | dropdown | Preparing land, Sowing, Growing, Flowering/fruiting, Ready to harvest, Field empty |
| Soil type | dropdown | Alluvial/loamy, Sandy, Clay, Black, Red, Saline/alkaline, Don't know |
| Irrigation | dropdown | Canal, Tubewell/borewell, Rain-fed (none), Drip/sprinkler |
| Farming method | dropdown | Conventional (chemical), Organic, Natural farming, Mixed |
| Livestock | checkboxes | Cows/buffaloes, Goats/sheep, Poultry, None |

Buttons: **Save & continue** and **Skip**. Saved to `localStorage`; never asked
again. An **Edit details** button on the main screen reopens the form. If skipped
(or no profile), the app behaves exactly as today.

## Personalized menu (options 1–7)

| # | Label (example in English) | What it asks / does |
|---|---|---|
| 1 | {Main crop} crop information | Basic info for their crop, place, soil, stage. (Today option 1 starts a voice recording — a leftover; it becomes a normal menu answer.) |
| 2 | Farming news for {state} | Made-up headline as today, but about their state/crops |
| 3 | Fertilizer for {main crop} | Fertilizer advice for their crop, soil, stage, method (organic → organic inputs) |
| 4 | Today's mandi prices | **Real** Agmarknet prices for their main + other crops in their state → AI summarizes in their language; AI estimate if no data today |
| 5 | Weather for {district} | **Real** Open-Meteo current + 3-day forecast for their district → AI turns it into a short forecast + one farming tip for their stage |
| 6 | {Main crop} diseases | Diseases/pests of their crop at their stage |
| 7 | Irrigation tips for {main crop} | For their crop, soil, irrigation source, stage |
| 8, 9 | unchanged | Farm details added to the AI's background instructions |

The ticker and the spoken "Hear menu" text use the same personalized labels.
Crop and state names are translated for Hindi and Punjabi labels.

## Greetings

Header shows "Sat Sri Akal, {name} ji" (Punjabi) / "नमस्ते, {name} जी" (Hindi) /
"Hello, {name}" (English); the spoken menu starts with the same greeting.

## Backend

- `/api/menu/{option}` becomes **POST** with JSON `{lang, profile}` (keeps farm
  details out of URLs and server logs). Name is never sent.
- Profile is validated against the fixed choice lists; district is trimmed to
  60 characters, one line.
- A "farmer details" sentence is built from the profile and given to the AI
  with each option's task; options 8 and 9 accept the same profile.
- Weather: geocode "{district}" with Open-Meteo, prefer the match in the chosen
  state, fall back to the state; then fetch current + 3-day daily forecast.
- Prices: data.gov.in resource `9ef84268-d588-465a-a308-a864a43d0070`, filtered
  by state + commodity (crop → Agmarknet commodity name map). Uses
  `DATA_GOV_IN_API_KEY` from the environment if set, else data.gov.in's public
  sample key (shared, 10 rows per request) — registering a free key is advised.
- External calls have short timeouts and a small in-memory cache (geocoding per
  district, prices per state+crop+day, weather ~30 min).
- Token caps stay within Groq's limits (≤ 500).

## Testing

- Form: fill, save, reload (not asked again), edit, skip.
- Each option 1–7 with a sample profile in all three languages; option 4 with a
  crop that has data today (paddy, Punjab) and one that doesn't (wheat); option 5
  with a real district and a misspelled one.
- Options 8 and 9 still work; no profile → behaves as today.

## Left to the builder

- Exact label/prompt wording within the rules above; translations of crop and
  state names; weather-code wording; cache durations.
