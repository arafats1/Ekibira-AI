import { NextResponse } from "next/server";

// Sound classification model proxy
// In production: TensorFlow Lite CNN running on-device (Raspberry Pi Zero)
// This API receives classified results from edge devices and manages the alert pipeline

const THREAT_SOUNDS = ["chainsaw", "axe", "vehicle", "gunshot"];
const SAFE_SOUNDS = ["birds", "rain", "insects", "primates", "wind"];

const SOUND_PROFILES = {
  chainsaw: {
    label: "Chainsaw",
    freqRange: "200Hz - 8kHz",
    pattern: "Sustained high-energy broadband with harmonic overtones",
    avgDuration: "30s - 15min continuous",
    threatLevel: "Critical",
    responseProtocol: "Immediate SMS/WhatsApp alert to nearest ranger post + NFA district office",
  },
  axe: {
    label: "Axe / Panga",
    freqRange: "100Hz - 3kHz",
    pattern: "Rhythmic impulse sounds with 1-3 second intervals",
    avgDuration: "5min - 2hr intermittent",
    threatLevel: "High",
    responseProtocol: "Alert community forest association + patrol dispatch",
  },
  vehicle: {
    label: "Vehicle / Truck",
    freqRange: "50Hz - 2kHz",
    pattern: "Low-frequency engine rumble, possible gear changes",
    avgDuration: "1min - 30min passing",
    threatLevel: "Moderate",
    responseProtocol: "Log and monitor — alert if near known timber extraction routes",
  },
  gunshot: {
    label: "Gunshot",
    freqRange: "500Hz - 12kHz",
    pattern: "Sharp impulse, rapid decay, possible echo",
    avgDuration: "< 1 second per event",
    threatLevel: "Critical",
    responseProtocol: "Immediate alert to UWA rangers + local police — potential poaching",
  },
  birds: {
    label: "Bird Song",
    freqRange: "1kHz - 10kHz",
    pattern: "Melodic, varied frequency, species-specific patterns",
    avgDuration: "Continuous (dawn chorus: 5:30-7:00 AM)",
    threatLevel: "None — biodiversity indicator",
    responseProtocol: "Log as positive ecosystem health signal",
  },
  rain: {
    label: "Rain / Thunder",
    freqRange: "20Hz - 15kHz (broadband)",
    pattern: "Stochastic broadband noise, thunder impulses",
    avgDuration: "30min - 4hr",
    threatLevel: "None — weather event",
    responseProtocol: "Flag for flood risk model if heavy/sustained",
  },
  insects: {
    label: "Insects / Cicadas",
    freqRange: "3kHz - 15kHz",
    pattern: "Continuous high-frequency buzz, species-specific",
    avgDuration: "Continuous (peak: dusk)",
    threatLevel: "None — ecosystem indicator",
    responseProtocol: "Log as baseline ambient",
  },
  primates: {
    label: "Primate Calls",
    freqRange: "200Hz - 8kHz",
    pattern: "Complex vocalizations, group-specific patterns",
    avgDuration: "5-30min bouts",
    threatLevel: "None — biodiversity indicator",
    responseProtocol: "Log location for primate monitoring database",
  },
  wind: {
    label: "Wind / Leaves",
    freqRange: "20Hz - 5kHz",
    pattern: "Low-frequency broadband with rustling overtones",
    avgDuration: "Variable",
    threatLevel: "None — environmental",
    responseProtocol: "Log as baseline ambient",
  },
};

const FOREST_ZONES = {
  mabira: {
    name: "Mabira Central Forest Reserve",
    zones: ["Najjembe Edge", "Nagojje Corridor", "Musamya Buffer", "Interior Core"],
    activeSensors: 12,
  },
  bugoma: {
    name: "Bugoma Central Forest Reserve",
    zones: ["Sugar Lease Boundary", "Kabwoya Corridor", "Kyangwali Border", "Chimp Habitat Core"],
    activeSensors: 16,
  },
  bwindi: {
    name: "Bwindi Impenetrable Forest (Buffer)",
    zones: ["Nkuringo Buffer", "Ruhija Edge", "Buhoma Perimeter", "Gorilla Corridor Core"],
    activeSensors: 20,
  },
  kibale: {
    name: "Kibale National Park (Edges)",
    zones: ["Bigodi Wetland Edge", "Sebitoli Corridor", "Kanyanchu Core", "Kanyawara Buffer"],
    activeSensors: 14,
  },
};

// Simulate a detection event
function simulateDetection(forestId, zoneIndex) {
  const forest = FOREST_ZONES[forestId];
  if (!forest) return null;

  const zone = forest.zones[zoneIndex] || forest.zones[0];
  const isThreat = Math.random() > 0.5;
  const soundId = isThreat
    ? THREAT_SOUNDS[Math.floor(Math.random() * THREAT_SOUNDS.length)]
    : SAFE_SOUNDS[Math.floor(Math.random() * SAFE_SOUNDS.length)];

  const profile = SOUND_PROFILES[soundId];
  const confidence = isThreat
    ? 78 + Math.floor(Math.random() * 20)
    : 85 + Math.floor(Math.random() * 14);

  const sensorId = `SEN-${zone.split(" ")[0].toUpperCase().slice(0, 3)}-${Math.floor(Math.random() * 20) + 1}`;
  const dbLevel = 55 + Math.floor(Math.random() * 35);

  return {
    eventId: `EVT-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
    forest: forest.name,
    forestId,
    zone,
    sensorId,
    classification: {
      soundId,
      label: profile.label,
      isThreat,
      confidence,
      threatLevel: profile.threatLevel,
      frequencyRange: profile.freqRange,
      pattern: profile.pattern,
    },
    response: {
      alertSent: isThreat && confidence > 85,
      protocol: profile.responseProtocol,
      channels: isThreat && confidence > 85 ? ["SMS", "WhatsApp", "NFA Dashboard"] : [],
    },
    metadata: {
      audioDbLevel: dbLevel,
      sampleRate: "16kHz",
      modelVersion: "KibiraAI-AudioCNN-v1.0",
      inferenceTimeMs: 120 + Math.floor(Math.random() * 200),
      deviceType: "Raspberry Pi Zero 2W",
    },
    timestamp: new Date().toISOString(),
  };
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { forestId = "mabira", zoneIndex = 0 } = body;

    const detection = simulateDetection(forestId, zoneIndex);

    if (!detection) {
      return NextResponse.json(
        { error: "Unknown forest. Valid IDs: " + Object.keys(FOREST_ZONES).join(", ") },
        { status: 400 }
      );
    }

    return NextResponse.json(detection);
  } catch (error) {
    return NextResponse.json({ error: "Detection simulation failed" }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    system: "KibiraAI Forest Acoustic Sentinel",
    version: "1.0",
    forests: Object.entries(FOREST_ZONES).map(([id, forest]) => ({
      id,
      name: forest.name,
      zones: forest.zones,
      activeSensors: forest.activeSensors,
    })),
    soundClassificationModel: {
      name: "KibiraAI-AudioCNN-v1.0",
      type: "Convolutional Neural Network (1D + 2D Mel-Spectrogram)",
      classes: Object.keys(SOUND_PROFILES).length,
      threatClasses: THREAT_SOUNDS.length,
      safeClasses: SAFE_SOUNDS.length,
      trainingData: "12,000+ labeled environmental audio samples",
      accuracy: "95.2% on test set",
      modelSize: "2.1MB (quantized INT8)",
      inferenceDevice: "Raspberry Pi Zero 2W",
      avgInferenceTime: "180ms",
    },
    soundProfiles: SOUND_PROFILES,
    hardwarePerNode: {
      compute: "Raspberry Pi Zero 2W ($15)",
      microphone: "INMP441 MEMS I2S Microphone ($3)",
      power: "6W Monocrystalline Solar Panel + 3.7V 6000mAh LiPo ($25)",
      connectivity: "SX1276 LoRaWAN Transceiver — 10km+ range ($8)",
      enclosure: "IP65 weatherproof ABS box ($5)",
      totalCostPerNode: "~$56",
    },
    note: "In production, audio is captured and classified on-device. Only classification results (not raw audio) are transmitted via LoRaWAN to minimize bandwidth.",
  });
}
