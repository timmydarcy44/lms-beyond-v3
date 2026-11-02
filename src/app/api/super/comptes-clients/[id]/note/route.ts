import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || !(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const body = (await request.json().catch(() => ({}))) as { body?: string };
  const text = String(body.body ?? "").trim();
  if (!text) return NextResponse.json({ error: "Note vide" }, { status: 400 });
  const saved = await service.from("org_notes").insert({ org_id: id, author_id: data.user.id, body: text }).select("id").single();
  if (saved.error) return NextResponse.json({ error: "Appliquez la migration des comptes clients pour enregistrer la note." }, { status: 503 });
  return NextResponse.json({ ok: true });
}
