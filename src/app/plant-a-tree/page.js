"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import StripeCardForm from "../components/StripeCardForm";

const TREE_SPECIES = [
  {
    id: "terminalia",
    name: "Terminalia mantaly",
    image: "🌳",
    co2: "22 kg CO₂/year",
    survival: "92%",
    location: "Urban Kampala — shade & stormwater",
    description: "A layered shade tree ideal for urban heat reduction and stormwater interception along main roads.",
  },
  {
    id: "musizi",
    name: "Maesopsis eminii (Musizi)",
    image: "🌲",
    co2: "35 kg CO₂/year",
    survival: "88%",
    location: "Mabira & Bugoma forests",
    description: "Fast-growing native species, excellent for carbon sequestration and forest edge restoration.",
  },
  {
    id: "markhamia",
    name: "Markhamia lutea",
    image: "🪵",
    co2: "18 kg CO₂/year",
    survival: "94%",
    location: "Community agroforestry",
    description: "Indigenous soil-improving tree used for boundary planting and as a firewood alternative.",
  },
  {
    id: "prunus",
    name: "Prunus africana",
    image: "🌿",
    co2: "28 kg CO₂/year",
    survival: "82%",
    location: "Bwindi & Kibale buffer zones",
    description: "Endangered medicinal timber tree — planting supports both conservation and community health.",
  },
  {
    id: "ficus",
    name: "Ficus natalensis (Mutuba)",
    image: "🍃",
    co2: "30 kg CO₂/year",
    survival: "96%",
    location: "Riparian zones & flood barriers",
    description: "Indigenous fig with deep roots that stabilize flood-prone soil and support biodiversity.",
  },
  {
    id: "grevillea",
    name: "Grevillea robusta",
    image: "🌴",
    co2: "25 kg CO₂/year",
    survival: "90%",
    location: "Urban streets & peri-urban",
    description: "Fast-growing urban shade tree, excellent for street lining and heat island mitigation.",
  },
];

const IMPACT_TIERS = [
  { trees: 1, label: "Seed Planter", icon: "🌱", impact: "Your tree absorbs ~22 kg CO₂/year and provides shade for a family" },
  { trees: 5, label: "Grove Starter", icon: "🌿", impact: "5 trees create a mini-cooling corridor, reducing local temp by ~0.5°C" },
  { trees: 10, label: "Forest Friend", icon: "🌳", impact: "10 trees sequester 250+ kg CO₂/year and support local biodiversity" },
  { trees: 25, label: "Canopy Builder", icon: "🏕️", impact: "25 trees restore a degraded patch and create habitat for birds & insects" },
  { trees: 50, label: "Forest Guardian", icon: "🦍", impact: "50 trees rebuild a buffer zone corridor for primate movement" },
  { trees: 100, label: "Climate Champion", icon: "🌍", impact: "100 trees = a micro-forest absorbing 2.5+ tonnes CO₂/year" },
];

/** $1 USD = 4,000 UGX */
const UGX_PER_USD = 4000;
const PRICE_USD_PER_TREE = 1;

function formatUGX(amount) {
  return `UGX ${Number(amount).toLocaleString("en-UG")}`;
}

function formatUSD(amount) {
  return `$${Number(amount).toFixed(2)}`;
}

function usdToUgx(usdAmount) {
  return Math.round(Number(usdAmount) * UGX_PER_USD);
}

export default function PlantATreePage() {
  const [treeCount, setTreeCount] = useState(1);
  const [selectedSpecies, setSelectedSpecies] = useState(TREE_SPECIES[0]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dedication, setDedication] = useState("");
  const [currency, setCurrency] = useState("UGX"); // UGX | USD
  const [paymentStep, setPaymentStep] = useState("idle"); // idle | processing | polling | card | success | error
  const [paymentError, setPaymentError] = useState("");
  const [dgatewayRef, setDgatewayRef] = useState("");
  const [merchantRef, setMerchantRef] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [stripePromise, setStripePromise] = useState(null);
  const [pollSeconds, setPollSeconds] = useState(0);
  const pollRef = useRef(null);
  const successHandled = useRef(false);

  const totalUsd = treeCount * PRICE_USD_PER_TREE;
  const totalUgx = usdToUgx(totalUsd);
  const displayAmount = currency === "USD" ? formatUSD(totalUsd) : formatUGX(totalUgx);
  const altAmount = currency === "USD" ? formatUGX(totalUgx) : formatUSD(totalUsd);
  const totalCO2 = (treeCount * parseFloat(selectedSpecies.co2)).toFixed(0);
  const currentTier = [...IMPACT_TIERS].reverse().find((t) => treeCount >= t.trees) || IMPACT_TIERS[0];

  const stopPolling = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }, []);

  const markSuccess = useCallback((ref) => {
    if (successHandled.current) return;
    successHandled.current = true;
    stopPolling();
    setMerchantRef(ref || merchantRef);
    setPaymentStep("success");
  }, [merchantRef, stopPolling]);

  const verifyOnce = useCallback(async (reference) => {
    const res = await fetch("/api/verify-payment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Verification failed");
    return data;
  }, []);

  useEffect(() => {
    if (paymentStep !== "polling" || !dgatewayRef) return undefined;

    setPollSeconds(0);
    successHandled.current = false;
    stopPolling();

    pollRef.current = setInterval(async () => {
      try {
        const data = await verifyOnce(dgatewayRef);
        if (data.confirmed || data.status === "completed") {
          markSuccess(data.merchantReference);
        } else if (data.status === "failed") {
          stopPolling();
          setPaymentError(data.failureReason || data.message || "Payment failed. Please try again.");
          setPaymentStep("error");
        }
      } catch {
        // keep polling through transient errors
      }
    }, 2500);

    const tick = setInterval(() => {
      setPollSeconds((s) => {
        if (s >= 90) {
          stopPolling();
          clearInterval(tick);
          setPaymentError(
            "Still waiting for confirmation. If you approved the payment, keep this page open or contact support with your reference."
          );
          setPaymentStep("error");
          return s;
        }
        return s + 1;
      });
    }, 1000);

    return () => {
      stopPolling();
      clearInterval(tick);
    };
  }, [paymentStep, dgatewayRef, verifyOnce, markSuccess, stopPolling]);

  const handlePayment = async () => {
    if (!name.trim() || !email.trim()) {
      setPaymentError("Please enter your name and email address.");
      setPaymentStep("error");
      return;
    }

    if (currency === "UGX" && !phone.trim()) {
      setPaymentError("Enter your MTN or Airtel number to receive the mobile money prompt.");
      setPaymentStep("error");
      return;
    }

    setPaymentError("");
    setPaymentStep("processing");
    successHandled.current = false;
    setDgatewayRef("");
    setClientSecret("");
    setStripePromise(null);

    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          treeCount,
          species: selectedSpecies.name,
          amount: currency === "USD" ? totalUsd : totalUgx,
          currency,
          provider: currency === "USD" ? "stripe" : "iotec",
          paymentPhone: phone,
          dedication: dedication || null,
          description: `Plant ${treeCount} ${selectedSpecies.name} tree(s) via KibiraAI`,
          customer: { name, email, phone },
        }),
      });

      const data = await res.json();

      if (!res.ok || data.error) {
        setPaymentError(data.error || "Payment initiation failed. Please try again.");
        setPaymentStep("error");
        return;
      }

      setDgatewayRef(data.reference || "");
      setMerchantRef(data.merchant_reference || "");

      if (data.client_secret && data.stripe_publishable_key) {
        setClientSecret(data.client_secret);
        setStripePromise(loadStripe(data.stripe_publishable_key));
        setPaymentStep("card");
        return;
      }

      if (data.reference) {
        setPaymentStep("polling");
        return;
      }

      setPaymentError("Payment gateway returned an unexpected response. Please try again.");
      setPaymentStep("error");
    } catch {
      setPaymentError("Network error. Please check your connection and try again.");
      setPaymentStep("error");
    }
  };

  const handleStripeSuccess = () => {
    if (dgatewayRef) setPaymentStep("polling");
    else markSuccess(merchantRef);
  };

  const resetPayment = () => {
    stopPolling();
    successHandled.current = false;
    setPaymentStep("idle");
    setPaymentError("");
    setDgatewayRef("");
    setClientSecret("");
    setStripePromise(null);
    setPollSeconds(0);
  };

  const busy = paymentStep === "processing" || paymentStep === "polling" || paymentStep === "card";

  return (
    <div className="min-h-screen bg-[#f7faf6]">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#2d6a4f]/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">🌿</span>
            <span className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold text-[#1b4332] tracking-tight">
              KibiraAI
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-[#1a2e1a]/80">
            <Link href="/solution" className="hover:text-[#2d6a4f] transition-colors">Solutions</Link>
            <Link href="/advisor" className="hover:text-[#2d6a4f] transition-colors">Dr. Kibira AI</Link>
            <Link href="/" className="hover:text-[#2d6a4f] transition-colors">Home</Link>
          </div>
        </div>
      </nav>

      <main className="pt-20 sm:pt-24 pb-20">
        <div className="bg-gradient-to-br from-[#1a2e1a] to-[#14532d] py-12 sm:py-20 mb-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-72 h-72 bg-[#4ade80]/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#d4a843]/10 rounded-full blur-3xl" />
          <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center relative z-10">
            <span className="inline-flex items-center gap-2 bg-[#4ade80]/20 border border-[#4ade80]/30 text-[#4ade80] text-xs font-bold tracking-widest uppercase px-4 py-1.5 rounded-full mb-6 font-[family-name:var(--font-body)]">
              🌱 Every Dollar Plants a Tree
            </span>
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6 font-[family-name:var(--font-display)]">
              Plant a Tree in
              <br />
              <span className="text-[#4ade80]">Uganda&apos;s Forests</span>
            </h1>
            <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto font-[family-name:var(--font-body)]">
              Choose a native species, pick how many trees you want to plant, and we&apos;ll put them in the ground
              in Uganda&apos;s most deforested areas. Pay in UGX (mobile money) or USD (card).
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-6 sm:gap-8">
            <div className="space-y-6">
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#dce9dc] shadow-sm p-5 sm:p-7">
                <p className="text-xs uppercase tracking-widest text-[#2d6a4f] font-semibold mb-4 font-[family-name:var(--font-body)]">
                  1. Choose Your Species
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                  {TREE_SPECIES.map((sp) => {
                    const isActive = selectedSpecies.id === sp.id;
                    return (
                      <button
                        key={sp.id}
                        type="button"
                        onClick={() => setSelectedSpecies(sp)}
                        disabled={busy}
                        className={`text-left rounded-xl p-3 sm:p-4 border transition-all
                          ${isActive
                            ? "bg-[#f0fdf4] border-[#4ade80] shadow-sm"
                            : "bg-gray-50 border-gray-100 hover:border-[#2d6a4f]/30"
                          }`}
                      >
                        <span className="text-2xl block mb-1">{sp.image}</span>
                        <p className={`text-xs sm:text-sm font-bold ${isActive ? "text-[#1a2e1a]" : "text-gray-700"} font-[family-name:var(--font-display)] leading-tight`}>
                          {sp.name.split("(")[0].trim()}
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1 font-[family-name:var(--font-body)]">{sp.co2}</p>
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 bg-[#f7faf6] rounded-xl p-4 border border-[#dce9dc]">
                  <p className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{selectedSpecies.name}</p>
                  <p className="text-xs text-[#5d6f5d] mt-1 font-[family-name:var(--font-body)]">{selectedSpecies.description}</p>
                  <div className="flex flex-wrap gap-3 mt-3">
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-semibold font-[family-name:var(--font-body)]">📍 {selectedSpecies.location}</span>
                    <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded font-semibold font-[family-name:var(--font-body)]">🌱 {selectedSpecies.survival} survival</span>
                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-semibold font-[family-name:var(--font-body)]">💨 {selectedSpecies.co2}</span>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#dce9dc] shadow-sm p-5 sm:p-7">
                <p className="text-xs uppercase tracking-widest text-[#2d6a4f] font-semibold mb-4 font-[family-name:var(--font-body)]">
                  2. How Many Trees?
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                  {[1, 5, 10, 25, 50, 100].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setTreeCount(n)}
                      disabled={busy}
                      className={`py-2.5 rounded-xl text-sm font-bold transition-all font-[family-name:var(--font-body)]
                        ${treeCount === n
                          ? "bg-[#2d6a4f] text-white shadow-md"
                          : "bg-gray-50 text-gray-600 border border-gray-200 hover:border-[#2d6a4f]/30"
                        }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="200"
                    value={treeCount}
                    disabled={busy}
                    onChange={(e) => setTreeCount(parseInt(e.target.value, 10))}
                    className="flex-1 accent-[#2d6a4f] h-2"
                  />
                  <div className="bg-[#f0fdf4] border border-[#4ade80] rounded-xl px-4 py-2 min-w-[80px] text-center">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={treeCount}
                      disabled={busy}
                      onChange={(e) => setTreeCount(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full text-center text-xl font-bold text-[#2d6a4f] bg-transparent outline-none font-[family-name:var(--font-display)]"
                    />
                  </div>
                </div>
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-2xl">{currentTier.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-amber-800 font-[family-name:var(--font-display)]">{currentTier.label}</p>
                    <p className="text-xs text-amber-600 font-[family-name:var(--font-body)]">{currentTier.impact}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#dce9dc] shadow-sm p-5 sm:p-7">
                <p className="text-xs uppercase tracking-widest text-[#2d6a4f] font-semibold mb-4 font-[family-name:var(--font-body)]">
                  3. Your Details
                </p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Your full name *"
                    value={name}
                    disabled={busy}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20 font-[family-name:var(--font-body)]"
                  />
                  <input
                    type="email"
                    placeholder="Email address *"
                    value={email}
                    disabled={busy}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20 font-[family-name:var(--font-body)]"
                  />
                  <input
                    type="tel"
                    placeholder={currency === "UGX" ? "Mobile money number * (07XXXXXXXX)" : "Phone number (optional)"}
                    value={phone}
                    disabled={busy}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20 font-[family-name:var(--font-body)]"
                  />
                  <textarea
                    placeholder="Dedicate these trees to someone (optional)"
                    value={dedication}
                    disabled={busy}
                    onChange={(e) => setDedication(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20 font-[family-name:var(--font-body)] resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="lg:sticky lg:top-24 h-fit space-y-6">
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#dce9dc] shadow-sm p-5 sm:p-7">
                <p className="text-xs uppercase tracking-widest text-[#2d6a4f] font-semibold mb-4 font-[family-name:var(--font-body)]">
                  Planting Summary
                </p>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{selectedSpecies.image}</span>
                      <div>
                        <p className="text-sm font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">{selectedSpecies.name.split("(")[0].trim()}</p>
                        <p className="text-xs text-gray-400 font-[family-name:var(--font-body)]">{selectedSpecies.location}</p>
                      </div>
                    </div>
                    <p className="text-lg font-bold text-[#2d6a4f] font-[family-name:var(--font-display)]">×{treeCount}</p>
                  </div>

                  <div className="flex justify-center gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setCurrency("UGX")}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors font-[family-name:var(--font-body)]
                        ${currency === "UGX" ? "bg-[#2d6a4f] text-white" : "bg-gray-100 text-gray-500 hover:text-[#1a2e1a]"}`}
                    >
                      UGX · MoMo
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => setCurrency("USD")}
                      className={`px-4 py-1.5 rounded-full text-xs font-bold transition-colors font-[family-name:var(--font-body)]
                        ${currency === "USD" ? "bg-[#2d6a4f] text-white" : "bg-gray-100 text-gray-500 hover:text-[#1a2e1a]"}`}
                    >
                      USD · Card
                    </button>
                  </div>

                  <div className="bg-[#f0fdf4] rounded-xl p-4 border border-[#bbf7d0]">
                    <p className="text-2xl sm:text-3xl font-bold text-[#2d6a4f] text-center font-[family-name:var(--font-display)]">
                      {displayAmount}
                    </p>
                    <p className="text-xs text-[#5d6f5d] text-center mt-1 font-[family-name:var(--font-body)]">
                      ≈ {altAmount} · {currency === "UGX" ? "MTN MoMo / Airtel Money" : "Visa / Mastercard"}
                    </p>
                  </div>
                </div>

                {(paymentStep === "error" || paymentError) && paymentStep !== "success" && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-xs text-red-600 font-semibold font-[family-name:var(--font-body)]">{paymentError}</p>
                    {dgatewayRef && (
                      <p className="text-[10px] text-red-400 mt-1 font-[family-name:var(--font-body)]">Ref: {dgatewayRef}</p>
                    )}
                  </div>
                )}

                {paymentStep === "success" && (
                  <div className="mt-4 bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
                    <p className="text-sm font-bold text-emerald-800 font-[family-name:var(--font-display)]">
                      Payment confirmed — trees scheduled
                    </p>
                    <p className="text-xs text-emerald-700 mt-1 font-[family-name:var(--font-body)]">
                      Certificate ref: {merchantRef || dgatewayRef}
                    </p>
                    <button
                      type="button"
                      onClick={resetPayment}
                      className="mt-3 text-xs font-semibold text-[#2d6a4f] underline font-[family-name:var(--font-body)]"
                    >
                      Plant more trees
                    </button>
                  </div>
                )}

                {paymentStep === "polling" && (
                  <div className="mt-4 bg-sky-50 border border-sky-200 rounded-xl p-4 text-center">
                    <div className="flex justify-center mb-2">
                      <svg className="animate-spin w-6 h-6 text-sky-600" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                      </svg>
                    </div>
                    <p className="text-sm font-bold text-sky-900 font-[family-name:var(--font-display)]">
                      {currency === "UGX" ? "Approve the prompt on your phone" : "Confirming card payment…"}
                    </p>
                    <p className="text-xs text-sky-700 mt-1 font-[family-name:var(--font-body)]">
                      Waiting {pollSeconds}s · Ref {dgatewayRef}
                    </p>
                  </div>
                )}

                {paymentStep === "card" && clientSecret && stripePromise && (
                  <div className="mt-4 border border-[#dce9dc] rounded-xl p-4">
                    <p className="text-xs font-semibold text-[#2d6a4f] mb-3 font-[family-name:var(--font-body)]">
                      Enter card details
                    </p>
                    <Elements
                      stripe={stripePromise}
                      options={{
                        clientSecret,
                        appearance: {
                          theme: "stripe",
                          variables: { colorPrimary: "#2d6a4f", borderRadius: "12px" },
                        },
                      }}
                    >
                      <StripeCardForm
                        submitLabel={`Pay ${formatUSD(totalUsd)}`}
                        onSuccess={handleStripeSuccess}
                        onError={(msg) => {
                          setPaymentError(msg);
                          setPaymentStep("error");
                        }}
                      />
                    </Elements>
                  </div>
                )}

                {(paymentStep === "idle" || paymentStep === "error" || paymentStep === "processing") && (
                  <button
                    type="button"
                    onClick={handlePayment}
                    disabled={paymentStep === "processing"}
                    className={`w-full mt-6 flex items-center justify-center gap-3 py-4 rounded-full text-base sm:text-lg font-bold transition-all font-[family-name:var(--font-body)]
                      ${paymentStep === "processing"
                        ? "bg-gray-200 text-gray-500 cursor-wait"
                        : "bg-[#2d6a4f] hover:bg-[#1b4332] text-white shadow-lg shadow-[#2d6a4f]/25 hover:scale-[1.02]"
                      }`}
                  >
                    {paymentStep === "processing" ? (
                      <>
                        <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                          <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                        </svg>
                        Starting payment…
                      </>
                    ) : (
                      <>🌳 Plant {treeCount} Tree{treeCount > 1 ? "s" : ""} — {displayAmount}</>
                    )}
                  </button>
                )}

                <p className="text-[10px] text-gray-400 text-center mt-3 font-[family-name:var(--font-body)]">
                  Secured by DGateway · UGX via MTN/Airtel MoMo · USD via Visa/Mastercard
                </p>
              </div>

              <div className="bg-[#1a2e1a] rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white">
                <p className="text-xs uppercase tracking-[0.3em] text-[#a7f3d0] font-semibold mb-4 font-[family-name:var(--font-body)]">
                  Your Impact
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <p className="text-xl sm:text-2xl font-bold text-[#4ade80] font-[family-name:var(--font-display)]">{treeCount}</p>
                    <p className="text-white/50 text-[10px] sm:text-xs font-[family-name:var(--font-body)]">Trees Planted</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <p className="text-xl sm:text-2xl font-bold text-[#4ade80] font-[family-name:var(--font-display)]">{totalCO2} kg</p>
                    <p className="text-white/50 text-[10px] sm:text-xs font-[family-name:var(--font-body)]">CO₂/year captured</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <p className="text-xl sm:text-2xl font-bold text-[#4ade80] font-[family-name:var(--font-display)]">{currentTier.icon}</p>
                    <p className="text-white/50 text-[10px] sm:text-xs font-[family-name:var(--font-body)]">{currentTier.label}</p>
                  </div>
                  <div className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                    <p className="text-xl sm:text-2xl font-bold text-[#4ade80] font-[family-name:var(--font-display)]">{selectedSpecies.survival}</p>
                    <p className="text-white/50 text-[10px] sm:text-xs font-[family-name:var(--font-body)]">Survival Rate</p>
                  </div>
                </div>
                <p className="text-white/40 text-[10px] sm:text-xs mt-4 text-center font-[family-name:var(--font-body)]">
                  All trees are GPS-tagged and monitored via satellite. You&apos;ll receive a certificate with coordinates.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-12 sm:mt-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1a2e1a] mb-6 text-center font-[family-name:var(--font-display)]">
              Impact Tiers
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {IMPACT_TIERS.map((tier) => (
                <button
                  key={tier.trees}
                  type="button"
                  disabled={busy}
                  onClick={() => setTreeCount(tier.trees)}
                  className={`text-center rounded-xl p-3 sm:p-4 border transition-all
                    ${treeCount >= tier.trees
                      ? "bg-[#f0fdf4] border-[#4ade80] shadow-sm"
                      : "bg-white border-gray-100 hover:border-[#2d6a4f]/30"
                    }`}
                >
                  <span className="text-2xl sm:text-3xl block">{tier.icon}</span>
                  <p className="text-xs sm:text-sm font-bold text-[#1a2e1a] mt-2 font-[family-name:var(--font-display)]">{tier.label}</p>
                  <p className="text-xs text-[#2d6a4f] font-bold mt-1 font-[family-name:var(--font-body)]">{tier.trees} tree{tier.trees > 1 ? "s" : ""}</p>
                  <p className="text-[10px] text-gray-400 mt-1 font-[family-name:var(--font-body)]">${tier.trees}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-12 bg-white rounded-2xl border border-[#dce9dc] p-5 sm:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center">
              {[
                { icon: "🌍", label: "GPS-Tagged", desc: "Every tree has coordinates" },
                { icon: "📱", label: "Satellite Tracked", desc: "Growth monitored via AI" },
                { icon: "🔒", label: "DGateway Secure", desc: "UGX MoMo & USD cards" },
                { icon: "📜", label: "Certificate", desc: "Digital proof of planting" },
              ].map((item, i) => (
                <div key={i}>
                  <span className="text-2xl sm:text-3xl block">{item.icon}</span>
                  <p className="text-sm font-bold text-[#1a2e1a] mt-2 font-[family-name:var(--font-display)]">{item.label}</p>
                  <p className="text-xs text-gray-400 font-[family-name:var(--font-body)]">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
