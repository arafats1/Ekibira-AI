import { NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

function getToken(request) {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

async function getUser(token) {
  const res = await fetch(`${STRAPI_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

// Check and auto-expire subscriptions past their endDate
async function autoExpireSubscriptions(userId, token) {
  try {
    const today = new Date().toISOString().split("T")[0];
    const res = await fetch(
      `${STRAPI_URL}/api/kibira-subscriptions?filters[userId][$eq]=${userId}&filters[status][$eq]=active&filters[endDate][$lt]=${today}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!res.ok) return;
    const data = await res.json();
    for (const sub of data.data || []) {
      await fetch(`${STRAPI_URL}/api/kibira-subscriptions/${sub.documentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ data: { status: "expired" } }),
      });
    }
  } catch {}
}

// GET — Check subscription status and usage limits
export async function GET(request) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUser(token);
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    // Auto-expire old subscriptions
    await autoExpireSubscriptions(user.id, token);

    // Fetch active subscriptions
    const subsRes = await fetch(
      `${STRAPI_URL}/api/kibira-subscriptions?filters[userId][$eq]=${user.id}&filters[status][$eq]=active&sort=createdAt:desc&pagination[limit]=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const subsData = subsRes.ok ? await subsRes.json() : { data: [] };
    const activeSubs = subsData.data || [];

    const hasAnnual = activeSubs.some((s) => s.type === "annual");
    const perCropSubs = activeSubs.filter((s) => s.type === "per-crop");
    const paidCropDocIds = perCropSubs.map((s) => s.cropDocumentId).filter(Boolean);

    // Count farmer's current crops
    const cropsRes = await fetch(
      `${STRAPI_URL}/api/farm-crops?filters[userId][$eq]=${user.id}&filters[status][$eq]=growing&pagination[limit]=100`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const cropsData = cropsRes.ok ? await cropsRes.json() : { data: [] };
    const growingCropCount = (cropsData.data || []).length;

    // Get today's usage
    const today = new Date().toISOString().split("T")[0];
    const usageRes = await fetch(
      `${STRAPI_URL}/api/kibira-usages?filters[userId][$eq]=${user.id}&filters[date][$eq]=${today}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const usageData = usageRes.ok ? await usageRes.json() : { data: [] };
    const usage = usageData.data?.[0] || { farmerChatCount: 0, advisorChatCount: 0 };

    // Determine tier
    const tier = hasAnnual ? "annual" : perCropSubs.length > 0 ? "per-crop" : "free";

    // Free tier: 1 crop, 5 chat msgs/day, 5 advisor msgs/day
    // Per-crop: 1 free + paid crops, unlimited chat/advisor
    // Annual: unlimited everything
    const hasPaidSub = hasAnnual || perCropSubs.length > 0;
    const limits = {
      maxCrops: hasAnnual ? Infinity : 1 + perCropSubs.length,
      maxFarmerChat: hasPaidSub ? Infinity : 5,
      maxAdvisorChat: hasPaidSub ? Infinity : 5,
    };

    return NextResponse.json({
      tier,
      hasAnnual,
      activeSubs: activeSubs.length,
      paidCropDocIds,
      growingCropCount,
      usage: {
        farmerChatCount: usage.farmerChatCount || 0,
        advisorChatCount: usage.advisorChatCount || 0,
      },
      limits,
      canAddCrop: hasAnnual || growingCropCount < limits.maxCrops,
      farmerChatRemaining: hasPaidSub ? Infinity : Math.max(0, 5 - (usage.farmerChatCount || 0)),
      advisorChatRemaining: hasPaidSub ? Infinity : Math.max(0, 5 - (usage.advisorChatCount || 0)),
    });
  } catch (error) {
    console.error("Subscription check error:", error);
    return NextResponse.json({ error: "Failed to check subscription" }, { status: 500 });
  }
}

// POST — Create a new subscription (after payment)
export async function POST(request) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUser(token);
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const body = await request.json();
    const { type, cropDocumentId, cropName, paymentRef, paymentMethod } = body;

    if (!type || !["per-crop", "annual"].includes(type)) {
      return NextResponse.json({ error: "Invalid subscription type" }, { status: 400 });
    }

    // cropDocumentId is optional — will be linked after crop creation if not provided

    const today = new Date();
    const startDate = today.toISOString().split("T")[0];
    let endDate;

    if (type === "annual") {
      const end = new Date(today);
      end.setFullYear(end.getFullYear() + 1);
      endDate = end.toISOString().split("T")[0];
    } else {
      // Per-crop: estimate harvest timing from crop data or cropName
      let monthsToHarvest = 6;
      // Try to estimate from cropName passed in the request body
      const nameForEstimate = (cropName || "").toLowerCase();
      if (nameForEstimate.includes("maize") || nameForEstimate.includes("corn")) monthsToHarvest = 4;
      else if (nameForEstimate.includes("bean")) monthsToHarvest = 3;
      else if (nameForEstimate.includes("rice")) monthsToHarvest = 5;
      else if (nameForEstimate.includes("cassava")) monthsToHarvest = 12;
      else if (nameForEstimate.includes("sweet potato")) monthsToHarvest = 4;
      else if (nameForEstimate.includes("coffee")) monthsToHarvest = 12;
      else if (nameForEstimate.includes("banana") || nameForEstimate.includes("matooke")) monthsToHarvest = 12;
      else if (nameForEstimate.includes("sorghum") || nameForEstimate.includes("millet")) monthsToHarvest = 4;
      else if (nameForEstimate.includes("groundnut") || nameForEstimate.includes("peanut")) monthsToHarvest = 4;
      else if (nameForEstimate.includes("tomato") || nameForEstimate.includes("cabbage") || nameForEstimate.includes("onion")) monthsToHarvest = 3;

      if (cropDocumentId) {
        try {
          const cropRes = await fetch(
            `${STRAPI_URL}/api/farm-crops/${cropDocumentId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (cropRes.ok) {
            const cropData = await cropRes.json();
            const crop = cropData.data;
            if (crop?.plantingDate) {
              // Estimate based on crop type
              const name = (crop.cropName || "").toLowerCase();
              if (name.includes("maize") || name.includes("corn")) monthsToHarvest = 4;
              else if (name.includes("bean")) monthsToHarvest = 3;
              else if (name.includes("rice")) monthsToHarvest = 5;
              else if (name.includes("cassava")) monthsToHarvest = 12;
              else if (name.includes("sweet potato")) monthsToHarvest = 4;
              else if (name.includes("coffee")) monthsToHarvest = 12;
              else if (name.includes("banana") || name.includes("matooke")) monthsToHarvest = 12;
              else if (name.includes("sorghum") || name.includes("millet")) monthsToHarvest = 4;
              else if (name.includes("groundnut") || name.includes("peanut")) monthsToHarvest = 4;
              else if (name.includes("tomato") || name.includes("cabbage") || name.includes("onion")) monthsToHarvest = 3;

              const planted = new Date(crop.plantingDate);
              const harvestDate = new Date(planted);
              harvestDate.setMonth(harvestDate.getMonth() + monthsToHarvest);
              // Add 2-week buffer after estimated harvest
              harvestDate.setDate(harvestDate.getDate() + 14);
              endDate = harvestDate.toISOString().split("T")[0];
            }
          }
        } catch {}
      }
      if (!endDate) {
        const end = new Date(today);
        end.setMonth(end.getMonth() + monthsToHarvest);
        endDate = end.toISOString().split("T")[0];
      }
    }

    const amount = type === "annual" ? 80000 : 20000;

    const subRes = await fetch(`${STRAPI_URL}/api/kibira-subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        data: {
          userId: user.id,
          type,
          status: "active",
          cropDocumentId: cropDocumentId || null,
          cropName: cropName || null,
          amount,
          currency: "UGX",
          paymentRef: paymentRef || `SIM-${Date.now()}`,
          paymentMethod: paymentMethod || "mobile_money",
          startDate,
          endDate,
          userEmail: user.email,
          userName: user.username || user.fullName || "",
        },
      }),
    });

    if (!subRes.ok) {
      const err = await subRes.json().catch(() => ({}));
      console.error("Strapi subscription create error:", err);
      return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
    }

    const subData = await subRes.json();

    return NextResponse.json({
      success: true,
      subscription: subData.data,
      message: type === "annual"
        ? "Annual subscription activated — unlimited crops and chat!"
        : `Crop tracking activated for ${cropName || "your crop"} until ${endDate}`,
    });
  } catch (error) {
    console.error("Subscription create error:", error);
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
