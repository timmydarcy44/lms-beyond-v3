import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { IMPERSONATION_COOKIE, REASON_CODES, reasonLabel } from "@/lib/control/constants";
import { buildActivityRow } from "@/lib/control/policy";
import { impersonationCookieOptions, readImpersonationContext } from "@/lib/control/session";
import { impersonationSecret, signImpersonationToken } from "@/lib/control/token";
import { sendEmail } from "@/lib/email/resend-client";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { publicAppUrl } from "@/lib/env";

export const dynamic = "force-dynamic";

const READ_MS = 8 * 60 * 60 * 1000;
const WRITE_MS = 30 * 60 * 1000;

export async function POST(request: NextRequest) {
  const supabase = await getServerClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user || isJadeDemoEmail(user.email) || !(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }
  const secret = impersonationSecret();
  if (!secret) return NextResponse.json({ error: "Secret d'accompagnement manquant" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as {
    orgId?: string;
    mode?: string;
    reasonCode?: string;
    reasonText?: string;
    notifyAdmin?: boolean;
  };
  const orgId = String(body.orgId ?? "");
  const mode = body.mode === "write" ? "write" : "read";
  if (mode === "write" && !REASON_CODES.some((item) => item.code === body.reasonCode)) {
    return NextResponse.json({ error: "Motif obligatoire" }, { status: 400 });
  }

  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
  const org = await service.from("organizations").select("id, name").eq("id", orgId).maybeSingle();
  if (!org.data) return NextResponse.json({ error: "Compte introuvable" }, { status: 404 });

  const current = await readImpersonationContext();
  const now = Date.now();
  const writeExp = mode === "write" ? new Date(now + WRITE_MS) : null;
  let sessionId = current && !current.expired && current.orgId === orgId ? current.sid : "";
  let exp = current && !current.expired && current.orgId === orgId ? current.exp : now + READ_MS;

  if (sessionId) {
    const updated = await service
      .from("impersonation_sessions")
      .update({
        mode,
        reason_code: body.reasonCode ?? null,
        reason_text: body.reasonText ?? null,
        notify_admin: body.notifyAdmin !== false,
        write_expires_at: writeExp?.toISOString() ?? null,
      })
      .eq("id", sessionId)
      .eq("staff_user_id", user.id);
    if (updated.error) return NextResponse.json({ error: updated.error.message }, { status: 503 });
  } else {
    exp = now + READ_MS;
    const inserted = await service
      .from("impersonation_sessions")
      .insert({
        staff_user_id: user.id,
        org_id: orgId,
        mode,
        reason_code: body.reasonCode ?? null,
        reason_text: body.reasonText ?? null,
        notify_admin: body.notifyAdmin !== false,
        expires_at: new Date(exp).toISOString(),
        write_expires_at: writeExp?.toISOString() ?? null,
        ip: request.headers.get("x-forwarded-for"),
        user_agent: request.headers.get("user-agent"),
      })
      .select("id")
      .single();
    if (inserted.error || !inserted.data) {
      return NextResponse.json({ error: "Appliquez la migration des comptes clients avant d'ouvrir un espace." }, { status: 503 });
    }
    sessionId = inserted.data.id as string;
  }

  await service.from("org_activity").insert(
    buildActivityRow({
      orgId,
      actorUserId: user.id,
      actorType: "byound_on_behalf",
      action: mode === "write" ? "impersonation_write" : "impersonation_start",
      payload: { reasonCode: body.reasonCode ?? null, reasonText: body.reasonText ?? null },
      impersonationSessionId: sessionId,
    }),
  );

  if (mode === "write" && body.notifyAdmin !== false) {
    await notifyOrgAdmin(service, orgId, String(org.data.name ?? "votre espace"), body.reasonCode ?? "support", body.reasonText ?? "");
  }

  const token = await signImpersonationToken(
    {
      sid: sessionId,
      orgId,
      staffId: user.id,
      orgName: String(org.data.name ?? "Client"),
      mode,
      exp,
      writeExp: writeExp?.getTime() ?? null,
    },
    secret,
  );
  const response = NextResponse.json({ ok: true });
  response.cookies.set(IMPERSONATION_COOKIE, token, impersonationCookieOptions(Math.max(60, Math.round((exp - now) / 1000))));
  return response;
}

async function notifyOrgAdmin(
  service: NonNullable<ReturnType<typeof getServiceRoleClient>>,
  orgId: string,
  orgName: string,
  reasonCode: string,
  reasonText: string,
) {
  const members = await service.from("org_memberships").select("user_id").eq("org_id", orgId).eq("role", "admin").limit(1);
  const userId = members.data?.[0]?.user_id as string | undefined;
  if (!userId) return;
  const profile = await service.from("profiles").select("email").eq("id", userId).maybeSingle();
  const email = profile.data?.email as string | undefined;
  if (!email) return;
  const journal = `${publicAppUrl()}/dashboard/entreprise/journal`;
  await sendEmail({
    to: email,
    subject: "Byound est intervenu dans votre espace",
    html: `<p>Byound est intervenu dans l'espace ${orgName}.</p><p>Motif : ${reasonLabel(reasonCode)}${reasonText ? ` — ${reasonText}` : ""}.</p><p><a href="${journal}">Voir le journal</a></p>`,
    skipBcc: true,
  });
}
