"use client";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { DASHBOARD_ROUTES } from "../../lib/dashboardRoutes";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

const ROUTE_MAP = DASHBOARD_ROUTES;

export default function DashboardPage() {
  const { user, loading, logout, getToken } = useAuth();
  const router = useRouter();
  const [error, setError] = useState(null);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.replace("/login"); return; }

    // If accountType is already known and has a dashboard, redirect immediately
    const route = ROUTE_MAP[user.accountType];
    if (route) { router.replace(route); return; }

    // Otherwise re-check from Strapi
    const resolveAndRedirect = async () => {
      try {
        const token = getToken();
        if (!token) { setError("no_token"); return; }

        let profile = null;

        // Try by user ID
        const res1 = await fetch(
          `${STRAPI_URL}/api/kibira-users?filters[user][$eq]=${user.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (res1.ok) {
          const d = await res1.json();
          if (d?.data?.length > 0) profile = d.data[0];
        }

        // Fallback by email
        if (!profile && user.email) {
          const res2 = await fetch(
            `${STRAPI_URL}/api/kibira-users?filters[email][$eq]=${encodeURIComponent(user.email)}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          if (res2.ok) {
            const d = await res2.json();
            if (d?.data?.length > 0) profile = d.data[0];
          }
        }

        if (profile?.accountType && ROUTE_MAP[profile.accountType]) {
          // Update localStorage so next login is instant
          const updated = { ...user, accountType: profile.accountType, fullName: profile.fullName || user.fullName };
          localStorage.setItem("kibira_user", JSON.stringify(updated));
          router.replace(ROUTE_MAP[profile.accountType]);
        } else {
          setError("no_role");
        }
      } catch {
        setError("fetch_error");
      }
    };

    resolveAndRedirect();
  }, [user, loading, router, getToken]);

  // Error state — account type could not be determined
  if (error) {
    return (
      <div className="min-h-screen bg-[#f7faf6] flex items-center justify-center px-4">
        <div className="bg-white rounded-2xl border border-[#e5e7eb] shadow-sm p-8 max-w-md w-full text-center">
          <div className="text-4xl mb-4">🌿</div>
          <h1 className="text-xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)] mb-2">
            Account Setup Incomplete
          </h1>
          <p className="text-sm text-[#6b7c6b] font-[family-name:var(--font-body)] mb-6">
            We couldn&apos;t determine your account type. Please sign up with the correct role to access your personalized dashboard.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => { logout(); router.push("/signup"); }}
              className="w-full py-2.5 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white text-sm font-semibold transition-colors font-[family-name:var(--font-body)]"
            >
              Sign Up with a Role
            </button>
            <button
              onClick={() => { logout(); router.push("/login"); }}
              className="w-full py-2.5 rounded-xl border border-[#e5e7eb] text-[#6b7c6b] hover:bg-gray-50 text-sm font-[family-name:var(--font-body)] transition-colors"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state while resolving
  return (
    <div className="min-h-screen bg-[#f7faf6] flex items-center justify-center">
      <div className="flex items-center gap-3 text-[#2d6a4f]">
        <div className="w-6 h-6 border-2 border-[#2d6a4f] border-t-transparent rounded-full animate-spin" />
        <span className="font-[family-name:var(--font-body)] text-sm">Redirecting to your dashboard...</span>
      </div>
    </div>
  );
}
