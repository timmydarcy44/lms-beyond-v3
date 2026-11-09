import type { SupabaseClient } from "@supabase/supabase-js";
import { jsPDF } from "jspdf";
import type { AssessmentQuestion } from "@/lib/formation-assessments/types";
import { newDocToken, uploadFormationPdf } from "@/lib/formation-documents/storage";

function formatAnswer(raw: unknown): string {
  if (raw == null) return "—";
  if (Array.isArray(raw)) return raw.map(String).join(", ") || "—";
  return String(raw);
}

/** Archive une tentative complétée dans le coffre Qualiopi du dossier. */
export async function archiveAssessmentAttemptToCoffre(
  service: SupabaseClient,
  params: {
    dossierId: string;
    attemptId: string;
    kind: string;
    participantId?: string | null;
    title: string;
    questions: AssessmentQuestion[];
    answers: Record<string, unknown>;
    scorePct?: number | null;
    completedAt?: string | null;
  },
): Promise<{ ok: true; documentId: string } | { ok: false; error: string }> {
  let participantLabel = "";
  if (params.participantId) {
    const { data: part } = await service
      .from("formation_participants")
      .select("profile_id")
      .eq("id", params.participantId)
      .maybeSingle();
    if (part?.profile_id) {
      const { data: profile } = await service
        .from("profiles")
        .select("full_name, first_name, last_name, email")
        .eq("id", part.profile_id)
        .maybeSingle();
      participantLabel =
        String(profile?.full_name ?? "").trim() ||
        [profile?.first_name, profile?.last_name].filter(Boolean).join(" ").trim() ||
        String(profile?.email || "").trim();
    }
  }

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 16;
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(params.title.slice(0, 80), margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  if (participantLabel) {
    doc.text(`Participant : ${participantLabel.slice(0, 90)}`, margin, y);
    y += 5;
  }
  doc.text(`Type : ${params.kind}`, margin, y);
  y += 5;
  if (params.completedAt) {
    doc.text(`Complete le : ${new Date(params.completedAt).toLocaleString("fr-FR")}`, margin, y);
    y += 5;
  }
  if (params.scorePct != null) {
    doc.text(`Score indicatif : ${params.scorePct} %`, margin, y);
    y += 5;
  }
  y += 4;

  for (const q of params.questions) {
    if (q.type === "section") continue;
    if (y > 270) {
      doc.addPage();
      y = 18;
    }
    doc.setFont("helvetica", "bold");
    const promptLines = doc.splitTextToSize(q.prompt, 178);
    doc.text(promptLines, margin, y);
    y += promptLines.length * 5 + 1;
    doc.setFont("helvetica", "normal");
    const answerLines = doc.splitTextToSize(formatAnswer(params.answers[q.id]), 178);
    doc.text(answerLines, margin, y);
    y += answerLines.length * 5 + 4;
  }

  const buffer = Buffer.from(doc.output("arraybuffer"));
  const kind =
    params.kind === "positionnement"
      ? "reponses_positionnement"
      : params.kind === "eval_chaud"
        ? "reponses_chaud"
        : params.kind === "eval_froid"
          ? "reponses_froid"
          : `reponses_${params.kind}`;
  const uploaded = await uploadFormationPdf(service, {
    dossierId: params.dossierId,
    kind,
    buffer,
  });

  const title = (
    participantLabel
      ? `${params.title} — ${participantLabel}`
      : params.title
  ).slice(0, 180);
  const meta = {
    attempt_id: params.attemptId,
    assessment_kind: params.kind,
    score_pct: params.scorePct ?? null,
    completed_at: params.completedAt ?? null,
    answers: params.answers,
  };

  let query = service
    .from("formation_documents")
    .select("id")
    .eq("dossier_id", params.dossierId)
    .eq("kind", kind);
  if (params.participantId) query = query.eq("participant_id", params.participantId);
  else query = query.is("participant_id", null);

  const { data: existing } = await query.maybeSingle();

  const patch: Record<string, unknown> = {
    title,
    status: "signed",
    signed_at: params.completedAt || new Date().toISOString(),
    generated_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    participant_id: params.participantId ?? null,
    meta,
    file_url: uploaded?.fileUrl ?? null,
  };
  if (uploaded) {
    patch.storage_bucket = uploaded.bucket;
    patch.storage_path = uploaded.path;
  }

  if (existing?.id) {
    const { error } = await service.from("formation_documents").update(patch).eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, documentId: String(existing.id) };
  }

  const { data, error } = await service
    .from("formation_documents")
    .insert({
      dossier_id: params.dossierId,
      kind,
      title,
      access_token: newDocToken(),
      ...patch,
    })
    .select("id")
    .single();

  if (error || !data) return { ok: false, error: error?.message || "Archive impossible" };

  await service.from("formation_events").insert({
    dossier_id: params.dossierId,
    event_type: "assessment_archived",
    payload: {
      kind: params.kind,
      attempt_id: params.attemptId,
      document_id: data.id,
    },
  });

  return { ok: true, documentId: String(data.id) };
}
