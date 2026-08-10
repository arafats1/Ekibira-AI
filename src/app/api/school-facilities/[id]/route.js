import { NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

async function getMe(token) {
  const res = await fetch(`${STRAPI_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function DELETE(request, { params }) {
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

    // Resolve by facilityKey or documentId
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

    const docId = match.documentId || match.id;
    const delRes = await fetch(`${STRAPI_URL}/api/kibira-facilities/${docId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!delRes.ok) {
      const err = await delRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.error?.message || "Could not delete facility" },
        { status: delRes.status }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Delete failed" }, { status: 500 });
  }
}
