import { NextResponse } from "next/server";

/**
 * Public Early Warning API index — UNICEF-accessible real-time entrypoint.
 */
export async function GET() {
  return NextResponse.json({
    name: "KibiraAI Children's Early Warning API",
    version: "1.0.0",
    license: "MIT",
    description:
      "Hyper-local climate and environmental early warning for schools, clinics, local governments, and community leaders — air pollution, UV, heat, humidity, flood, heat-illness and vector risk.",
    endpoints: {
      status: { method: "GET", path: "/api/early-warning/status", desc: "Public metrics and alert summary" },
      facilities: {
        method: "GET",
        path: "/api/early-warning/facilities",
        query: "type, ward, district, risk=1",
        desc: "Facility registry (schools & clinics)",
      },
      facilityRisk: {
        method: "GET",
        path: "/api/early-warning/facilities/{id}",
        desc: "Live risk + alerts + outlook for one facility",
      },
      thresholds: {
        method: "GET",
        path: "/api/early-warning/thresholds",
        desc: "Child-sensitive thresholds and playbooks",
      },
      predictions: {
        method: "GET",
        path: "/api/early-warning/predictions",
        query: "facilityId | lat,lng | (none for batch)",
        desc: "Heat-illness and vector suitability predictions",
      },
      stations: {
        method: "GET",
        path: "/api/early-warning/stations",
        query: "id, status, live=0",
        desc: "Weather/AQ stations at schools and clinics",
      },
    },
    ui: {
      childrensEarlyWarning: "/childrens-early-warning",
      publicDashboard: "/early-warning-status",
    },
  });
}
