import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data, error } = await supabase
    .from("crm_qualiopi_reclamations")
    .select("*")
    .order("received_at", { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ reclamations: data ?? [] });
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
  const subject = String(body.subject ?? "").trim();
  if (!subject) return NextResponse.json({ error: "Objet requis" }, { status: 400 });

  const channel = ["email", "satisfaction", "formulaire", "autre"].includes(String(body.channel))
    ? String(body.channel)
    : "autre";

  const { data, error } = await supabase
    .from("crm_qualiopi_reclamations")
    .insert({
      subject,
      requester_name: String(body.requester_name ?? "").trim() || null,
      requester_email: String(body.requester_email ?? "").trim() || null,
      channel,
      description: String(body.description ?? "").trim(),
      session_id: body.session_id ? String(body.session_id) : null,
      status: "open",
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ reclamation: data });
}
