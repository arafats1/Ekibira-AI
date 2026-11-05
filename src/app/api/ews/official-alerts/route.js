import { NextResponse } from "next/server";
import { DMS_SOURCE, getDmsAlerts } from "@/lib/ews/dms";

const CORS = { "Access-Control-Allow-Origin": "*" };

/**
 * GET /api/ews/official-alerts → active early warnings from the Department of
 * Meteorological Services (open CAP feed), with the covered districts we
 * serve. Polygons are left out to keep it small.
 */
export async function GET() {
  const { alerts, error } = await getDmsAlerts();
  return NextResponse.json(
    {
      source: DMS_SOURCE,
      portal: "https://wids.mwe.go.ug/early-warning-alerts",
      alerts: alerts.map(({ polygons, ...a }) => a),
      error,
      fetchedAt: new Date().toISOString(),
    },
    { headers: { ...CORS, "Cache-Control": "public, max-age=300" } }
  );
}
