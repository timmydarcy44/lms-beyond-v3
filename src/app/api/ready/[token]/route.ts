import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { maskEmail } from "@/lib/ready/otp";
import { isReadyLinkAccessible, loadReadyLinkByToken } from "@/lib/ready/load-link";
import { readReadySessionFromRequest } from "@/lib/ready/session";

export const dynamic = "force-dynamic";

function securityHeaders(res: NextResponse) {
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("Referrer-Policy", "no-referrer");
  return res;
}

/** État public du lien — aucune donnée fiche. */
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
      NextResponse.json({
        status: access.reason === "blocked" ? "blocked" : "expired",
        reason: access.reason,
        expires_at: link.expires_at,
        recipient_masked: maskEmail(link.recipient_email),
        blocked_until: link.blocked_until,
      }),
    );
  }

  const session = readReadySessionFromRequest(request);
  const authed =
    session?.linkId === link.id && session.tokenHash === link.token_hash;

  return securityHeaders(
    NextResponse.json({
      status: link.status,
      expires_at: link.expires_at,
      recipient_masked: maskEmail(link.recipient_email),
      recipient_name: link.recipient_name,
      authenticated: Boolean(authed),
      submitted: Boolean(link.submitted_at),
    }),
  );
}
