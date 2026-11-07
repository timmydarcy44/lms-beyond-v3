import type { SupabaseClient } from "@supabase/supabase-js";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import {
  buildEdgeEmailShell,
  edgeEmailButton,
  edgeEmailParagraph,
  escapeEdgeEmailHtml,
} from "@/lib/emails/edge-email-shell";
import { appOrigin } from "@/lib/formation-documents/context";

function dayPartLabel(dayPart: string): string {
  return dayPart === "matin" ? "matin" : "après-midi";
}

function formatFrDate(slotDate: string): string {
  const d = new Date(`${slotDate}T12:00:00`);
  if (!Number.isFinite(d.getTime())) return slotDate;
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export type PackFormateurContent = {
  courseTitle: string;
  clientName: string;
  whenLine: string;
  location: string;
  participantCount: number;
  emargerUrl: string;
  projectUrl: string | null;
  formateurUrl: string;
  programmeUrl: string | null;
};

export function buildPackFormateurEmail(content: PackFormateurContent): {
  subject: string;
  html: string;
  preheader: string;
} {
  const count = content.participantCount;
  const checklist = [
    "Vérifier la liste des participants et les besoins spécifiques",
    "Lancer l'émargement (code oral ou QR projeté) au début de la demi-journée",
    "Envoyer le lien aux apprenants si besoin, puis clôturer avec le comptage physique",
    "S'appuyer sur la synthèse de positionnement pour adapter le niveau",
    "En fin de session : évaluation à chaud + documents de clôture",
  ];

  const bodyHtml = [
    edgeEmailParagraph("Bonjour,"),
    edgeEmailParagraph(
      `Voici votre pack formateur pour « ${content.courseTitle} » — ${content.clientName}.`,
    ),
    `<div style="margin:0 0 20px;padding:14px 16px;border:1px solid #E8E8E8;border-radius:12px;">
<p style="margin:0 0 6px;font-size:13px;color:#8A8A8A;text-transform:uppercase;letter-spacing:0.04em;">Session</p>
<p style="margin:0 0 4px;font-size:16px;color:#111;font-weight:600;">${escapeEdgeEmailHtml(content.whenLine)}</p>
<p style="margin:0;font-size:14px;color:#4A4A4A;">${escapeEdgeEmailHtml(content.location)} · ${count} participant${count > 1 ? "s" : ""}</p>
</div>`,
    edgeEmailParagraph("Liens utiles (tout est prêt côté Byound) :"),
    edgeEmailButton("Ouvrir l'écran d'émargement (QR)", content.emargerUrl),
    content.projectUrl && content.projectUrl !== content.emargerUrl
      ? `<p style="margin:12px 0 0;font-size:14px;"><a href="${escapeEdgeEmailHtml(content.projectUrl)}" style="color:#6C5CF5;font-weight:600;">Écran projeté</a></p>`
      : "",
    `<p style="margin:12px 0 0;font-size:14px;"><a href="${escapeEdgeEmailHtml(content.formateurUrl)}" style="color:#6C5CF5;font-weight:600;">Mon espace formateur</a></p>`,
    content.programmeUrl
      ? `<p style="margin:12px 0 0;font-size:14px;"><a href="${escapeEdgeEmailHtml(content.programmeUrl)}" style="color:#6C5CF5;font-weight:600;">Programme de formation (PDF)</a></p>`
      : "",
    edgeEmailParagraph("Checklist Qualiopi du jour :"),
    `<ul style="margin:0 0 16px;padding-left:18px;color:#4A4A4A;font-size:14px;line-height:1.55;">
${checklist.map((item) => `<li style="margin:0 0 6px;">${escapeEdgeEmailHtml(item)}</li>`).join("")}
</ul>`,
    edgeEmailParagraph(
      "Astuce : le retard des apprenants se calcule à partir du début de créneau, ou de l'heure où vous ouvrez l'émargement si vous lancez après — la salle n'est pas pénalisée si vous démarrez en retard.",
    ),
  ].join("");

  const preheader = `${content.courseTitle} — ${content.whenLine}`;
  const html = buildEdgeEmailShell({
    title: "Pack formateur",
    preheader,
    bodyHtml,
    footerNote: "Byound — pack formateur automatique (veille ou jour de session).",
  });

  return {
    subject: `Pack formateur — ${content.courseTitle} (${content.whenLine})`,
    html,
    preheader,
  };
}

/** Construit et envoie le pack formateur (J-1 / jour J). */
export async function sendPackFormateurEmail(
  service: SupabaseClient,
  params: {
    dossierId: string;
    toEmail: string;
    slotId?: string | null;
    payload?: Record<string, unknown> | null;
  },
): Promise<{ ok: boolean; error?: string }> {
  const { data: dossier } = await service
    .from("formation_dossiers")
    .select("id, course_title, session_id, organization_id")
    .eq("id", params.dossierId)
    .maybeSingle();
  if (!dossier) return { ok: false, error: "dossier_missing" };

  const courseTitle =
    (typeof params.payload?.course_title === "string" && params.payload.course_title) ||
    String(dossier.course_title || "Formation");

  let slot: {
    id: string;
    slot_date: string;
    day_part: string;
    starts_at: string | null;
    ends_at: string | null;
  } | null = null;

  if (params.slotId) {
    const { data } = await service
      .from("formation_slots")
      .select("id, slot_date, day_part, starts_at, ends_at")
      .eq("id", params.slotId)
      .maybeSingle();
    slot = data;
  }
  if (!slot && dossier.session_id) {
    const { data } = await service
      .from("formation_slots")
      .select("id, slot_date, day_part, starts_at, ends_at")
      .eq("session_id", dossier.session_id)
      .order("slot_date", { ascending: true })
      .order("day_part", { ascending: true })
      .limit(1)
      .maybeSingle();
    slot = data;
  }

  const { data: session } = dossier.session_id
    ? await service
        .from("formation_sessions")
        .select("id, title, location_label, visio_url")
        .eq("id", dossier.session_id)
        .maybeSingle()
    : { data: null };

  const { data: org } = await service
    .from("organizations")
    .select("name")
    .eq("id", dossier.organization_id)
    .maybeSingle();

  const { count: participantCount } = await service
    .from("formation_participants")
    .select("id", { count: "exact", head: true })
    .eq("dossier_id", params.dossierId);

  const { data: programme } = await service
    .from("formation_documents")
    .select("access_token")
    .eq("dossier_id", params.dossierId)
    .eq("kind", "programme")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const origin = appOrigin();
  // /e?slot= — page publique fiable (évite 404 Vercel sur /e/p/…)
  const emargerUrl = slot
    ? `${origin}/e?slot=${encodeURIComponent(slot.id)}`
    : `${origin}/dashboard/formateur`;
  const projectUrl = slot ? `${origin}/e?slot=${encodeURIComponent(slot.id)}` : null;
  const formateurUrl = `${origin}/dashboard/formateur`;
  const programmeUrl = programme?.access_token
    ? `${origin}/d/${programme.access_token}`
    : null;

  const whenLine = slot
    ? `${formatFrDate(slot.slot_date)} · ${dayPartLabel(String(slot.day_part))}`
    : "Date à confirmer";
  const location =
    session?.location_label ||
    (typeof params.payload?.location === "string" ? params.payload.location : null) ||
    "Lieu communiqué séparément";

  const built = buildPackFormateurEmail({
    courseTitle,
    clientName: org?.name || "Client",
    whenLine,
    location,
    participantCount: participantCount ?? 0,
    emargerUrl,
    projectUrl,
    formateurUrl,
    programmeUrl,
  });

  const result = await sendEmail({
    to: params.toEmail,
    from: EDGE_COCKPIT_FROM,
    subject: built.subject,
    html: built.html,
    tags: {
      type: "formation-pack-formateur",
      dossier_id: params.dossierId,
      ...(slot ? { slot_id: slot.id } : {}),
    },
  });

  return result.success
    ? { ok: true }
    : { ok: false, error: result.error || "email_failed" };
}
