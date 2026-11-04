"use client";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || "http://localhost:1337";

const TOPICS = [
  { key: "partnership", label: "Using KibiraAI for my organisation" },
  { key: "children", label: "Access to the full children's dashboard" },
  { key: "outside_area", label: "Early warnings outside the covered districts" },
  { key: "other", label: "Something else" },
];

const inputCls =
  "w-full px-4 py-2.5 rounded-xl border border-[#d1d5db] focus:border-[#2d6a4f] focus:ring-2 focus:ring-[#2d6a4f]/15 outline-none text-sm font-[family-name:var(--font-body)] bg-white";
const labelCls = "block text-sm font-medium text-[#1a2e1a] mb-1 font-[family-name:var(--font-body)]";

function ContactForm() {
  const params = useSearchParams();
  const initial = TOPICS.some((t) => t.key === params.get("topic")) ? params.get("topic") : "partnership";
  const [form, setForm] = useState({ topic: initial, name: "", organisation: "", email: "", phone: "", message: "", website: "" });
  const [state, setState] = useState("idle");
  const [error, setError] = useState("");
  const set = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.message.trim()) return setError("Please add your name and a message.");
    if (!form.email.trim() && !form.phone.trim()) return setError("Please add an email or a phone number so we can reply.");
    setState("sending");
    try {
      const res = await fetch(`${STRAPI_URL}/api/ews/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error?.message || "Your message could not be sent.");
      setState("sent");
    } catch (err) {
      setError(err.message);
      setState("idle");
    }
  };

  if (state === "sent") {
    return (
      <div className="text-center py-8">
        <div className="text-5xl mb-3">✉️</div>
        <h2 className="text-xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Thank you, we got your message</h2>
        <p className="text-sm text-[#4a5c4a] mt-2 font-[family-name:var(--font-body)]">The KibiraAI team will reach out to talk about how you would like to use the platform.</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>}
      <div>
        <label className={labelCls}>What is it about?</label>
        <select name="topic" value={form.topic} onChange={set} className={inputCls}>
          {TOPICS.map((t) => (
            <option key={t.key} value={t.key}>{t.label}</option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Your name <span className="text-red-500">*</span></label>
          <input name="name" value={form.name} onChange={set} className={inputCls} required />
        </div>
        <div>
          <label className={labelCls}>Organisation</label>
          <input name="organisation" value={form.organisation} onChange={set} placeholder="School, NGO, district office…" className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Email</label>
          <input type="email" name="email" value={form.email} onChange={set} className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Phone</label>
          <input type="tel" name="phone" value={form.phone} onChange={set} placeholder="0772 123 456" className={inputCls} />
        </div>
      </div>
      <div>
        <label className={labelCls}>How would you like to use KibiraAI? <span className="text-red-500">*</span></label>
        <textarea name="message" value={form.message} onChange={set} rows={5} className={inputCls} placeholder="Who you work with, where, and what warnings or data would help." required />
      </div>
      {/* Hidden from people; bots fill it in. */}
      <input name="website" value={form.website} onChange={set} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <button type="submit" disabled={state === "sending"} className="w-full py-3 rounded-xl bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold text-sm transition-colors disabled:opacity-50">
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f6faf7] pt-28 pb-16 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">Get in touch</h1>
          <p className="text-[#4a5c4a] mt-3 mb-8 font-[family-name:var(--font-body)]">
            Community members and agents in our districts can sign up directly. For anything else (organisations, schools, health facilities, local government, places outside our districts, or the full children&apos;s dashboard) tell us what you need and we will reach out.
          </p>
          <div className="bg-white rounded-2xl border border-[#e5e7eb] p-6 sm:p-8 shadow-sm">
            <Suspense>
              <ContactForm />
            </Suspense>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
