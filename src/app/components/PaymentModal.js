"use client";
import { useState } from "react";

const PLANS = [
  {
    id: "per-crop",
    name: "Per Crop",
    price: "20,000",
    priceNum: 20000,
    period: "per crop",
    description: "Extra crop + unlimited AI chat till harvest",
    features: [
      "Full AI daily farm plan for this crop",
      "Unlimited Farm AI chat messages",
      "Unlimited Dr. Kibira AI conversations",
      "Weather-based risk alerts",
      "Harvest tracking & yield analysis",
      "Expires at harvest time",
    ],
    icon: "🌱",
    color: "amber",
  },
  {
    id: "annual",
    name: "Annual Unlimited",
    price: "80,000",
    priceNum: 80000,
    period: "per year",
    description: "Unlimited crops, unlimited AI chat, unlimited Dr. Kibira",
    features: [
      "Unlimited crop tracking",
      "Unlimited Farm AI chat messages",
      "Unlimited Dr. Kibira AI conversations",
      "Priority weather alerts",
      "Full harvest analytics",
    ],
    icon: "🚀",
    color: "green",
    recommended: true,
  },
];

export default function PaymentModal({
  isOpen,
  onClose,
  onSuccess,
  context = "crop", // "crop" | "chat" | "advisor"
  cropData = null, // { documentId, cropName } for per-crop payment
  getToken,
}) {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [step, setStep] = useState("plans"); // plans | payment | processing | success
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
    setStep("payment");
    setError("");
  };

  const handlePayment = async () => {
    if (!phone.trim()) {
      setError("Please enter your mobile money number");
      return;
    }
    // Basic Uganda phone validation
    const cleanPhone = phone.replace(/\s/g, "");
    if (!/^(\+?256|0)?[37]\d{8}$/.test(cleanPhone)) {
      setError("Enter a valid Uganda phone number (e.g. 0771234567)");
      return;
    }

    setStep("processing");
    setError("");

    try {
      const plan = PLANS.find((p) => p.id === selectedPlan);

      // Step 1: Simulate payment
      const payRes = await fetch("/api/simulate-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: plan.priceNum,
          currency: "UGX",
          phone: cleanPhone,
          description: `KibiraAI ${plan.name} — ${plan.description}`,
          type: plan.id,
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok || !payData.success) {
        setError(payData.error || "Payment failed. Please try again.");
        setStep("payment");
        return;
      }

      // Step 2: Create subscription
      const token = getToken();
      const subRes = await fetch("/api/subscription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          type: plan.id,
          cropDocumentId: plan.id === "per-crop" ? cropData?.documentId : null,
          cropName: plan.id === "per-crop" ? cropData?.cropName : null,
          plantingDate: plan.id === "per-crop" ? cropData?.plantingDate : null,
          paymentRef: payData.paymentRef,
          paymentMethod: "mobile_money",
        }),
      });

      const subData = await subRes.json();
      if (!subRes.ok || !subData.success) {
        setError(subData.error || "Subscription activation failed.");
        setStep("payment");
        return;
      }

      setStep("success");
      setTimeout(() => {
        onSuccess?.(subData);
        // Don't call onClose here — onSuccess handler already closes the modal
        setStep("plans");
        setSelectedPlan(null);
        setPhone("");
      }, 2500);
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("payment");
    }
  };

  const handleClose = () => {
    onClose();
    setStep("plans");
    setSelectedPlan(null);
    setPhone("");
    setError("");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">
              {step === "success" ? "🎉 Payment Successful!" : "Upgrade Your Farm Plan"}
            </h2>
            {step === "plans" && (
              <p className="text-xs text-[#6b7c6b] mt-0.5 font-[family-name:var(--font-body)]">
                {context === "crop"
                  ? "You've used your free crop. Choose a plan to add more."
                  : context === "chat"
                    ? "You've used your 5 free messages today. Upgrade for unlimited."
                    : "You've used your 5 free Dr. Kibira messages today. Upgrade for unlimited."}
              </p>
            )}
          </div>
          {step !== "processing" && (
            <button onClick={handleClose} className="text-[#9ca3af] hover:text-[#1a2e1a] transition-colors p-1">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Plans Selection */}
        {step === "plans" && (
          <div className="p-5 space-y-4">
            {/* Free tier info */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🆓</span>
                <span className="font-semibold text-sm text-[#1a2e1a] font-[family-name:var(--font-body)]">Free Plan (Current)</span>
              </div>
              <div className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] space-y-0.5">
                <p>• 1 crop tracking (full lifecycle)</p>
                <p>• 5 Farm AI messages per day</p>
                <p>• 5 Dr. Kibira AI messages per day</p>
                <p>• Weather dashboard</p>
              </div>
            </div>

            {/* Paid plans */}
            {PLANS.filter((p) => context === "crop" || p.id === "annual").map((plan) => (
              <button
                key={plan.id}
                onClick={() => handleSelectPlan(plan.id)}
                className={`w-full text-left rounded-xl p-5 border-2 transition-all hover:shadow-md ${
                  plan.recommended
                    ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 hover:border-green-500"
                    : "border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 hover:border-amber-400"
                } relative`}
              >
                {plan.recommended && (
                  <span className="absolute top-2 right-2 text-[9px] bg-green-600 text-white px-2 py-0.5 rounded-full font-bold font-[family-name:var(--font-body)]">
                    BEST VALUE
                  </span>
                )}
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-2xl">{plan.icon}</span>
                  <div>
                    <h3 className="font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{plan.name}</h3>
                    <p className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)]">{plan.description}</p>
                  </div>
                </div>
                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-2xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{plan.price}</span>
                  <span className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)]">UGX / {plan.period}</span>
                </div>
                <ul className="space-y-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="text-xs text-[#6b7c6b] font-[family-name:var(--font-body)] flex items-center gap-1.5">
                      <span className="text-green-500">✓</span> {f}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
        )}

        {/* Payment Form */}
        {step === "payment" && (
          <div className="p-5 space-y-4">
            <button
              onClick={() => setStep("plans")}
              className="text-xs text-[#6b7c6b] hover:text-[#1a2e1a] font-[family-name:var(--font-body)] flex items-center gap-1"
            >
              ← Back to plans
            </button>

            {/* Selected plan summary */}
            {(() => {
              const plan = PLANS.find((p) => p.id === selectedPlan);
              if (!plan) return null;
              return (
                <div className={`rounded-xl p-4 border ${plan.recommended ? "bg-green-50 border-green-200" : "bg-amber-50 border-amber-200"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{plan.icon}</span>
                      <span className="font-semibold text-sm text-[#1a2e1a] font-[family-name:var(--font-body)]">{plan.name}</span>
                    </div>
                    <span className="font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{plan.price} UGX</span>
                  </div>
                  {cropData?.cropName && plan.id === "per-crop" && (
                    <p className="text-xs text-[#6b7c6b] mt-1 font-[family-name:var(--font-body)]">
                      For: {cropData.cropName}
                    </p>
                  )}
                </div>
              );
            })()}

            {/* Mobile Money Payment */}
            <div>
              <h3 className="text-sm font-semibold text-[#1a2e1a] mb-3 font-[family-name:var(--font-body)]">
                📱 Pay with Mobile Money
              </h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button className="flex-1 py-2.5 rounded-lg border-2 border-amber-400 bg-amber-50 text-xs font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">
                    MTN MoMo
                  </button>
                  <button className="flex-1 py-2.5 rounded-lg border-2 border-gray-200 bg-gray-50 text-xs font-semibold text-[#6b7c6b] font-[family-name:var(--font-body)]">
                    Airtel Money
                  </button>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#1a2e1a] font-[family-name:var(--font-body)] mb-1 block">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="0771234567"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/15 outline-none text-sm font-[family-name:var(--font-body)]"
                  />
                </div>
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-600 font-[family-name:var(--font-body)] bg-red-50 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              onClick={handlePayment}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm transition-colors font-[family-name:var(--font-body)]"
            >
              Pay {PLANS.find((p) => p.id === selectedPlan)?.price} UGX
            </button>

            <p className="text-[10px] text-[#9ca3af] text-center font-[family-name:var(--font-body)]">
              Payment processed securely via PesaPal. You&apos;ll receive a confirmation SMS.
            </p>
          </div>
        )}

        {/* Processing */}
        {step === "processing" && (
          <div className="p-10 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">Processing payment...</p>
            <p className="text-xs text-[#6b7c6b] mt-1 font-[family-name:var(--font-body)]">Please approve the request on your phone</p>
          </div>
        )}

        {/* Success */}
        {step === "success" && (
          <div className="p-10 flex flex-col items-center justify-center text-center">
            <span className="text-5xl mb-4">✅</span>
            <h3 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-2">
              Payment Confirmed!
            </h3>
            <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)]">
              {selectedPlan === "annual"
                ? "Your annual subscription is active. Enjoy unlimited crops and AI chat!"
                : `Crop tracking for ${cropData?.cropName || "your crop"} is now active!`}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
