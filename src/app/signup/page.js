"use client";
import { useState, Suspense } from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

function SignupForm() {
  const { register } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/dashboard";
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    company: "",
    position: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError("");
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
      await register({
        username: form.email.split("@")[0] + "_" + Date.now().toString(36),
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        phone: form.phone,
        company: form.company,
        position: form.position,
      });
      router.push(redirect);
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
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
            Create your account to access Forest Sentinel and more
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-lg shadow-[#2d6a4f]/5 border border-[#e5e7eb] p-6 sm:p-8">
          <h1 className="text-xl font-bold text-[#1a2e1a] mb-6 font-[family-name:var(--font-display)]">
            Create Account
          </h1>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 mb-4 text-sm font-[family-name:var(--font-body)]">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]">
                Full Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@company.com"
                className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="+256 700 000 000"
                className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]">
                  Company
                </label>
                <input
                  type="text"
                  name="company"
                  value={form.company}
                  onChange={handleChange}
                  placeholder="Your Organization"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]">
                  Position
                </label>
                <input
                  type="text"
                  name="position"
                  value={form.position}
                  onChange={handleChange}
                  placeholder="Your Role"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]">
                Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                placeholder="Repeat your password"
                className="w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)] transition-all"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-[family-name:var(--font-body)]"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          <p className="text-center text-sm text-[#6b7c6b] mt-6 font-[family-name:var(--font-body)]">
            Already have an account?{" "}
            <Link href="/login" className="text-[#2d6a4f] font-semibold hover:underline">
              Sign In
            </Link>
          </p>
        </div>

        <p className="text-center text-xs text-[#9ca3af] mt-4 font-[family-name:var(--font-body)]">
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
