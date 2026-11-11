import type { SupabaseClient } from "@supabase/supabase-js";
import type { ScheduledMailKind } from "@/lib/formation-documents/constants";

const DAY_MS = 24 * 60 * 60 * 1000;

export async function upsertScheduledMail(
  service: SupabaseClient,
  row: {
    dossierId: string;
    kind: ScheduledMailKind;
    toEmail: string;
    scheduledAt: Date;
    participantId?: string | null;
    profileId?: string | null;
    slotId?: string | null;
    documentId?: string | null;
    payload?: Record<string, unknown>;
  },
): Promise<void> {
  const email = row.toEmail.trim().toLowerCase();
  if (!email.includes("@")) return;

  // Annule un éventuel doublon actif puis recrée (idempotent métier).
  let cancelQuery = service
    .from("formation_scheduled_mails")
    .update({
      cancelled_at: new Date().toISOString(),
      cancel_reason: "reschedule",
      updated_at: new Date().toISOString(),
    })
    .eq("dossier_id", row.dossierId)
    .eq("kind", row.kind)
    .is("sent_at", null)
    .is("cancelled_at", null);

  if (row.participantId) cancelQuery = cancelQuery.eq("participant_id", row.participantId);
  else cancelQuery = cancelQuery.is("participant_id", null);

  if (row.slotId) cancelQuery = cancelQuery.eq("slot_id", row.slotId);
  else cancelQuery = cancelQuery.is("slot_id", null);

  await cancelQuery;

  await service.from("formation_scheduled_mails").insert({
    dossier_id: row.dossierId,
    kind: row.kind,
    to_email: email,
    scheduled_at: row.scheduledAt.toISOString(),
    participant_id: row.participantId ?? null,
    profile_id: row.profileId ?? null,
    slot_id: row.slotId ?? null,
    document_id: row.documentId ?? null,
    payload: row.payload ?? {},
  });
}

/** Relances devis/convention J+3 et J+7 si non signé. */
export async function scheduleDocRelances(
  service: SupabaseClient,
  params: {
    dossierId: string;
    kind: "devis" | "convention";
    toEmail: string;
    documentId: string;
    sentAt?: Date;
  },
) {
  const base = params.sentAt ?? new Date();
  const j3 = params.kind === "devis" ? "devis_relance_j3" : "convention_relance_j3";
  const j7 = params.kind === "devis" ? "devis_relance_j7" : "convention_relance_j7";
  await upsertScheduledMail(service, {
    dossierId: params.dossierId,
    kind: j3,
    toEmail: params.toEmail,
    scheduledAt: new Date(base.getTime() + 3 * DAY_MS),
    documentId: params.documentId,
  });
  await upsertScheduledMail(service, {
    dossierId: params.dossierId,
    kind: j7,
    toEmail: params.toEmail,
    scheduledAt: new Date(base.getTime() + 7 * DAY_MS),
    documentId: params.documentId,
  });
}

/** Annule les relances restantes quand le document est ouvert/signé. */
export async function cancelDocRelances(
  service: SupabaseClient,
  dossierId: string,
  docKind: "devis" | "convention",
) {
  const kinds =
    docKind === "devis"
      ? ["devis_relance_j3", "devis_relance_j7"]
      : ["convention_relance_j3", "convention_relance_j7"];
  await service
    .from("formation_scheduled_mails")
    .update({
      cancelled_at: new Date().toISOString(),
      cancel_reason: "document_progressed",
      updated_at: new Date().toISOString(),
    })
    .eq("dossier_id", dossierId)
    .in("kind", kinds)
    .is("sent_at", null)
    .is("cancelled_at", null);
}

/** Relance absents après clôture d'un créneau. */
export async function scheduleAbsentRelances(
  service: SupabaseClient,
  params: {
    dossierId: string;
    slotId: string;
    absents: Array<{
      participantId?: string | null;
      profileId: string;
      email: string;
      name: string;
    }>;
  },
) {
  const when = new Date(Date.now() + 2 * 60 * 60 * 1000); // +2h (fin de journée pratique)
  for (const a of params.absents) {
    await upsertScheduledMail(service, {
      dossierId: params.dossierId,
      kind: "absent_relance",
      toEmail: a.email,
      scheduledAt: when,
      participantId: a.participantId,
      profileId: a.profileId,
      slotId: params.slotId,
      payload: { name: a.name },
    });
  }
}

/**
 * Byound Backstage :
 * - mail principal à J-2 09:00 Europe/Paris (immédiat si création tardive, jamais si session passée)
 * - rappel le jour J, 1 h avant le début (plancher 07:30 Paris)
 * Un couple de mails par jour de session (premier créneau du jour).
 */
export async function scheduleBackstageMails(
  service: SupabaseClient,
  params: {
    dossierId: string;
    trainerEmail: string | null;
    courseTitle?: string | null;
    location?: string | null;
    slots: Array<{
      id: string;
      slot_date: string;
      day_part: string;
      starts_at?: string | null;
      ends_at?: string | null;
    }>;
  },
) {
  if (!params.trainerEmail?.includes("@")) return;

  const { addCivilDays, parisWallToUtc } = await import(
    "@/lib/formation-documents/paris-time"
  );

  const byDate = new Map<string, (typeof params.slots)[number]>();
  for (const slot of params.slots) {
    const key = String(slot.slot_date);
    if (!byDate.has(key)) byDate.set(key, slot);
  }

  // Annule d'anciens packs J-1 encore en file
  await service
    .from("formation_scheduled_mails")
    .update({
      cancelled_at: new Date().toISOString(),
      cancel_reason: "backstage_rename",
      updated_at: new Date().toISOString(),
    })
    .eq("dossier_id", params.dossierId)
    .eq("kind", "pack_formateur_j1")
    .is("sent_at", null)
    .is("cancelled_at", null);

  const now = Date.now();

  for (const slot of byDate.values()) {
    const startsAt = slot.starts_at
      ? new Date(slot.starts_at)
      : parisWallToUtc(slot.slot_date, slot.day_part === "apres_midi" ? 13 : 9, 0);
    const endsAt = slot.ends_at
      ? new Date(slot.ends_at)
      : parisWallToUtc(slot.slot_date, slot.day_part === "apres_midi" ? 17 : 12, 0);

    if (!Number.isFinite(startsAt.getTime())) continue;

    // Session du jour déjà terminée (+1h marge) → aucun envoi
    if (endsAt.getTime() + 60 * 60 * 1000 < now) continue;

    const payload = {
      course_title: params.courseTitle ?? null,
      location: params.location ?? null,
      slot_date: slot.slot_date,
      day_part: slot.day_part,
    };

    // —— Backstage J-2 09:00 Paris ——
    const j2Ymd = addCivilDays(slot.slot_date, -2);
    let backstageAt = parisWallToUtc(j2Ymd, 9, 0);
    if (backstageAt.getTime() < now) {
      // Création tardive : immédiat si session encore future
      if (startsAt.getTime() > now) {
        backstageAt = new Date(now + 2 * 60_000);
      } else {
        backstageAt = new Date(NaN); // trop tard pour le pack J-2
      }
    }
    if (Number.isFinite(backstageAt.getTime())) {
      await upsertScheduledMail(service, {
        dossierId: params.dossierId,
        kind: "backstage_j2",
        toEmail: params.trainerEmail,
        scheduledAt: backstageAt,
        slotId: slot.id,
        payload,
      });
    }

    // —— Rappel jour J : 1 h avant, plancher 07:30 Paris ——
    let reminderAt = new Date(startsAt.getTime() - 60 * 60 * 1000);
    const floor = parisWallToUtc(slot.slot_date, 7, 30);
    if (reminderAt.getTime() < floor.getTime()) reminderAt = floor;
    if (reminderAt.getTime() < now) {
      if (startsAt.getTime() > now) {
        reminderAt = new Date(now + 2 * 60_000);
      } else {
        reminderAt = new Date(NaN);
      }
    }
    if (Number.isFinite(reminderAt.getTime())) {
      await upsertScheduledMail(service, {
        dossierId: params.dossierId,
        kind: "backstage_rappel",
        toEmail: params.trainerEmail,
        scheduledAt: reminderAt,
        slotId: slot.id,
        payload,
      });
    }
  }
}

/** @deprecated alias → scheduleBackstageMails */
export async function schedulePackFormateurMails(
  service: SupabaseClient,
  params: {
    dossierId: string;
    trainerEmail: string | null;
    courseTitle?: string | null;
    location?: string | null;
    slots: Array<{
      id: string;
      slot_date: string;
      day_part: string;
      starts_at?: string | null;
      ends_at?: string | null;
    }>;
  },
) {
  return scheduleBackstageMails(service, params);
}

/**
 * Après convention + date de session fixée : positionnement à J-3 pour chaque
 * participant, puis synthèse formateur à J-1.
 */
export async function schedulePositionnementMails(
  service: SupabaseClient,
  params: {
    dossierId: string;
    /** Première date de session (YYYY-MM-DD). */
    firstSlotDate: string;
    participants: Array<{
      participantId: string;
      profileId: string;
      email: string;
      name: string;
    }>;
    trainerEmail: string | null;
    courseTitle?: string | null;
  },
) {
  const slotDate = new Date(`${params.firstSlotDate}T09:00:00`);
  if (!Number.isFinite(slotDate.getTime())) return;

  const j3 = new Date(slotDate.getTime() - 3 * DAY_MS);
  const j1 = new Date(slotDate.getTime() - 1 * DAY_MS);
  const sendAtJ3 = j3.getTime() < Date.now() ? new Date() : j3;
  const sendAtJ1 = j1.getTime() < Date.now() ? new Date(Date.now() + 5 * 60_000) : j1;

  for (const p of params.participants) {
    if (!p.email.includes("@")) continue;
    await upsertScheduledMail(service, {
      dossierId: params.dossierId,
      kind: "positionnement_j3",
      toEmail: p.email,
      scheduledAt: sendAtJ3,
      participantId: p.participantId,
      profileId: p.profileId,
      payload: { name: p.name, course_title: params.courseTitle ?? null },
    });
  }

  if (params.trainerEmail?.includes("@")) {
    await upsertScheduledMail(service, {
      dossierId: params.dossierId,
      kind: "positionnement_synth_formateur",
      toEmail: params.trainerEmail,
      scheduledAt: sendAtJ1,
      payload: {
        course_title: params.courseTitle ?? null,
        first_slot_date: params.firstSlotDate,
      },
    });
  }
}

/** J+60 éval à froid (participants) + questionnaire entreprise (contact). */
export async function schedulePostSessionMails(
  service: SupabaseClient,
  params: {
    dossierId: string;
    sessionEndDate: Date;
    contactEmail: string | null;
    participants: Array<{
      participantId: string;
      profileId: string;
      email: string;
      name: string;
    }>;
  },
) {
  const at = new Date(params.sessionEndDate.getTime() + 60 * DAY_MS);
  for (const p of params.participants) {
    await upsertScheduledMail(service, {
      dossierId: params.dossierId,
      kind: "eval_froid_j60",
      toEmail: p.email,
      scheduledAt: at,
      participantId: p.participantId,
      profileId: p.profileId,
      payload: { name: p.name, profile_id: p.profileId },
    });
  }
  if (params.contactEmail) {
    await upsertScheduledMail(service, {
      dossierId: params.dossierId,
      kind: "questionnaire_entreprise_j60",
      toEmail: params.contactEmail,
      scheduledAt: at,
    });
  }
}
