import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
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

  return NextResponse.json({ validators: data ?? [] });
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
