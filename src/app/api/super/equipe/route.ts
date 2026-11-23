import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type TeamMember = {
  id: string;
  label: string;
  email: string | null;
  is_pedagogical_manager: boolean;
};

async function requireAdmin() {
  const supabase = await getServerClient();
  const { data } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  if (!data.user || !(await isSuperAdmin())) return null;
  return { userId: data.user.id, service: getServiceRoleClient() };
}

/** Équipe Byound (super_admins actifs) — pour Paramètres > Équipe. */
export async function GET() {
  const auth = await requireAdmin();
  if (!auth?.service) return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });

  const { data: admins, error } = await auth.service
    .from("super_admins")
    .select("user_id")
    .eq("is_active", true);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ids = [...new Set((admins ?? []).map((r) => String(r.user_id)).filter(Boolean))];
  if (!ids.length) return NextResponse.json({ members: [] });

  const { data: profiles, error: pErr } = await auth.service
    .from("profiles")
    .select("id, full_name, first_name, last_name, email, is_pedagogical_manager")
    .in("id", ids);
  if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

  const members: TeamMember[] = (profiles ?? [])
    .map((row) => {
      const p = row as Record<string, unknown>;
      const email = p.email ? String(p.email) : null;
      const label =
        String(p.full_name ?? "").trim() ||
        [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
        email ||
        String(p.id);
      return {
        id: String(p.id),
        label,
        email,
        is_pedagogical_manager: Boolean(p.is_pedagogical_manager),
      };
    })
    .sort((a, b) => a.label.localeCompare(b.label, "fr"));

  return NextResponse.json({ members });
}

/** Active / désactive le rôle Responsable pédagogique (admin uniquement). */
export async function PATCH(request: NextRequest) {
  const auth = await requireAdmin();
  if (!auth?.service) return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });

  const body = (await request.json().catch(() => ({}))) as {
    user_id?: string;
    is_pedagogical_manager?: boolean;
  };
  const userId = String(body.user_id ?? "").trim();
  if (!userId || typeof body.is_pedagogical_manager !== "boolean") {
    return NextResponse.json({ error: "user_id et is_pedagogical_manager requis" }, { status: 400 });
  }

  const { data: adminRow } = await auth.service
    .from("super_admins")
    .select("user_id")
    .eq("user_id", userId)
    .eq("is_active", true)
    .maybeSingle();
  if (!adminRow) {
    return NextResponse.json({ error: "Profil hors équipe Byound active" }, { status: 400 });
  }

  const { data, error } = await auth.service
    .from("profiles")
    .update({ is_pedagogical_manager: body.is_pedagogical_manager })
    .eq("id", userId)
    .select("id, full_name, email, is_pedagogical_manager")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ member: data });
}
