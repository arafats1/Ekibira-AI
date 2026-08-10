import { NextResponse } from "next/server";
import { THRESHOLDS, PLAYBOOKS } from "@/lib/early-warning/thresholds";

export async function GET() {
  return NextResponse.json({
    version: THRESHOLDS.version,
    updatedAt: THRESHOLDS.updatedAt,
    thresholds: THRESHOLDS,
    playbooks: PLAYBOOKS,
    notes:
      "Child-sensitive thresholds for schools and clinics. Levels: normal < watch < warning < critical.",
  });
}
