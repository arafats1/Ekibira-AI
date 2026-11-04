const RISKS = [
  { icon: "🦟", title: "Malaria", text: "Rises 2–4 weeks after wet, warm spells." },
  { icon: "💧", title: "Diarrhoea & cholera", text: "Follows heavy rain, floods and heat." },
  { icon: "🫁", title: "Pneumonia & coughs", text: "Smoke, dust and cold, damp nights." },
  { icon: "🌡️", title: "Heat illness", text: "Hot, humid days hit small children first." },
];

export default function ChildrenTeaser() {
  return (
    <section className="py-16 sm:py-24 bg-gradient-to-b from-[#fff5f5] to-[#f6faf7]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto">
          <p className="text-sm font-semibold uppercase tracking-wider text-rose-600">Children&apos;s early warning</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-[#1a2e1a]">Warn parents before children fall sick</h2>
          <p className="mt-3 text-[#4a5c4a] font-[family-name:var(--font-body)]">
            The weather tells us when childhood illnesses are about to rise. KibiraAI scores the coming week for each district and the team can alert parents who signed up, including when health officials confirm an outbreak.
          </p>
        </div>
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {RISKS.map((r) => (
            <div key={r.title} className="bg-white rounded-2xl border border-rose-100 p-5 shadow-sm text-center">
              <span className="text-4xl">{r.icon}</span>
              <p className="mt-2 font-bold text-[#1a2e1a]">{r.title}</p>
              <p className="text-sm text-[#4a5c4a] mt-1">{r.text}</p>
            </div>
          ))}
        </div>
        <p className="text-center mt-8">
          <a href="/childrens-early-warning" className="inline-block bg-rose-600 hover:bg-rose-700 text-white font-semibold px-6 py-3 rounded-full transition-colors">
            See the risk for your district →
          </a>
        </p>
      </div>
    </section>
  );
}
