import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email/resend-client";
import { publicAppUrl } from "@/lib/env";
import { BYOUND_PUBLIC_ORIGIN } from "@/lib/edge-site/byound-host";
import { CARE_SQL_HINT, missingRelation, requireCareExpert } from "@/lib/expert/care-auth";
import { getCareTest } from "@/lib/expert/care-tests";

export async function POST(req: NextRequest) {
  const gate = await requireCareExpert();
  if (!gate.ok) return gate.response;
  const body = (await req.json().catch(() => null)) as { clientId?: string; testSlug?: string } | null;
  const test = getCareTest(body?.testSlug ?? "");
  if (!test) return NextResponse.json({ error: "Test inconnu" }, { status: 400 });
  const clientId = body?.clientId?.trim() ?? "";
  if (!clientId) return NextResponse.json({ error: "Membre CRM requis" }, { status: 400 });

  const { data: client, error: clientError } = await gate.db
    .from("expert_care_clients")
    .select("id,first_name,last_name,email")
    .eq("id", clientId)
    .eq("expert_id", gate.expertId)
    .maybeSingle();
  if (clientError) {
    return NextResponse.json({ error: missingRelation(clientError) ? CARE_SQL_HINT : clientError.message }, { status: 500 });
  }
  if (!client) return NextResponse.json({ error: "Membre introuvable" }, { status: 404 });

  const token = randomBytes(18).toString("base64url");
  const { data: invite, error } = await gate.db
    .from("expert_care_invites")
    .insert({
      expert_id: gate.expertId,
      client_id: client.id,
      test_slug: test.slug,
      token,
      sent_at: new Date().toISOString(),
    })
    .select("id, token")
    .single();
  if (error) {
    return NextResponse.json({ error: missingRelation(error) ? CARE_SQL_HINT : error.message }, { status: 500 });
  }

  const origin = BYOUND_PUBLIC_ORIGIN || publicAppUrl();
  const link = `${origin}/care-test/${invite.token}`;
  const first = String(client.first_name ?? "").trim();
  const greeting = first ? `Bonjour ${first},` : "Bonjour,";
  const mailed = await sendEmail({
    to: client.email,
    subject: `Byound tests — ${test.title}`,
    html: `<p>${greeting}</p><p>Votre expert Byound Care vous invite à répondre au <strong>${test.title}</strong>.</p><p><a href="${link}">Ouvrir le test</a></p>`,
  });
  return NextResponse.json({
    ok: true,
    link,
    inviteId: invite.id,
    emailed: mailed.success,
    emailError: mailed.success ? null : mailed.error,
  });
}
