import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { revokeReadyLink } from "@/lib/ready/lifecycle";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id: dossierId } = await ctx.params;
  const { data: links } = await service
    .from("ready_links")
    .select(
      "id, document_id, status, expires_at, submitted_at, opened_at, progress_ready, progress_total, recipient_email, recipient_name, created_at, revoked_at",
    )
    .eq("dossier_id", dossierId)
    .order("created_at", { ascending: false })
    .limit(5);

  const active =
    (links ?? []).find((l) =>
      ["active", "blocked", "submitted"].includes(String(l.status)),
    ) ||
    links?.[0] ||
    null;

  return NextResponse.json({ link: active, history: links ?? [] });
}

export async function POST(request: NextRequest, ctx: Ctx) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { id: dossierId } = await ctx.params;
  let body: { action?: string; link_id?: string } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  if (body.action !== "revoke") {
    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  }

  let linkId = body.link_id;
  if (!linkId) {
    const { data } = await service
      .from("ready_links")
      .select("id")
      .eq("dossier_id", dossierId)
      .in("status", ["active", "blocked", "submitted"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    linkId = data?.id ? String(data.id) : undefined;
  }
  if (!linkId) {
    return NextResponse.json({ error: "Aucun lien actif" }, { status: 404 });
  }

  await revokeReadyLink(service, linkId);
  return NextResponse.json({ ok: true, link_id: linkId });
}
