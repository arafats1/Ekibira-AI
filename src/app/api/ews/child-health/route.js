import { NextResponse } from "next/server";
import { findDistrict } from "@/lib/ews/regions";
import { childHealthOutlook } from "@/lib/ews/child";

// Public; the mobile app's web build and the admin console call it too.
const CORS = { "Access-Control-Allow-Origin": "*" };

/**
 * GET /api/ews/child-health?district=Kabale → children's health risks (malaria,
 * diarrhoea, pneumonia, heat) for the next week with what parents can do.
 */
export async function GET(request) {
  const name = new URL(request.url).searchParams.get("district");
  const district = findDistrict(name);
  if (!district) return NextResponse.json({ error: "Choose one of the covered districts" }, { status: 404, headers: CORS });
  try {
    const outlook = await childHealthOutlook(district);
    return NextResponse.json({ district: district.name, region: district.region, ...outlook }, { headers: { ...CORS, "Cache-Control": "public, max-age=900" } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502, headers: CORS });
  }
}
