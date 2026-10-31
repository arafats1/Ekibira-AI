import Link from "next/link";
import Navbar from "./Navbar";
import Footer from "./Footer";

export const CONTACT_EMAIL = "arafats144@gmail.com";

/** Shared shell for the privacy policy and terms of use. */
export default function LegalPage({ eyebrow, title, updated, intro, sections }) {
  return (
    <div className="min-h-screen bg-[#f7faf6]">
      <Navbar />

      <main className="pt-24 sm:pt-32 pb-20">
        <div className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
          <header className="rounded-[2rem] border border-[#d6e7d6] bg-gradient-to-br from-[#f7fff5] via-[#f4fbf7] to-[#ecf7ef] px-6 sm:px-10 py-10 sm:py-12 mb-10">
            <span className="text-[#2d6a4f] font-semibold text-xs tracking-widest uppercase font-[family-name:var(--font-body)]">
              {eyebrow}
            </span>
            <h1 className="text-3xl sm:text-5xl font-bold text-[#1a2e1a] leading-tight mt-3 mb-4 font-[family-name:var(--font-display)]">
              {title}
            </h1>
            <p className="text-sm text-[#5d6f5d] font-[family-name:var(--font-body)]">Last updated: {updated}</p>
            <div className="text-[#3f513f] text-base sm:text-lg leading-relaxed mt-5 space-y-3 font-[family-name:var(--font-body)]">
              {intro}
            </div>
          </header>

          <div className="grid lg:grid-cols-[240px_1fr] gap-8 lg:gap-12">
            <nav className="hidden lg:block">
              <div className="sticky top-28 space-y-1 text-sm font-[family-name:var(--font-body)]">
                <p className="text-xs font-semibold uppercase tracking-widest text-[#6b7c6b] mb-3">On this page</p>
                {sections.map((s, i) => (
                  <a key={s.id} href={`#${s.id}`} className="block py-1 text-[#3f513f] hover:text-[#2d6a4f]">
                    {i + 1}. {s.title}
                  </a>
                ))}
              </div>
            </nav>

            <article className="min-w-0 space-y-10">
              {sections.map((s, i) => (
                <section key={s.id} id={s.id} className="scroll-mt-28">
                  <h2 className="text-xl sm:text-2xl font-bold text-[#1a2e1a] mb-3 font-[family-name:var(--font-display)]">
                    {i + 1}. {s.title}
                  </h2>
                  <div className="legal-body text-[#3f513f] leading-relaxed space-y-3 font-[family-name:var(--font-body)]">
                    {s.body}
                  </div>
                </section>
              ))}

              <div className="rounded-2xl border border-[#d6e7d6] bg-white p-5 sm:p-6 text-sm text-[#3f513f] font-[family-name:var(--font-body)]">
                Questions? Email{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="text-[#2d6a4f] font-semibold hover:underline">
                  {CONTACT_EMAIL}
                </a>
                . See also our{" "}
                <Link href="/privacy" className="text-[#2d6a4f] font-semibold hover:underline">Privacy Policy</Link> and{" "}
                <Link href="/terms" className="text-[#2d6a4f] font-semibold hover:underline">Terms of Use</Link>.
              </div>
            </article>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
