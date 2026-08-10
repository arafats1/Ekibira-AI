import { NextResponse } from "next/server";
import { listFacilities, publicFacility, facilityStats } from "@/lib/early-warning/facilities";
import { buildFacilityRisk, buildFacilityRiskOffline } from "@/lib/early-warning/risk";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || undefined;
    const ward = searchParams.get("ward") || undefined;
    const district = searchParams.get("district") || undefined;
    const includeRisk = searchParams.get("risk") === "1" || searchParams.get("risk") === "true";

    const facilities = listFacilities({ type, ward, district });

    if (!includeRisk) {
      return NextResponse.json({
        version: "1.0.0",
        count: facilities.length,
        stats: facilityStats(),
        facilities: facilities.map(publicFacility),
      });
    }

    const slice = facilities.slice(0, 20);
    const risks = await Promise.all(
      slice.map(async (f) => {
        try {
          return await buildFacilityRisk(f);
        } catch {
          return buildFacilityRiskOffline(f);
        }
      })
    );

    return NextResponse.json({
      version: "1.0.0",
      count: risks.length,
      stats: facilityStats(),
      facilities: risks,
      generatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to load facilities" }, { status: 500 });
  }
}
