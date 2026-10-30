import { NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

// Increment today's usage counter for the caller. Strapi works out the user
// and date from the token, so the count can't be set from here.
// Called by farmer-chat and advisor APIs
export async function incrementUsage(userId, field, token) {
  try {
    const res = await fetch(`${STRAPI_URL}/api/kibira/usage/increment`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ field }),
    });
    if (!res.ok) return -1;
    const data = await res.json();
    return data.data?.[field] ?? -1;
  } catch {
    return -1; // on error, don't block the user
  }
}

// Check if user has remaining messages
export async function checkUsageLimit(userId, field, token) {
  const today = new Date().toISOString().split("T")[0];
  try {
    // Check for any active paid subscription (annual or per-crop = unlimited chat)
    const subRes = await fetch(
      `${STRAPI_URL}/api/kibira-subscriptions?filters[userId][$eq]=${userId}&filters[subStatus][$eq]=active`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const subData = subRes.ok ? await subRes.json() : { data: [] };
    const activeSub = (subData.data || []).find(s => !s.endDate || new Date(s.endDate) >= new Date(today));
    if (activeSub) {
      return { allowed: true, remaining: Infinity, tier: activeSub.type === "annual" ? "annual" : "per-crop" };
    }

    // Free tier: check daily count
    const usageRes = await fetch(
      `${STRAPI_URL}/api/kibira-usages?filters[userId][$eq]=${userId}&filters[date][$eq]=${today}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const usageData = usageRes.ok ? await usageRes.json() : { data: [] };
    const count = usageData.data?.[0]?.[field] || 0;
    const limit = 5;
    return { allowed: count < limit, remaining: Math.max(0, limit - count), tier: "free" };
  } catch {
    return { allowed: true, remaining: 5, tier: "free" }; // on error, don't block
  }
}
