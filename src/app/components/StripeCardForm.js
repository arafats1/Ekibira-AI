"use client";

import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useState } from "react";

export default function StripeCardForm({
  onSuccess,
  onError,
  submitLabel = "Pay Now",
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setSubmitting(true);
    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        redirect: "if_required",
      });

      if (error) {
        onError?.(error.message || "Card payment failed.");
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        onSuccess?.();
      }
    } catch (err) {
      onError?.(err.message || "Card payment failed.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement options={{ layout: "tabs" }} />
      <button
        type="submit"
        disabled={!stripe || submitting}
        className="w-full py-3.5 rounded-full bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all font-[family-name:var(--font-body)]"
      >
        {submitting ? "Processing card…" : submitLabel}
      </button>
    </form>
  );
}
