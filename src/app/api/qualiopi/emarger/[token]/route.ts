import { NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: attendee } = await supabase
    .from("crm_qualiopi_attendees")
    .select("*, crm_qualiopi_sessions(course_name, deal_id)")
    .eq("token", token)
    .maybeSingle();
  if (!attendee) return NextResponse.json({ error: "Lien invalide" }, { status: 404 });

  return NextResponse.json({ attendee });
}

export async function POST(_req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data: attendee } = await supabase
    .from("crm_qualiopi_attendees")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  if (!attendee) return NextResponse.json({ error: "Lien invalide" }, { status: 404 });

  if (attendee.signed_at) {
    return NextResponse.json({ attendee, already: true });
  }

  const now = new Date().toISOString();
  const { data: updated, error } = await supabase
    .from("crm_qualiopi_attendees")
    .update({ signed_at: now })
    .eq("id", attendee.id)
    .select()
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ attendee: updated, already: false });
}
