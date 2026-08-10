import { NextResponse } from "next/server";
import { facilityStats, listFacilities } from "@/lib/early-warning/facilities";
import { stationStats } from "@/lib/early-warning/stations";
import { THRESHOLDS, PLAYBOOKS } from "@/lib/early-warning/thresholds";
import { buildFacilityRiskOffline } from "@/lib/early-warning/risk";

export async function GET() {
  try {
    const stats = facilityStats();
    const stations = stationStats();
    const facilities = listFacilities();
    const risks = facilities.map((f) => buildFacilityRiskOffline(f));

    const byLevel = { critical: 0, warning: 0, watch: 0, normal: 0 };
    for (const r of risks) byLevel[r.alertLevel] = (byLevel[r.alertLevel] || 0) + 1;

    const topAlerts = risks
      .filter((r) => r.alertLevel !== "normal")
      .sort((a, b) => {
        const rank = { critical: 3, warning: 2, watch: 1 };
        return (rank[b.alertLevel] || 0) - (rank[a.alertLevel] || 0);
      })
      .slice(0, 8)
      .map((r) => ({
        facilityId: r.facilityId,
        name: r.name,
        type: r.type,
        ward: r.ward,
        alertLevel: r.alertLevel,
        heatIllnessRisk: r.readings.heatIllnessRisk,
        vectorRisk: r.readings.vectorRisk,
        aqi: r.readings.aqi,
        floodRisk: r.readings.floodRisk,
      }));

    return NextResponse.json({
      version: "1.0.0",
      product: "KibiraAI Children's Early Warning",
      openSource: {
        license: "MIT",
        release: "v1.0.0",
        modules: [
          "facility-registry",
          "child-thresholds",
          "heat-illness-predictor",
          "vector-suitability",
          "station-telemetry",
          "public-apis",
        ],
      },
      facilities: stats,
      stations,
      alerts: byLevel,
      topAlerts,
      thresholdsVersion: THRESHOLDS.version,
      playbookCount: PLAYBOOKS.length,
      endpoints: [
        "/api/early-warning",
        "/api/early-warning/facilities",
        "/api/early-warning/facilities/[id]",
        "/api/early-warning/thresholds",
        "/api/early-warning/predictions",
        "/api/early-warning/stations",
        "/api/early-warning/status",
      ],
      dashboards: {
        childrensEarlyWarning: "/childrens-early-warning",
        publicStatus: "/early-warning-status",
        urbanWarning: "/urban-warning",
      },
      generatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to load status" }, { status: 500 });
  }
}
