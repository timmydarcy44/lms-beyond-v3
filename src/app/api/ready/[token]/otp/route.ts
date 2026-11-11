import { NextRequest, NextResponse } from "next/server";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { isReadyLinkAccessible, loadReadyLinkByToken } from "@/lib/ready/load-link";
import { maskEmail, requestReadyOtp, verifyReadyOtp } from "@/lib/ready/otp";
import { issueReadySession } from "@/lib/ready/session";

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
  if (!access.ok && access.reason !== "blocked") {
    return securityHeaders(
      NextResponse.json({ error: "Ce lien a expiré.", code: "expired" }, { status: 410 }),
    );
  }

  let body: { action?: string; code?: string; force?: boolean } = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const action = String(body.action || "request");

  if (action === "request") {
    if (access.reason === "blocked") {
      return securityHeaders(
        NextResponse.json(
          { error: "Lien temporairement bloqué. Réessayez plus tard.", code: "blocked" },
          { status: 429 },
        ),
      );
    }
    const result = await requestReadyOtp(service, link, { force: Boolean(body.force) });
    if (!result.ok) {
      const status =
        result.code === "rate_limited" || result.code === "blocked" ? 429 : 400;
      return securityHeaders(
        NextResponse.json({ error: result.error, code: result.code }, { status }),
      );
    }
    return securityHeaders(
      NextResponse.json({
        ok: true,
        emailed_to_masked: maskEmail(result.emailed_to),
      }),
    );
  }

  if (action === "verify") {
    const code = String(body.code || "").replace(/\D/g, "");
    if (code.length !== 6) {
      return securityHeaders(
        NextResponse.json({ error: "Code invalide", code: "invalid_otp" }, { status: 400 }),
      );
    }
    // Recharger pour otp frais
    const fresh = await loadReadyLinkByToken(service, token);
    if (!fresh) {
      return securityHeaders(NextResponse.json({ error: "Lien introuvable" }, { status: 404 }));
    }
    const result = await verifyReadyOtp(service, fresh, code);
    if (!result.ok) {
      const status = result.code === "blocked" ? 429 : 400;
      return securityHeaders(
        NextResponse.json(
          {
            error: result.error,
            code: result.code,
            attempts_left: result.attempts_left,
          },
          { status },
        ),
      );
    }

    const issued = issueReadySession({
      linkId: fresh.id,
      tokenHash: fresh.token_hash,
      linkExpiresAt: new Date(fresh.expires_at),
    });
    const res = securityHeaders(
      NextResponse.json({
        ok: true,
        session: issued.value,
        expires_in: issued.maxAgeSec,
      }),
    );
    res.headers.append("Set-Cookie", issued.cookie);
    return res;
  }

  return securityHeaders(
    NextResponse.json({ error: "Action inconnue" }, { status: 400 }),
  );
}
