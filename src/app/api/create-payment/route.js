import { NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      treeCount,
      species,
      amount,
      currency,
      description,
      dedication,
      customer,
      provider,
      paymentPhone,
    } = body;

    if (!treeCount || !species || !customer?.name || !customer?.email) {
      return NextResponse.json(
        { error: "Missing required fields: treeCount, species, name, email" },
        { status: 400 }
      );
    }

    const res = await fetch(`${STRAPI_URL}/api/kibira/plant-tree`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        treeCount,
        species,
        amount,
        currency,
        description,
        dedication,
        customer,
        provider,
        paymentPhone: paymentPhone || customer.phone,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      const message =
        data?.error?.message ||
        data?.message ||
        data?.error ||
        "Failed to create payment order";
      return NextResponse.json({ error: message }, { status: res.status || 500 });
    }

    const payload = data.data || data;

    return NextResponse.json({
      gateway: payload.gateway || "dgateway",
      provider: payload.provider,
      reference: payload.reference,
      merchant_reference: payload.merchantReference || payload.merchant_reference,
      amount: payload.amount,
      currency: payload.currency,
      status: payload.status,
      client_secret: payload.client_secret || null,
      stripe_publishable_key: payload.stripe_publishable_key || null,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}
