import { NextResponse } from "next/server";
import OpenAI from "openai";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ─── Helper: extract and validate Bearer token ───
function getToken(request) {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

// ─── AI yield estimation (called once on crop creation) ───
async function estimateYield(crop) {
  try {
    const prompt = `You are an agronomist. Estimate the expected harvest yield in kilograms for this specific crop setup. Use real agronomic data for this crop in Uganda/East Africa.

CROP: ${crop.cropName}${crop.variety ? ` (variety: ${crop.variety})` : ""}
FARM SIZE: ${crop.area || 0} ${crop.areaUnit || "acres"}
SEED QUANTITY: ${crop.seedQuantity || 0} ${crop.seedUnit || "kg"}
PLANT SPACING: ${crop.spacing || "not specified"}
LOCATION: ${crop.location}

Calculate yield using:
1. The specific crop's known yield potential per acre in East Africa (use published FAO/NARO/Uganda data)
2. Plant population = farm area / (row spacing × plant spacing). More plants per acre generally means more yield up to optimal density
3. Seed quantity relative to recommended seed rate for this crop — over-seeding or under-seeding affects yield
4. The specific variety's yield profile if known

Respond with ONLY valid JSON:
{
  "low": <number in kg — conservative estimate for smallholder conditions>,
  "high": <number in kg — good conditions estimate>,
  "basis": "<1 sentence: specific yield/acre used, plant population calculated, and how seed rate compares to recommended>"
}

RULES:
- low/high must be realistic numbers for Ugandan smallholder farms, NOT commercial farms
- The basis must reference the specific crop's yield data (e.g., "Groundnuts yield 600-1000 kg/acre in Uganda") not generic text
- If farm size is 0, return low:0, high:0
- Different crops have very different yields: groundnuts ~600-1000 kg/acre, maize ~800-2000 kg/acre, cassava ~5000-12000 kg/acre, beans ~400-800 kg/acre, etc.
- Account for the actual spacing and seed rate in the calculation`;

    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      temperature: 0,
      max_tokens: 300,
      response_format: { type: "json_object" },
    });

    const content = res.choices?.[0]?.message?.content;
    if (!content) return null;
    const parsed = JSON.parse(content);
    return {
      expectedYieldLow: Math.round(Number(parsed.low) || 0),
      expectedYieldHigh: Math.round(Number(parsed.high) || 0),
      yieldBasis: String(parsed.basis || "").slice(0, 500),
    };
  } catch (err) {
    // Yield estimation error silently handled
    return null;
  }
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
    // Farm crops GET error silently handled
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

    // Check subscription limits before allowing new crop
    try {
      const countRes = await fetch(
        `${STRAPI_URL}/api/farm-crops?filters[userId][$eq]=${me.id}&filters[status][$eq]=growing&pagination[limit]=100`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const countData = countRes.ok ? await countRes.json() : { data: [] };
      const growingCount = (countData.data || []).length;

      const subRes = await fetch(
        `${STRAPI_URL}/api/kibira-subscriptions?filters[userId][$eq]=${me.id}&filters[subStatus][$eq]=active`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const subData = subRes.ok ? await subRes.json() : { data: [] };
      const activeSubs = subData.data || [];
      const hasAnnual = activeSubs.some((s) => s.type === "annual" && (!s.endDate || new Date(s.endDate) >= new Date()));
      const paidCropCount = activeSubs.filter((s) => s.type === "per-crop").length;
      const maxCrops = hasAnnual ? Infinity : 1 + paidCropCount;

      if (growingCount >= maxCrops) {
        return NextResponse.json({
          error: "crop_limit",
          message: growingCount === 1 && paidCropCount === 0
            ? "You've used your 1 free crop. Pay 20,000 UGX per additional crop or 80,000 UGX/year for unlimited crops."
            : `You've reached your crop limit (${maxCrops}). Pay 20,000 UGX for another crop or upgrade to annual (80,000 UGX/year).`,
          currentCount: growingCount,
          maxCrops,
          tier: hasAnnual ? "annual" : paidCropCount > 0 ? "per-crop" : "free",
        }, { status: 403 });
      }
    } catch {}

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
    const cropId = created.data.documentId || created.data.id;
    const cropResult = { ...created.data, id: cropId };

    // Estimate yield via AI (fire-and-forget update to Strapi, return crop immediately with yield)
    const yieldData = await estimateYield(sanitized);
    if (yieldData) {
      cropResult.expectedYieldLow = yieldData.expectedYieldLow;
      cropResult.expectedYieldHigh = yieldData.expectedYieldHigh;
      cropResult.yieldBasis = yieldData.yieldBasis;
      // Update Strapi record with yield data (non-blocking)
      fetch(`${STRAPI_URL}/api/farm-crops/${cropId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: yieldData }),
      }).catch(() => {});
    }

    return NextResponse.json({ crop: cropResult });
  } catch (error) {
    // Farm crops POST error silently handled
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
    // Farm crops PUT error silently handled
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
    // Farm crops DELETE error silently handled
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
