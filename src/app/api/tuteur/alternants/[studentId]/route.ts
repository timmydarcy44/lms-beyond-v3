import { NextRequest, NextResponse } from "next/server";

import { requireTutorClient } from "@/lib/tuteur/require-tutor";
import { loadTutorFiche } from "@/lib/tuteur/tutor-fiche-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ studentId: string }> },
) {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const { studentId } = await params;
  const fiche = await loadTutorFiche(auth.ctx.supabase, auth.ctx.userId, auth.ctx.tutorName, studentId);
  if (!fiche) return NextResponse.json({ error: "Alternant introuvable" }, { status: 404 });
  return NextResponse.json(fiche);
}
