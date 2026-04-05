"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("kibira_user");
      const token = localStorage.getItem("kibira_token");
      if (stored && token) {
        setUser(JSON.parse(stored));
      }
    } catch {
      localStorage.removeItem("kibira_user");
      localStorage.removeItem("kibira_token");
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async ({ username, email, password, fullName, phone, company, position, accountType }) => {
    // Step 1: Register with Strapi users-permissions
    const res = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || "Registration failed");
    }

    // Step 2: Create kibira-user profile with extra fields
    const profileRes = await fetch(`${STRAPI_URL}/api/kibira-users`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${data.jwt}`,
      },
      body: JSON.stringify({
        data: {
          fullName,
          email,
          phone,
          company,
          position,
          accountType: accountType || "general",
          user: data.user.id,
        },
      }),
    });

    const profileData = await profileRes.json();
    const userData = {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      fullName,
      phone,
      company,
      position,
      accountType: profileData?.data?.accountType || accountType || "general",
      role: profileData?.data?.role || "user",
      profileId: profileData?.data?.id || null,
    };

    localStorage.setItem("kibira_token", data.jwt);
    localStorage.setItem("kibira_user", JSON.stringify(userData));
    setUser(userData);

    return userData;
  }, []);

  const login = useCallback(async ({ identifier, password }) => {
    const res = await fetch(`${STRAPI_URL}/api/auth/local`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || "Login failed");
    }

    // Fetch kibira-user profile
    let profile = null;
    try {
      const profileRes = await fetch(
        `${STRAPI_URL}/api/kibira-users?filters[user][$eq]=${data.user.id}`,
        { headers: { Authorization: `Bearer ${data.jwt}` } }
      );
      const profileData = await profileRes.json();
      if (profileData?.data?.length > 0) {
        profile = profileData.data[0];
      }
      // Fallback: try matching by email if user filter didn't return results
      if (!profile) {
        const profileByEmail = await fetch(
          `${STRAPI_URL}/api/kibira-users?filters[email][$eq]=${encodeURIComponent(data.user.email)}`,
          { headers: { Authorization: `Bearer ${data.jwt}` } }
        );
        const emailData = await profileByEmail.json();
        if (emailData?.data?.length > 0) {
          profile = emailData.data[0];
        }
      }
    } catch {
      // Profile fetch failed, continue with basic user data
    }

    // Determine accountType with fallbacks
    let accountType = profile?.accountType || "general";
    // If profile didn't return accountType, check if it was stored previously
    if (accountType === "general") {
      try {
        const stored = localStorage.getItem("kibira_user");
        if (stored) {
          const prev = JSON.parse(stored);
          if (prev.email === data.user.email && prev.accountType && prev.accountType !== "general") {
            accountType = prev.accountType;
          }
        }
      } catch { /* ignore */ }
    }

    const userData = {
      id: data.user.id,
      username: data.user.username,
      email: data.user.email,
      fullName: profile?.fullName || data.user.username,
      phone: profile?.phone || "",
      company: profile?.company || "",
      position: profile?.position || "",
      accountType,
      role: profile?.role || "user",
      profileId: profile?.id || null,
    };

    localStorage.setItem("kibira_token", data.jwt);
    localStorage.setItem("kibira_user", JSON.stringify(userData));
    setUser(userData);

    return userData;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("kibira_token");
    localStorage.removeItem("kibira_user");
    setUser(null);
  }, []);

  const getToken = useCallback(() => {
    return localStorage.getItem("kibira_token");
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
