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
    id: "forestry",
    icon: "🌲",
    title: "Forestry / Conservation",
    desc: "Full Forest Sentinel access with real-time deforestation monitoring, NDVI analysis, carbon tracking, and conservation reporting",
    color: "border-emerald-400 bg-emerald-50",
    activeColor: "border-emerald-500 bg-emerald-100 ring-2 ring-emerald-400",
  },
  {
    id: "general",
    icon: "🌿",
    title: "General / Researcher",
    desc: "Full access to Dr. Kibira AI, Early Warning, Forest Sentinel, and climate–health intelligence tools",
    color: "border-teal-400 bg-teal-50",
    activeColor: "border-teal-500 bg-teal-100 ring-2 ring-teal-400",
  },
  {
    id: "insurance",
    icon: "🛡️",
    title: "Insurance / Disaster Finance",
    desc: "Climate risk scores, anomaly-triggered alerts, and anticipatory action data for parametric and community disaster financing",
    color: "border-blue-400 bg-blue-50",
    activeColor: "border-blue-500 bg-blue-100 ring-2 ring-blue-400",
  },
  {
    id: "local_gov",
    icon: "🏛️",
    title: "Local Government / Community",
    desc: "Hyper-local flood, heat, air quality and humidity alerts for wards, schools, and community leaders — with anticipatory action playbooks",
    color: "border-sky-400 bg-sky-50",
    activeColor: "border-sky-500 bg-sky-100 ring-2 ring-sky-400",
  },
  {
    id: "school_health",
    icon: "🏫",
    title: "Schools & Health Facilities",
    desc: "Early warning for heat illness, flood, air pollution and climate-sensitive health risks affecting children, clinics, and school communities",
    color: "border-rose-400 bg-rose-50",
    activeColor: "border-rose-500 bg-rose-100 ring-2 ring-rose-400",
  },
];

function getDashboardRoute(type) {
  switch (type) {
    case "farmer": return "/dashboard/farmer";
    case "insurance": return "/dashboard/insurance";
    case "local_gov":
    case "school_health": return "/urban-warning";
    case "forestry": return "/dashboard/forestry";
    case "general": return "/dashboard/forestry";
    case "eu_compliance": return "/dashboard/forestry"; // legacy accounts
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

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
      case "insurance": return "Insurance / Finance Org";
      case "local_gov": return "Government / Community Org";
      case "school_health": return "School / Health Facility";
      case "forestry": return "Organization / NGO";
      default: return "Organization";
    }
  };

  const getPositionLabel = () => {
    switch (form.accountType) {
      case "farmer": return "Role (e.g. Farm Owner)";
      case "insurance": return "Role (e.g. Risk Analyst)";
      case "local_gov": return "Role (e.g. Ward Officer)";
      case "school_health": return "Role (e.g. Headteacher / CHW)";
      case "forestry": return "Role (e.g. Forest Ranger)";
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
                  <div className="relative">
                    <input type={showPassword ? "text" : "password"} name="password" value={form.password} onChange={handleChange} placeholder="At least 6 characters" className="w-full px-4 py-2.5 pr-11 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all" required minLength={6} />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7c6b] hover:text-[#1a2e1a] transition-colors" tabIndex={-1}>
                      {showPassword ? (
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                      ) : (
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                      )}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]">Confirm Password <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <input type={showConfirm ? "text" : "password"} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} placeholder="Repeat your password" className="w-full px-4 py-2.5 pr-11 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all" required />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7c6b] hover:text-[#1a2e1a] transition-colors" tabIndex={-1}>
                      {showConfirm ? (
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                      ) : (
                        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                      )}
                    </button>
                  </div>
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
