import type { SupabaseClient } from "@supabase/supabase-js";
import type { FormationDossierStatus } from "@/lib/formation-dossier/constants";
import {
  evaluateFormationDossierTransition,
  type TransitionDossierResult,
} from "@/lib/formation-dossier/transition";

export type TransitionFormationDossierParams = {
  dossierId: string;
  toStatus: FormationDossierStatus;
  motif?: string | null;
  actorUserId?: string | null;
};

async function loadLockContext(service: SupabaseClient, dossierId: string, sessionId: string | null) {
  const { data: convention } = await service
    .from("formation_documents")
    .select("status")
    .eq("dossier_id", dossierId)
    .eq("kind", "convention")
    .maybeSingle();

  const { data: certificat } = await service
    .from("formation_documents")
    .select("status, generated_at, file_url")
    .eq("dossier_id", dossierId)
    .eq("kind", "certificat")
    .maybeSingle();

  let slotCount = 0;
  let closedCount = 0;
  if (sessionId) {
    const { data: slots } = await service
      .from("formation_slots")
      .select("id")
      .eq("session_id", sessionId);
    slotCount = slots?.length ?? 0;
    if (slotCount) {
      const ids = (slots ?? []).map((s) => String(s.id));
      const { data: closures } = await service
        .from("attendance_closures")
        .select("slot_id")
        .in("slot_id", ids);
      closedCount = closures?.length ?? 0;
    }
  }

  const conventionSigned = convention?.status === "signed";
  const allSlotsClosed = slotCount === 0 ? true : closedCount >= slotCount;
  const certificatReady = Boolean(
    certificat && (certificat.generated_at || certificat.file_url || certificat.status !== "to_generate"),
  );

  return {
    conventionSigned,
    allSlotsClosed,
    slotCount,
    qualiopiCoreReady: conventionSigned && allSlotsClosed && certificatReady,
  };
}

/**
 * Point d’entrée unique pour toute transition de statut (Kanban, boutons, jobs).
 */
export async function transitionFormationDossier(
  service: SupabaseClient,
  params: TransitionFormationDossierParams,
): Promise<TransitionDossierResult & { dossierId?: string }> {
  const { data: dossier, error } = await service
    .from("formation_dossiers")
    .select(
      "id, status, bpf_funder_type, subcontracting, partner_of_name, training_course_id, session_id, trainer_user_id, invoice_validated_at",
    )
    .eq("id", params.dossierId)
    .maybeSingle();

  if (error || !dossier) {
    return { ok: false, code: "invalid_status", message: "Dossier introuvable." };
  }

  const { data: participants } = await service
    .from("formation_participants")
    .select("bpf_learner_status")
    .eq("dossier_id", params.dossierId);

  const locks = await loadLockContext(
    service,
    params.dossierId,
    dossier.session_id ? String(dossier.session_id) : null,
  );

  let trainerCvReady = true;
  if (dossier.trainer_user_id) {
    const { dossierHasTrainerCv, resolveExpertCv } = await import(
      "@/lib/formation-documents/trainer-cv"
    );
    const snapshotted = await dossierHasTrainerCv(service, params.dossierId);
    if (snapshotted) {
      trainerCvReady = true;
    } else {
      const cv = await resolveExpertCv(service, String(dossier.trainer_user_id));
      trainerCvReady = Boolean(cv);
    }
  } else if (params.toStatus === "session") {
    trainerCvReady = false;
  }

  // BPF allégé : valeurs par défaut si absentes, pour ne pas bloquer Convention → Mise en place
  let bpfFunder = dossier.bpf_funder_type ? String(dossier.bpf_funder_type) : null;
  let subcontracting = dossier.subcontracting ? String(dossier.subcontracting) : null;
  if (!bpfFunder || !subcontracting) {
    const { data: fundingRow } = await service
      .from("formation_dossiers")
      .select("funding_type")
      .eq("id", params.dossierId)
      .maybeSingle();
    const funding = String(fundingRow?.funding_type ?? "").toLowerCase();
    if (!bpfFunder) {
      bpfFunder =
        funding === "opco" || funding.includes("opco") ? "opco" : "entreprises_salaries";
    }
    if (!subcontracting) subcontracting = "aucune";
    await service
      .from("formation_dossiers")
      .update({
        bpf_funder_type: bpfFunder,
        subcontracting,
        updated_at: new Date().toISOString(),
      })
      .eq("id", params.dossierId);
  }

  const evaluation = evaluateFormationDossierTransition({
    currentStatus: String(dossier.status) as FormationDossierStatus,
    toStatus: params.toStatus,
    motif: params.motif,
    dossier: {
      bpf_funder_type: bpfFunder,
      subcontracting,
      partner_of_name: dossier.partner_of_name,
      training_course_id: dossier.training_course_id,
      participantCount: participants?.length ?? 0,
      participantBpfStatuses: (participants ?? []).map((p) => p.bpf_learner_status),
      conventionSigned: locks.conventionSigned,
      trainerAssigned: Boolean(dossier.trainer_user_id),
      trainerCvReady,
      allSlotsClosed: locks.allSlotsClosed,
      slotCount: locks.slotCount,
      invoiceValidated: Boolean(dossier.invoice_validated_at),
      qualiopiCoreReady: locks.qualiopiCoreReady,
    },
  });

  if (!evaluation.ok) return evaluation;
  if (evaluation.direction === "noop") {
    return { ...evaluation, dossierId: params.dossierId };
  }

  const { error: updateError } = await service
    .from("formation_dossiers")
    .update({
      status: params.toStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", params.dossierId);

  if (updateError) {
    return { ok: false, code: "invalid_status", message: updateError.message };
  }

  await service.from("formation_events").insert({
    dossier_id: params.dossierId,
    event_type: "status_transition",
    from_status: evaluation.from,
    to_status: evaluation.to,
    actor_user_id: params.actorUserId ?? null,
    motif: params.motif?.trim() || null,
    payload: { direction: evaluation.direction },
  });

  // Lots 4a/4b — pré-génération silencieuse (l'envoi reste manuel / humain sauf cron).
  try {
    const { generateFormationDocuments } = await import("@/lib/formation-documents/generate");
    const { loadDossierDocContext } = await import("@/lib/formation-documents/context");
    const { schedulePostSessionMails, schedulePositionnementMails, upsertScheduledMail } =
      await import("@/lib/formation-documents/schedule");
    const { resolveTrainerEmail } = await import("@/lib/formation-assessments/synth");

    if (params.toStatus === "devis") {
      await generateFormationDocuments(service, {
        dossierId: params.dossierId,
        kinds: ["devis"],
        actorUserId: params.actorUserId,
      });
    } else if (params.toStatus === "convention") {
      await generateFormationDocuments(service, {
        dossierId: params.dossierId,
        kinds: ["convention", "cgv", "reglement", "programme"],
        actorUserId: params.actorUserId,
      });
    } else if (params.toStatus === "mise_en_place") {
      await generateFormationDocuments(service, {
        dossierId: params.dossierId,
        kinds: ["convocation", "livret", "programme"],
        actorUserId: params.actorUserId,
      });
      const ctx = await loadDossierDocContext(service, params.dossierId);
      const firstSlot = ctx?.slots[0];
      if (firstSlot && ctx) {
        const slotDate = new Date(`${firstSlot.slot_date}T09:00:00`);
        const j7 = new Date(slotDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        for (const p of ctx.participants.filter((x) => x.email)) {
          await upsertScheduledMail(service, {
            dossierId: params.dossierId,
            kind: "convocation_j7",
            toEmail: p.email!,
            scheduledAt: j7.getTime() < Date.now() ? new Date() : j7,
            participantId: p.id,
            payload: { name: p.name },
          });
        }
        const trainerEmail = await resolveTrainerEmail(service, params.dossierId);
        await schedulePositionnementMails(service, {
          dossierId: params.dossierId,
          firstSlotDate: firstSlot.slot_date,
          courseTitle: ctx.dossier.course_title,
          trainerEmail,
          participants: ctx.participants
            .filter((p) => p.email)
            .map((p) => ({
              participantId: p.id,
              profileId: p.profile_id,
              email: p.email!,
              name: p.name,
            })),
        });

        const { schedulePackFormateurMails } = await import(
          "@/lib/formation-documents/schedule"
        );
        const sessionId = ctx.dossier.session_id;
        if (sessionId) {
          const { data: allSlots } = await service
            .from("formation_slots")
            .select("id, slot_date, day_part")
            .eq("session_id", sessionId)
            .order("slot_date", { ascending: true });
          await schedulePackFormateurMails(service, {
            dossierId: params.dossierId,
            trainerEmail,
            courseTitle: ctx.dossier.course_title,
            location: ctx.session?.location_label ?? null,
            slots: (allSlots ?? []).map((s) => ({
              id: String(s.id),
              slot_date: String(s.slot_date),
              day_part: String(s.day_part),
            })),
          });
        }
      }
    } else if (params.toStatus === "session") {
      // Pack formateur immédiat dès l’entrée en Session
      const trainerEmail = await resolveTrainerEmail(service, params.dossierId);
      if (trainerEmail) {
        const ctx = await loadDossierDocContext(service, params.dossierId);
        const { sendPackFormateurEmail } = await import(
          "@/lib/formation-documents/pack-formateur"
        );
        let slotId: string | null = null;
        if (ctx?.dossier.session_id) {
          const { data: nextSlot } = await service
            .from("formation_slots")
            .select("id")
            .eq("session_id", ctx.dossier.session_id)
            .order("slot_date", { ascending: true })
            .order("day_part", { ascending: true })
            .limit(1)
            .maybeSingle();
          slotId = nextSlot?.id ? String(nextSlot.id) : null;
        }
        const sent = await sendPackFormateurEmail(service, {
          dossierId: params.dossierId,
          toEmail: trainerEmail,
          slotId,
          payload: {
            course_title: ctx?.dossier.course_title ?? null,
            location: ctx?.session?.location_label ?? null,
          },
        });
        if (!sent.ok) {
          console.warn("[formation-dossier] pack formateur:", sent.error);
        } else {
          await service.from("formation_events").insert({
            dossier_id: params.dossierId,
            event_type: "pack_formateur_sent",
            actor_user_id: params.actorUserId ?? null,
            payload: { to: trainerEmail, slot_id: slotId, trigger: "status_session" },
          });
        }
        // Garde aussi le planning J-1 pour les jours suivants
        if (ctx?.dossier.session_id) {
          const { schedulePackFormateurMails } = await import(
            "@/lib/formation-documents/schedule"
          );
          const { data: allSlots } = await service
            .from("formation_slots")
            .select("id, slot_date, day_part")
            .eq("session_id", ctx.dossier.session_id)
            .order("slot_date", { ascending: true });
          await schedulePackFormateurMails(service, {
            dossierId: params.dossierId,
            trainerEmail,
            courseTitle: ctx.dossier.course_title,
            location: ctx.session?.location_label ?? null,
            slots: (allSlots ?? []).map((s) => ({
              id: String(s.id),
              slot_date: String(s.slot_date),
              day_part: String(s.day_part),
            })),
          });
        }
      }
    } else if (params.toStatus === "fin") {
      const { archiveLearnerCertificates } = await import(
        "@/lib/formation-documents/learner-certificates"
      );
      await archiveLearnerCertificates(service, {
        dossierId: params.dossierId,
        actorUserId: params.actorUserId,
      });
      const ctx = await loadDossierDocContext(service, params.dossierId);
      if (ctx) {
        const last = ctx.slots[ctx.slots.length - 1];
        const end = last ? new Date(`${last.slot_date}T18:00:00`) : new Date();
        await schedulePostSessionMails(service, {
          dossierId: params.dossierId,
          sessionEndDate: end,
          contactEmail: ctx.dossier.contact_email,
          participants: ctx.participants
            .filter((p) => p.email)
            .map((p) => ({
              participantId: p.id,
              profileId: p.profile_id,
              email: p.email!,
              name: p.name,
            })),
        });
        // Lot 6 — éval à chaud immédiate
        const { sendAssessmentInvites } = await import("@/lib/formation-assessments/send");
        await sendAssessmentInvites(service, {
          dossierId: params.dossierId,
          kind: "eval_chaud",
          onlyPending: true,
        });
      }
    }
  } catch (error) {
    console.warn("[formation-dossier] auto-generate docs:", error);
  }

  return { ...evaluation, dossierId: params.dossierId };
}
