"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const THEMES = {
  rose: {
    bar: "bg-[#4a1c2a]/95 border-white/10",
    title: "text-rose-300",
    panel: "bg-[#4a1c2a] border-white/10",
    link: "text-white/80 hover:text-white hover:bg-white/10",
    cta: "bg-rose-500 hover:bg-rose-600 text-white",
    burger: "text-white border-white/20 hover:bg-white/10",
  },
  sky: {
    bar: "bg-[#0c2d48]/95 border-white/10",
    title: "text-sky-300",
    panel: "bg-[#0c2d48] border-white/10",
    link: "text-white/80 hover:text-white hover:bg-white/10",
    cta: "bg-sky-500 hover:bg-sky-600 text-white",
    burger: "text-white border-white/20 hover:bg-white/10",
  },
};

export default function EarlyWarningNav({ title, theme = "rose", links = [] }) {
  const [open, setOpen] = useState(false);
  const t = THEMES[theme] || THEMES.rose;

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b ${t.bar}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 shrink-0" onClick={() => setOpen(false)}>
            <span className="text-xl sm:text-2xl">🌿</span>
            <span className="font-[family-name:var(--font-display)] text-lg sm:text-xl font-bold text-white tracking-tight">
              KibiraAI
            </span>
          </Link>
          <span className="text-white/30 hidden sm:inline shrink-0">|</span>
          <span
            className={`${t.title} text-xs sm:text-sm font-semibold font-[family-name:var(--font-body)] truncate`}
          >
            {title}
          </span>
        </div>

        <div className="hidden md:flex items-center gap-4 lg:gap-5 text-sm font-medium text-white/70 shrink-0">
          {links.map((link) =>
            link.cta ? (
              <Link
                key={link.href + link.label}
                href={link.href}
                className={`${t.cta} px-4 py-2 rounded-full transition-colors font-semibold text-sm whitespace-nowrap`}
              >
                {link.label}
              </Link>
            ) : (
              <Link
                key={link.href + link.label}
                href={link.href}
                className="hover:text-white transition-colors whitespace-nowrap"
              >
                {link.label}
              </Link>
            )
          )}
        </div>

        <button
          type="button"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`md:hidden inline-flex items-center justify-center w-10 h-10 rounded-xl border shrink-0 ${t.burger}`}
        >
          {open ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>

      {open && (
        <>
          <button
            type="button"
            aria-label="Close menu overlay"
            className="md:hidden fixed inset-0 top-[57px] bg-black/40"
            onClick={() => setOpen(false)}
          />
          <div
            className={`md:hidden absolute left-0 right-0 top-full border-b shadow-xl ${t.panel}`}
          >
            <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col gap-1">
              {links.map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-semibold font-[family-name:var(--font-body)] transition-colors ${
                    link.cta ? t.cta + " text-center" : t.link
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className={`px-4 py-3 rounded-xl text-sm font-semibold font-[family-name:var(--font-body)] transition-colors ${t.link}`}
              >
                Home
              </Link>
            </div>
          </div>
        </>
      )}
    </nav>
  );
}
