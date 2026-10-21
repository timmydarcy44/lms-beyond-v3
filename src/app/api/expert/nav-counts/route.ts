import { NextResponse } from "next/server";

import { loadExpertNavCounts } from "@/lib/expert/space-server";

export async function GET() {
  return NextResponse.json(await loadExpertNavCounts());
}
