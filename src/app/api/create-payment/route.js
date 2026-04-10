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

async function registerIPN(token) {
  const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.kibiraai.com"}/api/verify-payment`;
  const res = await fetch(`${PESAPAL_BASE}/api/URLSetup/RegisterIPN`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      url: callbackUrl,
      ipn_notification_type: "GET",
    }),
  });
  const data = await res.json();
  return data.ipn_id;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, currency, description, treeCount, species, customer } = body;

    if (!amount || !customer?.name || !customer?.email) {
      return NextResponse.json(
        { error: "Missing required fields: amount, name, email" },
        { status: 400 }
      );
    }

    const token = await getAccessToken();
    const ipnId = await registerIPN(token);

    const merchantRef = `KIBIRA-TREE-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const callbackUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "https://www.kibiraai.com"}/plant-a-tree?payment=success&ref=${merchantRef}`;

    const orderPayload = {
      id: merchantRef,
      currency: currency || "USD",
      amount: parseFloat(amount),
      description: description || `Plant ${treeCount} tree(s) via KibiraAI`,
      callback_url: callbackUrl,
      notification_id: ipnId,
      billing_address: {
        email_address: customer.email,
        phone_number: customer.phone || "",
        first_name: customer.name.split(" ")[0],
        last_name: customer.name.split(" ").slice(1).join(" ") || "",
        line_1: "",
        city: "",
        state: "",
        postal_code: "",
        country_code: "UG",
      },
    };

    const orderRes = await fetch(`${PESAPAL_BASE}/api/Transactions/SubmitOrderRequest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(orderPayload),
    });

    const orderData = await orderRes.json();

    if (orderData.redirect_url) {
      return NextResponse.json({
        redirect_url: orderData.redirect_url,
        order_tracking_id: orderData.order_tracking_id,
        merchant_reference: merchantRef,
      });
    }

    return NextResponse.json(
      { error: orderData.error?.message || "Failed to create payment order" },
      { status: 500 }
    );
  } catch (err) {
    // Pesapal create-payment error silently handled
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
