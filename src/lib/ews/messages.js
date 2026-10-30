/**
 * Impact-based SMS messages: what the hazard means for this kind of person
 * and what to do about it, in plain words that fit an SMS.
 *
 * English templates are the source of truth. Other languages are drafted by
 * AI and must be checked by a native speaker before sending (the console
 * enforces this).
 */

import { HAZARD_LABELS } from "./hazards";

const LEAD = { warning: "WARNING", watch: "BE READY", advisory: "NOTICE" };

const TEMPLATES = {
  heavy_rain: {
    farmer: "Heavy rain {when} in {district} ({chance}). Clear trenches, delay spraying and fertiliser, harvest mature crops early.",
    vendor: "Heavy rain {when} in {district} ({chance}). Raise goods off the ground, cover stock, keep stalls clear of drains.",
    flood_zone_resident: "Heavy rain {when} in {district} ({chance}). Move valuables up high, keep children away from drains and rivers.",
    pastoralist: "Heavy rain {when} in {district} ({chance}). Do not cross flooded valleys with animals. Check hooves and ticks after.",
    fisher: "Heavy rain and storms possible {when} in {district} ({chance}). Stay near the shore and return early.",
    other: "Heavy rain {when} in {district} ({chance}). Keep away from drains and rivers. Do not cross flowing water.",
  },
  flood: {
    farmer: "Flood risk {when} near rivers in {district} ({chance}). Move animals and stored harvest to high ground.",
    vendor: "Flood risk {when} in {district} ({chance}). Move stock from low-lying markets. Do not cross flowing water.",
    flood_zone_resident: "Flood risk {when} in {district} ({chance}). Pack documents and medicine, know your route to high ground. Leave if water rises.",
    pastoralist: "Flood risk {when} in {district} ({chance}). Move animals away from rivers and low grazing land now.",
    fisher: "Rivers rising {when} in {district} ({chance}). Secure boats and nets, avoid river mouths.",
    other: "Flood risk {when} in {district} ({chance}). Keep away from rivers. Never walk or drive through flowing water.",
  },
  landslide: {
    farmer: "Landslide risk {when} in {district} ({chance}). Avoid steep gardens. If you see cracks, tilting trees or muddy springs, leave.",
    vendor: "Landslide risk {when} in {district} ({chance}). Avoid travel on steep roads. Watch for cracks and falling rocks.",
    flood_zone_resident: "Landslide risk {when} in {district} ({chance}). If you live on a slope, sleep elsewhere. Cracks or muddy springs: leave now.",
    pastoralist: "Landslide risk {when} in {district} ({chance}). Keep animals off steep slopes and away from river banks.",
    fisher: "Landslide risk {when} in {district} ({chance}). Avoid steep paths and river banks.",
    other: "Landslide risk {when} in {district} ({chance}). Slope homes: watch for cracks, tilting trees, muddy springs. Leave if seen.",
  },
  dry_spell: {
    farmer: "Dry week likely in {district} ({chance}). Wait to plant until rain returns. Mulch and save water.",
    vendor: "Dry week likely in {district} ({chance}). Store water and keep fresh produce shaded.",
    flood_zone_resident: "Dry week likely in {district} ({chance}). Store clean water.",
    pastoralist: "Dry week likely in {district} ({chance}). Plan water and pasture now. Avoid overcrowding at dams.",
    fisher: "Dry week likely in {district} ({chance}).",
    other: "Dry week likely in {district} ({chance}). Store water and avoid planting until rain returns.",
  },
};

const GSM7 =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM7_EXT = "^{}\\[~]|€";

/** SMS segment count, matching how carriers bill. */
export function smsSegments(text) {
  const chars = [...text];
  const gsm = chars.every((c) => GSM7.includes(c) || GSM7_EXT.includes(c));
  if (gsm) {
    const len = chars.reduce((n, c) => n + (GSM7_EXT.includes(c) ? 2 : 1), 0);
    return { encoding: "GSM-7", length: len, segments: len <= 160 ? 1 : Math.ceil(len / 153) };
  }
  return { encoding: "UCS-2", length: chars.length, segments: chars.length <= 70 ? 1 : Math.ceil(chars.length / 67) };
}

/** Footer the backend appends; included here so length estimates are honest. */
export const FOOTER_SAMPLE = "\nDid it happen? Reply 1234 1=Heavy rain 3=Flood 5=No rain. -KibiraAI";

function whenPhrase(date, endDate, now = new Date()) {
  if (!date) return "this week";
  const day = new Date(`${date}T12:00:00+03:00`);
  const todayKampala = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Kampala" }));
  todayKampala.setHours(12, 0, 0, 0);
  const diff = Math.round((day - todayKampala) / 86400000);
  const label = day.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Africa/Kampala" });
  let when;
  if (diff <= 0) when = "today";
  else if (diff === 1) when = "tomorrow";
  else when = `on ${label}`;
  if (endDate && endDate !== date) when = diff <= 0 ? "from today" : diff === 1 ? "from tomorrow" : `from ${label}`;
  return when;
}

function chancePhrase(probability) {
  if (probability == null) return "rivers rising";
  const tenths = Math.max(1, Math.min(10, Math.round(probability * 10)));
  return `${tenths} in 10 chance`;
}

/** Draft one English message per persona for a hazard signal. */
export function draftMessages(signal, districtName, personas) {
  const templates = TEMPLATES[signal.hazard];
  if (!templates) return [];
  return personas.map((persona) => {
    const body = (templates[persona] || templates.other)
      .replace("{when}", whenPhrase(signal.date, signal.endDate))
      .replace("{district}", districtName)
      .replace("{chance}", chancePhrase(signal.probability));
    const message = `${LEAD[signal.severity]}: ${body}`;
    return {
      persona,
      hazard: signal.hazard,
      hazardLabel: HAZARD_LABELS[signal.hazard],
      severity: signal.severity,
      message,
      sms: smsSegments(message + FOOTER_SAMPLE),
    };
  });
}
