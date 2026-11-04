"use client";
import { useState, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import { DISTRICTS, LANGUAGES, PERSONAS, REGIONS } from "../../lib/ews/regions";
import { PLAY_STORE_URL, ugandaPhone } from "../../lib/ews/account";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

// The same two sign-ups as the mobile app. Everyone else gets in touch.
const ROLES = [
  {
    id: "farmer", // the account type community members have always had
    icon: "🌾",
    title: "Community member",
    desc: "Early warnings for heavy rain, floods, landslides, dry spells and disease in your district, by SMS and in the app, in your language.",
  },
  {
    id: "agent",
    icon: "📣",
    title: "KibiraAI Agent",
    desc: "Register people in your community, report what happened on the ground, and pass warnings on to those without phones.",
  },
];

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all";
const labelCls = "block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]";
const hintCls = "text-xs text-[#6b7c6b] mt-1 font-[family-name:var(--font-body)]";

const regionsCovered = [...new Set(DISTRICTS.map((d) => REGIONS[d.region]))];

async function ewsPut(path, jwt, body) {
  const res = await fetch(`${STRAPI_URL}/api/ews${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${jwt}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json().catch(() => ({})))?.error?.message || "Could not save");
}

function AppLink({ className = "" }) {
  return (
    <a
      href={PLAY_STORE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 rounded-xl bg-[#1a2e1a] hover:bg-black text-white px-4 py-2.5 text-sm font-semibold transition-colors font-[family-name:var(--font-body)] ${className}`}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M3.6 1.8 13.5 12l-9.9 10.2c-.4-.2-.6-.7-.6-1.2V3c0-.5.2-1 .6-1.2Zm11.3 8.8 2.6-2.7 3.5 2c1 .6 1 1.6 0 2.2l-3.5 2-2.6-2.7-.9-.8.9-.9v.9Zm-1.4-1.4L5.4 1.1l9.9 5.7-1.8 2.4Zm0 5.6 1.8 2.4-9.9 5.7 8.1-8.1Z" /></svg>
      Get the app on Google Play
    </a>
  );
}

function SignupForm() {
  const { registerAccount } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselect = searchParams.get("type");

  const [step, setStep] = useState(1);
  const [role, setRole] = useState(ROLES.some((r) => r.id === preselect) ? preselect : "");
  const [form, setForm] = useState({
    fullName: "",
    district: "",
    village: "",
    persona: "farmer",
    phone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [languages, setLanguages] = useState(["en"]);
  const [childAlerts, setChildAlerts] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [agentDone, setAgentDone] = useState(false);

  const set = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };
  const toggleLanguage = (key) =>
    setLanguages((prev) => (prev.includes(key) ? prev.filter((l) => l !== key) : [...prev, key]));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    const isAgent = role === "agent";
    const phone = form.phone.trim() ? ugandaPhone(form.phone) : null;
    if (!form.fullName.trim() || !form.district || !form.password) return setError("Please add your name, district and a password.");
    if (isAgent && !form.phone.trim()) return setError("Agents need a phone number so the KibiraAI team can reach you.");
    if (!form.phone.trim() && !form.email.trim()) return setError("Enter your phone number. You will use it to sign in.");
    if (form.phone.trim() && !phone) return setError("Type your phone number the way you dial it, for example 0772 123 456.");
    if (!languages.length) return setError("Pick at least one language for your warnings.");
    if (form.password.length < 6) return setError("Password must be at least 6 characters.");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");

    setLoading(true);
    try {
      const account = await registerAccount({
        phone,
        email: form.email.trim(),
        password: form.password,
        fullName: form.fullName.trim(),
        position: isAgent ? "KibiraAI Agent" : PERSONAS.find((p) => p.key === form.persona)?.label || "",
        accountType: role,
      });
      // The account exists now; warnings and agent setup can be finished in the app if either fails.
      await Promise.allSettled([
        ewsPut("/me", account.jwt, {
          district: form.district,
          persona: isAgent ? "other" : form.persona,
          language: languages[0],
          languages,
          village: form.village.trim() || undefined,
          sms: Boolean(phone),
          childAlerts,
        }),
        isAgent
          ? ewsPut("/agents/me", account.jwt, { fullName: form.fullName.trim(), phone, district: form.district, village: form.village.trim() })
          : Promise.resolve(),
      ]);
      if (isAgent) setAgentDone(true);
      else router.push("/dashboard/farmer");
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const selected = ROLES.find((r) => r.id === role);

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-8">
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1f13] via-[#122a1a] to-[#0f2618]" />

      <div className="w-full max-w-lg relative z-10">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🌿</span>
            <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#4ade80]">KibiraAI</span>
          </Link>
          <p className="text-sm text-white/60 mt-2 font-[family-name:var(--font-body)]">
            {step === 1 ? "Early warnings for last-mile communities" : "Create your account"}
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 border border-white/20 p-6 sm:p-8">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm font-[family-name:var(--font-body)]">{error}</div>
          )}

          {agentDone ? (
            <div className="text-center">
              <div className="text-4xl mb-3">📣</div>
              <h1 className="text-xl font-bold text-[#1a2e1a] mb-2 font-[family-name:var(--font-display)]">Thank you for applying</h1>
              <p className="text-sm text-[#4a5c4a] mb-5 font-[family-name:var(--font-body)]">
                The KibiraAI team will review your application and call you. Agent work (registering people, reports, checks) happens in the mobile app, so install it and sign in with your phone number.
              </p>
              <AppLink className="mb-4" />
              <p className="text-sm">
                <Link href="/dashboard/farmer" className="text-[#2d6a4f] font-semibold hover:underline">Continue to your dashboard →</Link>
              </p>
            </div>
          ) : step === 1 ? (
            <div>
              <h1 className="text-xl font-bold text-[#1a2e1a] mb-2 font-[family-name:var(--font-display)]">Join KibiraAI as a…</h1>
              <div className="rounded-xl bg-[#f0f7f3] border border-[#d5e8dc] px-4 py-3 mb-4">
                <p className="text-xs text-[#2d4a38] leading-relaxed font-[family-name:var(--font-body)]">
                  📍 Sign-up covers our <strong>last-mile areas</strong>: {DISTRICTS.length} districts in {regionsCovered.join(", ")}. Most people use KibiraAI on their phone.
                </p>
                <AppLink className="mt-3" />
              </div>

              <div className="space-y-3">
                {ROLES.map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      setRole(r.id);
                      setError("");
                    }}
                    className={`w-full text-left rounded-xl border-2 p-4 transition-all ${
                      role === r.id ? "border-[#2d6a4f] bg-[#f0faf4] ring-2 ring-[#2d6a4f]/30" : "border-[#d1d5db] hover:border-[#2d6a4f]/50 hover:shadow-md"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl mt-0.5">{r.icon}</span>
                      <div className="flex-1 min-w-0">
                        <span className="font-bold text-[#1a2e1a] text-sm font-[family-name:var(--font-display)]">
                          {r.title} {role === r.id && <span className="text-[#2d6a4f] text-xs">✓</span>}
                        </span>
                        <p className="text-xs text-[#6b7c6b] mt-1 leading-relaxed font-[family-name:var(--font-body)]">{r.desc}</p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => (role ? setStep(2) : setError("Choose how you will use KibiraAI."))}
                className="w-full mt-6 py-3 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-sm transition-colors font-[family-name:var(--font-body)]"
              >
                Continue →
              </button>

              <div className="mt-5 rounded-xl border border-dashed border-[#c9d6cd] px-4 py-3">
                <p className="text-sm font-semibold text-[#1a2e1a] font-[family-name:var(--font-display)]">Using KibiraAI another way?</p>
                <p className="text-xs text-[#6b7c6b] mt-1 font-[family-name:var(--font-body)]">
                  Organisations, schools, health facilities, local government, or places outside our districts: tell us what you need and we will reach out.
                </p>
                <Link href="/contact" className="inline-block mt-2 text-sm text-[#2d6a4f] font-semibold hover:underline">Get in touch →</Link>
              </div>

              <p className="text-center text-sm text-[#6b7c6b] mt-4 font-[family-name:var(--font-body)]">
                Already have an account? <Link href="/login" className="text-[#2d6a4f] font-semibold hover:underline">Sign in</Link>
              </p>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setStep(1)} className="text-[#2d6a4f] hover:text-[#1b4332]" aria-label="Back">
                  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h1 className="text-xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">
                  {selected?.icon} {selected?.title}
                </h1>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className={labelCls}>Full name <span className="text-red-500">*</span></label>
                  <input name="fullName" value={form.fullName} onChange={set} placeholder="Your name" className={inputCls} required />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>{role === "agent" ? "District you serve" : "Your district"} <span className="text-red-500">*</span></label>
                    <select name="district" value={form.district} onChange={set} className={inputCls} required>
                      <option value="">Choose…</option>
                      {DISTRICTS.map((d) => (
                        <option key={d.name} value={d.name}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Village or parish</label>
                    <input name="village" value={form.village} onChange={set} placeholder="e.g. Nyarusiza" className={inputCls} />
                  </div>
                </div>
                {role === "farmer" && (
                  <div>
                    <label className={labelCls}>Your main work</label>
                    <select name="persona" value={form.persona} onChange={set} className={inputCls}>
                      {PERSONAS.map((p) => (
                        <option key={p.key} value={p.key}>{p.label}</option>
                      ))}
                    </select>
                  </div>
                )}
                <div>
                  <label className={labelCls}>Languages you understand <span className="text-red-500">*</span></label>
                  <div className="flex flex-wrap gap-2">
                    {LANGUAGES.map((l) => {
                      const on = languages.includes(l.key);
                      return (
                        <button
                          key={l.key}
                          type="button"
                          onClick={() => toggleLanguage(l.key)}
                          aria-pressed={on}
                          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${on ? "bg-[#2d6a4f] text-white border-[#2d6a4f]" : "bg-white text-[#3d4f3d] border-[#d1d5db] hover:border-[#2d6a4f]"}`}
                        >
                          {on ? "✓ " : ""}{l.label}
                        </button>
                      );
                    })}
                  </div>
                  <p className={hintCls}>Pick one or more. SMS warnings come in the first one you pick.</p>
                </div>
                <label className="flex items-start gap-2 text-sm text-[#1a2e1a] font-[family-name:var(--font-body)] cursor-pointer">
                  <input type="checkbox" checked={childAlerts} onChange={(e) => setChildAlerts(e.target.checked)} className="mt-1 accent-[#2d6a4f]" />
                  <span>I look after children under 5. Send me children&apos;s health alerts (malaria, diarrhoea, outbreaks).</span>
                </label>
                <div>
                  <label className={labelCls}>Phone number <span className="text-red-500">*</span></label>
                  <input type="tel" name="phone" value={form.phone} onChange={set} placeholder="0772 123 456" className={inputCls} />
                  <p className={hintCls}>Start with 0, the way you dial it. You will sign in with this number.</p>
                </div>
                <div>
                  <label className={labelCls}>Email (optional)</label>
                  <input type="email" name="email" value={form.email} onChange={set} placeholder="you@email.com" className={inputCls} />
                  <p className={hintCls}>Only if you have one. You can also sign in with it.</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className={labelCls}>Password <span className="text-red-500">*</span></label>
                    <input type="password" name="password" value={form.password} onChange={set} placeholder="At least 6 characters" className={inputCls} required minLength={6} />
                  </div>
                  <div>
                    <label className={labelCls}>Confirm password <span className="text-red-500">*</span></label>
                    <input type="password" name="confirmPassword" value={form.confirmPassword} onChange={set} placeholder="Repeat it" className={inputCls} required />
                  </div>
                </div>
                <button type="submit" disabled={loading} className="w-full py-3 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-sm transition-colors disabled:opacity-50 font-[family-name:var(--font-body)]">
                  {loading ? "Creating account…" : "Create account"}
                </button>
              </form>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-white/40 mt-4 font-[family-name:var(--font-body)]">
          By creating an account, you agree to KibiraAI&apos;s <Link href="/terms" className="underline hover:text-white/70">Terms of Use</Link> and{" "}
          <Link href="/privacy" className="underline hover:text-white/70">Privacy Policy</Link>.
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
