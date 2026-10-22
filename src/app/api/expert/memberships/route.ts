import { NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { loadExpertPoleState, type ExpertPole, type MembershipStatus } from "@/lib/expert/poles";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

function asPole(value: unknown): ExpertPole | null {
  return value === "formation" || value === "care" ? value : null;
}

function asStatus(value: unknown): MembershipStatus | null {
  return value === "active" || value === "pending" || value === "suspended" ? value : null;
}

async function access() {
  const [superAdmin, state, userClient] = await Promise.all([isSuperAdmin(), loadExpertPoleState(), getServerClient()]);
  const supabase = superAdmin ? (getServiceRoleClient() ?? userClient) : userClient;
  return { superAdmin, state, supabase };
}

function can(pole: ExpertPole, superAdmin: boolean, managerPoles: ExpertPole[]) {
  return superAdmin || managerPoles.includes(pole);
}

export async function GET(request: Request) {
  const { superAdmin, state, supabase } = await access();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  if (!superAdmin && state.managerPoles.length === 0) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const requested = asPole(new URL(request.url).searchParams.get("pole"));
  let query = supabase.from("expert_memberships").select("id,expert_id,pole,status,joined_at").order("created_at", { ascending: false });
  if (!superAdmin) query = query.in("pole", state.managerPoles);
  else if (requested) query = query.eq("pole", requested);
  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ memberships: data ?? [], managerPoles: state.managerPoles, superAdmin });
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    kind?: string;
    expertId?: string;
    userId?: string;
    pole?: string;
    status?: string;
  } | null;
  const pole = asPole(body?.pole);
  if (!pole) return NextResponse.json({ error: "Pôle invalide" }, { status: 400 });
  const { superAdmin, state, supabase } = await access();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  if (!can(pole, superAdmin, state.managerPoles)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  if (body?.kind === "manager") {
    if (!superAdmin) return NextResponse.json({ error: "Réservé à l'admin plateforme" }, { status: 403 });
    const userId = String(body.userId ?? "").trim();
    if (!userId) return NextResponse.json({ error: "Utilisateur requis" }, { status: 400 });
    const { error } = await supabase.from("pole_managers").upsert({ user_id: userId, pole }, { onConflict: "user_id,pole" });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }

  const expertId = String(body?.expertId ?? "").trim();
  const status = asStatus(body?.status) ?? "pending";
  if (!expertId) return NextResponse.json({ error: "Expert requis" }, { status: 400 });
  const { error } = await supabase.from("expert_memberships").upsert(
    {
      expert_id: expertId,
      pole,
      status,
      joined_at: status === "active" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "expert_id,pole" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const body = (await request.json().catch(() => null)) as { id?: string; pole?: string; status?: string } | null;
  const pole = asPole(body?.pole);
  const status = asStatus(body?.status);
  const id = String(body?.id ?? "").trim();
  if (!pole || !status || !id) return NextResponse.json({ error: "Paramètres incomplets" }, { status: 400 });
  const { superAdmin, state, supabase } = await access();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  if (!can(pole, superAdmin, state.managerPoles)) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const { error } = await supabase
    .from("expert_memberships")
    .update({
      status,
      updated_at: new Date().toISOString(),
      ...(status === "active" ? { joined_at: new Date().toISOString() } : {}),
    })
    .eq("id", id)
    .eq("pole", pole);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
