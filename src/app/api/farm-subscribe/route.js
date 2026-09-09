import { NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

function getToken(request) {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

export async function POST(request) {
  try {
    const token = getToken(request);
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { type, cropDocumentId, cropName, plantingDate, paymentPhone, year } = body;

    if (!type || !["per-crop", "annual"].includes(type)) {
      return NextResponse.json({ error: "Invalid subscription type" }, { status: 400 });
    }
    if (!paymentPhone) {
      return NextResponse.json({ error: "Phone number is required" }, { status: 400 });
    }

    const res = await fetch(`${STRAPI_URL}/api/kibira/subscribe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        type,
        cropDocumentId,
        cropName,
        plantingDate,
        paymentPhone,
        year,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const message =
        data?.error?.message ||
        "Payment could not be started right now. Please try again shortly.";
      // Never forward raw gateway/provider payloads to the browser
      return NextResponse.json({ error: message }, { status: res.status || 500 });
    }

    const payload = data.data || data;
    return NextResponse.json({
      success: true,
      gateway: payload.gateway || "dgateway",
      provider: payload.provider || "iotec",
      productSource: "kibira",
      reference: payload.reference,
      merchantReference: payload.merchantReference,
      amount: payload.amount,
      currency: payload.currency || "UGX",
      status: payload.status || "pending",
      subscriptionId: payload.subscriptionId,
      documentId: payload.documentId,
      type: payload.type,
      endDate: payload.endDate,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to start subscription payment" },
      { status: 500 }
    );
  }
}
