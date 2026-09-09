import { NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

function getToken(request) {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get("year");
    const qs = year ? `?year=${encodeURIComponent(year)}` : "";
    const res = await fetch(`${STRAPI_URL}/api/kibira/pricing${qs}`, {
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || "Failed to load pricing" },
        { status: res.status || 500 }
      );
    }
    return NextResponse.json({ data: data.data || [] });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to load pricing" }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const res = await fetch(`${STRAPI_URL}/api/kibira/pricing`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || data?.error || "Failed to save pricing" },
        { status: res.status || 500 }
      );
    }
    return NextResponse.json({ data: data.data });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to save pricing" }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const res = await fetch(`${STRAPI_URL}/api/kibira/pricing/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      return NextResponse.json(
        { error: data?.error?.message || data?.error || "Failed to delete pricing" },
        { status: res.status || 500 }
      );
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message || "Failed to delete pricing" }, { status: 500 });
  }
}
