import { NextResponse } from "next/server";
import { DISTRICTS, PERSONAS, findDistrict } from "@/lib/ews/regions";
import { getDistrictForecast, getDistrictForecasts } from "@/lib/ews/forecast";
import { assessHazards, assessDiseaseRisks, SEVERITY_ORDER } from "@/lib/ews/hazards";
import { getDailyWeather, getClimateNormals } from "@/lib/ews/weather";
import { draftMessages } from "@/lib/ews/messages";
import { getSatellite } from "@/lib/ews/satellite";

const PERSONA_KEYS = PERSONAS.map((p) => p.key);

// Public forecast data; the mobile app's web build calls it cross-origin.
const CORS = { "Access-Control-Allow-Origin": "*" };

function bySeverity(a, b) {
  return SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity];
}

/**
 * GET /api/ews/outlook?district=Kisoro  → weather, rainfall forecast, satellite rainfall and NDVI, hazard signals and draft SMS per persona
 * GET /api/ews/outlook                  → current temperature and hazard signals for every district (overview)
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("district");

  if (name) {
    const district = findDistrict(name);
    if (!district) return NextResponse.json({ error: "Unknown district" }, { status: 404, headers: CORS });
    try {
      const [forecast, [weather], [normal], satellite] = await Promise.all([
        getDistrictForecast(district),
        getDailyWeather([district]),
        getClimateNormals([district]),
        getSatellite(district),
      ]);
      const signals = assessHazards(district, forecast);
      const hazards = [...signals, ...assessDiseaseRisks(weather, signals, normal)].sort(bySeverity).map((signal) => ({
        ...signal,
        drafts: draftMessages(signal, district.name, PERSONA_KEYS),
      }));
      return NextResponse.json({ district, forecast, weather, normal, satellite, hazards }, { headers: CORS });
    } catch (err) {
      return NextResponse.json({ error: `Forecast unavailable: ${err.message}` }, { status: 502, headers: CORS });
    }
  }

  const [forecasts, weather, normals] = await Promise.all([
    getDistrictForecasts(DISTRICTS),
    getDailyWeather(DISTRICTS),
    getClimateNormals(DISTRICTS),
  ]);
  const results = DISTRICTS.map((district, i) => {
    const forecast = forecasts[i];
    const current = weather[i]?.current || null;
    const today = weather[i]?.days?.[0] || null;
    const base = { district: district.name, region: district.region, current, today };
    const signals = forecast.error ? [] : assessHazards(district, forecast);
    const hazards = [...signals, ...assessDiseaseRisks(weather[i], signals, normals[i])].sort(bySeverity);
    if (forecast.error) return { ...base, error: forecast.error, hazards };
    return { ...base, provider: forecast.rainfall.provider, hazards };
  });
  return NextResponse.json({ districts: results, generatedAt: new Date().toISOString() }, { headers: CORS });
}
