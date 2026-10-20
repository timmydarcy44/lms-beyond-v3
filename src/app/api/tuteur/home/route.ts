import { NextResponse } from "next/server";

import { requireTutorClient } from "@/lib/tuteur/require-tutor";
import { buildTutorHome } from "@/lib/tuteur/tutor-home-server";

export async function GET() {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const payload = await buildTutorHome(auth.ctx.supabase, auth.ctx.userId, auth.ctx.tutorName);
  return NextResponse.json(payload);
}
