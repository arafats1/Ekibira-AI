import { NextResponse } from "next/server";
import OpenAI from "openai";
import { LANGUAGES } from "@/lib/ews/regions";
import { smsSegments, FOOTER_SAMPLE } from "@/lib/ews/messages";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

async function isLoggedIn(request) {
  const auth = request.headers.get("authorization");
  if (!auth) return false;
  const res = await fetch(`${STRAPI_URL}/api/users/me`, { headers: { Authorization: auth } }).catch(() => null);
  return Boolean(res?.ok);
}

/**
 * POST /api/ews/translate { text, language }
 * AI draft only: a native speaker must check it before it is sent.
 */
export async function POST(request) {
  if (!(await isLoggedIn(request))) {
    return NextResponse.json({ error: "Login required" }, { status: 401 });
  }

  const { text, language } = await request.json().catch(() => ({}));
  const lang = LANGUAGES.find((l) => l.key === language && l.key !== "en");
  if (!text?.trim() || !lang) {
    return NextResponse.json({ error: "text and a non-English language are required" }, { status: 400 });
  }

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      temperature: 0.2,
      messages: [
        {
          role: "system",
          content:
            `Translate an early warning SMS from English into ${lang.label} as spoken in rural Uganda. ` +
            "Use short, everyday words a farmer with little schooling understands. Keep the meaning and every action exact; " +
            "do not add advice. Keep district names, numbers and the opening label's meaning (WARNING, BE READY, NOTICE). " +
            "Plain text only, no emoji, no quotes. Stay under 200 characters if at all possible. Reply with the translation only.",
        },
        { role: "user", content: text.trim() },
      ],
    });
    const translation = completion.choices?.[0]?.message?.content?.trim() || "";
    return NextResponse.json({
      language: lang.key,
      translation,
      needsReview: true,
      sms: smsSegments(translation + FOOTER_SAMPLE),
    });
  } catch (err) {
    return NextResponse.json({ error: `Translation failed: ${err.message}` }, { status: 502 });
  }
}
