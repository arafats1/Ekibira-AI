const POINTS = [
  { icon: "📵", title: "Warnings stop at the tarmac", text: "Radio and national bulletins rarely reach hillside villages, fishing landings or grazing land, and many people have a basic phone, not a smartphone." },
  { icon: "🗣️", title: "Not in their language", text: "A warning in English that says “heavy rainfall expected” does not tell a farmer in Kisoro what to do tonight." },
  { icon: "⛰️", title: "Small places, big risks", text: "Landslides on Kigezi and Elgon slopes, floods in the Rwenzori valleys, dry spells in Ankole: each hits a few villages, too local for national maps." },
  { icon: "🦟", title: "Disease follows the weather", text: "Malaria, diarrhoea and crop and animal disease rise weeks after heavy rain or heat, and children under five are hit hardest." },
];

export default function Problem() {
  return (
    <section id="problem" className="py-16 sm:py-24 bg-[#f6faf7]">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-wider text-[#2d6a4f]">The problem</p>
          <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-[#1a2e1a] max-w-3xl mx-auto">The people most at risk hear about danger last</h2>
        </div>
        <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {POINTS.map((p) => (
            <div key={p.title} className="bg-white rounded-2xl border border-[#e5e7eb] p-5 hover:shadow-md transition-shadow">
              <span className="text-3xl">{p.icon}</span>
              <h3 className="mt-3 font-bold text-[#1a2e1a]">{p.title}</h3>
              <p className="mt-1 text-sm text-[#4a5c4a] leading-relaxed font-[family-name:var(--font-body)]">{p.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
