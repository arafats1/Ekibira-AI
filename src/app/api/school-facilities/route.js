import { NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

async function getMe(token) {
  const res = await fetch(`${STRAPI_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

function slugify(name) {
  return String(name || "facility")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
}

function toFacility(row) {
  const d = row.attributes ? { id: row.id, documentId: row.documentId, ...row.attributes } : row;
  return {
    id: d.facilityKey || d.documentId || String(d.id),
    documentId: d.documentId || null,
    strapiId: d.id || null,
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
    contactName: d.contactName || "",
    contactPhone: d.contactPhone || "",
    alertConsent: Boolean(d.alertConsent),
    ownerUserId: d.ownerUserId,
    ownerEmail: d.ownerEmail || "",
    drainageVulnerability: Number(d.drainageVulnerability) || 0.6,
    urbanHeatIslandDelta: Number(d.urbanHeatIslandDelta) || 4.5,
    treeCanopyCoverage: Number(d.treeCanopyCoverage) || 0.05,
    imperviousSurface: Number(d.imperviousSurface) || 0.7,
    stationId: d.stationId || null,
    createdAt: d.createdAt || null,
  };
}

export async function GET(request) {
  try {
    const auth = request.headers.get("authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const me = await getMe(token);
    if (!me?.id) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const res = await fetch(
      `${STRAPI_URL}/api/kibira-facilities?filters[ownerUserId][$eq]=${me.id}&sort=createdAt:desc&pagination[pageSize]=100`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.error?.message || "Could not load facilities. Restart MarketDoc-BE after adding kibira-facility." },
        { status: res.status }
      );
    }

    const data = await res.json();
    const facilities = (data.data || []).map(toFacility);

    return NextResponse.json({
      count: facilities.length,
      facilities,
      childrenCovered: facilities
        .filter((f) => f.type === "school")
        .reduce((s, f) => s + (f.enrollment || 0), 0),
      clinicCatchment: facilities
        .filter((f) => f.type === "clinic")
        .reduce((s, f) => s + (f.catchment || 0), 0),
    });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to load facilities" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const auth = request.headers.get("authorization") || "";
    const token = auth.replace(/^Bearer\s+/i, "");
    if (!token) {
      return NextResponse.json({ error: "Sign in required" }, { status: 401 });
    }

    const me = await getMe(token);
    if (!me?.id) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    const body = await request.json();
    const name = String(body.name || "").trim();
    const type = body.type === "clinic" ? "clinic" : "school";
    const ward = String(body.ward || "").trim();
    const lat = Number(body.lat);
    const lng = Number(body.lng);

    if (!name || !ward || Number.isNaN(lat) || Number.isNaN(lng)) {
      return NextResponse.json(
        { error: "Name, ward, latitude and longitude are required" },
        { status: 400 }
      );
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return NextResponse.json({ error: "Invalid GPS coordinates" }, { status: 400 });
    }

    const facilityKey = `${type === "clinic" ? "cli" : "sch"}-user-${me.id}-${slugify(name)}-${Date.now().toString(36)}`;

    const payload = {
      data: {
        facilityKey,
        name,
        type,
        ward,
        district: String(body.district || "Kampala").trim() || "Kampala",
        country: String(body.country || "Uganda").trim() || "Uganda",
        lat,
        lng,
        enrollment: type === "school" ? Math.max(0, parseInt(body.enrollment, 10) || 0) : 0,
        catchment: type === "clinic" ? Math.max(0, parseInt(body.catchment, 10) || 0) : 0,
        contactRole: String(body.contactRole || (type === "clinic" ? "In-charge" : "Headteacher")).trim(),
        contactName: String(body.contactName || "").trim(),
        contactPhone: String(body.contactPhone || "").trim(),
        alertConsent: Boolean(body.alertConsent),
        ownerUserId: me.id,
        ownerEmail: me.email || "",
        drainageVulnerability: Number(body.drainageVulnerability) || 0.6,
        urbanHeatIslandDelta: Number(body.urbanHeatIslandDelta) || 4.5,
        treeCanopyCoverage: Number(body.treeCanopyCoverage) || 0.05,
        imperviousSurface: Number(body.imperviousSurface) || 0.7,
      },
    };

    const res = await fetch(`${STRAPI_URL}/api/kibira-facilities`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Could not register facility" },
        { status: res.status }
      );
    }

    return NextResponse.json({ facility: toFacility(data.data) }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Registration failed" }, { status: 500 });
  }
}
