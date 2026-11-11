import type { SupabaseClient } from "@supabase/supabase-js";
import { render } from "@react-email/render";
import { sendEmail } from "@/lib/email/resend-client";
import { EDGE_COCKPIT_FROM } from "@/lib/email/edge-cockpit-from";
import { BYOUND_PUBLIC_ORIGIN } from "@/lib/edge-site/byound-host";
import { loadAccountManager } from "@/lib/formation-documents/public-meta";
import {
  createBackstageSignedUrl,
  expireAfterSessionMs,
  qrImageUrl,
} from "@/lib/formation-documents/backstage-signed-url";
import {
  formatParisClock,
  formatParisLongDate,
  formatParisShortDay,
  parisWallToUtc,
} from "@/lib/formation-documents/paris-time";
import { BackstageEmail } from "../../../emails/backstage/BackstageEmail";
import { BackstageReminderEmail } from "../../../emails/backstage/BackstageReminderEmail";

export const BACKSTAGE_REPLY_TO = "contact@byound.fr";
export const BACKSTAGE_CHECKLIST = [
  {
    moment: "En arrivant",
    text: "Ouvrez l'émargement et faites signer chaque participant (QR ou code oral). Vérifiez la liste et les besoins spécifiques.",
  },
  {
    moment: "En début de séance",
    text: "Rappelez les objectifs et le déroulé. Appuyez-vous sur la synthèse de positionnement pour adapter le niveau.",
  },
  {
    moment: "Pendant",
    text: "Notez les absences ou retards dans votre espace formateur. Envoyez le lien d'émargement aux retardataires si besoin, puis clôturez avec le comptage physique.",
  },
  {
    moment: "En fin de séance",
    text: "L'évaluation à chaud part automatiquement aux participants : laissez-leur 5 minutes pour y répondre.",
  },
] as const;

export type BackstageMailType = "backstage" | "rappel";

type SlotRow = {
  id: string;
  slot_date: string;
  day_part: string;
  starts_at: string | null;
  ends_at: string | null;
};

function dayPartPill(
  dayPart: string,
  startsAt: string | null,
  endsAt: string | null,
  siblingParts: string[],
): string {
  const start = formatParisClock(startsAt);
  const end = formatParisClock(endsAt);
  if (start && end) return `${start} – ${end}`;
  if (siblingParts.includes("matin") && siblingParts.includes("apres_midi")) return "Journée";
  if (dayPart === "matin") return "Matin";
  if (dayPart === "apres_midi") return "Après-midi";
  return "Session";
}

function locationDisplay(params: {
  locationLabel: string | null;
  modality: string | null;
  visioUrl: string | null;
}): { kindLabel: string; detail: string } {
  const raw = String(params.locationLabel || "").trim();
  const lower = raw.toLowerCase();
  const modality = String(params.modality || "").toLowerCase();
  if (
    modality.includes("distan") ||
    lower.includes("distan") ||
    lower.includes("visio") ||
    params.visioUrl
  ) {
    return {
      kindLabel: "À distance",
      detail: params.visioUrl || raw || "Lien visio communiqué séparément",
    };
  }
  if (lower.includes("byound") || lower.includes("nos locaux")) {
    const addr = raw.includes("—") ? raw.split("—").slice(1).join("—").trim() : raw;
    return { kindLabel: "Lieu · Byound", detail: addr || raw };
  }
  if (
    lower.includes("client") ||
    lower.includes("vos locaux") ||
    lower.includes("locaux du client")
  ) {
    const addr = raw.includes("—") ? raw.split("—").slice(1).join("—").trim() : raw;
    return { kindLabel: "Lieu · chez le client", detail: addr || raw || "Chez le client" };
  }
  return {
    kindLabel: "Lieu",
    detail: raw || "Lieu communiqué séparément",
  };
}

function subjectDateBits(ymd: string): string {
  // « lundi 9 novembre »
  const label = formatParisLongDate(ymd, false);
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function shortCourseTitle(title: string): string {
  const t = title.trim();
  if (t.length <= 48) return t;
  return `${t.slice(0, 45).trim()}…`;
}

async function resolveTrainerProfile(
  service: SupabaseClient,
  dossierId: string,
): Promise<{ id: string | null; email: string | null; firstName: string }> {
  const { data: dossier } = await service
    .from("formation_dossiers")
    .select("trainer_user_id")
    .eq("id", dossierId)
    .maybeSingle();
  const trainerId = dossier?.trainer_user_id ? String(dossier.trainer_user_id) : null;
  if (!trainerId) return { id: null, email: null, firstName: "" };
  const { data: profile } = await service
    .from("profiles")
    .select("id, email, reference_email, first_name, full_name")
    .eq("id", trainerId)
    .maybeSingle();
  const email = String(profile?.reference_email || profile?.email || "")
    .trim()
    .toLowerCase();
  const firstName =
    String(profile?.first_name || "").trim() ||
    String(profile?.full_name || "")
      .trim()
      .split(/\s+/)[0] ||
    "";
  return {
    id: trainerId,
    email: email.includes("@") ? email : null,
    firstName,
  };
}

async function alreadySent(
  service: SupabaseClient,
  params: { dossierId: string; slotId: string; mailType: BackstageMailType },
): Promise<boolean> {
  const { data } = await service
    .from("formation_backstage_sends")
    .select("id")
    .eq("dossier_id", params.dossierId)
    .eq("slot_id", params.slotId)
    .eq("mail_type", params.mailType)
    .eq("status", "sent")
    .eq("forced", false)
    .limit(1)
    .maybeSingle();
  return Boolean(data?.id);
}

async function logSend(
  service: SupabaseClient,
  row: {
    dossierId: string;
    sessionId: string | null;
    slotId: string | null;
    formateurId: string | null;
    toEmail: string;
    mailType: BackstageMailType;
    resendId?: string | null;
    status: "sent" | "failed" | "skipped";
    error?: string | null;
    forced?: boolean;
  },
) {
  await service.from("formation_backstage_sends").insert({
    dossier_id: row.dossierId,
    session_id: row.sessionId,
    slot_id: row.slotId,
    formateur_id: row.formateurId,
    to_email: row.toEmail,
    mail_type: row.mailType,
    resend_id: row.resendId ?? null,
    status: row.status,
    error: row.error ?? null,
    forced: Boolean(row.forced),
  });
}

async function loadSlotBundle(
  service: SupabaseClient,
  params: { dossierId: string; slotId?: string | null },
) {
  const { data: dossier } = await service
    .from("formation_dossiers")
    .select("id, course_title, session_id, organization_id, modality_presence")
    .eq("id", params.dossierId)
    .maybeSingle();
  if (!dossier) return null;

  let slot: SlotRow | null = null;
  if (params.slotId) {
    const { data } = await service
      .from("formation_slots")
      .select("id, slot_date, day_part, starts_at, ends_at")
      .eq("id", params.slotId)
      .maybeSingle();
    slot = data as SlotRow | null;
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
    slot = data as SlotRow | null;
  }
  if (!slot) return null;

  const { data: daySlots } = await service
    .from("formation_slots")
    .select("id, slot_date, day_part, starts_at, ends_at")
    .eq("session_id", dossier.session_id)
    .eq("slot_date", slot.slot_date)
    .order("day_part", { ascending: true });

  const { data: session } = dossier.session_id
    ? await service
        .from("formation_sessions")
        .select("id, title, location_label, visio_url, modality_presence")
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

  const { data: docs } = await service
    .from("formation_documents")
    .select("kind, access_token, status, title")
    .eq("dossier_id", params.dossierId)
    .in("kind", ["programme", "livret"])
    .order("created_at", { ascending: false });

  const latestByKind = new Map<string, { access_token: string | null; status: string }>();
  for (const d of docs ?? []) {
    const k = String(d.kind);
    if (!latestByKind.has(k)) {
      latestByKind.set(k, {
        access_token: d.access_token ? String(d.access_token) : null,
        status: String(d.status),
      });
    }
  }

  return {
    dossier,
    slot,
    daySlots: (daySlots ?? []) as SlotRow[],
    session,
    orgName: org?.name ? String(org.name) : "Client",
    participantCount: participantCount ?? 0,
    latestByKind,
  };
}

function sessionEndMs(daySlots: SlotRow[], fallbackYmd: string): number {
  let max = 0;
  for (const s of daySlots) {
    if (s.ends_at) {
      const t = new Date(s.ends_at).getTime();
      if (Number.isFinite(t)) max = Math.max(max, t);
    }
  }
  if (max > 0) return max;
  return parisWallToUtc(fallbackYmd, 18, 0).getTime();
}

/** Construit et envoie Backstage (J-2) ou rappel jour J. */
export async function sendBackstageEmail(
  service: SupabaseClient,
  params: {
    dossierId: string;
    toEmail?: string | null;
    slotId?: string | null;
    mailType: BackstageMailType;
    /** Renvoi manuel : ignore l'anti-doublon métier. */
    force?: boolean;
  },
): Promise<{ ok: boolean; skipped?: boolean; error?: string; messageId?: string }> {
  const trainer = await resolveTrainerProfile(service, params.dossierId);
  const toEmail = (params.toEmail || trainer.email || "").trim().toLowerCase();
  if (!toEmail.includes("@")) return { ok: false, error: "no_trainer_email" };

  const bundle = await loadSlotBundle(service, {
    dossierId: params.dossierId,
    slotId: params.slotId,
  });
  if (!bundle) return { ok: false, error: "slot_missing" };

  const { dossier, slot, daySlots, session, orgName, participantCount, latestByKind } = bundle;

  // Session passée → jamais d'envoi auto (force manuel OK)
  const endMs = sessionEndMs(daySlots, slot.slot_date);
  if (!params.force && endMs + 60 * 60 * 1000 < Date.now()) {
    await logSend(service, {
      dossierId: params.dossierId,
      sessionId: dossier.session_id ? String(dossier.session_id) : null,
      slotId: slot.id,
      formateurId: trainer.id,
      toEmail,
      mailType: params.mailType,
      status: "skipped",
      error: "session_past",
    });
    return { ok: true, skipped: true };
  }

  if (!params.force) {
    const dup = await alreadySent(service, {
      dossierId: params.dossierId,
      slotId: slot.id,
      mailType: params.mailType,
    });
    if (dup) return { ok: true, skipped: true };
  }

  const expiresAt = expireAfterSessionMs(endMs, 7);
  const emargerUrl = createBackstageSignedUrl({
    kind: "emarger",
    slotId: slot.id,
    dossierId: params.dossierId,
    expiresAtMs: expiresAt,
  });
  const formateurUrl = `${BYOUND_PUBLIC_ORIGIN}/dashboard/formateur`;
  const location = locationDisplay({
    locationLabel: session?.location_label ? String(session.location_label) : null,
    modality:
      (session?.modality_presence as string | null) ||
      (dossier.modality_presence as string | null),
    visioUrl: session?.visio_url ? String(session.visio_url) : null,
  });

  const manager = await loadAccountManager(service, dossier.organization_id);
  const contactName = manager?.name || "Timmy Darcy";
  const contactPhone = manager?.phone || null;
  const contactInitials = manager?.initials || "TD";
  const replyTo =
    manager?.email && manager.email.includes("@") && !manager.email.includes("noreply")
      ? manager.email
      : BACKSTAGE_REPLY_TO;

  const courseTitle =
    String(session?.title || dossier.course_title || "Formation").trim() || "Formation";
  const siblingParts = daySlots.map((s) => String(s.day_part));
  const pill = dayPartPill(String(slot.day_part), slot.starts_at, slot.ends_at, siblingParts);
  const dateLabel = formatParisLongDate(slot.slot_date);
  const dateLabelCap = dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1);

  let subject: string;
  let html: string;

  if (params.mailType === "rappel") {
    const start = formatParisClock(slot.starts_at);
    const dateLine = [
      dateLabelCap,
      start || pill,
      location.detail,
    ]
      .filter(Boolean)
      .join(" · ");
    subject = "Backstage · c'est aujourd'hui, ouvrez l'émargement";
    html = await render(
      BackstageReminderEmail({
        preheader: `Backstage · c'est aujourd'hui chez ${orgName}`,
        dateLine,
        emargerUrl,
        contactName,
        contactPhone,
      }),
    );
  } else {
    const docs: Array<{
      key: string;
      title: string;
      subtitle: string;
      href: string;
      iconBg: string;
      iconLabel: string;
    }> = [];

    const programme = latestByKind.get("programme");
    if (programme?.access_token) {
      docs.push({
        key: "programme",
        title: "Programme",
        subtitle: "Objectifs et déroulé",
        href: createBackstageSignedUrl({
          kind: "programme",
          dossierId: params.dossierId,
          documentToken: programme.access_token,
          expiresAtMs: expiresAt,
        }),
        iconBg: "#6E5BFF",
        iconLabel: "P",
      });
    }

    docs.push({
      key: "participants",
      title: "Participants",
      subtitle: `${participantCount} inscrit${participantCount > 1 ? "s" : ""} · fonctions`,
      href: createBackstageSignedUrl({
        kind: "participants",
        dossierId: params.dossierId,
        slotId: slot.id,
        expiresAtMs: expiresAt,
      }),
      iconBg: "#3B82F6",
      iconLabel: "2",
    });

    // Support : pas de kind dédié → carte masquée
    const livret = latestByKind.get("livret");
    if (livret?.access_token) {
      docs.push({
        key: "infos",
        title: "Infos pratiques",
        subtitle: "Accès, contact sur place",
        href: createBackstageSignedUrl({
          kind: "livret",
          dossierId: params.dossierId,
          documentToken: livret.access_token,
          expiresAtMs: expiresAt,
        }),
        iconBg: "#F59E0B",
        iconLabel: "i",
      });
    }

    const jour = formatParisShortDay(slot.slot_date);
    const preheader = `Byound Backstage · votre session de ${jour} chez ${orgName} : émargement, checklist et documents.`;
    subject = `Backstage · ${subjectDateBits(slot.slot_date)}, ${orgName} — ${shortCourseTitle(courseTitle)}`;

    html = await render(
      BackstageEmail({
        preheader,
        trainerFirstName: trainer.firstName,
        dateLabel: dateLabelCap,
        dayPartPill: pill,
        courseTitle,
        locationKindLabel: location.kindLabel,
        locationDetail: location.detail,
        clientName: orgName,
        participantCount,
        emargerUrl,
        qrImageUrl: qrImageUrl(emargerUrl, 220),
        checklist: BACKSTAGE_CHECKLIST.map((c) => ({ moment: c.moment, text: c.text })),
        docs,
        formateurUrl,
        contactName,
        contactPhone,
        contactInitials,
      }),
    );
  }

  const result = await sendEmail({
    to: toEmail,
    from: EDGE_COCKPIT_FROM,
    replyTo,
    subject,
    html,
    tags: {
      type: params.mailType === "rappel" ? "formation-backstage-rappel" : "formation-backstage",
      dossier_id: params.dossierId,
      slot_id: slot.id,
    },
  });

  if (!result.success) {
    await logSend(service, {
      dossierId: params.dossierId,
      sessionId: dossier.session_id ? String(dossier.session_id) : null,
      slotId: slot.id,
      formateurId: trainer.id,
      toEmail,
      mailType: params.mailType,
      status: "failed",
      error: result.error || "email_failed",
      forced: params.force,
    });
    return { ok: false, error: result.error || "email_failed" };
  }

  await logSend(service, {
    dossierId: params.dossierId,
    sessionId: dossier.session_id ? String(dossier.session_id) : null,
    slotId: slot.id,
    formateurId: trainer.id,
    toEmail,
    mailType: params.mailType,
    resendId: result.messageId ?? null,
    status: "sent",
    forced: params.force,
  });

  await service.from("formation_events").insert({
    dossier_id: params.dossierId,
    event_type: "backstage_sent",
    payload: {
      to: toEmail,
      slot_id: slot.id,
      mail_type: params.mailType,
      forced: Boolean(params.force),
      resend_id: result.messageId ?? null,
    },
  });

  return { ok: true, messageId: result.messageId };
}

/** @deprecated alias — conserve les imports existants. */
export async function sendPackFormateurEmail(
  service: SupabaseClient,
  params: {
    dossierId: string;
    toEmail: string;
    slotId?: string | null;
    payload?: Record<string, unknown> | null;
  },
) {
  return sendBackstageEmail(service, {
    dossierId: params.dossierId,
    toEmail: params.toEmail,
    slotId: params.slotId,
    mailType: "backstage",
    force: true,
  });
}
