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

    // Fetch active insurance subscription (Strapi expires lapsed ones on read)
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

// POST — There is no paid checkout for insurance plans, and subscriptions are
// only activated by the backend payment flow, so plans can't be self-activated.
export async function POST() {
  return NextResponse.json(
    { error: "Insurance plans are not available for purchase" },
    { status: 410 }
  );
}
