import { NextResponse } from "next/server";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const URGENCY = new Set(["basse", "normale"]);

export async function POST(request: Request) {
  const supabase = await getServerClient();
  if (!supabase) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.id) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as {
    label?: string;
    skillId?: string | null;
    message?: string | null;
    urgency?: string;
  } | null;
  const label = String(body?.label ?? "").trim();
  if (!label || label.length > 160) {
    return NextResponse.json({ error: "Indiquez un thème." }, { status: 400 });
  }
  const urgency = URGENCY.has(String(body?.urgency)) ? String(body?.urgency) : "normale";
  const message = String(body?.message ?? "").trim().slice(0, 2000) || null;

  const db = (await getServiceRoleClientOrFallback()) ?? supabase;
  const { data: profile } = await db
    .from("profiles")
    .select("company_id")
    .eq("id", user.id)
    .maybeSingle();
  const { data: employee } = await db
    .from("employees")
    .select("company_id")
    .or(`profile_id.eq.${user.id}${user.email ? `,email.eq.${user.email}` : ""}`)
    .limit(1)
    .maybeSingle();
  const companyId = String(profile?.company_id ?? employee?.company_id ?? "").trim() || null;

  const { data, error } = await db
    .from("training_requests")
    .insert({
      user_id: user.id,
      company_id: companyId,
      skill_id: body?.skillId ? String(body.skillId).slice(0, 120) : null,
      label,
      message,
      urgency,
      status: "new",
    })
    .select("id, status, created_at")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ ok: true, request: data });
}
