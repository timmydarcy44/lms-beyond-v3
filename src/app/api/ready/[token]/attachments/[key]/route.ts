import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isReadyLinkAccessible, loadReadyLinkByToken } from "@/lib/ready/load-link";
import { readReadySessionFromRequest } from "@/lib/ready/session";

export const dynamic = "force-dynamic";

const ALLOWED = new Set(["devis", "programme", "convention", "qualiopi"]);

function securityHeaders(res: NextResponse) {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}

export async function GET(
  request: NextRequest,
  ctx: { params: Promise<{ token: string; key: string }> },
) {
  const { token, key } = await ctx.params;
  if (!ALLOWED.has(key)) {
    return securityHeaders(NextResponse.json({ error: "Pièce inconnue" }, { status: 404 }));
  }

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

  if (key === "qualiopi") {
    const url = process.env.READY_QUALIOPI_CERT_URL?.trim();
    if (!url) {
      return securityHeaders(NextResponse.json({ error: "Document indisponible" }, { status: 404 }));
    }
    return securityHeaders(NextResponse.redirect(url, 302));
  }

  const { data: doc } = await service
    .from("formation_documents")
    .select("storage_bucket, storage_path, file_url")
    .eq("dossier_id", link.dossier_id)
    .eq("kind", key)
    .maybeSingle();

  if (!doc) {
    return securityHeaders(NextResponse.json({ error: "Document introuvable" }, { status: 404 }));
  }

  if (doc.storage_bucket && doc.storage_path) {
    const { data: signed, error } = await service.storage
      .from(String(doc.storage_bucket))
      .createSignedUrl(String(doc.storage_path), 120);
    if (error || !signed?.signedUrl) {
      return securityHeaders(
        NextResponse.json({ error: error?.message || "Signature impossible" }, { status: 500 }),
      );
    }
    return securityHeaders(NextResponse.redirect(signed.signedUrl, 302));
  }

  if (doc.file_url) {
    return securityHeaders(NextResponse.redirect(String(doc.file_url), 302));
  }

  return securityHeaders(NextResponse.json({ error: "Fichier manquant" }, { status: 404 }));
}
