"use client";
import { useState, Suspense } from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const [form, setForm] = useState({ identifier: "", password: "" });
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
      await login({ identifier: form.identifier, password: form.password });
      router.push(redirect);
    } catch (err) {
      setError(err.message || "Login failed. Please check your credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f0fdf4] via-[#f8faf5] to-[#ecfdf5] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="text-3xl">🌿</span>
            <span className="font-[family-name:var(--font-display)] text-2xl font-bold text-[#1b4332]">KibiraAI</span>
          </Link>
          <p className="text-sm text-[#6b7c6b] mt-2 font-[family-name:var(--font-body)]">
            Sign in to access your dashboard
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg shadow-[#2d6a4f]/5 border border-[#e5e7eb] p-6 sm:p-8">
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
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all"
                required
              />
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
