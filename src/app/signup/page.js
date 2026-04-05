"use client";
import { useState, Suspense } from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

const ACCOUNT_TYPES = [
  {
    id: "farmer",
    icon: "🌾",
    title: "Farmer / Agribusiness",
    desc: "Flood & heat risk predictions, seasonal weather forecasts, agroforestry guidance, climate-smart agriculture strategies",
    color: "border-amber-400 bg-amber-50",
    activeColor: "border-amber-500 bg-amber-100 ring-2 ring-amber-400",
  },
  {
    id: "insurance",
    icon: "🛡️",
    title: "Insurance Company",
    desc: "Climate risk underwriting data, flood/heat risk scoring, loss prediction modeling, portfolio risk analytics",
    color: "border-blue-400 bg-blue-50",
    activeColor: "border-blue-500 bg-blue-100 ring-2 ring-blue-400",
  },
  {
    id: "eu_compliance",
    icon: "🇪🇺",
    title: "EU Compliance / Trade",
    desc: "Deforestation-free supply chain verification, EUDR compliance reports, satellite area overviews for market access",
    color: "border-indigo-400 bg-indigo-50",
    activeColor: "border-indigo-500 bg-indigo-100 ring-2 ring-indigo-400",
  },
  {
    id: "general",
    icon: "🌿",
    title: "General / Researcher",
    desc: "Full access to Dr. Kibira AI, Forest Sentinel, Urban Warning, and all climate intelligence tools",
    color: "border-emerald-400 bg-emerald-50",
    activeColor: "border-emerald-500 bg-emerald-100 ring-2 ring-emerald-400",
  },
];

function getDashboardRoute(type) {
  switch (type) {
    case "farmer": return "/dashboard/farmer";
    case "insurance": return "/dashboard/insurance";
    case "eu_compliance": return "/dashboard/eu-compliance";
    default: return "/dashboard";
  }
}

function SignupForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const preselect = searchParams.get("type");

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    password: "",
    confirmPassword: "",
    accountType: preselect && ACCOUNT_TYPES.find((t) => t.id === preselect) ? preselect : "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const selectAccountType = (id) => {
    setForm((prev) => ({ ...prev, accountType: id }));
    setError("");
  };

  const goToStep2 = () => {
    if (!form.accountType) {
      setError("Please select how you'll use KibiraAI.");
      return;
    }
    setError("");
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.fullName || !form.email || !form.password) {
      setError("Full name, email, and password are required.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const userData = await register({
        username: form.email.split("@")[0] + "_" + Date.now().toString(36),
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone,
        company: form.company,
        position: form.position,
        accountType: form.accountType,
      });
      const dest = redirect || getDashboardRoute(userData.accountType || form.accountType);
      router.push(dest);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selectedType = ACCOUNT_TYPES.find((t) => t.id === form.accountType);

  const getCompanyLabel = () => {
    switch (form.accountType) {
      case "farmer": return "Farm / Cooperative Name";
      case "insurance": return "Insurance Company";
      case "eu_compliance": return "Company / Agency";
      default: return "Organization";
    }
  };

  const getPositionLabel = () => {
    switch (form.accountType) {
      case "farmer": return "Role (e.g. Farm Owner)";
      case "insurance": return "Role (e.g. Underwriter)";
      case "eu_compliance": return "Role (e.g. Compliance Officer)";
      default: return "Position";
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-8">
      {/* Forest background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1f13] via-[#122a1a] to-[#0f2618]" />
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Cg fill='%234ade80' opacity='0.15'%3E%3Cpath d='M100 600 L130 400 L80 420 L110 250 L70 280 L100 150 L130 280 L90 250 L120 420 L70 400Z'/%3E%3Cpath d='M250 600 L280 380 L230 400 L260 220 L220 250 L250 100 L280 250 L240 220 L270 400 L220 380Z'/%3E%3Cpath d='M400 600 L430 350 L380 370 L410 200 L370 230 L400 80 L430 230 L390 200 L420 370 L370 350Z'/%3E%3Cpath d='M550 600 L580 390 L530 410 L560 240 L520 270 L550 120 L580 270 L540 240 L570 410 L520 390Z'/%3E%3Cpath d='M700 600 L730 370 L680 390 L710 210 L670 240 L700 90 L730 240 L690 210 L720 390 L670 370Z'/%3E%3C/g%3E%3C/svg%3E")`, backgroundSize: 'cover', backgroundPosition: 'bottom' }} />
      <div className="absolute top-20 left-[10%] w-2 h-2 bg-[#4ade80]/20 rounded-full animate-pulse" />
      <div className="absolute top-40 right-[15%] w-3 h-3 bg-[#4ade80]/15 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute bottom-40 right-[25%] w-2 h-2 bg-[#4ade80]/20 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />

      <div className="w-full max-w-lg relative z-10">
        {/* Logo */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🌿</span>
            <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#4ade80]">KibiraAI</span>
          </Link>
          <p className="text-sm text-white/60 mt-2 font-[family-name:var(--font-body)]">
            {step === 1 ? "How will you use KibiraAI?" : "Create your account"}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? 'bg-[#4ade80] text-[#0a1f13]' : 'bg-white/20 text-white/50'}`}>1</div>
          <div className={`w-12 h-0.5 ${step >= 2 ? 'bg-[#4ade80]' : 'bg-white/20'}`} />
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? 'bg-[#4ade80] text-[#0a1f13]' : 'bg-white/20 text-white/50'}`}>2</div>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 border border-white/20 p-6 sm:p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm font-[family-name:var(--font-body)]">
              {error}
            </div>
          )}

          {/* STEP 1: Role Selection */}
          {step === 1 && (
            <div>
              <h1 className="text-xl font-bold text-[#1a2e1a] mb-2 font-[family-name:var(--font-display)]">
                I want to use KibiraAI as a...
              </h1>
              <p className="text-sm text-[#6b7c6b] mb-5 font-[family-name:var(--font-body)]">
                Select your role to get a customized dashboard with the tools you need.
              </p>

              <div className="space-y-3">
                {ACCOUNT_TYPES.map((type) => (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => selectAccountType(type.id)}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                      form.accountType === type.id ? type.activeColor : type.color + " hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">{type.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#1a2e1a] text-sm font-[family-name:var(--font-display)]">{type.title}</span>
                          {form.accountType === type.id && (
                            <span className="text-[#2d6a4f] text-xs">✓</span>
                          )}
                        </div>
                        <p className="text-xs text-[#6b7c6b] mt-1 leading-relaxed font-[family-name:var(--font-body)]">{type.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={goToStep2}
                className="w-full mt-6 py-3 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-sm transition-colors font-[family-name:var(--font-body)]"
              >
                Continue →
              </button>

              <p className="text-center text-sm text-[#6b7c6b] mt-4 font-[family-name:var(--font-body)]">
                Already have an account?{" "}
                <Link href="/login" className="text-[#2d6a4f] font-semibold hover:underline">
                  Sign In
                </Link>
              </p>
            </div>
          )}

          {/* STEP 2: Account Details */}
          {step === 2 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setStep(1)} className="text-[#2d6a4f] hover:text-[#1b4332] transition-colors">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Create Account</h1>
              </div>

              {selectedType && (
                <div className={`rounded-lg border px-3 py-2 mb-4 flex items-center gap-2 ${selectedType.color}`}>
                  <span className="text-lg">{selectedType.icon}</span>
                  <span className="text-sm font-semibold text-[#1a2e1a] font-[family-name:var(--font-body)]">{selectedType.title}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]">Full Name <span className="text-red-500">*</span></label>
                  <input type="text" name="fullName" value={form.fullName} onChange={handleChange} placeholder="John Doe" className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]">Email Address <span className="text-red-500">*</span></label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@company.com" className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]">Phone Number</label>
                  <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+256 700 000 000" className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]">{getCompanyLabel()}</label>
                    <input type="text" name="company" value={form.company} onChange={handleChange} placeholder={form.accountType === "farmer" ? "My Farm / Coop" : "Your Organization"} className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]">{getPositionLabel()}</label>
                    <input type="text" name="position" value={form.position} onChange={handleChange} placeholder="Your Role" className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]">Password <span className="text-red-500">*</span></label>
                  <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="At least 6 characters" className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all" required minLength={6} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]">Confirm Password <span className="text-red-500">*</span></label>
                  <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat your password" className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all" required />
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-[family-name:var(--font-body)]">
                  {loading ? "Creating Account..." : "Create Account"}
                </button>
              </form>

              <p className="text-center text-sm text-[#6b7c6b] mt-4 font-[family-name:var(--font-body)]">
                Already have an account?{" "}
                <Link href="/login" className="text-[#2d6a4f] font-semibold hover:underline">Sign In</Link>
              </p>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-white/40 mt-4 font-[family-name:var(--font-body)]">
          By creating an account, you agree to KibiraAI&apos;s Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
