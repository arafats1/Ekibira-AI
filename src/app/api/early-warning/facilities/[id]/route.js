import { NextResponse } from "next/server";
import { getFacility, publicFacility } from "@/lib/early-warning/facilities";
import { buildFacilityRisk, buildFacilityRiskOffline } from "@/lib/early-warning/risk";

export async function GET(_request, { params }) {
  try {
    const { id } = await params;
    const facility = getFacility(id);
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
      facility: publicFacility(facility),
      risk,
    });
  } catch {
    return NextResponse.json({ error: "Failed to load facility risk" }, { status: 500 });
  }
}
