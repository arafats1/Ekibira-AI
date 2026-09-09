"use client";
import { createContext, useContext, useState, useEffect, useCallback } from "react";

const AuthContext = createContext(null);

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

function getAdminEmails() {
  return (process.env.NEXT_PUBLIC_KIBIRA_ADMIN_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email) {
  if (!email) return false;
  return getAdminEmails().includes(String(email).trim().toLowerCase());
}

async function fetchKibiraProfile(jwt, user) {
  let profile = null;
  try {
    const profileRes = await fetch(
      `${STRAPI_URL}/api/kibira-users?filters[user][$eq]=${user.id}`,
      { headers: { Authorization: `Bearer ${jwt}` } }
    );
    const profileData = await profileRes.json();
    if (profileData?.data?.length > 0) {
      profile = profileData.data[0];
    }
    if (!profile) {
      const profileByEmail = await fetch(
        `${STRAPI_URL}/api/kibira-users?filters[email][$eq]=${encodeURIComponent(user.email)}`,
        { headers: { Authorization: `Bearer ${jwt}` } }
      );
      const emailData = await profileByEmail.json();
      if (emailData?.data?.length > 0) {
        profile = emailData.data[0];
      }
    }
  } catch {
    // ignore
  }
  return profile;
}

async function ensureAdminProfile(jwt, user, profile) {
  const shouldBeAdmin = isAdminEmail(user.email);

  // Create missing kibira-user profile
  if (!profile) {
    try {
      const createRes = await fetch(`${STRAPI_URL}/api/kibira-users`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({
          data: {
            fullName: user.username || user.email,
            email: user.email,
            user: user.id,
            role: shouldBeAdmin ? "admin" : "user",
            accountType: "general",
          },
        }),
      });
      if (createRes.ok) {
        const created = await createRes.json();
        profile = created?.data || null;
      }
    } catch {
      // ignore
    }
  }

  // Promote existing profile if email is in admin list
  if (profile && shouldBeAdmin && profile.role !== "admin") {
    try {
      const id = profile.documentId || profile.id;
      const updateRes = await fetch(`${STRAPI_URL}/api/kibira-users/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`,
        },
        body: JSON.stringify({ data: { role: "admin" } }),
      });
      if (updateRes.ok) {
        const updated = await updateRes.json();
        profile = updated?.data || { ...profile, role: "admin" };
      } else {
        profile = { ...profile, role: "admin" };
      }
    } catch {
      profile = { ...profile, role: "admin" };
    }
  }

  // Client-side override if env list says admin (even if API update failed)
  if (shouldBeAdmin && profile) {
    profile = { ...profile, role: "admin" };
  }

  return profile;
}

function buildUserData(strapiUser, profile, prevAccountType) {
  let accountType = profile?.accountType || "general";
  if (accountType === "general" && prevAccountType && prevAccountType !== "general") {
    accountType = prevAccountType;
  }

  const role =
    profile?.role === "admin" || isAdminEmail(strapiUser.email) ? "admin" : profile?.role || "user";

  return {
    id: strapiUser.id,
    username: strapiUser.username,
    email: strapiUser.email,
    fullName: profile?.fullName || strapiUser.username,
    phone: profile?.phone || "",
    company: profile?.company || "",
    position: profile?.position || "",
    accountType,
    location: profile?.location || "",
    role,
    profileId: profile?.id || null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage, then refresh role from Strapi / admin email list
  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      try {
        const stored = localStorage.getItem("kibira_user");
        const token = localStorage.getItem("kibira_token");
        if (!stored || !token) return;

        let userData = JSON.parse(stored);

        // Immediate client-side admin recognition so UI updates without waiting
        if (isAdminEmail(userData.email) && userData.role !== "admin") {
          userData = { ...userData, role: "admin" };
          localStorage.setItem("kibira_user", JSON.stringify(userData));
        }
        if (!cancelled) setUser(userData);

        // Refresh profile from backend
        try {
          const meRes = await fetch(`${STRAPI_URL}/api/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (!meRes.ok) return;
          const me = await meRes.json();
          let profile = await fetchKibiraProfile(token, me);
          profile = await ensureAdminProfile(token, me, profile);
          const refreshed = buildUserData(me, profile, userData.accountType);
          localStorage.setItem("kibira_user", JSON.stringify(refreshed));
          if (!cancelled) setUser(refreshed);
        } catch {
          // keep local user
        }
      } catch {
        localStorage.removeItem("kibira_user");
        localStorage.removeItem("kibira_token");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const register = useCallback(async ({ username, email, password, fullName, phone, company, position, accountType }) => {
    const res = await fetch(`${STRAPI_URL}/api/auth/local/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data?.error?.message || "Registration failed");
    }

    const shouldBeAdmin = isAdminEmail(email);
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
          role: shouldBeAdmin ? "admin" : "user",
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
      location: profileData?.data?.location || "",
      role: shouldBeAdmin ? "admin" : profileData?.data?.role || "user",
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

    let profile = await fetchKibiraProfile(data.jwt, data.user);
    profile = await ensureAdminProfile(data.jwt, data.user, profile);

    let prevAccountType = null;
    try {
      const stored = localStorage.getItem("kibira_user");
      if (stored) {
        const prev = JSON.parse(stored);
        if (prev.email === data.user.email) prevAccountType = prev.accountType;
      }
    } catch { /* ignore */ }

    const userData = buildUserData(data.user, profile, prevAccountType);

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
