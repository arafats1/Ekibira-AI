import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function SolutionPage() {
  const reforestationServices = [
    {
      title: "Deforestation Risk Mapping",
      description: "AI-powered analysis of satellite imagery and land-use patterns identifies at-risk areas before trees are lost, allowing for targeted intervention.",
      icon: "📊"
    },
    {
      title: "Native Species Optimization",
      description: "We generate planting strategies using indigenous species suited to local soil and rainfall, increasing survival rates by up to 40% compared to monocultures.",
      icon: "🌳"
    },
    {
      title: "Carbon Verification Ecosystem",
      description: "Science-backed tracking of biomass growth translates into verifiable carbon credits, creating direct revenue streams for forest-dependent communities.",
      icon: "💰"
    }
  ];

  const urbanResilienceServices = [
    {
      title: "Heat Stress Mitigation",
      description: "Our AI maps 'Urban Heat Islands' and provides digital roadmaps for cooling corridors, recommending native species placement to reduce neighborhood heat by up to 5°C.",
      icon: "🌡️"
    },
    {
      title: "Early Warning Flood Analytics",
      description: "By processing topography and soil moisture data, we provide early warnings to dense informal settlements, giving families time to respond before flooding occurs.",
      icon: "🌊"
    },
    {
      title: "Urban Garden Advisory",
      description: "Innovation for food insecurity: Digital technical support for vertical and rooftop farming, optimizing yield in limited urban spaces.",
      icon: "🥬"
    },
    {
      title: "Smart Water Monitoring",
      description: "Addressing water scarcity through digital leakage detection and smart distribution patterns, ensuring reliable access to clean water in growing cities.",
      icon: "💧"
    }
  ];

  return (
    <div className="min-h-screen bg-[#fafcf7]">
      <Navbar />

      {/* Main Content */}
      <main className="pt-24 sm:pt-32 pb-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Hero Header */}
          <div className="text-center mb-16 sm:mb-24">
            <span className="inline-block text-[#2d6a4f] font-semibold text-sm tracking-widest uppercase mb-4 font-[family-name:var(--font-body)]">
              The KibiraAI Innovation
            </span>
            <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-[#1a2e1a] leading-tight mb-6 font-[family-name:var(--font-display)]">
              Intelligence That <span className="text-[#4ade80]">Adapts</span> & <span className="text-[#4ade80]">Restores</span>
            </h1>
            <p className="text-[#6b7c6b] text-lg sm:text-xl max-w-3xl mx-auto leading-relaxed font-[family-name:var(--font-body)]">
              KibiraAI provides the data-driven services required to fight the 
              climate crisis where it hits hardest — in our wild forests and our expanding cities.
            </p>
          </div>

          {/* Deforestation Section */}
          <section className="mb-24 sm:mb-32">
            <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#1a2e1a] mb-6 font-[family-name:var(--font-display)]">
                  1. Reforestation: Restoring the Lungs of Africa
                </h2>
                <div className="space-y-6 text-[#6b7c6b] font-[family-name:var(--font-body)] text-lg">
                  <p>
                    Africa is losing 3.9 million hectares of forest every year. This isn't just an 
                    ecological loss; it's an economic and survival crisis for millions.
                  </p>
                  <p>
                    KibiraAI tackles this by replacing guesswork with <strong>Reforestation Intelligence</strong>. 
                    Our models analyze decades of satellite data to determine what to plant, where to plant, 
                    and how to ensure it survives.
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-3xl p-2 shadow-2xl shadow-[#14532d]/10 overflow-hidden border border-[#a7f3d0]">
                <img 
                  src="https://images.unsplash.com/photo-1511497584788-876760111969?w=800&q=80" 
                  alt="Reforestation" 
                  className="rounded-2xl w-full h-full object-cover aspect-[4/3]"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {reforestationServices.map((service, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-[#a7f3d0]/30 hover:border-[#4ade80]/50 transition-all group">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform inline-block">{service.icon}</div>
                  <h3 className="text-xl font-bold text-[#1a2e1a] mb-3 font-[family-name:var(--font-display)]">{service.title}</h3>
                  <p className="text-[#6b7c6b] text-sm leading-relaxed font-[family-name:var(--font-body)]">{service.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Urban Resilience Section */}
          <section className="relative">
            <div className="absolute inset-0 bg-[#2d6a4f]/5 rounded-[3rem] -rotate-1" />
            <div className="relative p-8 sm:p-16">
              <div className="grid md:grid-cols-2 gap-12 items-center mb-16">
                <div className="order-2 md:order-1 bg-white rounded-3xl p-2 shadow-2xl shadow-black/10 overflow-hidden border border-[#a7f3d0]">
                  <img 
                    src="https://images.unsplash.com/photo-1518391846015-55a9cc003b25?w=800&q=80" 
                    alt="Urban centers in Africa" 
                    className="rounded-2xl w-full h-full object-cover aspect-[4/3]"
                  />
                </div>
                <div className="order-1 md:order-2">
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#1a2e1a] mb-6 font-[family-name:var(--font-display)]">
                    2. Urban Center Services: Building Resilience
                  </h2>
                  <div className="space-y-6 text-[#6b7c6b] font-[family-name:var(--font-body)] text-lg">
                    <p>
                      As African cities grow, so do their climate vulnerabilities. Heat, floods, 
                      and resource scarcity are the new urban reality. 
                    </p>
                    <p>
                      KibiraAI provides <strong>Climate-Resilient Services</strong> that help cities adapt. 
                      Because we currently focus on digital and advisory innovation, we provide high-impact 
                      solutions that don't require heavy capital for physical infrastructure.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {urbanResilienceServices.map((service, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-[#a7f3d0]/30 shadow-sm hover:shadow-md transition-all">
                    <div className="text-3xl mb-3">{service.icon}</div>
                    <h3 className="text-lg font-bold text-[#1a2e1a] mb-2 font-[family-name:var(--font-display)]">{service.title}</h3>
                    <p className="text-[#6b7c6b] text-xs leading-relaxed font-[family-name:var(--font-body)]">{service.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Final CTA */}
          <div className="mt-24 sm:mt-32 bg-[#14532d] rounded-[3rem] p-8 sm:p-20 text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-[#4ade80]/10 rounded-full blur-3xl" />
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#d4a843]/10 rounded-full blur-3xl" />
             
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-8 relative z-10 font-[family-name:var(--font-display)]">
               Ready to restore their future?
             </h2>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
               <a 
                href="/advisor" 
                className="bg-[#4ade80] hover:bg-[#22c55e] text-[#0a1f13] font-bold px-10 py-5 rounded-full text-lg transition-all hover:scale-105 shadow-xl shadow-black/10 w-full sm:w-auto"
               >
                 Launch AI Advisor →
               </a>
               <a 
                href="/#support" 
                className="border-2 border-white/20 text-white hover:bg-white/10 font-bold px-10 py-5 rounded-full text-lg transition-all w-full sm:w-auto"
               >
                 Support This Innovation
               </a>
             </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
