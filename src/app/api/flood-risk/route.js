import { NextResponse } from "next/server";

// Kampala neighborhood flood risk model
// In production, this would pull from real satellite data (Sentinel-1 radar),
// weather APIs, and drainage topology databases
const NEIGHBORHOOD_BASELINES = {
  bwaise: {
    name: "Bwaise",
    baseFloodRisk: 72,
    drainageCapacity: 0.2, // 0-1 scale, lower = worse
    elevation: 1140,
    soilPermeability: 0.15,
    historicalFloodFrequency: 4.2, // events per year
    criticalDrainagePoints: [
      { name: "Lubigi Channel Junction", lat: 0.3480, lng: 32.5665, blockageRisk: 0.85 },
      { name: "Bwaise Railway Crossing", lat: 0.3472, lng: 32.5680, blockageRisk: 0.72 },
    ],
  },
  katanga: {
    name: "Katanga",
    baseFloodRisk: 45,
    drainageCapacity: 0.5,
    elevation: 1190,
    soilPermeability: 0.3,
    historicalFloodFrequency: 1.8,
    criticalDrainagePoints: [
      { name: "Mulago Hill Runoff Channel", lat: 0.3330, lng: 32.5700, blockageRisk: 0.55 },
    ],
  },
  namuwongo: {
    name: "Namuwongo",
    baseFloodRisk: 68,
    drainageCapacity: 0.25,
    elevation: 1130,
    soilPermeability: 0.18,
    historicalFloodFrequency: 3.5,
    criticalDrainagePoints: [
      { name: "Nakivubo Channel Outlet", lat: 0.3055, lng: 32.6100, blockageRisk: 0.78 },
      { name: "Lake Victoria Edge", lat: 0.3050, lng: 32.6105, blockageRisk: 0.4 },
    ],
  },
  kalerwe: {
    name: "Kalerwe",
    baseFloodRisk: 55,
    drainageCapacity: 0.4,
    elevation: 1155,
    soilPermeability: 0.25,
    historicalFloodFrequency: 2.3,
    criticalDrainagePoints: [
      { name: "Kalerwe Market Drain", lat: 0.3512, lng: 32.5748, blockageRisk: 0.68 },
    ],
  },
  kisenyi: {
    name: "Kisenyi",
    baseFloodRisk: 52,
    drainageCapacity: 0.35,
    elevation: 1175,
    soilPermeability: 0.22,
    historicalFloodFrequency: 2.0,
    criticalDrainagePoints: [
      { name: "Nsooba-Lubigi Junction", lat: 0.3142, lng: 32.5688, blockageRisk: 0.75 },
      { name: "Owino Market Drain", lat: 0.3135, lng: 32.5690, blockageRisk: 0.62 },
    ],
  },
};

function calculateFloodRisk(neighborhoodId, rainfallMm, soilSaturation, hoursAhead) {
  const baseline = NEIGHBORHOOD_BASELINES[neighborhoodId];
  if (!baseline) return null;

  // ML-inspired risk scoring (simplified deterministic model for demo)
  // In production: trained on historical flood events + Sentinel-1 SAR data
  const rainfallFactor = Math.min(1, rainfallMm / 60); // normalized, 60mm = extreme
  const saturationFactor = soilSaturation; // 0-1
  const drainagePenalty = 1 - baseline.drainageCapacity;
  const elevationFactor = Math.max(0, (1200 - baseline.elevation) / 100); // lower = riskier

  const rawRisk =
    baseline.baseFloodRisk * 0.3 +
    rainfallFactor * 35 +
    saturationFactor * 20 +
    drainagePenalty * 10 +
    elevationFactor * 5;

  // Time decay — risk decreases as prediction horizon increases
  const timeDecay = Math.max(0.6, 1 - hoursAhead * 0.004);
  const finalRisk = Math.min(100, Math.round(rawRisk * timeDecay));

  // Determine alert level
  let alertLevel, alertMessage, actions;
  if (finalRisk >= 85) {
    alertLevel = "CRITICAL";
    alertMessage = `Severe flooding expected in ${baseline.name}. Immediate evacuation of low-lying areas recommended.`;
    actions = [
      "Move to higher ground immediately",
      "Secure valuables above known flood line",
      "Avoid drainage channels and low-lying roads",
      "Contact community leaders for evacuation routes",
    ];
  } else if (finalRisk >= 65) {
    alertLevel = "HIGH";
    alertMessage = `High flood risk in ${baseline.name}. Prepare for potential flooding in the next ${hoursAhead} hours.`;
    actions = [
      "Move valuables to elevated positions",
      "Prepare emergency supplies (water, food, phone charger)",
      "Monitor drainage channels for rising water levels",
      "Stay informed via SMS/WhatsApp alerts",
    ];
  } else if (finalRisk >= 40) {
    alertLevel = "MODERATE";
    alertMessage = `Moderate flood risk in ${baseline.name}. Standard precautions recommended.`;
    actions = [
      "Clear drainage gutters around your property",
      "Avoid discarding waste in drainage channels",
      "Keep emergency contacts accessible",
    ];
  } else {
    alertLevel = "LOW";
    alertMessage = `Low flood risk in ${baseline.name}. No immediate action required.`;
    actions = ["Continue normal activities", "Stay informed of weather updates"];
  }

  return {
    neighborhoodId,
    neighborhoodName: baseline.name,
    riskScore: finalRisk,
    alertLevel,
    alertMessage,
    actions,
    factors: {
      rainfallMm,
      soilSaturation: Math.round(soilSaturation * 100),
      drainageCapacity: Math.round(baseline.drainageCapacity * 100),
      elevation: baseline.elevation,
      historicalFrequency: baseline.historicalFloodFrequency,
    },
    criticalPoints: baseline.criticalDrainagePoints,
    predictionHorizon: `${hoursAhead} hours`,
    generatedAt: new Date().toISOString(),
    model: "KibiraAI Flood Risk v1.0 (deterministic proxy)",
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      neighborhoodId = "bwaise",
      rainfallMm = 30,
      soilSaturation = 0.5,
      hoursAhead = 48,
    } = body;

    const result = calculateFloodRisk(neighborhoodId, rainfallMm, soilSaturation, hoursAhead);

    if (!result) {
      return NextResponse.json(
        { error: "Unknown neighborhood. Valid IDs: " + Object.keys(NEIGHBORHOOD_BASELINES).join(", ") },
        { status: 400 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: "Failed to calculate flood risk" }, { status: 500 });
  }
}

export async function GET() {
  // Return risk for all neighborhoods with default weather
  const results = Object.keys(NEIGHBORHOOD_BASELINES).map((id) =>
    calculateFloodRisk(id, 35, 0.5, 48)
  );

  return NextResponse.json({
    city: "Kampala",
    country: "Uganda",
    neighborhoods: results,
    generatedAt: new Date().toISOString(),
    dataSource: "KibiraAI Flood Risk Model v1.0",
    note: "In production, rainfall and soil data would come from live weather APIs and Sentinel-1 satellite radar",
  });
}
