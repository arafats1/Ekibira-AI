# Last-Mile Early Warning

Turns weather forecasts and recent weather history into reviewed,
persona-specific SMS and voice calls for communities in south-western Uganda
(plus Rwenzori and Elgon), and collects what actually happened from the
people who received them and from KibiraAI community agents.

Console: `/last-mile` (KibiraAI admins only).

## How it fits together

```
Everyday weather: now, 7 days ahead, last 30 days (Open-Meteo)
Normal for these dates: same calendar window, last 5 years (ERA5 via Open-Meteo archive)
Rainfall probabilities: external feed when configured, else ECMWF 51-member ensemble
River flow vs usual: GloFAS via Open-Meteo
        │  src/lib/ews/weather.js, forecast.js
        ▼
Signals per district, most severe first
  weather: heavy rain, flood, landslide, dry spell
  disease risk: crop blight/fungal, livestock (ticks, worms, foot rot),
                malaria and waterborne disease
        │  src/lib/ews/hazards.js   ← thresholds to agree with met, agriculture,
        │                              veterinary and health officers
        ▼
AI insights (on request): recent pattern vs normal, outlook, likely
outcomes, suggested warnings, using agent reports and community feedback
        │  /api/ews/insights (admin only, gpt-4o)
        ▼
Draft SMS per persona (farmer, vendor, flood/landslide-zone resident,
livestock keeper, fisher) in English; AI-drafted local-language versions
        │  src/lib/ews/messages.js, /api/ews/translate
        ▼
Person reviews, edits, ticks translations checked by a native speaker,
chooses SMS and/or voice call, sends
        │  POST {STRAPI}/api/ews/alerts/send
        ▼
Africa's Talking SMS → people who chose SMS
Africa's Talking voice → everyone matched; plays a recording in their
language if one was added, otherwise reads the English message aloud
        ▼
Replies / USSD reports / gauge readings → ews-feedback
Agent field reports (text, photos, video) → ews-report
        ▼
Both feed the console and the next AI analysis
```

## People and roles

| Who | How they join | What they do |
|---|---|---|
| Community member | Mobile app signup, USSD, `JOIN <district>` by SMS, registered by an agent, or imported from a contact list | Gets warnings in the app, by SMS and by phone call; reports what happened |
| KibiraAI agent | Mobile app signup as "KibiraAI Agent" (name, phone, district) | Admin approves them on the console. They can then register members (consent script read aloud) and send field reports with photos and videos, even offline. Pending agents can already send reports |
| Admin | kibira-user role `admin` | Uses `/last-mile`: forecasts, AI insights, sending, CSV import, approving agents, verifying reports |

## Ways people join and report (no smartphone needed)

| Channel | Join | Report | Stop |
|---|---|---|---|
| USSD | dial code → 1 (language, livelihood, district, village, consent) | dial code → 2 | dial code → 4 |
| SMS | `JOIN KISORO` | reply `<alert no.> 1-8`, or `RAIN 25` (gauge mm) | `STOP` |
| Agent | mobile app → Agent tab | Agent tab → Report an incident | — |
| Contact list | console → Register people → Import a contact list | — | `STOP` |

Report codes everywhere: 1 heavy rain, 2 light rain, 3 flood, 4 landslide,
5 no rain, 6 hail, 7 crop disease, 8 animal disease.

### Importing contact lists

CSV with a `phone` column; `name`, `livelihood`, `language`, `village`,
`sub-county`, `parish` and `district` are optional. The importer:

- requires the admin to confirm everyone agreed and to record where the list
  came from (stored as the consent method);
- never re-subscribes anyone who sent STOP before;
- sends new people a welcome SMS that explains STOP (on by default);
- skips numbers Excel has mangled (2.56772E+11): format the phone column as Text.

## Voice calls

Calls use the Africa's Talking Voice API and a virtual number. When someone
answers, Africa's Talking asks the backend what to play:

- a recording for the person's language, if one was added for that send. It can
  be uploaded (best: a local speaker reading the warning) or generated with
  Sunbird AI (Runyankore/Rukiga `nyn`, Luganda `lug`, Rufumbira via the
  Kinyarwanda voice `kin`, English) or ElevenLabs (English);
- otherwise the gateway's text-to-speech reads the English message twice.

Lukonzo, Rutooro and Lugisu have no synthetic voice yet, so record those. Have
a speaker listen to every generated clip before you use it.

## Setup

**Backend (TUOGERE-BE)**

```
AT_USERNAME=sandbox            # your Africa's Talking app username in production
AT_API_KEY=...
AT_SENDER_ID=                  # optional, production only (approved sender id / shortcode)
AT_VOICE_NUMBER=+256...        # Africa's Talking virtual voice number; enables calls
EWS_CALLBACK_SECRET=<random>   # appended to callback URLs as ?key=
EWS_USSD_CODE=*384*123#        # shown to users once you have one
PUBLIC_URL=https://<backend>   # absolute links for recordings when B2 is not used
SUNBIRD_API_TOKEN=             # optional, local-language voices
ELEVENLABS_API_KEY=            # optional, English voices (ELEVENLABS_VOICE_ID to pick one)
OPENAI_API_KEY=                # AI notes on agent report photos
B2_*                           # report photos/videos and recordings are stored here when set
```

In the Africa's Talking dashboard, set:

- USSD callback: `https://<backend>/api/ews/ussd?key=<EWS_CALLBACK_SECRET>`
- SMS inbound callback: `https://<backend>/api/ews/sms/inbound?key=<EWS_CALLBACK_SECRET>`
- SMS delivery reports: `https://<backend>/api/ews/sms/delivery?key=<EWS_CALLBACK_SECRET>`
- Voice number callback: `https://<backend>/api/ews/voice/callback?key=<EWS_CALLBACK_SECRET>`

Inbound SMS (JOIN / STOP / replies) needs a shortcode or two-way number.
Voice calls only work with a production Africa's Talking account, not the sandbox.

**Web (this repo)**

```
EWS_FORECAST_URL=     # optional external forecast feed; expected JSON in src/lib/ews/forecast.js
OPENAI_API_KEY=       # AI insights and translation drafts
```

## What is and is not real yet

- Forecasts: real ECMWF ensemble data (about 25 km grid, so neighbouring
  districts such as Kisoro and Rubanda can share a cell). A higher-resolution
  feed can be plugged in through `EWS_FORECAST_URL`.
- The "normal" comes from ERA5 reanalysis, while the last 30 days come from
  forecast models. Rain from the two sources is close but not identical, so
  "x% above normal" is a guide rather than an exact anomaly. Temperature is not
  compared, because the two sources differ by a degree or more in the highlands.
- Disease-risk signals flag weather that favours disease. They do not detect
  outbreaks. Agree the thresholds and messages with district agriculture,
  veterinary and health officers.
- No ground sensors. Ground truth comes from community feedback, agent
  field reports and manual rain gauges.
- AI insights and AI translation are suggestions; a person reviews everything
  before it is sent.
- District coordinates are approximate headquarters; hazard flags per district
  should be checked with district disaster officers.

Keep the district list in `src/lib/ews/regions.js` in sync with `DISTRICTS` in
`TUOGERE-BE/src/api/ews/services/ews.js` (the USSD menu order) and with
`constants/ews.ts` in Kibira-Mobile.
