import { NextResponse } from "next/server";
import { EDGE_BCC_ADDRESS, sendEmail } from "@/lib/email/resend-client";
import { listPublishedFormations } from "@/lib/financement-opco-formations";
import { OPCO_LEAD_SOURCE, effectifLabel, opcoLeadSchema } from "@/lib/financement-opco";
import { getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const rateLimitStore = new Map<string, { count: number; ts: number }>();
const RATE_WINDOW_MS = 10 * 60_000;
const RATE_MAX = 5;

function clientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function limited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now - entry.ts > RATE_WINDOW_MS) {
    rateLimitStore.set(ip, { count: 1, ts: now });
    return false;
  }
  entry.count += 1;
  if (entry.count > RATE_MAX) return true;
  return false;
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

export async function POST(request: Request) {
  if (limited(clientIp(request))) {
    return NextResponse.json({ ok: false, message: "Trop de demandes. Réessayez dans quelques minutes." }, { status: 429 });
  }

  const json = await request.json().catch(() => null);
  const parsed = opcoLeadSchema.safeParse(json);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0];
    return NextResponse.json(
      { ok: false, field: typeof field === "string" ? field : undefined, message: issue?.message ?? "Vérifiez le formulaire." },
      { status: 400 },
    );
  }

  if (parsed.data.company_website?.trim()) {
    return NextResponse.json({ ok: true });
  }

  const formations = await listPublishedFormations();
  const formation = formations.find((item) => item.id === parsed.data.formationId);
  if (!formation) {
    return NextResponse.json({ ok: false, field: "formationId", message: "Choisissez une formation." }, { status: 400 });
  }

  const db = getServiceRoleClient();
  if (!db) {
    return NextResponse.json({ ok: false, message: "L'envoi est momentanément indisponible." }, { status: 503 });
  }

  const isTest = process.env.NODE_ENV !== "production";
  const saved = await db.from("leads_opco").insert({
    siret: parsed.data.siret,
    effectif: parsed.data.effectif,
    formation_id: formation.id,
    email: parsed.data.email,
    source: OPCO_LEAD_SOURCE,
    is_test: isTest,
  });
  if (saved.error) {
    console.error("[opco-lead] insert", saved.error.message);
    return NextResponse.json({ ok: false, message: "L'envoi n'a pas abouti. Réessayez dans un instant." }, { status: 503 });
  }

  const sent = await sendEmail({
    to: EDGE_BCC_ADDRESS,
    skipBcc: true,
    replyTo: parsed.data.email,
    subject: isTest ? "[Test] Demande de prise en charge OPCO" : "Demande de prise en charge OPCO",
    text: [
      `SIRET : ${parsed.data.siret}`,
      `Effectif : ${effectifLabel(parsed.data.effectif)}`,
      `Formation : ${formation.title}`,
      `E-mail : ${parsed.data.email}`,
      `Source : ${OPCO_LEAD_SOURCE}`,
    ].join("\n"),
    html: `<p>Nouvelle demande de prise en charge OPCO.</p>
      <ul>
        <li>SIRET : ${escapeHtml(parsed.data.siret)}</li>
        <li>Effectif : ${escapeHtml(effectifLabel(parsed.data.effectif))}</li>
        <li>Formation : ${escapeHtml(formation.title)}</li>
        <li>E-mail : ${escapeHtml(parsed.data.email)}</li>
      </ul>`,
  });
  if (!sent.success) console.error("[opco-lead] email", sent.error);

  return NextResponse.json({ ok: true });
}
