import { NextResponse } from "next/server";
import { DISTRICTS, PERSONAS, findDistrict } from "@/lib/ews/regions";
import { getDistrictForecast, getDistrictForecasts } from "@/lib/ews/forecast";
import { assessHazards } from "@/lib/ews/hazards";
import { draftMessages } from "@/lib/ews/messages";

const PERSONA_KEYS = PERSONAS.map((p) => p.key);

/**
 * GET /api/ews/outlook?district=Kisoro  → forecast, hazard signals and draft SMS per persona
 * GET /api/ews/outlook                  → hazard signals for every district (overview)
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get("district");

  if (name) {
    const district = findDistrict(name);
    if (!district) return NextResponse.json({ error: "Unknown district" }, { status: 404 });
    try {
      const forecast = await getDistrictForecast(district);
      const hazards = assessHazards(district, forecast).map((signal) => ({
        ...signal,
        drafts: draftMessages(signal, district.name, PERSONA_KEYS),
      }));
      return NextResponse.json({ district, forecast, hazards });
    } catch (err) {
      return NextResponse.json({ error: `Forecast unavailable: ${err.message}` }, { status: 502 });
    }
  }

  const forecasts = await getDistrictForecasts(DISTRICTS);
  const results = DISTRICTS.map((district, i) => {
    const forecast = forecasts[i];
    if (forecast.error) {
      return { district: district.name, region: district.region, error: forecast.error, hazards: [] };
    }
    return {
      district: district.name,
      region: district.region,
      provider: forecast.rainfall.provider,
      hazards: assessHazards(district, forecast),
      today: forecast.rainfall.days?.[0] || null,
    };
  });
  return NextResponse.json({ districts: results, generatedAt: new Date().toISOString() });
}
