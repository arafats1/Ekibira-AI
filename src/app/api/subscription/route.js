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

// GET — Check subscription status and usage limits
export async function GET(request) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUser(token);
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    // Fetch active subscriptions (Strapi expires lapsed ones on read)
    const subsRes = await fetch(
      `${STRAPI_URL}/api/kibira-subscriptions?filters[userId][$eq]=${user.id}&filters[subStatus][$eq]=active&sort=createdAt:desc&pagination[limit]=50`,
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

    const result = {
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
    };

    // Include full subscription records when requested (for sync operations)
    const url = new URL(request.url);
    if (url.searchParams.get("includeSubs") === "true") {
      result.subscriptions = activeSubs;
    }

    return NextResponse.json(result);
  } catch (error) {
    // Subscription check error silently handled
    return NextResponse.json({ error: "Failed to check subscription" }, { status: 500 });
  }
}

// POST — Subscriptions are created and activated by the backend payment flow
// (/api/farm-subscribe → /api/farm-subscribe/verify), never directly.
export async function POST() {
  return NextResponse.json(
    { error: "Use /api/farm-subscribe to start a paid plan" },
    { status: 410 }
  );
}

// PUT — Link a paid per-crop subscription to the crop it was bought for.
// Plan dates and status are owned by the backend; endDate can't be changed here.
export async function PUT(request) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUser(token);
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const body = await request.json();
    const { subscriptionDocumentId, cropDocumentId, cropName } = body;

    if (!subscriptionDocumentId) {
      return NextResponse.json({ error: "subscriptionDocumentId required" }, { status: 400 });
    }
    if (!cropDocumentId) {
      return NextResponse.json({ error: "cropDocumentId required" }, { status: 400 });
    }

    // Verify the subscription belongs to this user
    const checkRes = await fetch(
      `${STRAPI_URL}/api/kibira-subscriptions/${subscriptionDocumentId}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!checkRes.ok) return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    const checkData = await checkRes.json();
    if (checkData.data?.userId !== user.id) {
      return NextResponse.json({ error: "Not your subscription" }, { status: 403 });
    }

    const updateData = { cropDocumentId };
    if (cropName) updateData.cropName = cropName;

    const updateRes = await fetch(
      `${STRAPI_URL}/api/kibira-subscriptions/${subscriptionDocumentId}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ data: updateData }),
      }
    );

    if (!updateRes.ok) {
      const err = await updateRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: err?.error?.message || "Failed to update subscription" },
        { status: updateRes.status }
      );
    }

    const updated = await updateRes.json();
    return NextResponse.json({ success: true, subscription: updated.data });
  } catch (error) {
    // Subscription update error silently handled
    return NextResponse.json({ error: "Failed to update subscription" }, { status: 500 });
  }
}
