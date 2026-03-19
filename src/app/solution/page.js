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

  const forestSentinelFeatures = [
    {
      title: "Acoustic Detection",
      description: "Solar-powered IoT microphones deployed across at-risk forests use a trained neural network to classify chainsaw and axe sounds in real-time, distinguishing logging from natural forest sounds like thunder or animal calls.",
      icon: "🎙️",
      stat: "95% detection accuracy"
    },
    {
      title: "GPS Triangulation & Alerts",
      description: "Multiple sensor nodes triangulate the exact GPS location of detected logging activity. Instant SMS and WhatsApp alerts are pushed to community forest rangers and Uganda's National Forestry Authority within seconds.",
      icon: "📍",
      stat: "< 30 second alert time"
    },
    {
      title: "Evidence & Dashboard Logging",
      description: "Every detection event is logged on the KibiraAI dashboard with timestamp, GPS coordinates, confidence score, and audio classification. Optional drone dispatch captures photographic evidence for prosecution.",
      icon: "🛰️",
      stat: "100% event traceability"
    },
    {
      title: "Predictive Feedback Loop",
      description: "Detection data flows back into KibiraAI's deforestation risk model, making future predictions sharper. Patrol routes are optimized based on hotspot patterns, reducing ranger workload by up to 60%.",
      icon: "🔄",
      stat: "Self-improving AI model"
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

  const urbanFloodHeatFeatures = [
    {
      title: "Hyperlocal Heat Island Mapping",
      description: "Satellite thermal imagery (Landsat Band 10) combined with ground-level data maps neighborhood-level heat intensity across African cities, identifying which informal settlements like Bwaise, Katanga, and Namuwongo are dangerously hot.",
      icon: "🌡️",
      stat: "50m resolution heat maps"
    },
    {
      title: "72-Hour Flood Prediction Engine",
      description: "An ML model processes real-time weather forecasts, soil saturation levels, and urban drainage topology to predict flash floods 24–72 hours ahead, pushing SMS and WhatsApp alerts to residents in flood-prone zones.",
      icon: "🌊",
      stat: "24–72h advance warning"
    },
    {
      title: "Parish-Level Climate Action Plans",
      description: "AI generates specific intervention plans per neighborhood — e.g., 'Plant 200 Terminalia mantaly trees along Jinja Road to reduce heat by 3°C and intercept 40% of stormwater runoff' — ready for KCCA and NGO implementation.",
      icon: "📋",
      stat: "Actionable per-ward plans"
    },
    {
      title: "Climate Justice Evidence",
      description: "Maps and data proving which communities bear the worst climate impact help NGOs and city authorities direct adaptation funding equitably — supporting advocacy, policy change, and international climate finance applications.",
      icon: "⚖️",
      stat: "Data-backed equity reports"
    }
  ];

  const solutionPillars = [
    {
      title: "Data-to-Action",
      description: "From satellite signals to actionable playbooks, every insight is designed for immediate use in the field.",
    },
    {
      title: "Community First",
      description: "Designed for low-bandwidth environments with clear, local-language friendly recommendations.",
    },
    {
      title: "Verified Impact",
      description: "Continuous monitoring produces evidence for climate finance, carbon credits, and public accountability.",
    },
  ];

  const outcomeMetrics = [
    { value: "3.9M", label: "Hectares protected yearly", note: "Risk mapped to prevent loss" },
    { value: "95%", label: "Logging detection rate", note: "Acoustic AI forest sentinel" },
    { value: "5°C", label: "Urban cooling potential", note: "Heat corridors + tree placement" },
    { value: "72h", label: "Flood early warning", note: "Preparedness for dense neighborhoods" },
    { value: "40%", label: "Higher survival", note: "Native species optimization" },
    { value: "< 30s", label: "Alert response time", note: "Real-time ranger notification" },
  ];

  const dataToActionPipeline = [
    { layer: "Educate & Advise", tool: "AI Climate Advisor", description: "Users query the AI for region-specific data on deforestation, native species, carbon potential, and climate-smart farming practices.", color: "bg-emerald-500" },
    { layer: "Detect & Protect", tool: "Forest Acoustic Sentinel", description: "IoT sound sensors detect illegal logging in real-time, alert rangers, and feed data back into the deforestation risk model.", color: "bg-amber-500" },
    { layer: "Predict & Prepare", tool: "Urban Heat & Flood AI", description: "Satellite and weather data predict heat extremes and flash floods, push early warnings, and generate neighborhood-level climate action plans.", color: "bg-blue-500" },
  ];

  return (
    <div className="min-h-screen bg-[#f7faf6]">
      <Navbar />

      {/* Main Content */}
      <main className="pt-24 sm:pt-32 pb-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          {/* Hero Header */}
          <section className="relative overflow-hidden rounded-[2.5rem] border border-[#d6e7d6] bg-gradient-to-br from-[#f7fff5] via-[#f4fbf7] to-[#ecf7ef] px-6 sm:px-10 py-12 sm:py-16 mb-16 sm:mb-24">
            <div className="absolute -top-16 -right-10 w-64 h-64 bg-[#4ade80]/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 -left-12 w-72 h-72 bg-[#d4a843]/10 rounded-full blur-3xl" />
            <div className="relative grid lg:grid-cols-[1.1fr,0.9fr] gap-10 items-center">
              <div>
                <span className="inline-flex items-center gap-2 text-[#2d6a4f] font-semibold text-xs tracking-widest uppercase mb-4 font-[family-name:var(--font-body)]">
                  The KibiraAI Innovation
                </span>
                <h1 className="text-4xl sm:text-6xl md:text-7xl font-bold text-[#1a2e1a] leading-tight mb-6 font-[family-name:var(--font-display)]">
                  Intelligence That <span className="text-[#2d6a4f]">Adapts</span> and <span className="text-[#2d6a4f]">Restores</span>
                </h1>
                <p className="text-[#5d6f5d] text-lg sm:text-xl max-w-2xl leading-relaxed font-[family-name:var(--font-body)]">
                  KibiraAI delivers climate services for Africa's forests and cities, transforming raw data into actionable guidance that reduces emissions and protects lives.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <a
                    href="/advisor"
                    className="bg-[#2d6a4f] hover:bg-[#1b4332] text-white font-semibold px-6 py-3 rounded-full transition-colors"
                  >
                    Try the AI Researcher →
                  </a>
                  <a
                    href="#solution-detail"
                    className="border border-[#2d6a4f]/30 text-[#2d6a4f] hover:bg-[#2d6a4f]/10 font-semibold px-6 py-3 rounded-full transition-colors"
                  >
                    Explore the Solution
                  </a>
                </div>
              </div>
              <div className="grid gap-4">
                <div className="bg-white/90 rounded-2xl p-5 border border-[#dce9dc] shadow-sm">
                  <p className="text-xs uppercase tracking-widest text-[#2d6a4f] font-semibold">Forest Intelligence</p>
                  <h3 className="text-lg font-bold text-[#1a2e1a] mt-2">Predict risk, plant smarter, verify carbon</h3>
                  <p className="text-sm text-[#5d6f5d] mt-2">AI maps vulnerable zones, generates native-species plans, and tracks sequestration for carbon credits.</p>
                </div>
                <div className="bg-white/90 rounded-2xl p-5 border border-[#dce9dc] shadow-sm">
                  <p className="text-xs uppercase tracking-widest text-[#2d6a4f] font-semibold">Urban Services</p>
                  <h3 className="text-lg font-bold text-[#1a2e1a] mt-2">Cool, protect, feed &amp; hydrate cities</h3>
                  <p className="text-sm text-[#5d6f5d] mt-2">Heat mapping, flood early-warnings, food-garden advisory, and smart water monitoring — delivered digitally.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Forest Intelligence Section */}
          <section id="solution-detail" className="mb-20 sm:mb-28">
            <div className="grid lg:grid-cols-2 gap-12 items-center mb-14">
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-[#2d6a4f] font-semibold mb-4 font-[family-name:var(--font-body)]">Pillar 1 &mdash; Forest Intelligence</p>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#1a2e1a] mb-6 font-[family-name:var(--font-display)]">
                  AI That Predicts, Plants &amp; Verifies
                </h2>
                <div className="space-y-6 text-[#5d6f5d] font-[family-name:var(--font-body)] text-lg">
                  <p>
                    KibiraAI uses satellite imagery, land-use data, and ecological models to pinpoint
                    where forests are most at risk — then generates region-specific reforestation plans
                    using native species matched to local soil and rainfall.
                  </p>
                  <p>
                    Every intervention is tracked with science-backed biomass monitoring, producing
                    verifiable carbon-credit reports that create direct revenue for communities.
                  </p>
                </div>
              </div>
              <div className="bg-white rounded-[2.5rem] p-2 shadow-2xl shadow-[#14532d]/10 overflow-hidden border border-[#cfe6d4]">
                <img 
                  src="/deforestation.jpg" 
                  alt="AI-driven reforestation in Africa" 
                  className="rounded-2xl w-full h-full object-cover aspect-[4/3]"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              {reforestationServices.map((service, i) => (
                <div key={i} className="bg-white p-8 rounded-3xl border border-[#dce9dc] hover:border-[#4ade80]/50 transition-all group shadow-sm">
                  <div className="text-4xl mb-4 group-hover:scale-110 transition-transform inline-block">{service.icon}</div>
                  <h3 className="text-xl font-bold text-[#1a2e1a] mb-3 font-[family-name:var(--font-display)]">{service.title}</h3>
                  <p className="text-[#5d6f5d] text-sm leading-relaxed font-[family-name:var(--font-body)]">{service.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* === PRACTICAL INNOVATION: Forest Acoustic Sentinel === */}
          <section className="mb-20 sm:mb-28">
            <div className="bg-gradient-to-br from-[#1a2e1a] to-[#14532d] rounded-[3rem] p-8 sm:p-14 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-[#4ade80]/8 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-72 h-72 bg-amber-500/8 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center gap-2 bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full font-[family-name:var(--font-body)]">
                    🔊 Practical Innovation
                  </span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 font-[family-name:var(--font-display)]">
                  AI Forest Acoustic Sentinel
                </h2>
                <p className="text-white/70 text-lg max-w-3xl mb-6 font-[family-name:var(--font-body)]">
                  Beyond data — real-time forest protection. Low-cost IoT sound sensors deployed across Uganda&apos;s at-risk forests (Mabira, Bugoma, Bwindi buffer zones) use a trained neural network to detect illegal logging activity and alert rangers within seconds.
                </p>
                <a 
                  href="/forest-sentinel" 
                  className="inline-flex items-center gap-2 bg-[#4ade80] hover:bg-[#22c55e] text-[#0a1f13] font-bold px-6 py-3 rounded-full transition-all hover:scale-105 shadow-lg shadow-[#4ade80]/25 mb-10"
                >
                  🔊 Launch Forest Sentinel →
                </a>

                <div className="grid sm:grid-cols-2 gap-5">
                  {forestSentinelFeatures.map((feature, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group">
                      <div className="flex items-start gap-4">
                        <span className="text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">{feature.icon}</span>
                        <div>
                          <h3 className="text-lg font-bold text-white mb-2 font-[family-name:var(--font-display)]">{feature.title}</h3>
                          <p className="text-white/60 text-sm leading-relaxed font-[family-name:var(--font-body)]">{feature.description}</p>
                          <span className="inline-block mt-3 text-[#4ade80] text-xs font-semibold tracking-wide uppercase font-[family-name:var(--font-body)]">{feature.stat}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* How it works flow */}
                <div className="mt-10 border-t border-white/10 pt-8">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#a7f3d0] font-semibold mb-6 font-[family-name:var(--font-body)]">Detection Pipeline</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { step: "1", label: "Sound Captured", desc: "IoT mic detects chainsaw/axe audio" },
                      { step: "2", label: "AI Classifies", desc: "TensorFlow Lite model on-device" },
                      { step: "3", label: "Alert Dispatched", desc: "SMS/WhatsApp to rangers in < 30s" },
                      { step: "4", label: "Evidence Logged", desc: "GPS, timestamp, audio on dashboard" },
                    ].map((item, i) => (
                      <div key={i} className="text-center">
                        <div className="w-10 h-10 rounded-full bg-[#4ade80]/20 text-[#4ade80] font-bold text-sm flex items-center justify-center mx-auto mb-3">{item.step}</div>
                        <p className="text-white text-sm font-semibold font-[family-name:var(--font-display)]">{item.label}</p>
                        <p className="text-white/50 text-xs mt-1 font-[family-name:var(--font-body)]">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Scale note */}
                <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-5">
                  <p className="text-white/80 text-sm font-[family-name:var(--font-body)]">
                    <span className="text-[#4ade80] font-semibold">Africa-wide scalability:</span> Replicable across the Congo Basin (1.5M ha lost/year), Kenya&apos;s community forests, and Ghana&apos;s cocoa-belt forests. Tech stack: TensorFlow Lite on Raspberry Pi Zero + solar panel + LoRaWAN for low-power, long-range connectivity in remote areas.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Urban Resilience Section */}
          <section className="relative mb-24">
            <div className="absolute inset-0 bg-gradient-to-br from-[#e9f5ed] to-[#f6fbf7] rounded-[3rem]" />
            <div className="relative p-8 sm:p-16">
              <div className="grid lg:grid-cols-2 gap-12 items-center mb-14">
                <div className="order-2 lg:order-1 bg-white rounded-[2.5rem] p-2 shadow-2xl shadow-black/10 overflow-hidden border border-[#cfe6d4]">
                  <img 
                    src="/kampala.jpg" 
                    alt="Kampala city" 
                    className="rounded-2xl w-full h-full object-cover aspect-[4/3]"
                  />
                </div>
                <div className="order-1 lg:order-2">
                  <p className="text-xs uppercase tracking-[0.3em] text-[#2d6a4f] font-semibold mb-4 font-[family-name:var(--font-body)]">Pillar 2 &mdash; Urban Resilience</p>
                  <h2 className="text-3xl sm:text-4xl font-bold text-[#1a2e1a] mb-6 font-[family-name:var(--font-display)]">
                    Digital Services That Cool, Protect &amp; Feed Cities
                  </h2>
                  <div className="space-y-6 text-[#5d6f5d] font-[family-name:var(--font-body)] text-lg">
                    <p>
                      KibiraAI delivers lightweight, data-driven services that help urban communities
                      manage heat, avoid floods, grow food, and secure water — all without heavy
                      capital infrastructure.
                    </p>
                    <p>
                      Through early-warning analytics, localized advisories, and AI-powered planning,
                      city leaders and residents get the intelligence they need to act before crises hit.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {urbanResilienceServices.map((service, i) => (
                  <div key={i} className="bg-white p-6 rounded-2xl border border-[#dce9dc] shadow-sm hover:shadow-md transition-all">
                    <div className="text-3xl mb-3">{service.icon}</div>
                    <h3 className="text-lg font-bold text-[#1a2e1a] mb-2 font-[family-name:var(--font-display)]">{service.title}</h3>
                    <p className="text-[#5d6f5d] text-xs leading-relaxed font-[family-name:var(--font-body)]">{service.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* === PRACTICAL INNOVATION: Urban Heat & Flood Early Warning === */}
          <section className="mb-20 sm:mb-28">
            <div className="bg-gradient-to-br from-[#0c2d48] to-[#1a1a2e] rounded-[3rem] p-8 sm:p-14 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-80 h-80 bg-blue-500/8 rounded-full blur-3xl" />
              <div className="absolute bottom-0 right-0 w-72 h-72 bg-red-500/8 rounded-full blur-3xl" />
              
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <span className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-semibold tracking-widest uppercase px-4 py-1.5 rounded-full font-[family-name:var(--font-body)]">
                    🏙️ Practical Innovation
                  </span>
                </div>
                <h2 className="text-3xl sm:text-5xl font-bold text-white mb-4 font-[family-name:var(--font-display)]">
                  Urban Heat &amp; Flood Early Warning System
                </h2>
                <p className="text-white/70 text-lg max-w-3xl mb-4 font-[family-name:var(--font-body)]">
                  Beyond data — predictive urban protection. A hyperlocal AI system for Kampala and African cities that combines satellite thermal imagery, weather data, and drainage topology to predict heat extremes and flash floods before they strike.
                </p>
                <a 
                  href="/urban-warning" 
                  className="inline-flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white font-bold px-6 py-3 rounded-full transition-all hover:scale-105 shadow-lg shadow-blue-500/25 mb-10"
                >
                  🚀 Launch Live System →
                </a>

                <div className="grid sm:grid-cols-2 gap-5">
                  {urbanFloodHeatFeatures.map((feature, i) => (
                    <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all group">
                      <div className="flex items-start gap-4">
                        <span className="text-3xl flex-shrink-0 group-hover:scale-110 transition-transform">{feature.icon}</span>
                        <div>
                          <h3 className="text-lg font-bold text-white mb-2 font-[family-name:var(--font-display)]">{feature.title}</h3>
                          <p className="text-white/60 text-sm leading-relaxed font-[family-name:var(--font-body)]">{feature.description}</p>
                          <span className="inline-block mt-3 text-blue-400 text-xs font-semibold tracking-wide uppercase font-[family-name:var(--font-body)]">{feature.stat}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* How the urban system works */}
                <div className="mt-10 border-t border-white/10 pt-8">
                  <p className="text-xs uppercase tracking-[0.3em] text-blue-300 font-semibold mb-6 font-[family-name:var(--font-body)]">Early Warning Pipeline</p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {[
                      { step: "1", label: "Satellite Scan", desc: "Landsat thermal + Sentinel-1 radar" },
                      { step: "2", label: "AI Analysis", desc: "ML predicts heat/flood risk per ward" },
                      { step: "3", label: "Alert Pushed", desc: "SMS/WhatsApp to at-risk residents" },
                      { step: "4", label: "Action Plan", desc: "Per-parish interventions generated" },
                    ].map((item, i) => (
                      <div key={i} className="text-center">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 text-blue-400 font-bold text-sm flex items-center justify-center mx-auto mb-3">{item.step}</div>
                        <p className="text-white text-sm font-semibold font-[family-name:var(--font-display)]">{item.label}</p>
                        <p className="text-white/50 text-xs mt-1 font-[family-name:var(--font-body)]">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Target cities */}
                <div className="mt-8 bg-white/5 border border-white/10 rounded-xl p-5">
                  <p className="text-white/80 text-sm font-[family-name:var(--font-body)]">
                    <span className="text-blue-400 font-semibold">Target cities:</span> Kampala (primary), Lagos, Nairobi (Mathare/Kibera), Dar es Salaam, Accra (Odaw River basin). Uses freely available Sentinel-1 radar for flood detection and Landsat thermal bands for heat mapping — no hardware deployment needed.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* === DATA → DETECTION → ACTION Pipeline === */}
          <section className="mb-20 sm:mb-28">
            <div className="text-center mb-12">
              <p className="text-xs uppercase tracking-[0.3em] text-[#2d6a4f] font-semibold mb-4 font-[family-name:var(--font-body)]">The Complete Pipeline</p>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#1a2e1a] font-[family-name:var(--font-display)]">
                Data → Detection → Action
              </h2>
              <p className="text-[#5d6f5d] text-lg mt-4 max-w-2xl mx-auto font-[family-name:var(--font-body)]">
                Three integrated layers that transform climate intelligence into measurable impact across Africa&apos;s forests and cities.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {dataToActionPipeline.map((item, i) => (
                <div key={i} className="relative bg-white rounded-3xl border border-[#dce9dc] p-8 shadow-sm hover:shadow-lg transition-all group overflow-hidden">
                  <div className={`absolute top-0 left-0 w-full h-1.5 ${item.color}`} />
                  <p className="text-xs uppercase tracking-widest text-[#5d6f5d] font-semibold mb-3 font-[family-name:var(--font-body)]">Layer {i + 1}</p>
                  <h3 className="text-2xl font-bold text-[#1a2e1a] mb-2 font-[family-name:var(--font-display)]">{item.layer}</h3>
                  <p className={`text-sm font-semibold mb-3 font-[family-name:var(--font-body)] ${item.color === 'bg-emerald-500' ? 'text-emerald-600' : item.color === 'bg-amber-500' ? 'text-amber-600' : 'text-blue-600'}`}>{item.tool}</p>
                  <p className="text-[#5d6f5d] text-sm leading-relaxed font-[family-name:var(--font-body)]">{item.description}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Service Pillars */}
          <section className="mb-20">
            <div className="grid lg:grid-cols-[1.1fr,0.9fr] gap-10 items-start">
              <div>
                <h2 className="text-3xl sm:text-4xl font-bold text-[#1a2e1a] mb-5 font-[family-name:var(--font-display)]">
                  The Digital Service Stack
                </h2>
                <p className="text-[#5d6f5d] text-lg leading-relaxed font-[family-name:var(--font-body)] mb-6">
                  KibiraAI acts as a climate operating system, turning data into guidance for local governments,
                  NGOs, and community leaders. This keeps intervention fast, affordable, and scalable.
                </p>
                <div className="space-y-4">
                  {solutionPillars.map((pillar, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-[#dce9dc] p-5 shadow-sm">
                      <h3 className="text-lg font-bold text-[#1a2e1a] mb-2 font-[family-name:var(--font-display)]">{pillar.title}</h3>
                      <p className="text-sm text-[#5d6f5d] font-[family-name:var(--font-body)]">{pillar.description}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-[#1a2e1a] rounded-[2.5rem] p-6 sm:p-8 text-white">
                <p className="text-xs uppercase tracking-[0.3em] text-[#a7f3d0]">Workflow</p>
                <h3 className="text-2xl font-bold mt-3 mb-6 font-[family-name:var(--font-display)]">How KibiraAI Works</h3>
                <div className="space-y-4 text-sm font-[family-name:var(--font-body)] text-white/80">
                  <div className="border border-white/10 rounded-xl p-4">
                    <p className="text-white font-semibold">1. Data Capture</p>
                    <p className="mt-1">Satellite, climate, and local inputs establish real-time context.</p>
                  </div>
                  <div className="border border-white/10 rounded-xl p-4">
                    <p className="text-white font-semibold">2. AI Diagnosis</p>
                    <p className="mt-1">Models detect risk zones and forecast climate stress events.</p>
                  </div>
                  <div className="border border-white/10 rounded-xl p-4">
                    <p className="text-white font-semibold">3. Action Playbooks</p>
                    <p className="mt-1">Communities receive tailored actions for forests and cities.</p>
                  </div>
                  <div className="border border-white/10 rounded-xl p-4">
                    <p className="text-white font-semibold">4. Verified Outcomes</p>
                    <p className="mt-1">Progress is monitored and validated for climate finance.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Outcomes */}
          <section className="mb-24">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {outcomeMetrics.map((metric, i) => (
                <div key={i} className="bg-white rounded-2xl p-6 border border-[#dce9dc] shadow-sm">
                  <p className="text-3xl font-bold text-[#2d6a4f] font-[family-name:var(--font-display)]">{metric.value}</p>
                  <p className="text-[#1a2e1a] font-semibold mt-2 font-[family-name:var(--font-display)]">{metric.label}</p>
                  <p className="text-xs text-[#5d6f5d] mt-2 font-[family-name:var(--font-body)]">{metric.note}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Final CTA */}
          <div className="mt-16 sm:mt-24 bg-[#14532d] rounded-[3rem] p-8 sm:p-20 text-center relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-[#4ade80]/10 rounded-full blur-3xl" />
             <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#d4a843]/10 rounded-full blur-3xl" />
             
             <h2 className="text-3xl sm:text-5xl font-bold text-white mb-8 relative z-10 font-[family-name:var(--font-display)]">
               Ready to restore the future?
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
