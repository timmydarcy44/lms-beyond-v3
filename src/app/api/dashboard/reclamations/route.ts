import { NextRequest, NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const AUDIENCES = ["entreprise", "expert", "apprenant", "salarie"] as const;

export async function POST(req: NextRequest) {
  const session = await getServerClient();
  if (!session) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }
  const {
    data: { user },
  } = await session.auth.getUser();
  if (!user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const body = (await req.json().catch(() => ({}))) as {
    subject?: string;
    description?: string;
    audience?: string;
    requester_name?: string;
  };

  const subject = String(body.subject ?? "").trim();
  const description = String(body.description ?? "").trim();
  const audience = String(body.audience ?? "").trim();
  if (!subject || subject.length < 3) {
    return NextResponse.json({ error: "Objet trop court" }, { status: 400 });
  }
  if (!description || description.length < 10) {
    return NextResponse.json({ error: "Décrivez le problème (10 caractères min.)" }, { status: 400 });
  }
  if (!(AUDIENCES as readonly string[]).includes(audience)) {
    return NextResponse.json({ error: "Espace dashboard invalide" }, { status: 400 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, first_name, last_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const nameFromProfile = [
    profile?.first_name,
    profile?.last_name,
  ]
    .filter(Boolean)
    .join(" ")
    .trim();
  const requesterName =
    String(body.requester_name ?? "").trim() ||
    nameFromProfile ||
    (profile?.full_name ? String(profile.full_name) : null) ||
    user.email ||
    null;

  const { data, error } = await supabase
    .from("crm_qualiopi_reclamations")
    .insert({
      subject,
      description,
      audience,
      channel: "dashboard",
      requester_name: requesterName,
      requester_email: user.email ?? (profile?.email ? String(profile.email) : null),
      requester_user_id: user.id,
      status: "open",
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true, id: data.id });
}
