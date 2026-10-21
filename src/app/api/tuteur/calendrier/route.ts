import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { jadeCalendar } from "@/lib/demo/jade-tutor-pages";
import { loadTutorCalendar } from "@/lib/tuteur/calendar-server";
import { relationMissing } from "@/lib/tuteur/followup-server";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";

const planSchema = z.object({
  apprenticeId: z.string().min(1),
  type: z.enum(["monthly", "onboarding", "tripartite", "other"]),
  date: z.string().min(8),
  time: z.string().min(4),
  durationMinutes: z.coerce.number().int().min(15).max(480),
  remote: z.boolean(),
  location: z.string().trim().min(1),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const anchor = new URL(request.url).searchParams.get("date");
  if (isJadeDemoEmail(auth.ctx.email)) return NextResponse.json(jadeCalendar(anchor));
  const board = await loadTutorCalendar(auth.ctx.supabase, auth.ctx.userId, anchor);
  return NextResponse.json(board);
}

export async function POST(request: NextRequest) {
  const auth = await requireTutorClient();
  if (!auth.ok) return NextResponse.json({ error: auth.message }, { status: auth.status });
  const parsed = planSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Vérifiez la date, l'heure et le lieu." }, { status: 400 });
  if (isJadeDemoEmail(auth.ctx.email)) return NextResponse.json({ ok: true, id: "rdv-demo" });
  const owned = await auth.ctx.supabase
    .from("tutor_assignments")
    .select("id")
    .eq("tutor_id", auth.ctx.userId)
    .eq("learner_id", parsed.data.apprenticeId)
    .in("status", ["active", "paused"])
    .maybeSingle();
  if (!owned.data) return NextResponse.json({ error: "Alternant introuvable" }, { status: 404 });
  const starts = new Date(`${parsed.data.date}T${parsed.data.time}:00`);
  if (Number.isNaN(starts.getTime())) return NextResponse.json({ error: "Date invalide" }, { status: 400 });
  const ends = new Date(starts.getTime() + parsed.data.durationMinutes * 60 * 1000);
  const created = await auth.ctx.supabase.from("tutor_appointments").insert({
    tutor_id: auth.ctx.userId,
    apprentice_id: parsed.data.apprenticeId,
    type: parsed.data.type,
    starts_at: starts.toISOString(),
    ends_at: ends.toISOString(),
    location: parsed.data.location,
    is_remote: parsed.data.remote,
    notes: parsed.data.notes ?? null,
  }).select("id").single();
  if (relationMissing(created.error) || created.error) {
    return NextResponse.json({ error: "Le rendez-vous n'a pas pu être enregistré." }, { status: 500 });
  }
  await auth.ctx.supabase.from("notifications").insert({
    user_id: parsed.data.apprenticeId,
    type: "info",
    title: "Rendez-vous planifié",
    message: `Votre tuteur a planifié un rendez-vous le ${parsed.data.date} à ${parsed.data.time}.`,
    read: false,
  });
  return NextResponse.json({ ok: true, id: created.data.id });
}
