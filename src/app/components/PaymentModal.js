"use client";
import { useEffect, useMemo, useRef, useState } from "react";

const PLAN_META = [
  {
    id: "per-crop",
    name: "Per Crop",
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

function formatUgx(amount) {
  return Number(amount || 0).toLocaleString("en-UG");
}

function resolvePlanPrice(pricingRows, planId, cropName) {
  const year = new Date().getFullYear();
  const rows = (pricingRows || []).filter(
    (r) => r.planType === planId && Number(r.year) === year && r.active !== false
  );
  if (planId === "per-crop") {
    const cropKey = (cropName || "default").trim().toLowerCase();
    const exact = rows.find((r) => String(r.cropName || "").trim().toLowerCase() === cropKey);
    if (exact) return exact.amountUgx;
    const fallback = rows.find((r) => String(r.cropName || "default").trim().toLowerCase() === "default");
    if (fallback) return fallback.amountUgx;
    return 20000;
  }
  return rows[0]?.amountUgx || 80000;
}

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
  const [network, setNetwork] = useState("mtn");
  const [error, setError] = useState("");
  const [pricing, setPricing] = useState([]);
  const [pollSeconds, setPollSeconds] = useState(0);
  const [paymentRef, setPaymentRef] = useState("");
  const pollRef = useRef(null);

  const plans = useMemo(
    () =>
      PLAN_META.map((plan) => {
        const priceNum = resolvePlanPrice(pricing, plan.id, cropData?.cropName);
        return {
          ...plan,
          priceNum,
          price: formatUgx(priceNum),
        };
      }),
    [pricing, cropData?.cropName]
  );

  useEffect(() => {
    if (!isOpen) return;
    fetch("/api/kibira-pricing")
      .then((r) => r.json())
      .then((d) => setPricing(d.data || []))
      .catch(() => setPricing([]));
  }, [isOpen]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const stopPolling = () => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  };

  const handleSelectPlan = (planId) => {
    setSelectedPlan(planId);
    setStep("payment");
    setError("");
  };

  const verifyOnce = async (reference) => {
    const res = await fetch("/api/farm-subscribe/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    });
    return res.json();
  };

  const startPolling = (reference) => {
    stopPolling();
    setPollSeconds(0);
    let seconds = 0;
    pollRef.current = setInterval(async () => {
      seconds += 3;
      setPollSeconds(seconds);
      try {
        const data = await verifyOnce(reference);
        if (data.confirmed || data.status === "completed") {
          stopPolling();
          setStep("success");
          setTimeout(() => {
            onSuccess?.({
              success: true,
              subscription: data.subscription,
              paymentRef: reference,
            });
            setStep("plans");
            setSelectedPlan(null);
            setPhone("");
            setPaymentRef("");
          }, 2500);
        } else if (data.status === "failed") {
          stopPolling();
          setError(data.failureReason || data.message || "Payment failed. Please try again.");
          setStep("payment");
        } else if (seconds >= 120) {
          stopPolling();
          setError(
            "Still waiting for confirmation. If you approved the payment, wait a moment and try again, or contact support with your reference."
          );
          setStep("payment");
        }
      } catch {
        // keep polling through transient errors
      }
    }, 3000);
  };

  const handlePayment = async () => {
    if (!phone.trim()) {
      setError("Please enter your mobile money number");
      return;
    }
    const cleanPhone = phone.replace(/\s/g, "");
    // Uganda MoMo: 07XXXXXXXX, 2567XXXXXXXX, or +2567XXXXXXXX
    if (!/^(\+?256|0)?7\d{8}$/.test(cleanPhone)) {
      setError("Enter a valid Uganda phone number (e.g. 0771234567)");
      return;
    }

    setStep("processing");
    setError("");
    stopPolling();

    try {
      const plan = plans.find((p) => p.id === selectedPlan);
      const token = getToken();
      if (!token) {
        setError("Please log in again to continue.");
        setStep("payment");
        return;
      }

      const payRes = await fetch("/api/farm-subscribe", {
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
          paymentPhone: cleanPhone,
          year: new Date().getFullYear(),
        }),
      });

      const payData = await payRes.json();
      if (!payRes.ok || !payData.reference) {
        setError(
          typeof payData.error === "string"
            ? payData.error
            : "Payment could not be started right now. Please try again shortly."
        );
        setStep("payment");
        return;
      }

      setPaymentRef(payData.reference);

      // Immediate confirm if already completed
      const first = await verifyOnce(payData.reference);
      if (first.confirmed || first.status === "completed") {
        setStep("success");
        setTimeout(() => {
          onSuccess?.({
            success: true,
            subscription: first.subscription,
            paymentRef: payData.reference,
          });
          setStep("plans");
          setSelectedPlan(null);
          setPhone("");
          setPaymentRef("");
        }, 2500);
        return;
      }

      startPolling(payData.reference);
    } catch {
      setError("Something went wrong. Please try again.");
      setStep("payment");
    }
  };

  const handleClose = () => {
    stopPolling();
    onClose();
    setStep("plans");
    setSelectedPlan(null);
    setPhone("");
    setError("");
    setPaymentRef("");
    setPollSeconds(0);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">
              {step === "success" ? "Payment Successful!" : "Upgrade Your Farm Plan"}
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

        {step === "plans" && (
          <div className="p-5 space-y-4">
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

            {plans.filter((p) => context === "crop" || p.id === "annual").map((plan) => (
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

        {step === "payment" && (
          <div className="p-5 space-y-4">
            <button
              onClick={() => setStep("plans")}
              className="text-xs text-[#6b7c6b] hover:text-[#1a2e1a] font-[family-name:var(--font-body)] flex items-center gap-1"
            >
              ← Back to plans
            </button>

            {(() => {
              const plan = plans.find((p) => p.id === selectedPlan);
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

            <div>
              <h3 className="text-sm font-semibold text-[#1a2e1a] mb-3 font-[family-name:var(--font-body)]">
                Pay with Mobile Money
              </h3>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNetwork("mtn")}
                    className={`flex-1 py-2.5 rounded-lg border-2 text-xs font-semibold font-[family-name:var(--font-body)] ${
                      network === "mtn"
                        ? "border-amber-400 bg-amber-50 text-[#1a2e1a]"
                        : "border-gray-200 bg-gray-50 text-[#6b7c6b]"
                    }`}
                  >
                    MTN MoMo
                  </button>
                  <button
                    type="button"
                    onClick={() => setNetwork("airtel")}
                    className={`flex-1 py-2.5 rounded-lg border-2 text-xs font-semibold font-[family-name:var(--font-body)] ${
                      network === "airtel"
                        ? "border-red-400 bg-red-50 text-[#1a2e1a]"
                        : "border-gray-200 bg-gray-50 text-[#6b7c6b]"
                    }`}
                  >
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
                {paymentRef ? ` Ref: ${paymentRef}` : ""}
              </p>
            )}

            <button
              onClick={handlePayment}
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-sm transition-colors font-[family-name:var(--font-body)]"
            >
              Pay {plans.find((p) => p.id === selectedPlan)?.price} UGX
            </button>

            <p className="text-[10px] text-[#9ca3af] text-center font-[family-name:var(--font-body)]">
              Payment processed securely via DGateway mobile money. Approve the prompt on your phone.
            </p>
          </div>
        )}

        {step === "processing" && (
          <div className="p-10 flex flex-col items-center justify-center">
            <div className="w-12 h-12 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">Processing payment...</p>
            <p className="text-xs text-[#6b7c6b] mt-1 font-[family-name:var(--font-body)]">Please approve the request on your phone</p>
            {paymentRef && (
              <p className="text-[10px] text-[#9ca3af] mt-3 font-[family-name:var(--font-body)]">
                Waiting {pollSeconds}s · Ref {paymentRef}
              </p>
            )}
          </div>
        )}

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
