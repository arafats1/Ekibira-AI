import { NextResponse } from "next/server";

const PESAPAL_BASE =
  process.env.PESAPAL_ENV === "production"
    ? "https://pay.pesapal.com/v3"
    : "https://cybqa.pesapal.com/pesapalv3";

async function getAccessToken() {
  const res = await fetch(`${PESAPAL_BASE}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      consumer_key: process.env.PESAPAL_CONSUMER_KEY,
      consumer_secret: process.env.PESAPAL_CONSUMER_SECRET,
    }),
  });
  const data = await res.json();
  if (data.error) throw new Error(data.error.message || "Token request failed");
  return data.token;
}

// GET — Pesapal sends IPN notifications here
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const orderTrackingId = searchParams.get("OrderTrackingId");
    const orderMerchantReference = searchParams.get("OrderMerchantReference");
    const orderNotificationType = searchParams.get("OrderNotificationType");

    if (!orderTrackingId) {
      return NextResponse.json({ error: "Missing OrderTrackingId" }, { status: 400 });
    }

    const token = await getAccessToken();

    const statusRes = await fetch(
      `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const statusData = await statusRes.json();

    // Pesapal IPN received, payment verified
    // No console logging in production

    // In production, you would update your database here
    // e.g., mark the tree planting order as confirmed

    return NextResponse.json({
      orderTrackingId,
      merchantReference: orderMerchantReference,
      status: statusData.payment_status_description,
      amount: statusData.amount,
      currency: statusData.currency,
      message: statusData.payment_status_description === "Completed"
        ? "Payment verified successfully. Trees will be planted!"
        : `Payment status: ${statusData.payment_status_description}`,
    });
  } catch (err) {
    // Pesapal verify-payment error silently handled
    return NextResponse.json(
      { error: err.message || "Verification failed" },
      { status: 500 }
    );
  }
}

// POST — for manual verification from frontend
export async function POST(request) {
  try {
    const body = await request.json();
    const { orderTrackingId } = body;

    if (!orderTrackingId) {
      return NextResponse.json({ error: "Missing orderTrackingId" }, { status: 400 });
    }

    const token = await getAccessToken();

    const statusRes = await fetch(
      `${PESAPAL_BASE}/api/Transactions/GetTransactionStatus?orderTrackingId=${orderTrackingId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const statusData = await statusRes.json();

    return NextResponse.json({
      status: statusData.payment_status_description,
      amount: statusData.amount,
      currency: statusData.currency,
      confirmed: statusData.payment_status_description === "Completed",
    });
  } catch (err) {
    // Pesapal verify error silently handled
    return NextResponse.json({ error: "Verification failed" }, { status: 500 });
  }
}
