import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";
import { getServiceRoleClient } from "@/lib/supabase/server";

const pick = (v: unknown) => {
  const s = String(v ?? "").trim();
  return s || null;
};

export async function GET() {
  const allowed = await isSuperAdmin();
  if (!allowed) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("validators")
    .select("*")
    .order("last_name", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const jessicaEmail = JESSICA_CONTENTIN_EMAIL.toLowerCase();
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email, role")
    .or(`role.eq.formateur,role.eq.instructor,email.ilike.${jessicaEmail},full_name.ilike.%contentin%`);
  const formateurs = ((profiles ?? []) as Array<{ id?: string; full_name?: string | null; email?: string | null; role?: string | null }>)
    .filter((profile) => {
      const role = String(profile.role ?? "").toLowerCase();
      const email = String(profile.email ?? "").toLowerCase();
      const name = String(profile.full_name ?? "").toLowerCase();
      return role === "formateur" || role === "instructor" || role.includes("formateur") || email === jessicaEmail || name.includes("contentin");
    })
    .map((profile) => ({
      id: String(profile.id),
      name: String(profile.full_name ?? "").trim() || String(profile.email ?? "").trim() || String(profile.id),
    }))
    .filter((profile) => profile.id)
    .sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));

  return NextResponse.json({ validators: data ?? [], formateurs });
}

export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const supabase = getServiceRoleClient();
  if (!supabase) {
    return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  }

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const first_name = pick(body?.first_name);
  const last_name = pick(body?.last_name);
  if (!first_name || !last_name) {
    return NextResponse.json({ error: "Prénom et nom requis" }, { status: 400 });
  }

  const row: Record<string, unknown> = {
    first_name,
    last_name,
    description: pick(body?.description),
    photo_url: pick(body?.photo_url),
  };

  const { data, error } = await supabase.from("validators").insert(row).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ validator: data });
}
