import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { logReadyEvent } from "@/lib/ready/events";
import { computeExpiresAt } from "@/lib/ready/lifecycle";
import { isReadyLinkAccessible, loadReadyLinkByToken } from "@/lib/ready/load-link";
import { readReadySessionFromRequest } from "@/lib/ready/session";

export const dynamic = "force-dynamic";

function securityHeaders(res: NextResponse) {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}

export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ token: string }> },
) {
  const { token } = await ctx.params;
  const service = getServiceRoleClient();
  if (!service) {
    return securityHeaders(NextResponse.json({ error: "Indisponible" }, { status: 503 }));
  }

  const link = await loadReadyLinkByToken(service, token);
  if (!link) {
    return securityHeaders(NextResponse.json({ error: "Lien introuvable" }, { status: 404 }));
  }
  const access = isReadyLinkAccessible(link);
  if (!access.ok) {
    return securityHeaders(
      NextResponse.json({ error: "Ce lien a expiré.", code: access.reason }, { status: 410 }),
    );
  }

  const session = readReadySessionFromRequest(request);
  if (!session || session.linkId !== link.id || session.tokenHash !== link.token_hash) {
    return securityHeaders(
      NextResponse.json({ error: "Authentification requise", code: "auth_required" }, { status: 401 }),
    );
  }

  const submittedAt = new Date();
  const { data: dossier } = await service
    .from("formation_dossiers")
    .select("session_id")
    .eq("id", link.dossier_id)
    .maybeSingle();

  let sessionStart: Date | null = null;
  if (dossier?.session_id) {
    const { data: slots } = await service
      .from("formation_slots")
      .select("slot_date, starts_at")
      .eq("session_id", dossier.session_id)
      .order("slot_date", { ascending: true })
      .limit(1);
    if (slots?.[0]?.starts_at) sessionStart = new Date(String(slots[0].starts_at));
    else if (slots?.[0]?.slot_date) {
      sessionStart = new Date(`${slots[0].slot_date}T08:00:00.000Z`);
    }
  }

  const { data: full } = await service
    .from("ready_links")
    .select("created_at")
    .eq("id", link.id)
    .maybeSingle();
  const finalExpires = computeExpiresAt({
    createdAt: full?.created_at ? new Date(String(full.created_at)) : new Date(),
    sessionStart,
    submittedAt,
  });

  await service
    .from("ready_links")
    .update({
      status: "submitted",
      submitted_at: submittedAt.toISOString(),
      expires_at: finalExpires.toISOString(),
      updated_at: submittedAt.toISOString(),
    })
    .eq("id", link.id);

  await logReadyEvent(service, link.id, "deposited", {});

  return securityHeaders(
    NextResponse.json({
      ok: true,
      submitted_at: submittedAt.toISOString(),
      expires_at: finalExpires.toISOString(),
    }),
  );
}
