import { NextResponse } from "next/server";
import { listStations, stationStats, buildTelemetry, getStation } from "@/lib/early-warning/stations";
import { getFacility } from "@/lib/early-warning/facilities";
import { fetchWeatherBundle, liveSnapshot } from "@/lib/early-warning/weather";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const status = searchParams.get("status") || undefined;
    const live = searchParams.get("live") !== "0";

    if (id) {
      const station = getStation(id);
      if (!station) {
        return NextResponse.json({ error: "Station not found" }, { status: 404 });
      }
      let snapshot = null;
      if (live) {
        const facility = getFacility(station.facilityId);
        if (facility) {
          const { weather, air } = await fetchWeatherBundle(facility.lat, facility.lng);
          snapshot = liveSnapshot(weather, air);
        }
      }
      return NextResponse.json({
        version: "1.0.0",
        station: buildTelemetry(station, snapshot),
      });
    }

    const stations = listStations({ status });
    const enriched = await Promise.all(
      stations.map(async (stn) => {
        if (!live) return buildTelemetry(stn, null);
        try {
          const facility = getFacility(stn.facilityId);
          if (!facility) return buildTelemetry(stn, null);
          const { weather, air } = await fetchWeatherBundle(facility.lat, facility.lng);
          return buildTelemetry(stn, liveSnapshot(weather, air));
        } catch {
          return buildTelemetry(stn, null);
        }
      })
    );

    return NextResponse.json({
      version: "1.0.0",
      stats: stationStats(),
      count: enriched.length,
      stations: enriched,
      generatedAt: new Date().toISOString(),
    });
  } catch {
    return NextResponse.json({ error: "Failed to load stations" }, { status: 500 });
  }
}
