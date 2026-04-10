import { NextResponse } from "next/server";

// Simulated PesaPal payment processing
// Replace with real PesaPal API integration when ready
export async function POST(request) {
  try {
    const body = await request.json();
    const { amount, currency, phone, email, name, description, type } = body;

    if (!amount || !phone) {
      return NextResponse.json({ error: "Amount and phone number are required" }, { status: 400 });
    }

    // Simulate payment processing delay
    const paymentRef = `PESAPAL-SIM-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // In production, this would:
    // 1. Get PesaPal access token
    // 2. Register IPN callback
    // 3. Submit order request
    // 4. Return redirect URL for payment page
    // For now, simulate instant success

    return NextResponse.json({
      success: true,
      paymentRef,
      status: "completed",
      method: "mobile_money",
      amount,
      currency: currency || "UGX",
      phone,
      message: `Payment of ${Number(amount).toLocaleString()} ${currency || "UGX"} received via Mobile Money (${phone})`,
      // In production: redirect_url, order_tracking_id
      simulated: true,
    });
  } catch (error) {
    // Simulated payment error silently handled
    return NextResponse.json({ error: "Payment processing failed" }, { status: 500 });
  }
}
