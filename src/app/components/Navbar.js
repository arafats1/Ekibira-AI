"use client";
import { useState } from "react";

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#2d6a4f]/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <span className="text-2xl sm:text-3xl">🌿</span>
          <span className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold text-[#1b4332] tracking-tight">
            KibiraAI
          </span>
        </a>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-8 text-sm font-medium text-[#1a2e1a]/80">
          <a href="/problem" className="hover:text-[#2d6a4f] transition-colors">The Problem</a>
          <a href="/solution" className="hover:text-[#2d6a4f] transition-colors">Solution</a>
          <a href="/advisor" className="hover:text-[#2d6a4f] transition-colors">Try Advisor</a>
          <a href="/urban-warning" className="hover:text-[#2d6a4f] transition-colors flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Urban Warning
          </a>
          <a href="/#impact" className="hover:text-[#2d6a4f] transition-colors">Impact</a>
          <a
            href="#support"
            className="bg-[#2d6a4f] text-white px-5 py-2.5 rounded-full hover:bg-[#1b4332] transition-colors font-semibold"
          >
            Support This Initiative
          </a>
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden p-2"
          onClick={() => setOpen(!open)}
          aria-label="Toggle menu"
        >
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            {open ? (
              <path d="M6 6l12 12M6 18L18 6" />
            ) : (
              <path d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile nav */}
      {open && (
        <div className="md:hidden bg-white/95 backdrop-blur-md border-t border-[#eef2e6] px-4 sm:px-6 py-3 flex flex-col gap-1 text-sm font-medium">
          <a href="/problem" onClick={() => setOpen(false)} className="hover:text-[#2d6a4f] py-3 border-b border-[#eef2e6]">The Problem</a>
          <a href="/solution" onClick={() => setOpen(false)} className="hover:text-[#2d6a4f] py-3 border-b border-[#eef2e6]">Solution</a>
          <a href="/advisor" onClick={() => setOpen(false)} className="hover:text-[#2d6a4f] py-3 border-b border-[#eef2e6]">Try Advisor</a>
          <a href="/urban-warning" onClick={() => setOpen(false)} className="hover:text-[#2d6a4f] py-3 border-b border-[#eef2e6] flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
            Urban Warning
          </a>
          <a href="/#impact" onClick={() => setOpen(false)} className="hover:text-[#2d6a4f] py-3 border-b border-[#eef2e6]">Impact</a>
          <a
            href="#support"
            onClick={() => setOpen(false)}
            className="bg-[#2d6a4f] text-white px-5 py-3 rounded-full text-center hover:bg-[#1b4332] transition-colors font-semibold mt-2"
          >
            Support This Initiative
          </a>
        </div>
      )}
    </nav>
  );
}
