/**
 * Predictive layers for children's climate–health early warning:
 * - Heat-illness risk (0–100)
 * - Vector / malaria climate suitability (0–100)
 */

/** Approximate heat index (°C) from dry-bulb temp and relative humidity. */
export function heatIndexC(tempC, humidity) {
  const T = tempC;
  const R = humidity;
  if (T < 26) return T;

  // Rothfusz regression adapted toward °C inputs (NWS-style approximation)
  const Tf = (T * 9) / 5 + 32;
  let HI =
    -42.379 +
    2.04901523 * Tf +
    10.14333127 * R -
    0.22475541 * Tf * R -
    0.00683783 * Tf * Tf -
    0.05481717 * R * R +
    0.00122874 * Tf * Tf * R +
    0.00085282 * Tf * R * R -
    0.00000199 * Tf * Tf * R * R;

  if (R < 13 && Tf >= 80 && Tf <= 112) {
    HI -= ((13 - R) / 4) * Math.sqrt((17 - Math.abs(Tf - 95)) / 17);
  }
  if (R > 85 && Tf >= 80 && Tf <= 87) {
    HI += ((R - 85) / 10) * ((87 - Tf) / 5);
  }
  return ((HI - 32) * 5) / 9;
}

/**
 * Heat-illness risk for children — higher weight on heat index, humidity,
 * facility type (schools midday exposure), and UHI.
 */
export function computeHeatIllnessRisk({
  tempC,
  humidity,
  uvIndex = 0,
  urbanHeatIslandDelta = 3,
  facilityType = "school",
  treeCanopyCoverage = 0.05,
}) {
  const hi = heatIndexC(tempC + urbanHeatIslandDelta * 0.5, humidity);
  let score = 0;

  // Heat index: 0–45
  score += Math.min(45, Math.max(0, (hi - 28) * 4.5));
  // Humidity stress: 0–15
  score += Math.min(15, Math.max(0, ((humidity - 55) / 45) * 15));
  // UV contributes to outdoor heat stress: 0–10
  score += Math.min(10, (uvIndex / 11) * 10);
  // Canopy deficit: 0–15
  score += (1 - treeCanopyCoverage) * 15;
  // Schools: midday outdoor exposure premium: 0–10
  if (facilityType === "school") score += 8;
  else score += 4; // clinics: waiting areas / caregivers outdoors

  return {
    score: Math.min(100, Math.max(0, Math.round(score))),
    heatIndex: Math.round(hi * 10) / 10,
  };
}

/**
 * Vector / malaria climate suitability.
 * Anopheles-friendly windows: ~18–32°C, high humidity, recent rainfall.
 * Not a case forecast — climate suitability for transmission risk windows.
 */
export function computeVectorRisk({
  tempC,
  humidity,
  rainfallMm24h = 0,
  rainfallMm7d = 0,
  standingWaterProxy = 0.5, // 0–1 from drainage vulnerability
}) {
  let score = 0;

  // Temperature suitability (peak ~25–28°C)
  if (tempC >= 18 && tempC <= 32) {
    const dist = Math.abs(tempC - 26.5);
    score += Math.max(0, 30 - dist * 4);
  }

  // Humidity: 0–25
  score += Math.min(25, Math.max(0, ((humidity - 50) / 50) * 25));

  // Rainfall (breeding sites): 0–25
  const rainFactor = Math.min(1, rainfallMm24h / 25) * 0.4 + Math.min(1, rainfallMm7d / 80) * 0.6;
  score += rainFactor * 25;

  // Drainage / standing water: 0–20
  score += standingWaterProxy * 20;

  return Math.min(100, Math.max(0, Math.round(score)));
}

export function buildSevenDayOutlook(dailyWeather, facility) {
  if (!dailyWeather?.time?.length) return [];

  const {
    time,
    temperature_2m_max = [],
    precipitation_sum = [],
    relative_humidity_2m_mean,
    uv_index_max = [],
  } = dailyWeather;

  // Open-Meteo daily may not include humidity mean — approximate from precip
  const precipArr = precipitation_sum;
  let rain7 = 0;
  for (let i = 0; i < Math.min(7, precipArr.length); i++) rain7 += precipArr[i] || 0;

  return time.slice(0, 7).map((dateStr, i) => {
    const temp = temperature_2m_max[i] ?? 28;
    const precip = precipArr[i] || 0;
    const humidity =
      relative_humidity_2m_mean?.[i] ??
      (precip > 20 ? 85 : precip > 5 ? 72 : 60);
    const uv = uv_index_max[i] || 0;

    const rainToDate = precipArr.slice(0, i + 1).reduce((a, b) => a + (b || 0), 0);
    const heat = computeHeatIllnessRisk({
      tempC: temp,
      humidity,
      uvIndex: uv,
      urbanHeatIslandDelta: facility.urbanHeatIslandDelta,
      facilityType: facility.type,
      treeCanopyCoverage: facility.treeCanopyCoverage,
    });
    const vector = computeVectorRisk({
      tempC: temp,
      humidity,
      rainfallMm24h: precip,
      rainfallMm7d: rainToDate || rain7,
      standingWaterProxy: facility.drainageVulnerability,
    });

    return {
      date: dateStr,
      tempHigh: Math.round(temp),
      rainfall: Math.round(precip),
      humidity: Math.round(humidity),
      uvIndex: Math.round(uv * 10) / 10,
      heatIllnessRisk: heat.score,
      heatIndex: heat.heatIndex,
      vectorRisk: vector,
    };
  });
}
