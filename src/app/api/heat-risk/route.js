import { NextResponse } from "next/server";

// Kampala neighborhood heat island model
// In production: Landsat Band 10 thermal imagery + ground weather stations
const HEAT_BASELINES = {
  bwaise: {
    name: "Bwaise",
    baseTemp: 28.5,
    urbanHeatIslandDelta: 5.2, // °C above rural
    treeCanopyCoverage: 0.04, // 4%
    imperviousSurface: 0.82, // 82% concrete/metal
    populationDensity: 28000, // per km²
    albedo: 0.18, // low = absorbs more heat
    vulnerablePopulation: 0.35, // 35% elderly/children/sick
  },
  katanga: {
    name: "Katanga",
    baseTemp: 29.2,
    urbanHeatIslandDelta: 7.1,
    treeCanopyCoverage: 0.02,
    imperviousSurface: 0.91,
    populationDensity: 42000,
    albedo: 0.15,
    vulnerablePopulation: 0.30,
  },
  namuwongo: {
    name: "Namuwongo",
    baseTemp: 27.8,
    urbanHeatIslandDelta: 4.5,
    treeCanopyCoverage: 0.06,
    imperviousSurface: 0.75,
    populationDensity: 22000,
    albedo: 0.20,
    vulnerablePopulation: 0.32,
  },
  kalerwe: {
    name: "Kalerwe",
    baseTemp: 27.2,
    urbanHeatIslandDelta: 3.8,
    treeCanopyCoverage: 0.08,
    imperviousSurface: 0.68,
    populationDensity: 18000,
    albedo: 0.22,
    vulnerablePopulation: 0.28,
  },
  kisenyi: {
    name: "Kisenyi",
    baseTemp: 29.0,
    urbanHeatIslandDelta: 6.5,
    treeCanopyCoverage: 0.01,
    imperviousSurface: 0.88,
    populationDensity: 38000,
    albedo: 0.16,
    vulnerablePopulation: 0.33,
  },
};

const RURAL_BASELINE_TEMP = 24.5; // °C — Kampala rural average

function calculateHeatRisk(neighborhoodId, ambientTemp, humidity, windSpeed) {
  const baseline = HEAT_BASELINES[neighborhoodId];
  if (!baseline) return null;

  // Calculate effective temperature with urban heat island effect
  const uhi = baseline.urbanHeatIslandDelta;
  const effectiveTemp = ambientTemp + uhi;

  // Heat index (simplified) — combines temperature and humidity
  const heatIndex = effectiveTemp + (humidity * 0.05);

  // Wind cooling factor
  const windCooling = Math.min(2, windSpeed * 0.3);
  const perceivedTemp = heatIndex - windCooling;

  // Risk scoring (0-100)
  const tempScore = Math.min(40, Math.max(0, (perceivedTemp - 28) * 5));
  const densityScore = Math.min(20, (baseline.populationDensity / 50000) * 20);
  const canopyPenalty = (1 - baseline.treeCanopyCoverage) * 15;
  const albedoPenalty = (0.3 - baseline.albedo) * 50;
  const vulnerabilityScore = baseline.vulnerablePopulation * 30;

  const riskScore = Math.min(100, Math.round(
    tempScore + densityScore + canopyPenalty + albedoPenalty + vulnerabilityScore * 0.3
  ));

  // Cooling interventions
  const interventions = [];
  if (baseline.treeCanopyCoverage < 0.1) {
    const treesNeeded = Math.round((0.15 - baseline.treeCanopyCoverage) * 2000);
    interventions.push({
      type: "Tree Planting",
      impact: `Plant ${treesNeeded} native shade trees to increase canopy from ${Math.round(baseline.treeCanopyCoverage * 100)}% to 15%`,
      tempReduction: `−${(treesNeeded * 0.008).toFixed(1)}°C`,
      priority: "High",
    });
  }
  if (baseline.albedo < 0.25) {
    interventions.push({
      type: "Cool Roofs",
      impact: `Apply reflective coating to ${Math.round(baseline.imperviousSurface * 100 * 0.3)}% of rooftops`,
      tempReduction: `−${((0.25 - baseline.albedo) * 15).toFixed(1)}°C`,
      priority: "Medium",
    });
  }
  if (baseline.imperviousSurface > 0.7) {
    interventions.push({
      type: "Green Infrastructure",
      impact: "Create micro-parks, vertical gardens, and permeable surfaces",
      tempReduction: `−${((baseline.imperviousSurface - 0.6) * 8).toFixed(1)}°C`,
      priority: "Medium",
    });
  }
  interventions.push({
    type: "Heat Refuge Stations",
    impact: `Establish ${Math.ceil(baseline.populationDensity / 10000)} shaded water distribution points`,
    tempReduction: "Immediate relief for vulnerable populations",
    priority: "High",
  });

  // Alert level
  let alertLevel, healthAdvisory;
  if (riskScore >= 80) {
    alertLevel = "EXTREME";
    healthAdvisory = "Dangerous heat conditions. Stay indoors during 11am-3pm. Hydrate frequently. Check on elderly neighbors.";
  } else if (riskScore >= 60) {
    alertLevel = "HIGH";
    healthAdvisory = "High heat stress risk. Limit outdoor activity during peak hours. Seek shade and water regularly.";
  } else if (riskScore >= 40) {
    alertLevel = "MODERATE";
    healthAdvisory = "Moderate heat. Stay hydrated and take breaks in shade during outdoor work.";
  } else {
    alertLevel = "LOW";
    healthAdvisory = "Normal conditions. Standard precautions for outdoor activity.";
  }

  return {
    neighborhoodId,
    neighborhoodName: baseline.name,
    riskScore,
    alertLevel,
    healthAdvisory,
    temperatures: {
      ruralBaseline: RURAL_BASELINE_TEMP,
      ambientTemp,
      urbanHeatIslandEffect: `+${uhi}°C`,
      effectiveTemp: Math.round(effectiveTemp * 10) / 10,
      perceivedTemp: Math.round(perceivedTemp * 10) / 10,
    },
    surfaceAnalysis: {
      treeCanopyCoverage: `${Math.round(baseline.treeCanopyCoverage * 100)}%`,
      imperviousSurface: `${Math.round(baseline.imperviousSurface * 100)}%`,
      albedo: baseline.albedo,
      populationDensity: `${baseline.populationDensity.toLocaleString()}/km²`,
    },
    interventions,
    generatedAt: new Date().toISOString(),
    model: "KibiraAI Heat Island v1.0 (Landsat Band 10 proxy)",
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      neighborhoodId = "bwaise",
      ambientTemp = 28,
      humidity = 65,
      windSpeed = 2,
    } = body;

    const result = calculateHeatRisk(neighborhoodId, ambientTemp, humidity, windSpeed);

    if (!result) {
      return NextResponse.json(
        { error: "Unknown neighborhood. Valid IDs: " + Object.keys(HEAT_BASELINES).join(", ") },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to calculate heat risk" }, { status: 500 });
  }
}

export async function GET() {
  const results = Object.keys(HEAT_BASELINES).map((id) =>
    calculateHeatRisk(id, 28, 65, 2)
  );

  return NextResponse.json({
    city: "Kampala",
    country: "Uganda",
    ruralBaseline: `${RURAL_BASELINE_TEMP}°C`,
    neighborhoods: results,
    generatedAt: new Date().toISOString(),
    dataSource: "KibiraAI Heat Island Model v1.0",
    note: "In production, thermal data would come from Landsat Band 10 satellite imagery and ground weather stations",
  });
}
