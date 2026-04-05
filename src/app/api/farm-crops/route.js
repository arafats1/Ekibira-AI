import { NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

// ─── Helper: extract and validate Bearer token ───
function getToken(request) {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

// ─── GET: Fetch user's crops ───
export async function GET(request) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get user ID from token
    const meRes = await fetch(`${STRAPI_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    const me = await meRes.json();

    // Fetch crops for this user
    const cropsRes = await fetch(
      `${STRAPI_URL}/api/farm-crops?filters[userId][$eq]=${me.id}&sort=createdAt:desc&pagination[pageSize]=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!cropsRes.ok) {
      const err = await cropsRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.error?.message || "Failed to fetch crops" },
        { status: cropsRes.status }
      );
    }

    const cropsData = await cropsRes.json();
    const crops = (cropsData.data || []).map((item) => ({
      ...item,
      id: item.documentId || item.id,
    }));

    return NextResponse.json({ crops });
  } catch (error) {
    console.error("Farm crops GET error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── POST: Add a new crop ───
export async function POST(request) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const meRes = await fetch(`${STRAPI_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    const me = await meRes.json();

    const body = await request.json();
    const { cropName, variety, area, areaUnit, plantingDate, location, notes, seedQuantity, seedUnit, spacing } = body;

    if (!cropName || !plantingDate || !location) {
      return NextResponse.json(
        { error: "cropName, plantingDate, and location are required" },
        { status: 400 }
      );
    }

    // Validate and sanitize inputs
    const sanitized = {
      cropName: String(cropName).trim().slice(0, 100),
      variety: variety ? String(variety).trim().slice(0, 100) : "",
      area: area ? parseFloat(area) || 0 : 0,
      areaUnit: ["acres", "hectares", "sqm"].includes(areaUnit) ? areaUnit : "acres",
      plantingDate: String(plantingDate).slice(0, 10),
      location: String(location).trim().slice(0, 200),
      notes: notes ? String(notes).trim().slice(0, 500) : "",
      seedQuantity: seedQuantity ? parseFloat(seedQuantity) || 0 : 0,
      seedUnit: seedUnit ? String(seedUnit).trim().slice(0, 20) : "kg",
      spacing: spacing ? String(spacing).trim().slice(0, 100) : "",
      userId: me.id,
      status: "growing",
    };

    const createRes = await fetch(`${STRAPI_URL}/api/farm-crops`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data: sanitized }),
    });

    if (!createRes.ok) {
      const err = await createRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.error?.message || "Failed to add crop" },
        { status: createRes.status }
      );
    }

    const created = await createRes.json();
    return NextResponse.json({ crop: { ...created.data, id: created.data.documentId || created.data.id } });
  } catch (error) {
    console.error("Farm crops POST error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── PUT: Update a crop (status, notes, harvest date) ───
export async function PUT(request) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const meRes = await fetch(`${STRAPI_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    const me = await meRes.json();

    const body = await request.json();
    const { id, status, notes, harvestDate, harvestYield, yieldUnit } = body;

    if (!id) {
      return NextResponse.json({ error: "Crop id is required" }, { status: 400 });
    }

    // Verify ownership — Strapi v5 uses documentId in URLs
    const checkRes = await fetch(
      `${STRAPI_URL}/api/farm-crops/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!checkRes.ok) return NextResponse.json({ error: "Crop not found" }, { status: 404 });
    const existing = await checkRes.json();
    const existingUserId = existing.data?.userId ?? existing.data?.attributes?.userId;
    if (existingUserId !== me.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const updateData = {};
    if (status && ["growing", "harvested", "failed"].includes(status)) updateData.status = status;
    if (notes !== undefined) updateData.notes = String(notes).trim().slice(0, 500);
    if (harvestDate) updateData.harvestDate = String(harvestDate).slice(0, 10);
    if (harvestYield !== undefined) updateData.harvestYield = parseFloat(harvestYield) || 0;
    if (yieldUnit) updateData.yieldUnit = String(yieldUnit).trim().slice(0, 20);

    const updateRes = await fetch(`${STRAPI_URL}/api/farm-crops/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ data: updateData }),
    });

    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.error?.message || "Failed to update crop" },
        { status: updateRes.status }
      );
    }

    const updated = await updateRes.json();
    return NextResponse.json({ crop: { ...updated.data, id: updated.data.documentId || updated.data.id } });
  } catch (error) {
    console.error("Farm crops PUT error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ─── DELETE: Remove a crop ───
export async function DELETE(request) {
  const token = getToken(request);
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const meRes = await fetch(`${STRAPI_URL}/api/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!meRes.ok) return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    const me = await meRes.json();

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Crop id is required" }, { status: 400 });
    }

    // Verify ownership — Strapi v5 uses documentId in URLs
    const checkRes = await fetch(
      `${STRAPI_URL}/api/farm-crops/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!checkRes.ok) return NextResponse.json({ error: "Crop not found" }, { status: 404 });
    const existing = await checkRes.json();
    const existingUserId = existing.data?.userId ?? existing.data?.attributes?.userId;
    if (existingUserId !== me.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const delRes = await fetch(`${STRAPI_URL}/api/farm-crops/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!delRes.ok) {
      return NextResponse.json({ error: "Failed to delete crop" }, { status: delRes.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Farm crops DELETE error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
