import Link from "next/link";

export default function AdvisorTeaser() {
  return (
    <section id="demo" className="py-16 sm:py-24 px-4 sm:px-6 bg-[#f6faf7]">
      <div className="max-w-3xl mx-auto">
        <div className="text-center">
          <span className="text-[#2d6a4f] font-semibold text-xs sm:text-sm tracking-widest uppercase">Free for everyone</span>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-[#1a2e1a]">
            Ask <span className="text-[#2d6a4f]">Dr. Kibira AI</span>
          </h2>
          <p className="mt-3 text-[#4a5c4a] font-[family-name:var(--font-body)]">
            Ask what the weather means for your village, your crops, your animals or your children: what to expect this week and what to do about it. No sign-up needed.
          </p>
          <Link href="/advisor" className="inline-flex items-center gap-2 mt-6 bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold px-6 py-3 rounded-full transition-colors">
            Ask a question →
          </Link>
        </div>
        <div className="mt-10 bg-white rounded-2xl border border-[#e5e7eb] shadow-sm overflow-hidden text-left">
          <div className="bg-[#14532d] px-5 py-3 flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-[#4ade80]/20 flex items-center justify-center">🌿</span>
            <p className="text-white font-bold text-sm">Dr. Kibira AI</p>
          </div>
          <div className="p-5 space-y-3 text-sm">
            <div className="flex justify-end">
              <p className="bg-[#2d6a4f] text-white rounded-xl rounded-br-sm px-3 py-2 max-w-[80%]">It rained a lot this week in Kasese. Should I worry about my children?</p>
            </div>
            <div className="flex gap-2">
              <span className="w-7 h-7 rounded-full bg-[#2d6a4f]/10 flex items-center justify-center text-xs shrink-0">🌿</span>
              <p className="bg-[#f0fdf4] rounded-xl rounded-bl-sm px-3 py-2 text-[#1a2e1a] max-w-[85%]">
                After heavy rain, malaria and diarrhoea usually rise within 2–4 weeks. Let children sleep under a treated net, clear standing water, and boil drinking water. A child with fever should be tested the same day.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
