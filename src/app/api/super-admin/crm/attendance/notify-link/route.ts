import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import {
  buildEdgeEmailShell,
  edgeEmailParagraph,
  escapeEdgeEmailHtml,
} from "@/lib/emails/edge-email-shell";
import { loadSlotContext } from "@/lib/formation-attendance/slot-context";
import { resolveTrainerNameForSession } from "@/lib/formation-attendance/trainer";

/**
 * Envoi manuel du lien d'émargement (/e?launch=…) aux participants.
 * Jamais le code HOTP dans le mail — le code reste annoncé / projeté en salle.
 */
export async function POST(req: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const slotId = String(body?.slot_id ?? "").trim();
  if (!slotId) return NextResponse.json({ error: "slot_id requis" }, { status: 400 });

  const ctx = await loadSlotContext(service, slotId);
  if (!ctx) return NextResponse.json({ error: "Créneau introuvable" }, { status: 404 });

  const { data: launch } = await service
    .from("attendance_slot_launches")
    .select("id, revoked_at")
    .eq("slot_id", slotId)
    .is("revoked_at", null)
    .order("opened_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!launch?.id) {
    return NextResponse.json(
      { error: "Aucun émargement ouvert. Lancez d'abord la session.", code: "no_launch" },
      { status: 400 },
    );
  }

  const origin = new URL(req.url).origin;
  const publicUrl = `${origin}/e?launch=${encodeURIComponent(String(launch.id))}`;
  const trainerName = await resolveTrainerNameForSession(service, ctx.session.id);
  const title = ctx.session.title || ctx.dossiers[0]?.course_title || "Formation";
  const dayPart = ctx.slot.day_part === "matin" ? "matin" : "après-midi";

  const recipients = ctx.participants.filter((p) => p.convention_ok && p.email.includes("@"));
  if (!recipients.length) {
    return NextResponse.json(
      { error: "Aucun participant éligible (convention signée + e-mail).", code: "no_recipients" },
      { status: 400 },
    );
  }

  let sent = 0;
  const errors: string[] = [];

  for (const p of recipients) {
    const html = buildEdgeEmailShell({
      title: "Lien d'émargement",
      preheader: `${title} — ${ctx.slot.slot_date} · ${dayPart}`,
      bodyHtml: `${edgeEmailParagraph(`Bonjour ${p.name},`)}
${edgeEmailParagraph(
  `L'émargement est ouvert pour « ${title} » (${ctx.slot.slot_date} · ${dayPart})${trainerName ? `, avec ${trainerName}` : ""}.`,
)}
${edgeEmailParagraph(
  "Ouvrez ce lien sur votre téléphone, puis saisissez le code à 4 chiffres annoncé ou projeté en salle :",
)}
<p style="margin:0 0 16px;"><a href="${escapeEdgeEmailHtml(publicUrl)}" style="display:inline-block;padding:12px 18px;background:#6C5CF5;color:#fff;border-radius:12px;text-decoration:none;font-weight:600;">Émarger maintenant</a></p>
<p style="margin:0 0 8px;font-size:13px;color:#8A8A8A;word-break:break-all;">${escapeEdgeEmailHtml(publicUrl)}</p>
${edgeEmailParagraph(
  "Le code de salle n'est pas envoyé par e-mail : il change régulièrement et vous est communiqué uniquement en session.",
)}`,
    });

    const result = await sendEmail({
      to: p.email,
      from: EDGE_COCKPIT_FROM,
      subject: `Émargement — ${title}`,
      html,
      tags: { type: "attendance-session-link", slot_id: slotId, launch_id: String(launch.id) },
    });

    if (result.success) sent += 1;
    else errors.push(`${p.email}: ${result.error || "échec"}`);
  }

  return NextResponse.json({
    ok: true,
    sent,
    total: recipients.length,
    public_url: publicUrl,
    errors: errors.length ? errors : undefined,
  });
}
