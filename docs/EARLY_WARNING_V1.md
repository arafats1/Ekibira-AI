# KibiraAI Children's Early Warning — Open Source v1.0

**License:** MIT  
**Release:** `v1.0.0`  
**Focus:** UNICEF Area 2 — Early warning, early action for children's climate health

## What this module provides

| Capability | Path |
|---|---|
| Facility registry (schools & clinics) | `src/lib/early-warning/facilities.js` |
| Child-sensitive thresholds + playbooks | `src/lib/early-warning/thresholds.js` |
| Heat-illness + vector suitability models | `src/lib/early-warning/predictions.js` |
| Weather/AQ stations at facilities | `src/lib/early-warning/stations.js` |
| Risk aggregation (Open-Meteo + models) | `src/lib/early-warning/risk.js` |
| Public APIs (Strapi / Express) | Early-warning REST endpoints (facilities, thresholds, predictions, stations, status) |
| Children's Early Warning UI (Next.js frontend) | `/childrens-early-warning` |
| Public status dashboard (Next.js frontend) | `/early-warning-status` |

## Public API (Strapi / Express backend)

```
GET /api/early-warning
GET /api/early-warning/status
GET /api/early-warning/facilities
GET /api/early-warning/facilities?risk=1
GET /api/early-warning/facilities/{id}
GET /api/early-warning/thresholds
GET /api/early-warning/predictions
GET /api/early-warning/predictions?facilityId=sch-bwaise-muslim
GET /api/early-warning/stations
GET /api/early-warning/stations?id=stn-bwaise-01
```

All endpoints return JSON suitable for dashboards, partners, and UNICEF real-time data requirements. Backend is **Strapi on Express** with **MySQL**; the Next.js app is **frontend only**.

## Data sources

- **Open-Meteo** — weather forecast, humidity, UV
- **Open-Meteo Air Quality** — PM2.5, PM10, European AQI
- **GloFAS via Open-Meteo** — river discharge for flood context
- **On-facility stations** — hyper-local temperature, humidity, PM, UV (pilot telemetry model)

## Models (transparent)

1. **Heat-illness risk (0–100)** — heat index, humidity, UV, canopy deficit, facility type
2. **Vector / malaria climate suitability (0–100)** — temperature window, humidity, rainfall, drainage/standing-water proxy

These are **climate suitability / health risk foresight layers**, not clinical diagnoses.

## Reproducibility

```bash
# Frontend (Next.js)
npm install && npm run dev
# open http://localhost:3000/childrens-early-warning

# Backend (Strapi / Express + MySQL) — run your Strapi server separately
# then call early-warning endpoints on the Strapi base URL
```

## Open-source commitment

Core early-warning libraries and Strapi/Express API definitions are intended for open reuse under MIT. Hardware station firmware and partner PII systems remain out of scope for v1.0.
