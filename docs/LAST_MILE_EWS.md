# Last-Mile Early Warning (phase 1)

Turns probabilistic rainfall forecasts into reviewed, persona-specific SMS for
communities in south-western Uganda (plus Rwenzori and Elgon), and collects
what actually happened from the people who received them.

Console: `/last-mile` (login required; sending and reach stats are admin-only).

## How it fits together

```
Forecast (external feed when configured, else ECMWF ensemble via Open-Meteo)
  + river flow (GloFAS via Open-Meteo)
        │  src/lib/ews/forecast.js
        ▼
Hazard signals per district (heavy rain, flood, landslide, dry spell)
        │  src/lib/ews/hazards.js   ← thresholds to agree with the met service
        ▼
Draft SMS per persona (farmer, vendor, flood/landslide-zone resident,
livestock keeper, fisher) in English; AI-drafted local-language versions
        │  src/lib/ews/messages.js, /api/ews/translate
        ▼
Person reviews, edits, ticks translations checked by a native speaker, sends
        │  POST {STRAPI}/api/ews/alerts/send
        ▼
Africa's Talking SMS → subscribers in that district with that persona
        │  footer: "Did it happen? Reply 1234 1=Heavy rain 3=Flood 5=No rain"
        ▼
Replies / USSD reports / rain-gauge readings → ews-feedback (ground truth)
```

## Ways people join and report (no smartphone needed)

| Channel | Join | Report | Stop |
|---|---|---|---|
| USSD | dial code → 1 (language, livelihood, district, village, consent) | dial code → 2 | dial code → 4 |
| SMS | `JOIN KISORO` | reply `<alert no.> 1-6`, or `RAIN 25` (gauge mm) | `STOP` |
| Volunteer | console → Register people (consent script read aloud) | — | — |

Report codes everywhere: 1 heavy rain, 2 light rain, 3 flood, 4 landslide, 5 no rain, 6 hail.

## Setup

**Backend (TUOGERE-BE)**

```
AT_USERNAME=sandbox            # your Africa's Talking app username in production
AT_API_KEY=...
AT_SENDER_ID=                  # optional, production only (approved sender id / shortcode)
EWS_CALLBACK_SECRET=<random>   # appended to callback URLs as ?key=
EWS_USSD_CODE=*384*123#        # shown to users once you have one
```

In the Africa's Talking dashboard, set:

- USSD callback: `https://<backend>/api/ews/ussd?key=<EWS_CALLBACK_SECRET>`
- SMS inbound callback: `https://<backend>/api/ews/sms/inbound?key=<EWS_CALLBACK_SECRET>`
- SMS delivery reports: `https://<backend>/api/ews/sms/delivery?key=<EWS_CALLBACK_SECRET>`

Inbound SMS (JOIN / STOP / replies) needs a shortcode or two-way number from Africa's Talking.

**Web (this repo)**

```
EWS_FORECAST_URL=     # optional external forecast feed; expected JSON in src/lib/ews/forecast.js
```

## What is and is not real yet

- Forecasts: real ECMWF ensemble data (about 25 km grid, so neighbouring
  districts such as Kisoro and Rubanda can share a cell). A higher-resolution
  feed can be plugged in through `EWS_FORECAST_URL`.
- No rainfall climatology baseline yet (to say how unusual a forecast is).
- No ground sensors. Ground truth comes from community reports and volunteers
  with manual rain gauges.
- Hazard thresholds and message wording are starting points. Agree them with
  the national met service and district disaster offices before an operational pilot.
- Local-language messages are AI drafts and are only sent once a native speaker
  has checked them; otherwise people get English.
- District coordinates are approximate headquarters; hazard flags per district
  should be checked with district disaster officers.

Keep the district list in `src/lib/ews/regions.js` in sync with `DISTRICTS` in
`TUOGERE-BE/src/api/ews/services/ews.js` (the USSD menu order).
