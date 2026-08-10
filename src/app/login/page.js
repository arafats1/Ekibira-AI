"use client";
import { useState, Suspense } from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { getDashboardRoute } from "../../lib/dashboardRoutes";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect");
  const [form, setForm] = useState({ identifier: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!form.identifier || !form.password) {
      setError("Email and password are required.");
      return;
    }

    setLoading(true);
    try {
      const userData = await login({ identifier: form.identifier, password: form.password });
      const dest = redirect || getDashboardRoute(userData.accountType);
      router.push(dest);
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center px-4 py-8">
      {/* Forest background */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0a1f13] via-[#122a1a] to-[#0f2618]" />
      <div className="absolute inset-0 opacity-20" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 800 600'%3E%3Cg fill='%234ade80' opacity='0.15'%3E%3Cpath d='M100 600 L130 400 L80 420 L110 250 L70 280 L100 150 L130 280 L90 250 L120 420 L70 400Z'/%3E%3Cpath d='M250 600 L280 380 L230 400 L260 220 L220 250 L250 100 L280 250 L240 220 L270 400 L220 380Z'/%3E%3Cpath d='M400 600 L430 350 L380 370 L410 200 L370 230 L400 80 L430 230 L390 200 L420 370 L370 350Z'/%3E%3Cpath d='M550 600 L580 390 L530 410 L560 240 L520 270 L550 120 L580 270 L540 240 L570 410 L520 390Z'/%3E%3Cpath d='M700 600 L730 370 L680 390 L710 210 L670 240 L700 90 L730 240 L690 210 L720 390 L670 370Z'/%3E%3C/g%3E%3Cg fill='%232d6a4f' opacity='0.1'%3E%3Cpath d='M170 600 L200 430 L150 450 L180 300 L140 330 L170 200 L200 330 L160 300 L190 450 L140 430Z'/%3E%3Cpath d='M470 600 L500 410 L450 430 L480 260 L440 290 L470 140 L500 290 L460 260 L490 430 L440 410Z'/%3E%3Cpath d='M620 600 L650 420 L600 440 L630 280 L590 310 L620 160 L650 310 L610 280 L640 440 L590 420Z'/%3E%3C/g%3E%3C/svg%3E")`, backgroundSize: 'cover', backgroundPosition: 'bottom' }} />
      {/* Floating particles */}
      <div className="absolute top-20 left-[10%] w-2 h-2 bg-[#4ade80]/20 rounded-full animate-pulse" />
      <div className="absolute top-40 right-[15%] w-3 h-3 bg-[#4ade80]/15 rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-60 left-[30%] w-1.5 h-1.5 bg-[#4ade80]/25 rounded-full animate-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute bottom-40 right-[25%] w-2 h-2 bg-[#4ade80]/20 rounded-full animate-pulse" style={{ animationDelay: '0.5s' }} />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🌿</span>
            <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#4ade80]">KibiraAI</span>
          </Link>
          <p className="text-sm text-white/60 mt-2 font-[family-name:var(--font-body)]">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/20 border border-white/20 p-6 sm:p-8">
          <h1 className="text-xl font-bold text-[#1a2e1a] mb-6 font-[family-name:var(--font-display)]">
            Welcome Back
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm font-[family-name:var(--font-body)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]">
                Email Address
              </label>
              <input
                type="email"
                name="identifier"
                value={form.identifier}
                onChange={handleChange}
                placeholder="you@company.com"
                className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  className="w-full px-4 py-2.5 pr-11 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all"
                  required
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6b7c6b] hover:text-[#1a2e1a] transition-colors" tabIndex={-1}>
                  {showPassword ? (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" /></svg>
                  ) : (
                    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" /><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" /></svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-[family-name:var(--font-body)]"
            >
              {loading ? "Signing In..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-sm text-[#6b7c6b] mt-6 font-[family-name:var(--font-body)]">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-[#2d6a4f] font-semibold hover:underline">
              Create Account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
