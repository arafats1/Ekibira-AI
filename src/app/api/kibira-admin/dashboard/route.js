import { NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

function getToken(request) {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

export async function GET(request) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const res = await fetch(`${STRAPI_URL}/api/kibira/admin/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || data?.error || "Failed to load dashboard" },
        { status: res.status || 500 }
      );
    }
    return NextResponse.json({ data: data.data });
  } catch (err) {
    return NextResponse.json(
      { error: err.message || "Failed to load dashboard" },
      { status: 500 }
    );
  }
}
