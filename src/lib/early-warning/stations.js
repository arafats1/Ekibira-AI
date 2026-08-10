/**
 * Weather / air-quality stations at schools & clinics (DePIN-lite).
 * Telemetry is a blend of live Open-Meteo (when available) + deterministic
 * station noise so each site has a distinct hyper-local reading.
 */

import { FACILITIES } from "./facilities";

export const STATIONS = [
  {
    id: "stn-kawempe-01",
    facilityId: "sch-kawempe-primary",
    name: "Kawempe Primary AQ/Weather",
    lat: 0.3775,
    lng: 32.5572,
    sensors: ["temperature", "humidity", "pm25", "pm10", "uv"],
    installedAt: "2026-03-12",
    status: "online",
  },
  {
    id: "stn-bwaise-01",
    facilityId: "sch-bwaise-muslim",
    name: "Bwaise Primary AQ/Weather",
    lat: 0.3538,
    lng: 32.5615,
    sensors: ["temperature", "humidity", "pm25", "pm10"],
    installedAt: "2026-03-18",
    status: "online",
  },
  {
    id: "stn-katanga-01",
    facilityId: "sch-katanga-community",
    name: "Katanga School AQ/Weather",
    lat: 0.3352,
    lng: 32.5738,
    sensors: ["temperature", "humidity", "pm25", "uv"],
    installedAt: "2026-04-02",
    status: "online",
  },
  {
    id: "stn-namuwongo-01",
    facilityId: "sch-namuwongo-baptist",
    name: "Namuwongo Baptist Station",
    lat: 0.3015,
    lng: 32.6058,
    sensors: ["temperature", "humidity", "pm25", "pm10", "uv"],
    installedAt: "2026-04-10",
    status: "online",
  },
  {
    id: "stn-kisenyi-01",
    facilityId: "sch-kisenyi-nursery",
    name: "Kisenyi Nursery Station",
    lat: 0.3128,
    lng: 32.5682,
    sensors: ["temperature", "humidity", "pm25"],
    installedAt: "2026-04-22",
    status: "degraded",
  },
  {
    id: "stn-kalerwe-01",
    facilityId: "sch-kalerwe-secondary",
    name: "Kalerwe Secondary Station",
    lat: 0.3612,
    lng: 32.5718,
    sensors: ["temperature", "humidity", "pm25", "uv"],
    installedAt: "2026-05-01",
    status: "online",
  },
  {
    id: "stn-nakawa-01",
    facilityId: "sch-nakawa-primary",
    name: "Nakawa Primary Station",
    lat: 0.332,
    lng: 32.6155,
    sensors: ["temperature", "humidity", "pm25", "pm10"],
    installedAt: "2026-05-08",
    status: "online",
  },
  {
    id: "stn-kawempe-clinic-01",
    facilityId: "cli-kawempe-hciv",
    name: "Kawempe HC IV Station",
    lat: 0.3798,
    lng: 32.5591,
    sensors: ["temperature", "humidity", "pm25", "pm10", "uv"],
    installedAt: "2026-03-20",
    status: "online",
  },
  {
    id: "stn-mulago-01",
    facilityId: "cli-mulago-paeds",
    name: "Mulago Paeds Station",
    lat: 0.3389,
    lng: 32.5756,
    sensors: ["temperature", "humidity", "pm25", "uv"],
    installedAt: "2026-04-05",
    status: "online",
  },
  {
    id: "stn-kiswa-01",
    facilityId: "cli-kiswa-hc",
    name: "Kiswa HC III Station",
    lat: 0.3245,
    lng: 32.6088,
    sensors: ["temperature", "humidity", "pm25", "pm10"],
    installedAt: "2026-05-15",
    status: "online",
  },
];

function hashSeed(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

function jitter(seed, amplitude) {
  const x = Math.sin(seed) * 10000;
  return ((x - Math.floor(x)) * 2 - 1) * amplitude;
}

export function getStation(id) {
  return STATIONS.find((s) => s.id === id) || null;
}

export function listStations({ status } = {}) {
  return STATIONS.filter((s) => (status ? s.status === status : true));
}

export function stationStats() {
  const online = STATIONS.filter((s) => s.status === "online").length;
  const degraded = STATIONS.filter((s) => s.status === "degraded").length;
  return {
    total: STATIONS.length,
    online,
    degraded,
    offline: STATIONS.length - online - degraded,
    uptimePct: Math.round((online / STATIONS.length) * 1000) / 10,
  };
}

/**
 * Build current telemetry. Pass liveOpenMeteo snapshot when available:
 * { temperature, humidity, pm25, pm10, uvIndex, aqi }
 */
export function buildTelemetry(station, live = null) {
  const seed = hashSeed(station.id + Math.floor(Date.now() / 300000)); // 5-min buckets
  const facility = FACILITIES.find((f) => f.id === station.facilityId);

  const baseTemp = live?.temperature ?? 27 + jitter(seed, 2);
  const baseHum = live?.humidity ?? 65 + jitter(seed + 1, 8);
  const basePm25 = live?.pm25 ?? 28 + jitter(seed + 2, 10);
  const basePm10 = live?.pm10 ?? basePm25 * 1.6;
  const baseUv = live?.uvIndex ?? 7 + jitter(seed + 3, 1.5);

  // Microclimate bias from facility characteristics
  const uhi = facility?.urbanHeatIslandDelta ?? 4;
  const canopy = facility?.treeCanopyCoverage ?? 0.05;

  const temperature = Math.round((baseTemp + uhi * 0.15 - canopy * 2 + jitter(seed + 4, 0.4)) * 10) / 10;
  const humidity = Math.round(Math.min(98, Math.max(25, baseHum + jitter(seed + 5, 3))));
  const pm25 = Math.max(3, Math.round(basePm25 + (1 - canopy) * 4 + jitter(seed + 6, 3)));
  const pm10 = Math.max(5, Math.round(basePm10 + jitter(seed + 7, 4)));
  const uvIndex = Math.max(0, Math.round((baseUv + jitter(seed + 8, 0.3)) * 10) / 10);

  const readings = {
    temperature,
    humidity,
    pm25: station.sensors.includes("pm25") ? pm25 : null,
    pm10: station.sensors.includes("pm10") ? pm10 : null,
    uvIndex: station.sensors.includes("uv") ? uvIndex : null,
    aqi: live?.aqi ?? Math.round(pm25 * 1.8),
    recordedAt: new Date().toISOString(),
    source: live ? "open-meteo+station" : "station-model",
    intervalMinutes: 5,
  };

  return {
    ...station,
    facilityName: facility?.name || null,
    facilityType: facility?.type || null,
    ward: facility?.ward || null,
    telemetry: readings,
  };
}
