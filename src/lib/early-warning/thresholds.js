/**
 * Child-sensitive alert thresholds and anticipatory action playbooks.
 * Tuned for schools and clinics in tropical East African urban settings.
 */

export const THRESHOLDS = {
  version: "1.0.0",
  updatedAt: "2026-08-01",
  heat: {
    school: { watch: 32, warning: 35, critical: 38 }, // heat index °C
    clinic: { watch: 31, warning: 34, critical: 37 },
  },
  humidity: {
    school: { watch: 70, warning: 80, critical: 90 }, // %
    clinic: { watch: 70, warning: 80, critical: 90 },
  },
  uv: {
    school: { watch: 6, warning: 8, critical: 11 },
    clinic: { watch: 6, warning: 8, critical: 11 },
  },
  aqi: {
    // European AQI
    school: { watch: 40, warning: 60, critical: 80 },
    clinic: { watch: 35, warning: 55, critical: 75 },
  },
  pm25: {
    school: { watch: 15, warning: 35, critical: 55 }, // µg/m³
    clinic: { watch: 12, warning: 30, critical: 50 },
  },
  flood: {
    school: { watch: 45, warning: 65, critical: 85 }, // 0–100 score
    clinic: { watch: 40, warning: 60, critical: 80 },
  },
  heatIllness: {
    school: { watch: 45, warning: 65, critical: 80 },
    clinic: { watch: 40, warning: 60, critical: 75 },
  },
  vector: {
    school: { watch: 50, warning: 70, critical: 85 },
    clinic: { watch: 45, warning: 65, critical: 80 },
  },
};

export const PLAYBOOKS = [
  {
    id: "heat-illness",
    hazard: "heat",
    title: "Heat illness — school & clinic actions",
    audience: ["school", "clinic", "community"],
    actions: {
      watch: [
        "Increase water breaks every 30–45 minutes during outdoor periods",
        "Move PE / assembly to early morning or late afternoon",
        "Open shaded rest areas; remind caregivers about hats and light clothing",
      ],
      warning: [
        "Cancel strenuous outdoor activity between 11:00–16:00",
        "Activate cooling corners with water and ventilation",
        "Screen for dizziness, nausea, confusion — send to clinic if needed",
      ],
      critical: [
        "Suspend outdoor classes and sports for the day",
        "Shorten school day or stagger outdoor movement if classrooms overheat",
        "Notify caregivers and local leaders; prioritize young children and pregnant mothers",
      ],
    },
  },
  {
    id: "high-uv",
    hazard: "uv",
    title: "High UV — outdoor protection",
    audience: ["school", "community"],
    actions: {
      watch: ["Use shade for outdoor play; sunscreen reminder for staff/caregivers"],
      warning: ["Limit midday outdoor exposure; schedule shade breaks"],
      critical: ["Keep children indoors during peak UV; use covered walkways only"],
    },
  },
  {
    id: "poor-aqi",
    hazard: "aqi",
    title: "Air pollution — respiratory protection",
    audience: ["school", "clinic", "community"],
    actions: {
      watch: ["Keep windows closed on traffic-facing sides during peak hours", "Reduce outdoor PE intensity"],
      warning: ["Move PE indoors; watch for asthma cough/wheeze", "Advise masks for symptomatic children"],
      critical: ["Cancel outdoor activities; ventilate with clean indoor air if available", "Clinic: prepare for respiratory surge"],
    },
  },
  {
    id: "flood",
    hazard: "flood",
    title: "Flood & storm early action",
    audience: ["school", "clinic", "community"],
    actions: {
      watch: ["Clear drains around compound; elevate learning materials"],
      warning: ["Prepare safe higher-ground assembly; delay arrival if routes flood", "Secure chemicals and medical supplies"],
      critical: ["Activate evacuation plan; notify parents/CHWs; do not cross floodwater"],
    },
  },
  {
    id: "humidity",
    hazard: "humidity",
    title: "High humidity — comfort & mould risk",
    audience: ["school", "clinic"],
    actions: {
      watch: ["Increase classroom airflow; dry wet uniforms/linen"],
      warning: ["Shorten dense indoor sessions; hydrate more frequently"],
      critical: ["Combine with heat playbook; watch heat exhaustion closely"],
    },
  },
  {
    id: "vector",
    hazard: "vector",
    title: "Vector / malaria climate suitability",
    audience: ["school", "clinic", "community"],
    actions: {
      watch: ["Clear standing water in compounds; reinforce net messaging"],
      warning: ["School talks on fever care-seeking; clinic stock check for RDTs/ACTs"],
      critical: ["Community leaders push net use + early treatment; clinic surge readiness"],
    },
  },
];

export function levelFromValue(value, bands) {
  if (value == null || Number.isNaN(value)) return "none";
  if (value >= bands.critical) return "critical";
  if (value >= bands.warning) return "warning";
  if (value >= bands.watch) return "watch";
  return "normal";
}

export function evaluateAlerts(readings, facilityType = "school") {
  const type = facilityType === "clinic" ? "clinic" : "school";
  const alerts = [];

  const checks = [
    { hazard: "heat", value: readings.heatIndex, bands: THRESHOLDS.heat[type], unit: "°C heat index" },
    { hazard: "humidity", value: readings.humidity, bands: THRESHOLDS.humidity[type], unit: "%" },
    { hazard: "uv", value: readings.uvIndex, bands: THRESHOLDS.uv[type], unit: "UV index" },
    { hazard: "aqi", value: readings.aqi, bands: THRESHOLDS.aqi[type], unit: "EU AQI" },
    { hazard: "flood", value: readings.floodRisk, bands: THRESHOLDS.flood[type], unit: "risk score" },
    { hazard: "heatIllness", value: readings.heatIllnessRisk, bands: THRESHOLDS.heatIllness[type], unit: "risk score" },
    { hazard: "vector", value: readings.vectorRisk, bands: THRESHOLDS.vector[type], unit: "risk score" },
  ];

  for (const c of checks) {
    const level = levelFromValue(c.value, c.bands);
    if (level === "none" || level === "normal") continue;
    const playbook = PLAYBOOKS.find((p) => p.hazard === c.hazard || (c.hazard === "heatIllness" && p.hazard === "heat"));
    alerts.push({
      hazard: c.hazard,
      level,
      value: Math.round(c.value * 10) / 10,
      unit: c.unit,
      thresholds: c.bands,
      playbookId: playbook?.id || null,
      actions: playbook?.actions?.[level] || [],
    });
  }

  const rank = { critical: 3, warning: 2, watch: 1 };
  alerts.sort((a, b) => (rank[b.level] || 0) - (rank[a.level] || 0));
  return alerts;
}

export function overallAlertLevel(alerts) {
  if (alerts.some((a) => a.level === "critical")) return "critical";
  if (alerts.some((a) => a.level === "warning")) return "warning";
  if (alerts.some((a) => a.level === "watch")) return "watch";
  return "normal";
}
