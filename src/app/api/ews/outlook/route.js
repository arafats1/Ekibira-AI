import { NextResponse } from "next/server";
import { AREAS, DISTRICTS, PERSONAS, areasOf, findDistrict } from "@/lib/ews/regions";
import { getDistrictForecast, getDistrictForecasts } from "@/lib/ews/forecast";
import { assessHazards, assessDiseaseRisks, applySeason, seasonState, SEVERITY_ORDER } from "@/lib/ews/hazards";
import { getDailyWeather, getClimateNormals } from "@/lib/ews/weather";
import { draftMessages } from "@/lib/ews/messages";
import { getSatellite } from "@/lib/ews/satellite";
import { dmsFor, getDmsAlerts } from "@/lib/ews/dms";

const PERSONA_KEYS = PERSONAS.map((p) => p.key);

// Public forecast data; the mobile app's web build calls it cross-origin.
const CORS = { "Access-Control-Allow-Origin": "*" };

function bySeverity(a, b) {
  return SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
}

const sum = (days, key) => Math.round(days.slice(0, 7).reduce((n, d) => n + (d[key] || 0), 0));

/**
 * Signals for an extra forecast point inside a district. It shares the
 * district's hazard list, recent weather and satellite season; only the
 * ensemble forecast and river flow are its own.
 */
function areaOutlook(area, district, forecast, satellite, weather, normal, withDrafts) {
  const base = { name: area.name, note: area.note, lat: area.lat, lng: area.lng };
  if (!forecast || forecast.error) return { ...base, error: forecast?.error || "No forecast", hazards: [] };
  const point = { ...district, lat: area.lat, lng: area.lng };
  const place = `${area.name}, ${district.name}`;
  const hazards = applySeason(district, assessHazards(point, forecast), satellite, weather, normal)
    // The dry season is district-wide (district satellite data); keep it on the district.
    .filter((h) => h.variant !== "season_dry")
    .sort(bySeverity)
    .map((signal) => (withDrafts ? { ...signal, drafts: draftMessages(signal, place, PERSONA_KEYS) } : signal));
  const days = forecast.rainfall.days || [];
  return { ...base, next7: { median: sum(days, "median"), p90: sum(days, "p90") }, hazards };
}

/**
 * The district's signals plus any area signal that is new or stronger than the
 * district's own for that hazard, tagged with the area so it reads "In Bwera: …".
 */
function withAreaSignals(hazards, areas) {
  const out = [...hazards];
  for (const area of areas) {
    for (const h of area.hazards) {
      const own = out.find((o) => o.hazard === h.hazard && !o.area);
      if (own && SEVERITY_ORDER[own.severity] >= SEVERITY_ORDER[h.severity]) continue;
      const other = out.find((o) => o.hazard === h.hazard && o.area);
      if (other && SEVERITY_ORDER[other.severity] >= SEVERITY_ORDER[h.severity]) continue;
      if (other) out.splice(out.indexOf(other), 1);
      out.push({ ...h, area: area.name, reason: `In ${area.name} (${area.note}): ${h.reason}` });
    }
  }
  return out.sort(bySeverity);
}

/**
 * GET /api/ews/outlook?district=Kisoro  → weather, rainfall forecast, satellite rainfall and NDVI, hazard signals and draft SMS per persona, and the same for extra forecast points in the district
 * GET /api/ews/outlook                  → current temperature, hazard signals and the season so far for every district (overview)
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("district");

  if (name) {
    const district = findDistrict(name);
    if (!district) return NextResponse.json({ error: "Unknown district" }, { status: 404, headers: CORS });
    try {
      const extra = areasOf(district.name);
      const [forecast, [weather], [normal], satellite, areaForecasts, dms] = await Promise.all([
        getDistrictForecast(district),
        getDailyWeather([district]),
        getClimateNormals([district]),
        getSatellite(district),
        extra.length ? getDistrictForecasts(extra) : [],
        getDmsAlerts(),
      ]);
      const signals = assessHazards(district, forecast);
      const all = [...signals, ...assessDiseaseRisks(weather, signals, normal)];
      const season = seasonState(satellite, weather, normal);
      const hazards = applySeason(district, all, satellite, weather, normal).sort(bySeverity).map((signal) => ({
        ...signal,
        drafts: draftMessages(signal, district.name, PERSONA_KEYS),
      }));
      const areas = extra.map((a, i) => areaOutlook(a, district, areaForecasts[i], satellite, weather, normal, true));
      return NextResponse.json(
        {
          district,
          forecast,
          weather,
          normal,
          satellite,
          season,
          hazards: withAreaSignals(hazards, areas),
          areas,
          // Official DMS warnings covering this district (shown first, never merged into ours)
          official: dmsFor(dms.alerts, district.name).map(({ polygons, ...a }) => a),
        },
        { headers: CORS }
      );
    } catch (err) {
      return NextResponse.json({ error: `Forecast unavailable: ${err.message}` }, { status: 502, headers: CORS });
    }
  }

  const [forecasts, weather, normals, satellites, areaForecasts, dms] = await Promise.all([
    getDistrictForecasts(DISTRICTS),
    getDailyWeather(DISTRICTS),
    getClimateNormals(DISTRICTS),
    Promise.all(DISTRICTS.map((d) => getSatellite(d))),
    getDistrictForecasts(AREAS),
    getDmsAlerts(),
  ]);
  const results = DISTRICTS.map((district, i) => {
    const forecast = forecasts[i];
    const current = weather[i]?.current || null;
    const today = weather[i]?.days?.[0] || null;
    const season = seasonState(satellites[i], weather[i], normals[i]);
    const areas = AREAS.map((a, j) => [a, areaForecasts[j]])
      .filter(([a]) => a.district === district.name)
      .map(([a, f]) => areaOutlook(a, district, f, satellites[i], weather[i], normals[i], false));
    const official = dmsFor(dms.alerts, district.name).map(({ id, event, level, severity, headline, expires, web }) => ({ id, event, level, severity, headline, expires, web }));
    const base = { district: district.name, region: district.region, lat: district.lat, lng: district.lng, current, today, season, areas, official };
    const signals = forecast.error ? [] : assessHazards(district, forecast);
    const all = [...signals, ...assessDiseaseRisks(weather[i], signals, normals[i])];
    const hazards = withAreaSignals(applySeason(district, all, satellites[i], weather[i], normals[i]), areas);
    if (forecast.error) return { ...base, error: forecast.error, hazards };
    return { ...base, provider: forecast.rainfall.provider, hazards };
  });
  return NextResponse.json(
    { districts: results, official: dms.alerts.map(({ polygons, ...a }) => a), officialError: dms.error, generatedAt: new Date().toISOString() },
    { headers: CORS }
  );
}
