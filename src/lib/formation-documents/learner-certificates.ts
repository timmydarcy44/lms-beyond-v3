import type { SupabaseClient } from "@supabase/supabase-js";
import { countAttendedHalfDays } from "@/lib/formation-assessments/attendance-duration";
import { loadDossierDocContext } from "@/lib/formation-documents/context";
import { buildFormationDocumentPdf } from "@/lib/formation-documents/pdf";
import { newDocToken, uploadFormationPdf } from "@/lib/formation-documents/storage";

/** Génère et stocke certificat + attestation par apprenant (présence réelle). */
export async function archiveLearnerCertificates(
  service: SupabaseClient,
  params: {
    dossierId: string;
    actorUserId?: string | null;
    minAttendance?: number;
  },
): Promise<{ ok: true; certificat: number; attestation: number } | { ok: false; error: string }> {
  const ctx = await loadDossierDocContext(service, params.dossierId);
  if (!ctx) return { ok: false, error: "Dossier introuvable" };

  const minAttendance = params.minAttendance ?? 1;
  let certificat = 0;
  let attestation = 0;
  const now = new Date().toISOString();

  for (const p of ctx.participants) {
    const duration = await countAttendedHalfDays(service, {
      sessionId: ctx.dossier.session_id,
      profileId: p.profile_id,
    });
    if (duration.attended < minAttendance) continue;

    for (const kind of ["certificat", "attestation"] as const) {
      const buffer = buildFormationDocumentPdf({
        ctx,
        kind,
        participantName: p.name,
        attendedHalfDays: duration.attended,
        plannedHalfDays: duration.planned,
      });
      const uploaded = await uploadFormationPdf(service, {
        dossierId: params.dossierId,
        kind,
        buffer,
      });

      const title =
        kind === "certificat"
          ? `Certificat — ${p.name}`
          : `Attestation — ${p.name}`;

      const { data: existing } = await service
        .from("formation_documents")
        .select("id")
        .eq("dossier_id", params.dossierId)
        .eq("kind", kind)
        .eq("participant_id", p.id)
        .maybeSingle();

      const patch: Record<string, unknown> = {
        title,
        status: "sent",
        generated_at: now,
        updated_at: now,
        participant_id: p.id,
        meta: {
          profile_id: p.profile_id,
          participant_name: p.name,
          attended_half_days: duration.attended,
          planned_half_days: duration.planned,
        },
        file_url: uploaded?.fileUrl ?? null,
      };
      if (uploaded) {
        patch.storage_bucket = uploaded.bucket;
        patch.storage_path = uploaded.path;
      }

      if (existing?.id) {
        const { error } = await service
          .from("formation_documents")
          .update(patch)
          .eq("id", existing.id);
        if (!error) {
          if (kind === "certificat") certificat += 1;
          else attestation += 1;
        }
      } else {
        const { error } = await service.from("formation_documents").insert({
          dossier_id: params.dossierId,
          kind,
          title,
          access_token: newDocToken(),
          ...patch,
        });
        if (!error) {
          if (kind === "certificat") certificat += 1;
          else attestation += 1;
        }
      }
    }
  }

  await service.from("formation_events").insert({
    dossier_id: params.dossierId,
    event_type: "learner_certificates_archived",
    actor_user_id: params.actorUserId ?? null,
    payload: { certificat, attestation },
  });

  return { ok: true, certificat, attestation };
}
