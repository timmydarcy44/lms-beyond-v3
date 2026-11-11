import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { loadReadyFiche } from "@/lib/ready/fiche";
import { logReadyEvent } from "@/lib/ready/events";
import { isReadyLinkAccessible, loadReadyLinkByToken } from "@/lib/ready/load-link";
import { readReadySessionFromRequest } from "@/lib/ready/session";

export const dynamic = "force-dynamic";

function securityHeaders(res: NextResponse) {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}

export async function GET(
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

  const fiche = await loadReadyFiche(service, link.id);
  if (!fiche) {
    return securityHeaders(NextResponse.json({ error: "Fiche introuvable" }, { status: 404 }));
  }

  if (!link.opened_at) {
    await service
      .from("ready_links")
      .update({ opened_at: new Date().toISOString(), updated_at: new Date().toISOString() })
      .eq("id", link.id);
    await logReadyEvent(service, link.id, "opened", {});
  }

  return securityHeaders(NextResponse.json(fiche));
}
