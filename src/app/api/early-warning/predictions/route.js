import { NextResponse } from "next/server";
import { getFacility, listFacilities } from "@/lib/early-warning/facilities";
import { buildFacilityRisk, buildFacilityRiskOffline } from "@/lib/early-warning/risk";
import {
  computeHeatIllnessRisk,
  computeVectorRisk,
  heatIndexC,
} from "@/lib/early-warning/predictions";
import { fetchWeatherBundle, liveSnapshot } from "@/lib/early-warning/weather";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get("facilityId");
    const lat = parseFloat(searchParams.get("lat"));
    const lng = parseFloat(searchParams.get("lng"));

    if (facilityId) {
      const facility = getFacility(facilityId);
      if (!facility) {
        return NextResponse.json({ error: "Facility not found" }, { status: 404 });
      }
      let risk;
      try {
        risk = await buildFacilityRisk(facility);
      } catch {
        risk = buildFacilityRiskOffline(facility);
      }
      return NextResponse.json({
        version: "1.0.0",
        facilityId,
        heatIllnessRisk: risk.readings.heatIllnessRisk,
        vectorRisk: risk.readings.vectorRisk,
        heatIndex: risk.readings.heatIndex,
        outlook: risk.outlook,
        alerts: risk.alerts.filter(
          (a) => a.hazard === "heatIllness" || a.hazard === "vector" || a.hazard === "heat"
        ),
        generatedAt: risk.generatedAt,
      });
    }

    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      const { weather, air } = await fetchWeatherBundle(lat, lng);
      const live = liveSnapshot(weather, air);
      const temp = live.temperature ?? 28;
      const humidity = live.humidity ?? 65;
      const heat = computeHeatIllnessRisk({
        tempC: temp,
        humidity,
        uvIndex: live.uvIndex ?? 7,
        facilityType: "school",
      });
      const rainToday = weather?.daily?.precipitation_sum?.[0] || 0;
      const rain7 = (weather?.daily?.precipitation_sum || [])
        .slice(0, 7)
        .reduce((a, b) => a + (b || 0), 0);
      const vector = computeVectorRisk({
        tempC: temp,
        humidity,
        rainfallMm24h: rainToday,
        rainfallMm7d: rain7,
        standingWaterProxy: 0.5,
      });
      return NextResponse.json({
        version: "1.0.0",
        lat,
        lng,
        heatIllnessRisk: heat.score,
        heatIndex: heat.heatIndex,
        vectorRisk: vector,
        temperature: temp,
        humidity,
        generatedAt: new Date().toISOString(),
      });
    }

    const facilities = listFacilities().slice(0, 12);
    const rows = await Promise.all(
      facilities.map(async (f) => {
        try {
          const risk = await buildFacilityRisk(f);
          return {
            facilityId: f.id,
            name: f.name,
            type: f.type,
            heatIllnessRisk: risk.readings.heatIllnessRisk,
            vectorRisk: risk.readings.vectorRisk,
            alertLevel: risk.alertLevel,
          };
        } catch {
          const risk = buildFacilityRiskOffline(f);
          return {
            facilityId: f.id,
            name: f.name,
            type: f.type,
            heatIllnessRisk: risk.readings.heatIllnessRisk,
            vectorRisk: risk.readings.vectorRisk,
            alertLevel: risk.alertLevel,
          };
        }
      })
    );

    return NextResponse.json({
      version: "1.0.0",
      model: "heat-illness + vector suitability",
      count: rows.length,
      predictions: rows,
      meta: {
        heatIndexFormula: "NWS-style heat index (°C)",
        vectorNote: "Climate suitability for transmission windows — not clinical case forecast",
        heatIndexExample: heatIndexC(32, 75),
      },
      generatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to compute predictions" }, { status: 500 });
  }
}
