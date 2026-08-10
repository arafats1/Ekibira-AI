import { NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export async function POST(request) {
  try {
    const body = await request.json();
    const reference = body.reference || body.orderTrackingId;

    if (!reference) {
      return NextResponse.json({ error: "Missing payment reference" }, { status: 400 });
    }

    const res = await fetch(`${STRAPI_URL}/api/kibira/plant-tree/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        data?.error?.message ||
        data?.message ||
        data?.error ||
        "Verification failed";
      return NextResponse.json({ error: message }, { status: res.status || 500 });
    }

    const payload = data.data || data;

    return NextResponse.json({
      status: payload.status,
      confirmed: payload.confirmed || payload.status === "completed",
      plantingStatus: payload.plantingStatus,
      merchantReference: payload.merchantReference,
      amount: payload.amount,
      currency: payload.currency,
      failureReason: payload.failureReason || "",
      message:
        payload.status === "completed"
          ? "Payment verified successfully. Trees will be planted!"
          : payload.status === "failed"
            ? payload.failureReason || "Payment failed"
            : "Payment still pending. Approve the prompt on your phone.",
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Verification failed" },
      { status: 500 }
    );
  }
}

/** Legacy Pesapal IPN GET — forwards to Strapi verify when a reference is present */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const reference =
      searchParams.get("reference") ||
      searchParams.get("OrderTrackingId") ||
      searchParams.get("OrderMerchantReference");

    if (!reference) {
      return NextResponse.json({ error: "Missing payment reference" }, { status: 400 });
    }

    const res = await fetch(`${STRAPI_URL}/api/kibira/plant-tree/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    });

    const data = await res.json().catch(() => ({}));
    const payload = data.data || data;

    return NextResponse.json({
      reference,
      status: payload.status,
      confirmed: payload.confirmed || payload.status === "completed",
      message:
        payload.status === "completed"
          ? "Payment verified successfully. Trees will be planted!"
          : `Payment status: ${payload.status || "unknown"}`,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Verification failed" },
      { status: 500 }
    );
  }
}
