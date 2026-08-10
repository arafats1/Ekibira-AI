"use client";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getDashboardRoute, SIGNUP_ACCOUNT_TYPES } from "../../lib/dashboardRoutes";

const solutionLinks = [
  {
    href: "/problem",
    label: "The Problem",
    description: "Why forests, cities, and children need climate foresight",
  },
  {
    href: "/solution",
    label: "Our Solution",
    description: "How KibiraAI turns climate data into protection",
  },
];

/** Public systems only — Forest Sentinel is forestry-account access, not listed here */
const systemLinks = [
  {
    href: "/childrens-early-warning",
    label: "Children's Early Warning",
    description: "Live risk dashboards for schools and clinics",
    accent: "bg-rose-500",
  },
  {
    href: "/urban-warning",
    label: "Urban Warning",
    description: "Hyperlocal flood and heat prediction",
    accent: "bg-blue-500",
  },
  {
    href: "/advisor",
    label: "Dr. Kibira AI",
    description: "AI climate research assistant",
  },
];

const useCaseLinks = SIGNUP_ACCOUNT_TYPES.map((t) => ({
  href: `/signup?type=${t.id}`,
  label: t.navLabel,
  description: t.desc,
  accent: t.id === "farmer" ? "bg-amber-500" : t.id === "forestry" ? "bg-emerald-500" : "bg-rose-500",
}));

function Chevron({ open }) {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      aria-hidden
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function DropdownMenu({ id, label, items, open, onOpen, onClose, align = "center", buttonClassName }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, onClose]);

  const panelAlign =
    align === "right"
      ? "right-0 left-auto translate-x-0"
      : "left-1/2 -translate-x-1/2";

  return (
    <div
      ref={ref}
      className="relative"
      onMouseEnter={onOpen}
      onMouseLeave={onClose}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={id}
        onClick={() => (open ? onClose() : onOpen())}
        className={
          buttonClassName ||
          "inline-flex items-center gap-1.5 h-10 px-3 whitespace-nowrap text-base font-semibold text-[#1a2e1a]/85 hover:text-[#2d6a4f] transition-colors"
        }
      >
        {label}
        <Chevron open={open} />
      </button>

      <div
        id={id}
        role="menu"
        className={`absolute top-full ${panelAlign} pt-2 transition-all duration-150 ${
          open ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-1 pointer-events-none"
        }`}
      >
        <div className="min-w-[20rem] rounded-2xl border border-[#dce9dc] bg-white shadow-xl shadow-[#1a2e1a]/8 p-2">
          {items.map((item) =>
            item.onClick ? (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => {
                  onClose();
                  item.onClick();
                }}
                className="w-full text-left flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-[#f3f8f3] transition-colors"
              >
                <span className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-red-400" aria-hidden />
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-red-700 leading-snug">
                    {item.label}
                  </span>
                </span>
              </button>
            ) : (
              <a
                key={item.href}
                href={item.href}
                role="menuitem"
                onClick={onClose}
                className="flex items-start gap-3 rounded-xl px-3 py-3 hover:bg-[#f3f8f3] transition-colors"
              >
                {item.accent ? (
                  <span className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${item.accent}`} aria-hidden />
                ) : (
                  <span className="mt-1.5 w-2 h-2 rounded-full shrink-0 bg-[#2d6a4f]/25" aria-hidden />
                )}
                <span className="min-w-0">
                  <span className="block text-[15px] font-semibold text-[#1a2e1a] leading-snug">
                    {item.label}
                  </span>
                  {item.description && (
                    <span className="block text-sm text-[#5d6f5d] mt-0.5 leading-snug">
                      {item.description}
                    </span>
                  )}
                </span>
              </a>
            )
          )}
        </div>
      </div>
    </div>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [desktopMenu, setDesktopMenu] = useState(null);
  const [mobileSection, setMobileSection] = useState(null);
  const { user, logout } = useAuth();
  const router = useRouter();
  const isAdmin = user && user.role === "admin";
  const dashboardHref = user ? getDashboardRoute(user.accountType) : "/dashboard";

  const handleSignOut = () => {
    logout();
    setOpen(false);
    setDesktopMenu(null);
    router.push("/");
  };

  const accountMenuItems = [
    {
      href: dashboardHref,
      label: "Dashboard",
      description: "Open your role workspace",
      accent: "bg-[#2d6a4f]",
    },
    {
      label: "Sign out",
      onClick: handleSignOut,
    },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-md border-b border-[#2d6a4f]/10">
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2 shrink-0 z-10">
          <span className="text-2xl leading-none" aria-hidden>
            🌿
          </span>
          <span className="font-[family-name:var(--font-display)] text-xl sm:text-2xl font-bold text-[#1b4332] tracking-tight leading-none">
            KibiraAI
          </span>
        </a>

        <div className="hidden lg:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 items-center gap-1">
          <DropdownMenu
            id="our-solution-menu"
            label="Our Solution"
            items={solutionLinks}
            open={desktopMenu === "solution"}
            onOpen={() => setDesktopMenu("solution")}
            onClose={() => setDesktopMenu(null)}
          />
          <DropdownMenu
            id="our-systems-menu"
            label="Our Systems"
            items={systemLinks}
            open={desktopMenu === "systems"}
            onOpen={() => setDesktopMenu("systems")}
            onClose={() => setDesktopMenu(null)}
          />
          <DropdownMenu
            id="use-cases-menu"
            label="Use Cases"
            items={useCaseLinks}
            open={desktopMenu === "useCases"}
            onOpen={() => setDesktopMenu("useCases")}
            onClose={() => setDesktopMenu(null)}
          />
          <a
            href="/plant-a-tree"
            className="inline-flex items-center h-10 px-3 whitespace-nowrap text-base font-semibold text-[#1a2e1a]/85 hover:text-[#2d6a4f] transition-colors"
          >
            Plant a Tree
          </a>
        </div>

        <div className="hidden lg:flex items-center gap-2 shrink-0 z-10">
          {user ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="inline-flex items-center gap-1.5 h-10 px-3 whitespace-nowrap text-base font-semibold text-[#d97706] hover:text-[#b45309] transition-colors"
                >
                  Admin
                </Link>
              )}
              <DropdownMenu
                id="account-menu"
                label={
                  <>
                    <span className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center text-[10px] leading-none shrink-0">
                      {user.fullName?.charAt(0)?.toUpperCase() || "U"}
                    </span>
                    Dashboard
                  </>
                }
                items={accountMenuItems}
                open={desktopMenu === "account"}
                onOpen={() => setDesktopMenu("account")}
                onClose={() => setDesktopMenu(null)}
                align="right"
                buttonClassName="inline-flex items-center gap-2 h-10 bg-[#2d6a4f] text-white px-5 rounded-full hover:bg-[#1b4332] transition-colors text-base font-semibold whitespace-nowrap"
              />
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center h-10 px-3 whitespace-nowrap text-base font-semibold text-[#2d6a4f] hover:text-[#1b4332] transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center h-10 bg-[#2d6a4f] text-white px-5 rounded-full hover:bg-[#1b4332] transition-colors text-base font-semibold whitespace-nowrap"
              >
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          className="lg:hidden p-2 ml-auto"
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

      {open && (
        <div className="lg:hidden bg-white/95 backdrop-blur-md border-t border-[#eef2e6] px-4 sm:px-6 py-3 flex flex-col text-base font-medium">
          <button
            type="button"
            onClick={() => setMobileSection(mobileSection === "solution" ? null : "solution")}
            className="flex items-center justify-between py-3 border-b border-[#eef2e6] font-semibold text-[#1a2e1a]"
          >
            Our Solution
            <Chevron open={mobileSection === "solution"} />
          </button>
          {mobileSection === "solution" &&
            solutionLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="pl-3 py-3 border-b border-[#eef2e6] hover:text-[#2d6a4f] flex items-start gap-2"
              >
                <span>
                  <span className="block font-semibold">{link.label}</span>
                  <span className="block text-sm text-[#5d6f5d] mt-0.5">{link.description}</span>
                </span>
              </a>
            ))}

          <button
            type="button"
            onClick={() => setMobileSection(mobileSection === "systems" ? null : "systems")}
            className="flex items-center justify-between py-3 border-b border-[#eef2e6] font-semibold text-[#1a2e1a]"
          >
            Our Systems
            <Chevron open={mobileSection === "systems"} />
          </button>
          {mobileSection === "systems" &&
            systemLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="pl-3 py-3 border-b border-[#eef2e6] hover:text-[#2d6a4f] flex items-start gap-2"
              >
                {link.accent && (
                  <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${link.accent}`} aria-hidden />
                )}
                <span>
                  <span className="block font-semibold">{link.label}</span>
                  <span className="block text-sm text-[#5d6f5d] mt-0.5">{link.description}</span>
                </span>
              </a>
            ))}

          <button
            type="button"
            onClick={() => setMobileSection(mobileSection === "useCases" ? null : "useCases")}
            className="flex items-center justify-between py-3 border-b border-[#eef2e6] font-semibold text-[#1a2e1a]"
          >
            Use Cases
            <Chevron open={mobileSection === "useCases"} />
          </button>
          {mobileSection === "useCases" &&
            useCaseLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="pl-3 py-3 border-b border-[#eef2e6] hover:text-[#2d6a4f] flex items-start gap-2"
              >
                <span className={`mt-1.5 w-1.5 h-1.5 rounded-full shrink-0 ${link.accent}`} aria-hidden />
                <span>
                  <span className="block font-semibold">{link.label}</span>
                  <span className="block text-sm text-[#5d6f5d] mt-0.5">{link.description}</span>
                </span>
              </a>
            ))}

          <a
            href="/plant-a-tree"
            onClick={() => setOpen(false)}
            className="hover:text-[#2d6a4f] py-3 border-b border-[#eef2e6] font-semibold text-[#1a2e1a]"
          >
            Plant a Tree
          </a>

          {user ? (
            <>
              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="hover:text-[#d97706] py-3 border-b border-[#eef2e6] flex items-center gap-2 text-[#d97706] font-semibold"
                >
                  Admin Dashboard
                </Link>
              )}
              <Link
                href={dashboardHref}
                onClick={() => setOpen(false)}
                className="bg-[#2d6a4f] text-white px-5 py-3 rounded-full text-center hover:bg-[#1b4332] transition-colors font-semibold mt-3"
              >
                Dashboard
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="mt-2 py-3 text-center text-red-600 font-semibold border border-red-100 rounded-full hover:bg-red-50"
              >
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="hover:text-[#2d6a4f] py-3 border-b border-[#eef2e6] font-semibold text-[#2d6a4f]"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                onClick={() => setOpen(false)}
                className="bg-[#2d6a4f] text-white px-5 py-3 rounded-full text-center hover:bg-[#1b4332] transition-colors font-semibold mt-3"
              >
                Get Started
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
}
