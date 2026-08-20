import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: attendee } = await supabase
    .from("crm_qualiopi_attendees")
    .select("*, crm_qualiopi_sessions(course_name)")
    .eq("satisfaction_token", token)
    .maybeSingle();
  if (!attendee) return NextResponse.json({ error: "Lien invalide" }, { status: 404 });
  return NextResponse.json({ attendee });
}

export async function POST(req: NextRequest, ctx: Ctx) {
  const { token } = await ctx.params;
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const score = Number(body?.score);
  const comment = String(body?.comment ?? "").trim();
  if (!Number.isFinite(score) || score < 1 || score > 5) {
    return NextResponse.json({ error: "Notez de 1 à 5." }, { status: 400 });
  }

  const { data: attendee } = await supabase
    .from("crm_qualiopi_attendees")
    .select("*")
    .eq("satisfaction_token", token)
    .maybeSingle();
  if (!attendee) return NextResponse.json({ error: "Lien invalide" }, { status: 404 });

  const { data: updated, error } = await supabase
    .from("crm_qualiopi_attendees")
    .update({
      satisfaction_score: score,
      satisfaction_comment: comment || null,
      satisfaction_at: new Date().toISOString(),
    })
    .eq("id", attendee.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ attendee: updated });
}
