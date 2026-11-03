import { NextResponse } from "next/server";

/**
 * Forecast rain grid for the risk map's rainfall layer: daily totals for 7
 * days at every 0.25° cell. The backend builds it every 6 hours in paced
 * batches (Open-Meteo allows 600 calls a minute and the grid is 525 points),
 * so this only passes the stored grid on.
 */

const CORS = { "Access-Control-Allow-Origin": "*" };

export async function GET() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_STRAPI_URL}/api/ews/rain-map`, { signal: AbortSignal.timeout(15000), cache: "no-store" });
    const data = await res.json();
    if (!res.ok) return NextResponse.json({ error: data?.error || `${res.status} from the backend` }, { status: 502, headers: CORS });
    return NextResponse.json(data, { headers: { ...CORS, "Cache-Control": "public, max-age=900" } });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 502, headers: CORS });
  }
}
