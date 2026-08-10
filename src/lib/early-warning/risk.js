import { evaluateAlerts, overallAlertLevel } from "./thresholds";
import {
  computeHeatIllnessRisk,
  computeVectorRisk,
  buildSevenDayOutlook,
  buildSyntheticOutlook,
} from "./predictions";
import { fetchWeatherBundle, computeFloodRiskScore, liveSnapshot } from "./weather";
import { getStation, buildTelemetry } from "./stations";

export async function buildFacilityRisk(facility) {
  const { weather, air, flood } = await fetchWeatherBundle(facility.lat, facility.lng);
  const live = liveSnapshot(weather, air);

  const temp = live.temperature ?? 28;
  const humidity = live.humidity ?? 65;
  const uvIndex = live.uvIndex ?? 7;
  const aqi = live.aqi ?? 45;
  const pm25 = live.pm25 ?? 25;

  const heat = computeHeatIllnessRisk({
    tempC: temp,
    humidity,
    uvIndex,
    urbanHeatIslandDelta: facility.urbanHeatIslandDelta,
    facilityType: facility.type,
    treeCanopyCoverage: facility.treeCanopyCoverage,
  });

  const rainToday = weather?.daily?.precipitation_sum?.[0] || 0;
  const rain7 = (weather?.daily?.precipitation_sum || []).slice(0, 7).reduce((a, b) => a + (b || 0), 0);

  const vectorRisk = computeVectorRisk({
    tempC: temp,
    humidity,
    rainfallMm24h: rainToday,
    rainfallMm7d: rain7,
    standingWaterProxy: facility.drainageVulnerability,
  });

  const floodRisk = computeFloodRiskScore(weather, flood, facility.drainageVulnerability);

  const readings = {
    temperature: temp,
    humidity,
    heatIndex: heat.heatIndex,
    uvIndex,
    aqi,
    pm25,
    floodRisk,
    heatIllnessRisk: heat.score,
    vectorRisk,
  };

  const alerts = evaluateAlerts(readings, facility.type);
  const alertLevel = overallAlertLevel(alerts);

  let outlook = buildSevenDayOutlook(weather?.daily, facility);
  if (!outlook.length) {
    outlook = buildSyntheticOutlook(facility, {
      temperature: temp,
      humidity,
      uvIndex,
      rainfallMm24h: rainToday || 5,
    });
  }

  let station = null;
  if (facility.stationId) {
    const stn = getStation(facility.stationId);
    if (stn) station = buildTelemetry(stn, live);
  }

  return {
    facilityId: facility.id,
    name: facility.name,
    type: facility.type,
    ward: facility.ward,
    district: facility.district,
    lat: facility.lat,
    lng: facility.lng,
    enrollment: facility.enrollment || 0,
    catchment: facility.catchment || 0,
    alertLevel,
    readings: {
      ...readings,
      temperature: Math.round(temp * 10) / 10,
      humidity: Math.round(humidity),
      heatIndex: heat.heatIndex,
      uvIndex: Math.round(uvIndex * 10) / 10,
      aqi: Math.round(aqi),
      pm25: Math.round(pm25 * 10) / 10,
    },
    alerts,
    outlook,
    station,
    dataSources: {
      weather: weather ? "Open-Meteo" : "fallback",
      airQuality: air ? "Open-Meteo Air Quality" : "fallback",
      flood: flood ? "GloFAS via Open-Meteo" : "terrain-only",
      outlook: weather?.daily?.time?.length ? "Open-Meteo daily" : "synthetic-7-day",
      station: station ? station.telemetry.source : "none",
      models: "KibiraAI heat-illness + vector suitability v1.0",
    },
    generatedAt: new Date().toISOString(),
  };
}

export function buildFacilityRiskOffline(facility) {
  const seed = facility.lat + facility.lng;
  const temp = 27 + (seed % 3);
  const humidity = 68 + Math.round((seed * 10) % 12);
  const uvIndex = 8;
  const aqi = 48 + Math.round((seed * 20) % 20);
  const pm25 = 30;
  const heat = computeHeatIllnessRisk({
    tempC: temp,
    humidity,
    uvIndex,
    urbanHeatIslandDelta: facility.urbanHeatIslandDelta,
    facilityType: facility.type,
    treeCanopyCoverage: facility.treeCanopyCoverage,
  });
  const vectorRisk = computeVectorRisk({
    tempC: temp,
    humidity,
    rainfallMm24h: 8,
    rainfallMm7d: 35,
    standingWaterProxy: facility.drainageVulnerability,
  });
  const floodRisk = Math.round(facility.drainageVulnerability * 70 + 15);
  const readings = {
    temperature: temp,
    humidity,
    heatIndex: heat.heatIndex,
    uvIndex,
    aqi,
    pm25,
    floodRisk,
    heatIllnessRisk: heat.score,
    vectorRisk,
  };
  const alerts = evaluateAlerts(readings, facility.type);
  const outlook = buildSyntheticOutlook(facility, {
    temperature: temp,
    humidity,
    uvIndex,
    rainfallMm24h: 8,
  });

  return {
    facilityId: facility.id,
    name: facility.name,
    type: facility.type,
    ward: facility.ward,
    district: facility.district,
    lat: facility.lat,
    lng: facility.lng,
    enrollment: facility.enrollment || 0,
    catchment: facility.catchment || 0,
    alertLevel: overallAlertLevel(alerts),
    readings,
    alerts,
    outlook,
    station: facility.stationId
      ? buildTelemetry(getStation(facility.stationId), {
          temperature: temp,
          humidity,
          pm25,
          aqi,
          uvIndex,
        })
      : null,
    dataSources: {
      weather: "offline-model",
      outlook: "synthetic-7-day",
      models: "KibiraAI heat-illness + vector suitability v1.0",
    },
    generatedAt: new Date().toISOString(),
  };
}
