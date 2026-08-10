import { NextResponse } from "next/server";
import { buildFacilityRisk, buildFacilityRiskOffline } from "@/lib/early-warning/risk";
import { PLAYBOOKS } from "@/lib/early-warning/thresholds";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

async function getMe(token) {
  const res = await fetch(`${STRAPI_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

function toRiskFacility(d) {
  return {
    id: d.facilityKey || d.documentId || String(d.id),
    name: d.name,
    type: d.type,
    ward: d.ward,
    district: d.district || "Kampala",
    country: d.country || "Uganda",
    lat: Number(d.lat),
    lng: Number(d.lng),
    enrollment: Number(d.enrollment) || 0,
    catchment: Number(d.catchment) || 0,
    contactRole: d.contactRole || "",
    stationId: d.stationId || null,
    drainageVulnerability: Number(d.drainageVulnerability) || 0.6,
    urbanHeatIslandDelta: Number(d.urbanHeatIslandDelta) || 4.5,
    treeCanopyCoverage: Number(d.treeCanopyCoverage) || 0.05,
    imperviousSurface: Number(d.imperviousSurface) || 0.7,
  };
}

export async function GET(request, { params }) {
  try {
    const { id } = await params;
    const auth = request.headers.get("authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const me = await getMe(token);
    if (!me?.id) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const listRes = await fetch(
      `${STRAPI_URL}/api/kibira-facilities?filters[ownerUserId][$eq]=${me.id}&pagination[pageSize]=100`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!listRes.ok) {
      return NextResponse.json({ error: "Could not load facilities" }, { status: 500 });
    }

    const listData = await listRes.json();
    const rows = listData.data || [];
    const match = rows.find((row) => {
      const d = row.attributes ? { ...row.attributes, documentId: row.documentId, id: row.id } : row;
      return d.facilityKey === id || d.documentId === id || String(d.id) === String(id);
    });

    if (!match) {
      return NextResponse.json({ error: "Facility not found" }, { status: 404 });
    }

    const raw = match.attributes
      ? { ...match.attributes, documentId: match.documentId, id: match.id }
      : match;
    const facility = toRiskFacility(raw);

    let risk;
    try {
      risk = await buildFacilityRisk(facility);
    } catch {
      risk = buildFacilityRiskOffline(facility);
    }

    const activePlaybooks = (risk.alerts || [])
      .map((a) => PLAYBOOKS.find((p) => p.id === a.playbookId))
      .filter(Boolean)
      .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i);

    return NextResponse.json({
      version: "1.0.0",
      facility: {
        ...facility,
        contactName: raw.contactName || "",
        contactPhone: raw.contactPhone || "",
        alertConsent: Boolean(raw.alertConsent),
      },
      risk,
      playbooks: activePlaybooks.length
        ? activePlaybooks
        : PLAYBOOKS.filter((p) => p.audience.includes(facility.type) || p.audience.includes("community")),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Risk lookup failed" }, { status: 500 });
  }
}
