import { NextResponse } from "next/server";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

function getToken(request) {
  const auth = request.headers.get("authorization");
  if (!auth || !auth.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

async function getUser(token) {
  const res = await fetch(`${STRAPI_URL}/api/users/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return null;
  return res.json();
}

// GET — load all chats for the logged-in farmer
export async function GET(request) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUser(token);
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const res = await fetch(
      `${STRAPI_URL}/api/farmer-chats?filters[userId][$eq]=${user.id}&sort=lastMessageAt:desc&pagination[limit]=50`,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!res.ok) {
      return NextResponse.json({ chats: [] });
    }

    const data = await res.json();
    const chats = (data.data || []).map((c) => ({
      id: c.id,
      documentId: c.documentId,
      title: c.title || "Chat",
      messages: c.messages || [],
      lastMessageAt: c.lastMessageAt,
    }));

    return NextResponse.json({ chats });
  } catch (error) {
    console.error("Load chats error:", error);
    return NextResponse.json({ error: "Failed to load chats" }, { status: 500 });
  }
}

// POST — save or update a chat
export async function POST(request) {
  try {
    const token = getToken(request);
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const user = await getUser(token);
    if (!user) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

    const { chatId, messages, title } = await request.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: "Messages required" }, { status: 400 });
    }

    const safeTitle = title
      ? String(title).slice(0, 100)
      : String(messages.find((m) => m.role === "user")?.content || "Chat").slice(0, 80);
    const now = new Date().toISOString();

    if (chatId) {
      // Update existing chat
      const res = await fetch(`${STRAPI_URL}/api/farmer-chats/${chatId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ data: { messages, title: safeTitle, lastMessageAt: now } }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("Update chat error:", err);
        return NextResponse.json({ error: "Failed to update chat" }, { status: 500 });
      }

      const updated = await res.json();
      return NextResponse.json({
        chatId: updated.data?.documentId || chatId,
        title: safeTitle,
      });
    } else {
      // Create new chat
      const res = await fetch(`${STRAPI_URL}/api/farmer-chats`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          data: {
            userId: user.id,
            messages,
            title: safeTitle,
            lastMessageAt: now,
          },
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        console.error("Create chat error:", err);
        return NextResponse.json({ error: "Failed to save chat" }, { status: 500 });
      }

      const created = await res.json();
      return NextResponse.json({
        chatId: created.data?.documentId,
        title: safeTitle,
      });
    }
  } catch (error) {
    console.error("Save chat error:", error);
    return NextResponse.json({ error: "Failed to save chat" }, { status: 500 });
  }
}
