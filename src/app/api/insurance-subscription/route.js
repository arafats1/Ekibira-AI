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

// Insurance plan tiers
const INSURANCE_PLANS = {
  "insurance-basic": {
    name: "Starter",
    price: 49,
    currency: "USD",
    maxAreas: 3,
    maxReportsPerMonth: 10,
    features: ["3 monitored areas", "Basic risk scores", "Monthly risk reports", "Email alerts"],
  },
  "insurance-professional": {
    name: "Professional",
    price: 199,
    currency: "USD",
    maxAreas: 15,
    maxReportsPerMonth: 100,
    features: ["15 monitored areas", "AI underwriting data", "Loss prediction models", "Parametric triggers", "API access", "Weekly reports"],
  },
  "insurance-enterprise": {
    name: "Enterprise",
    price: 499,
    currency: "USD",
    maxAreas: 100,
    maxReportsPerMonth: -1, // unlimited
    features: ["Unlimited areas", "Full AI intelligence", "Catastrophe modeling", "Custom parametric products", "Portfolio optimization", "Priority support", "Reinsurance analytics"],
  },
};

// GET — Check insurance subscription status
export async function GET(request) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUser(token);
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    // Auto-expire old subscriptions
    const today = new Date().toISOString().split("T")[0];
    try {
      const expiredRes = await fetch(
        `${STRAPI_URL}/api/kibira-subscriptions?filters[userId][$eq]=${user.id}&filters[subStatus][$eq]=active&filters[type][$startsWith]=insurance&filters[endDate][$lt]=${today}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (expiredRes.ok) {
        const expData = await expiredRes.json();
        for (const sub of expData.data || []) {
          await fetch(`${STRAPI_URL}/api/kibira-subscriptions/${sub.documentId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ data: { subStatus: "expired" } }),
          });
        }
      }
    } catch {}

    // Fetch active insurance subscription
    const subsRes = await fetch(
      `${STRAPI_URL}/api/kibira-subscriptions?filters[userId][$eq]=${user.id}&filters[subStatus][$eq]=active&filters[type][$startsWith]=insurance&sort=createdAt:desc&pagination[limit]=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const subsData = subsRes.ok ? await subsRes.json() : { data: [] };
    const activeSub = subsData.data?.[0] || null;

    // Get usage count this month
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().split("T")[0];

    if (!activeSub) {
      return NextResponse.json({
        tier: "free",
        plan: null,
        maxAreas: 2,
        maxReports: 3,
        subscription: null,
        plans: INSURANCE_PLANS,
      });
    }

    const planInfo = INSURANCE_PLANS[activeSub.type] || {};

    return NextResponse.json({
      tier: activeSub.type,
      plan: planInfo,
      maxAreas: activeSub.maxAreas || planInfo.maxAreas || 3,
      maxReports: planInfo.maxReportsPerMonth || 100,
      subscription: {
        documentId: activeSub.documentId,
        type: activeSub.type,
        startDate: activeSub.startDate,
        endDate: activeSub.endDate,
        amount: activeSub.amount,
        currency: activeSub.currency,
      },
      plans: INSURANCE_PLANS,
    });
  } catch (error) {
    // Insurance sub check error silently handled
    return NextResponse.json({ error: "Failed to check subscription" }, { status: 500 });
  }
}

// POST — Create insurance subscription
export async function POST(request) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUser(token);
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const body = await request.json();
    const { type, paymentRef, paymentMethod } = body;

    if (!type || !INSURANCE_PLANS[type]) {
      return NextResponse.json({ error: "Invalid insurance plan type" }, { status: 400 });
    }

    const plan = INSURANCE_PLANS[type];
    const today = new Date();
    const startDate = today.toISOString().split("T")[0];
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 1); // Monthly billing
    const endDateStr = endDate.toISOString().split("T")[0];

    const subRes = await fetch(`${STRAPI_URL}/api/kibira-subscriptions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        data: {
          userId: user.id,
          type,
          subStatus: "active",
          amount: plan.price,
          currency: plan.currency,
          paymentRef: paymentRef || `INS-SIM-${Date.now()}`,
          paymentMethod: paymentMethod || "card",
          startDate,
          endDate: endDateStr,
          userEmail: user.email,
          userName: user.username || user.fullName || "",
          maxAreas: plan.maxAreas,
          companyName: user.company || "",
        },
      }),
    });

    if (!subRes.ok) {
      const err = await subRes.json().catch(() => ({}));
      // Create insurance sub error silently handled
      return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
    }

    const subData = await subRes.json();

    return NextResponse.json({
      success: true,
      subscription: subData.data,
      plan: plan,
      message: `${plan.name} plan activated — monitor up to ${plan.maxAreas} areas with AI risk intelligence`,
    });
  } catch (error) {
    // Insurance sub create error silently handled
    return NextResponse.json({ error: "Failed to create subscription" }, { status: 500 });
  }
}
