import type { SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { relationMissing } from "@/lib/tuteur/followup-server";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";

const updateSchema = z.object({
  date: z.string().min(8),
  time: z.string().min(4),
  durationMinutes: z.coerce.number().int().min(15).max(480),
  location: z.string().trim().min(1),
  remote: z.boolean(),
  notes: z.string().optional(),
});

async function owned(supabase: SupabaseClient, tutorId: string, id: string) {
  const row = await supabase.from("tutor_appointments").select("id, tutor_id").eq("id", id).maybeSingle();
  if (relationMissing(row.error) || !row.data || row.data.tutor_id !== tutorId) return null;
  return row.data;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (isJadeDemoEmail(auth.ctx.email)) return NextResponse.json({ ok: true });
  const { id } = await params;
  const parsed = updateSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Vérifiez les informations du rendez-vous." }, { status: 400 });
  const row = await owned(auth.ctx.supabase, auth.ctx.userId, id);
  if (!row) return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
  const starts = new Date(`${parsed.data.date}T${parsed.data.time}:00`);
  const ends = new Date(starts.getTime() + parsed.data.durationMinutes * 60 * 1000);
  const updated = await auth.ctx.supabase.from("tutor_appointments").update({
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    location: parsed.data.location,
    is_remote: parsed.data.remote,
    notes: parsed.data.notes ?? null,
  }).eq("id", id);
  if (updated.error) return NextResponse.json({ error: "La modification n'a pas pu être enregistrée." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  if (isJadeDemoEmail(auth.ctx.email)) return NextResponse.json({ ok: true });
  const { id } = await params;
  const row = await owned(auth.ctx.supabase, auth.ctx.userId, id);
  if (!row) return NextResponse.json({ error: "Rendez-vous introuvable" }, { status: 404 });
  const removed = await auth.ctx.supabase.from("tutor_appointments").delete().eq("id", id);
  if (removed.error) return NextResponse.json({ error: "L'annulation n'a pas pu être enregistrée." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
