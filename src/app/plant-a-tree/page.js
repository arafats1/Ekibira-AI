"use client";
import { useState } from "react";
import Link from "next/link";

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

export default function PlantATreePage() {
  const [treeCount, setTreeCount] = useState(1);
  const [selectedSpecies, setSelectedSpecies] = useState(TREE_SPECIES[0]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dedication, setDedication] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const pricePerTree = 1; // $1 USD
  const totalAmount = treeCount * pricePerTree;
  const totalCO2 = (treeCount * parseFloat(selectedSpecies.co2)).toFixed(0);
  const currentTier = [...IMPACT_TIERS].reverse().find((t) => treeCount >= t.trees) || IMPACT_TIERS[0];

  const handlePayment = async () => {
    if (!name.trim() || !email.trim()) {
      setPaymentError("Please enter your name and email address.");
      return;
    }
    setPaymentError("");
    setIsProcessing(true);

    try {
      const res = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: totalAmount,
          currency: "USD",
          description: `Plant ${treeCount} ${selectedSpecies.name} tree(s) via KibiraAI`,
          treeCount,
          species: selectedSpecies.name,
          dedication: dedication || null,
          customer: { name, email, phone },
        }),
      });

      const data = await res.json();

      if (data.redirect_url) {
        window.location.href = data.redirect_url;
      } else if (data.error) {
        setPaymentError(data.error || "Payment initiation failed. Please try again.");
        setIsProcessing(false);
      } else {
        setPaymentError("Payment gateway returned an unexpected response. Please try again.");
        setIsProcessing(false);
      }
    } catch (err) {
      setPaymentError("Network error. Please check your connection and try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7faf6]">
      {/* Nav */}
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
            <Link href="/advisor" className="hover:text-[#2d6a4f] transition-colors">AI Advisor</Link>
            <Link href="/" className="hover:text-[#2d6a4f] transition-colors">Home</Link>
          </div>
        </div>
      </nav>

      <main className="pt-20 sm:pt-24 pb-20">
        {/* Hero */}
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
              in Uganda&apos;s most deforested areas. Each tree is GPS-tagged and tracked on KibiraAI.
            </p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-6 sm:gap-8">
            {/* Left — Configuration */}
            <div className="space-y-6">
              {/* Species selector */}
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
                        onClick={() => setSelectedSpecies(sp)}
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
                {/* Selected species detail */}
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

              {/* Tree count */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#dce9dc] shadow-sm p-5 sm:p-7">
                <p className="text-xs uppercase tracking-widest text-[#2d6a4f] font-semibold mb-4 font-[family-name:var(--font-body)]">
                  2. How Many Trees?
                </p>
                {/* Quick select */}
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-4">
                  {[1, 5, 10, 25, 50, 100].map((n) => (
                    <button
                      key={n}
                      onClick={() => setTreeCount(n)}
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
                {/* Slider */}
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="1"
                    max="200"
                    value={treeCount}
                    onChange={(e) => setTreeCount(parseInt(e.target.value))}
                    className="flex-1 accent-[#2d6a4f] h-2"
                  />
                  <div className="bg-[#f0fdf4] border border-[#4ade80] rounded-xl px-4 py-2 min-w-[80px] text-center">
                    <input
                      type="number"
                      min="1"
                      max="1000"
                      value={treeCount}
                      onChange={(e) => setTreeCount(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full text-center text-xl font-bold text-[#2d6a4f] bg-transparent outline-none font-[family-name:var(--font-display)]"
                    />
                  </div>
                </div>
                {/* Impact tier */}
                <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                  <span className="text-2xl">{currentTier.icon}</span>
                  <div>
                    <p className="text-sm font-bold text-amber-800 font-[family-name:var(--font-display)]">{currentTier.label}</p>
                    <p className="text-xs text-amber-600 font-[family-name:var(--font-body)]">{currentTier.impact}</p>
                  </div>
                </div>
              </div>

              {/* Personal details */}
              <div className="bg-white rounded-2xl sm:rounded-3xl border border-[#dce9dc] shadow-sm p-5 sm:p-7">
                <p className="text-xs uppercase tracking-widest text-[#2d6a4f] font-semibold mb-4 font-[family-name:var(--font-body)]">
                  3. Your Details
                </p>
                <div className="space-y-3">
                  <input
                    type="text"
                    placeholder="Your full name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20 font-[family-name:var(--font-body)]"
                  />
                  <input
                    type="email"
                    placeholder="Email address *"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20 font-[family-name:var(--font-body)]"
                  />
                  <input
                    type="tel"
                    placeholder="Phone number (optional)"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20 font-[family-name:var(--font-body)]"
                  />
                  <textarea
                    placeholder="Dedicate these trees to someone (optional)"
                    value={dedication}
                    onChange={(e) => setDedication(e.target.value)}
                    rows={2}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:border-[#2d6a4f] focus:ring-1 focus:ring-[#2d6a4f]/20 font-[family-name:var(--font-body)] resize-none"
                  />
                </div>
              </div>
            </div>

            {/* Right — Summary & Payment */}
            <div className="lg:sticky lg:top-24 h-fit space-y-6">
              {/* Order summary */}
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

                  <div className="border-t border-gray-100 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500 font-[family-name:var(--font-body)]">{treeCount} tree{treeCount > 1 ? "s" : ""} × ${pricePerTree}</span>
                      <span className="font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">${totalAmount}</span>
                    </div>
                  </div>

                  <div className="bg-[#f0fdf4] rounded-xl p-4 border border-[#bbf7d0]">
                    <p className="text-2xl sm:text-3xl font-bold text-[#2d6a4f] text-center font-[family-name:var(--font-display)]">
                      ${totalAmount} USD
                    </p>
                    <p className="text-xs text-[#5d6f5d] text-center mt-1 font-[family-name:var(--font-body)]">
                      Powered by Pesapal — secure payment
                    </p>
                  </div>
                </div>

                {paymentError && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-3">
                    <p className="text-xs text-red-600 font-semibold font-[family-name:var(--font-body)]">{paymentError}</p>
                  </div>
                )}

                <button
                  onClick={handlePayment}
                  disabled={isProcessing}
                  className={`w-full mt-6 flex items-center justify-center gap-3 py-4 rounded-full text-base sm:text-lg font-bold transition-all font-[family-name:var(--font-body)]
                    ${isProcessing
                      ? "bg-gray-200 text-gray-500 cursor-wait"
                      : "bg-[#2d6a4f] hover:bg-[#1b4332] text-white shadow-lg shadow-[#2d6a4f]/25 hover:scale-[1.02]"
                    }`}
                >
                  {isProcessing ? (
                    <>
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                        <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
                      </svg>
                      Connecting to Pesapal...
                    </>
                  ) : (
                    <>🌳 Plant {treeCount} Tree{treeCount > 1 ? "s" : ""} — ${totalAmount}</>
                  )}
                </button>

                <p className="text-[10px] text-gray-400 text-center mt-3 font-[family-name:var(--font-body)]">
                  Payments processed securely by Pesapal. Supports mobile money, Visa, Mastercard & bank transfer.
                </p>
              </div>

              {/* Impact stats */}
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

          {/* Impact tiers */}
          <div className="mt-12 sm:mt-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-[#1a2e1a] mb-6 text-center font-[family-name:var(--font-display)]">
              Impact Tiers
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {IMPACT_TIERS.map((tier) => (
                <button
                  key={tier.trees}
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

          {/* Trust bar */}
          <div className="mt-12 bg-white rounded-2xl border border-[#dce9dc] p-5 sm:p-8">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 text-center">
              {[
                { icon: "🌍", label: "GPS-Tagged", desc: "Every tree has coordinates" },
                { icon: "📱", label: "Satellite Tracked", desc: "Growth monitored via AI" },
                { icon: "🔒", label: "Pesapal Secure", desc: "Trusted payment gateway" },
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
