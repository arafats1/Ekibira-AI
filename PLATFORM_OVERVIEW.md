# KibiraAI — Platform Overview & Presentation Guide

> **AI-Powered Climate Intelligence for Africa**
> Restoring forests, protecting cities, and empowering communities to fight climate change.

---

## 1. WHAT IS KIBIRAAI?

KibiraAI is an integrated climate intelligence platform that combines **artificial intelligence**, **real-time environmental monitoring**, and **community action tools** to combat deforestation, urban climate vulnerability, and biodiversity loss across Africa.

The platform has **four core systems**:

| System | Purpose | Status |
|--------|---------|--------|
| **Dr. Kibira AI** | AI-powered climate research assistant | 🟢 Live |
| **Forest Sentinel** | Real-time acoustic monitoring for illegal logging | 🟢 Live (Demo) |
| **Urban Warning** | Hyperlocal flood & heat risk prediction | 🔵 Live (Demo) |
| **Plant a Tree** | Direct reforestation with payment processing | 🟢 Live |

---

## 2. THE PROBLEM WE'RE SOLVING

### Forest Crisis
- **3.9 million hectares** of African forest lost annually
- Deforestation contributes **15-20% of global CO₂ emissions**
- Less than **3% of global climate finance** reaches African communities
- The Congo Basin (world's 2nd largest tropical forest) is at **critical risk** (92/100)

### Urban Crisis
- **100M+ Africans** at risk from urban heat, floods, and water scarcity
- Urban areas warming **1.5x faster** than rural areas
- Informal settlements experience temperatures **5-8°C higher** than surrounding areas
- **86% of urban growth** occurring in flood-prone zones

### The Gap
Communities, NGOs, and local governments lack **accessible, data-driven tools** to understand their climate risks, plan reforestation, track carbon sequestration, or respond to environmental threats in real-time.

---

## 3. PLATFORM CAPABILITIES (Demo Walkthrough)

### 3.1 Dr. Kibira AI — Climate Research Assistant

**What it does:** An AI-powered research assistant with deep expertise in African climate science. Users ask questions in natural language and receive data-rich, actionable analysis.

**Key capabilities:**
- **Deforestation pattern analysis** — Historical trends, driver identification (agriculture, logging, charcoal, mining), spatial patterns, and satellite data references for any African region or forest
- **Native reforestation strategies** — Species-site matching with scientific names, sequestration rates, survival rates, planting designs, community engagement models, cost estimates ($20-50/ha for FMNR vs $1,000-3,000/ha for full replanting)
- **Carbon sequestration tracking** — Species-specific rates (4-20 tCO₂/ha/year), carbon pool breakdowns (above-ground, below-ground, soil), MRV methodologies, carbon credit valuation ($6-35/tonne depending on region and certification)
- **Urban resilience planning** — Heat island analysis, flood risk assessment, green infrastructure recommendations
- **Climate projections** — 5, 10, and 20-year forecasts based on IPCC AR6 and regional models
- **Inline data visualization** — Generates interactive bar charts, pie charts, line charts, and area charts within responses
- **Research images** — Automatically fetches relevant images from Wikimedia Commons (satellite views, species photos, project images)
- **Citations** — Every response includes 3-8 references from credible sources (IPCC, FAO, Global Forest Watch, NASA, peer-reviewed journals)

**Regional expertise covers:** East Africa, West Africa, Central Africa, Southern Africa, North Africa, and Urban contexts — with specific data for each.

**Demo flow:** Ask "Analyze deforestation patterns in Mabira Forest, Uganda and recommend native reforestation strategies" → Shows historical data, driver breakdown charts, species table, carbon projections, and satellite images.

---

### 3.2 Forest Sentinel — Acoustic Monitoring System

**What it does:** Real-time detection of illegal logging, poaching, and encroachment using IoT acoustic sensors deployed across Uganda's critical forests.

**4 forests monitored:**

| Forest | Area | Threat Level | Annual Loss | Key Threat |
|--------|------|-------------|-------------|------------|
| **Mabira** | 29,964 ha | 82/100 | ~312 ha/yr | Sugar cane encroachment |
| **Bugoma** | 41,144 ha | 95/100 (Critical) | ~890 ha/yr | Hoima Sugar Ltd lease |
| **Bwindi** | 32,092 ha | 58/100 | ~85 ha/yr | Buffer zone pressure |
| **Kibale** | 79,500 ha | 65/100 | ~145 ha/yr | Community encroachment |

**How it works:**
1. **Acoustic sensors** deployed across 16 zones capture environmental sounds 24/7
2. **AI classification** (TensorFlow Lite CNN) identifies 9 sound types:
   - 🔴 **Threats:** Chainsaw (200Hz-8kHz), axe/panga, vehicle engine, gunshot, human activity
   - 🟢 **Safe:** Birdsong, rain/thunder, insects/cicadas, wind
3. **GPS triangulation** pinpoints the threat location within 30 seconds
4. **Instant alerts** sent via SMS/WhatsApp to rangers with coordinates, confidence score, and evidence
5. **Dashboard logging** provides 100% event traceability and CSV export

**Dashboard tabs:** Overview, Live Detection (waveform visualizer), Event Log, Sensor Map

---

### 3.3 Urban Warning — Heat & Flood Risk System

**What it does:** Hyperlocal climate risk monitoring for Kampala neighborhoods, providing 24-72 hour advance flood warnings and heat stress assessments.

**5 neighborhoods monitored:**

| Area | Population | Flood Risk | Heat Risk | Key Issue |
|------|-----------|-----------|----------|-----------|
| **Bwaise** | ~62K | 94/100 🔴 | 78/100 | Low-lying reclaimed wetland |
| **Katanga** | ~25K | 62/100 | 91/100 🔴 | 40K+ people/km² density |
| **Namuwongo** | ~35K | 87/100 🔴 | 72/100 | Nakivubo channel overflow |
| **Kalerwe** | ~48K | 76/100 | 68/100 | Hillside-to-valley runoff |
| **Kisenyi** | ~55K | 71/100 | 85/100 🔴 | Valley floor, poor drainage |

**Features:**
- **Flood risk model:** Calculates risk score from baseline data, rainfall, soil saturation, drainage capacity, and elevation
- **Heat island model:** Factors in UHI delta, tree canopy, impervious surface, population density, and surface albedo
- **AI-generated interventions:** Per-neighborhood planting plans, cool-roof programs, bioswale designs, and water features
- **5-day forecast:** Temperature and rainfall predictions per neighborhood
- **Alert levels:** Critical (≥85) → High (65-85) → Moderate (45-65) → Low (<45)

---

### 3.4 Plant a Tree — Direct Reforestation

**What it does:** Enables anyone to fund planting of native African tree species at $1/tree, with GPS tracking and carbon impact reporting.

**6 native species available:**

| Species | CO₂/year | Survival | Use Case |
|---------|----------|----------|----------|
| Terminalia mantaly | 22 kg | 92% | Urban shade & stormwater |
| Maesopsis eminii (Musizi) | 35 kg | 88% | Carbon sequestration champion |
| Markhamia lutea | 18 kg | 94% | Community agroforestry |
| Prunus africana | 28 kg | 82% | Medicinal timber (buffer zones) |
| Ficus natalensis (Mutuba) | 30 kg | 96% | Flood barriers (riparian) |
| Grevillea robusta | 25 kg | 90% | Urban heat island mitigation |

**Impact tiers:** From 🌱 Seed Planter (1 tree) to 🌍 Climate Champion (100 trees = 2.5+ tCO₂/year micro-forest)

**Payment:** Integrated with Pesapal (Africa's leading payment gateway) — supports mobile money, cards, and bank transfers.

---

## 4. TECHNICAL ARCHITECTURE

### Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 16.1.6, React 19.2.3 | Server-side rendering, routing |
| **Styling** | Tailwind CSS 4 | Responsive, mobile-first design |
| **Charts** | Recharts 3.8.0 | Interactive data visualization |
| **AI Engine** | OpenAI GPT-4o | Natural language climate intelligence |
| **Auth & CMS** | Strapi (headless CMS) | User management, knowledge base, chat logs |
| **Payments** | Pesapal v3 API | African-focused payment processing |
| **Images** | Wikimedia Commons API | CC-licensed research imagery |
| **Hosting** | Vercel (frontend), Strapi (backend) | Global CDN, serverless functions |

### Data Flow
```
User → Next.js Frontend → API Routes → OpenAI GPT-4o (AI)
                                      → Strapi CMS (Auth/Data)
                                      → Pesapal (Payments)
                                      → Wikimedia (Images)
```

### Authentication
- JWT-based via Strapi users-permissions plugin
- Extended user profiles with role-based access (user / admin)
- Secure token storage with localStorage
- Admin panel for user management and role assignment

---

## 5. CURRENT STATE & WHAT'S REAL vs. DEMO

| Feature | Status | Details |
|---------|--------|---------|
| AI Advisor (Dr. Kibira) | ✅ **Fully functional** | Real GPT-4o integration, real-time responses |
| Knowledge base integration | ✅ **Fully functional** | Admin can upload documents to augment AI knowledge |
| Chart generation | ✅ **Fully functional** | AI generates data-driven visualizations |
| Image research | ✅ **Fully functional** | Real Wikimedia Commons image search |
| User authentication | ✅ **Fully functional** | Strapi-backed registration/login |
| Admin dashboard | ✅ **Fully functional** | User management, chat logs, knowledge base |
| Payment processing | ✅ **Fully functional** | Pesapal production integration |
| Forest Sentinel UI | ✅ **Complete UI** | Full dashboard with simulated sensor data |
| Urban Warning UI | ✅ **Complete UI** | Full dashboard with deterministic risk models |
| Real IoT sensor data | ⚠️ **Simulated** | Requires hardware deployment + WebSocket backend |
| Live satellite feeds | ⚠️ **Not connected** | Ready for Google Earth Engine / Sentinel Hub integration |
| Tree planting GPS tracking | ⚠️ **Post-payment** | Payment works; GPS tracking needs field implementation |

---

## 6. DEPLOYMENT, SCALABILITY & TECHNICAL OPPORTUNITIES

### Current Deployment
- **Frontend:** Vercel (kibira-ai.vercel.app) — automatic CI/CD from GitHub
- **Backend:** Strapi on dedicated server — SQLite for development, PostgreSQL-ready for production
- **AI:** OpenAI API — pay-per-use, scales automatically

### Scalability Considerations

**What scales well today:**
- Vercel's edge network handles global traffic with zero configuration
- OpenAI API scales horizontally — no infrastructure to manage
- Pesapal handles payment volume for all of East Africa
- Stateless API design means horizontal scaling is straightforward

**What needs attention for scale:**
1. **Database migration** — SQLite → PostgreSQL/MySQL for concurrent users
2. **Caching layer** — Redis for AI response caching (same queries, same regions)
3. **Rate limiting** — Per-user API call limits to control OpenAI costs
4. **CDN for images** — Cache Wikimedia responses instead of fetching every time
5. **WebSocket infrastructure** — For real-time Forest Sentinel alerts (Socket.io / Pusher)

### Technical Enhancement Opportunities

| Enhancement | Impact | Complexity | Priority |
|-------------|--------|-----------|----------|
| **Google Earth Engine integration** | Real satellite deforestation monitoring | High | 🔴 High |
| **Sentinel-2 / Landsat API** | Live forest cover change detection | High | 🔴 High |
| **IoT sensor backend** | Real acoustic data from forest sensors | High | 🔴 High |
| **Weather API (OpenWeatherMap)** | Live flood/heat predictions | Medium | 🟡 Medium |
| **NASA FIRMS fire data** | Real-time fire alerts for forests | Medium | 🟡 Medium |
| **Carbon credit MRV pipeline** | Automated verification for carbon markets | High | 🟡 Medium |
| **Mobile app (React Native)** | Offline-capable for field workers | High | 🟡 Medium |
| **Multi-language support** | Swahili, French, Lingala, Hausa | Low | 🟢 Low |
| **WhatsApp bot integration** | Alerts & queries via WhatsApp | Medium | 🟢 Low |
| **PDF report generation** | Downloadable climate assessments | Low | 🟢 Low |

---

## 7. IMPACT PROJECTIONS

### Targets

| Metric | Target |
|--------|--------|
| Trees planted | 50M+ |
| Hectares restored | 2.5M |
| CO₂ captured | 18M tonnes |
| Farmers empowered | 500K+ |
| Carbon credit revenue | $45M |
| Countries covered | 12 |

### SDG Alignment
- **SDG 13:** Climate Action — Core mission
- **SDG 15:** Life on Land — Forest restoration & biodiversity
- **SDG 11:** Sustainable Cities — Urban heat & flood resilience
- **SDG 2:** Zero Hunger — Climate-smart agriculture advisory
- **SDG 6:** Clean Water — Watershed protection through reforestation
- **SDG 17:** Partnerships — Open platform for collaboration

### Theory of Change
1. **Technology** → AI + IoT provide real-time intelligence → evidence-based decisions
2. **Community** → Local ownership through FMNR, agroforestry, carbon payments → sustainable livelihoods
3. **Scale** → Proven models replicated across 12 countries → continental impact

---

## 8. FUNDING PHASES

| Phase | Investment | Timeline | Deliverables |
|-------|-----------|----------|-------------|
| **Phase 1: Foundation** | $150K | 6 months | Pilot in 3 Uganda districts, IoT sensor deployment, AI refinement |
| **Phase 2: Scale** | $400K | 12 months | Expand to 5 countries, 200 community ambassadors, satellite integration |
| **Phase 3: Impact** | $1.2M | 36 months | Continental coverage (12 countries), carbon credit marketplace, mobile app |

---

## 9. COLLABORATION STRUCTURE & ROLES

### Potential Roles

| Role | Contribution | Benefit |
|------|-------------|---------|
| **Technical Partner** | AI/ML engineering, satellite data, IoT infrastructure | Technology co-ownership, IP sharing |
| **Climate Science Advisor** | Domain validation, model calibration, data partnerships | Research publication, field access |
| **Funding Partner** | Grant writing, co-investment, fiscal sponsorship | Impact reporting, carbon credit revenue share |
| **Field Implementation** | Community engagement, sensor installation, tree planting | Ground-truth data, local credibility |
| **Government/Policy** | Regulatory framework, data sharing, endorsement | Evidence-based policy tools, citizen engagement |

### What Makes KibiraAI Unique for a Joint Proposal
1. **Africa-first design** — Built in Uganda, for African communities, with African payment infrastructure
2. **AI + Ground Truth** — Combines LLM intelligence with physical IoT sensors and real ecological data
3. **Revenue model** — Carbon credit verification creates sustainable income beyond grants
4. **Low-bandwidth consideration** — Designed for communities with limited connectivity
5. **Open knowledge base** — Admin-uploaded documents continuously improve AI responses
6. **Modular architecture** — Each system (AI, Forest, Urban, Trees) can be deployed independently

---

## 10. NEXT STEPS TOWARD A JOINT PROPOSAL

1. **Define scope** — Which systems to prioritize (AI advisor vs. Forest Sentinel vs. Urban Warning)
2. **Identify data sources** — Satellite partnerships (ESA Copernicus, NASA), weather APIs, ground sensor networks
3. **Technical roadmap** — IoT backend architecture, real-time data pipeline, ML model training
4. **Pilot geography** — Which forests/cities for Phase 1 deployment
5. **Budget allocation** — Hardware (sensors), cloud infrastructure, AI API costs, field team
6. **Impact metrics** — Define measurable KPIs for the proposal (hectares monitored, response time, trees planted)
7. **Timeline** — Align deliverables with funding cycles and reporting requirements

---

## DEMO SCRIPT (Suggested Order)

1. **Homepage** → Walk through the crisis stats and platform overview
2. **Dr. Kibira AI** → Live demo: ask about deforestation in a specific region → show charts, images, and citations
3. **Forest Sentinel** → Show the 4 monitored forests, live detection simulator, sensor map
4. **Urban Warning** → Show Kampala neighborhoods, flood/heat risk scores, intervention plans
5. **Plant a Tree** → Show species selection, impact calculator, payment flow
6. **Admin Panel** → Show user management, chat history, knowledge base
7. **Architecture slide** → Technical stack, scalability path, enhancement opportunities

---

*Built with 💚 in Uganda for Africa*
*Contact: hello@KibiraAI.org*
