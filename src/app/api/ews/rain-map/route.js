import { NextResponse } from "next/server";

/**
 * Forecast rain on a grid over the districts we cover, for the risk map's
 * rainfall layer: daily totals for 7 days at every 0.25° cell (the ECMWF IFS
 * grid) from Open-Meteo. The map sums the days it shows.
 *
 * Each grid point counts as one Open-Meteo call, so the answer is cached for
 * 6 hours, as often as ECMWF runs (about 2,100 calls a day at most).
 */

const GRID = { south: -2.5, north: 2.5, west: 29, east: 35, step: 0.25 };
const CHUNK = 100; // points per request, to keep URLs short
const CORS = { "Access-Control-Allow-Origin": "*" };

function gridPoints() {
  const rows = Math.round((GRID.north - GRID.south) / GRID.step) + 1;
  const cols = Math.round((GRID.east - GRID.west) / GRID.step) + 1;
  const points = [];
  // Row 0 is the northern edge, so the grid reads like the map.
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) points.push({ lat: GRID.north - r * GRID.step, lng: GRID.west + c * GRID.step });
  return { rows, cols, points };
}

async function fetchChunk(points) {
  const url =
    `https://api.open-meteo.com/v1/forecast?latitude=${points.map((p) => p.lat).join(",")}&longitude=${points.map((p) => p.lng).join(",")}` +
    `&daily=precipitation_sum&models=ecmwf_ifs025&forecast_days=7&timezone=Africa%2FKampala`;
  const res = await fetch(url, { signal: AbortSignal.timeout(30000), next: { revalidate: 21600 } });
  if (!res.ok) throw new Error(`${res.status} from Open-Meteo`);
  const data = await res.json();
  return Array.isArray(data) ? data : [data];
}

export async function GET() {
  const { rows, cols, points } = gridPoints();
  try {
    const answers = [];
    for (let i = 0; i < points.length; i += CHUNK) answers.push(...(await fetchChunk(points.slice(i, i + CHUNK))));
    const days = answers.find((a) => a?.daily?.time)?.daily.time || [];
    const rain = answers.map((a) => (a?.daily?.precipitation_sum || []).map((v) => (v == null ? null : Math.round(v * 10) / 10)));
    return NextResponse.json(
      {
        source: "ECMWF IFS 0.25° forecast via Open-Meteo",
        grid: { ...GRID, rows, cols },
        days,
        rain, // rain[row * cols + col][day], mm
      },
      { headers: { ...CORS, "Cache-Control": "public, max-age=900" } }
    );
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502, headers: CORS });
  }
}
