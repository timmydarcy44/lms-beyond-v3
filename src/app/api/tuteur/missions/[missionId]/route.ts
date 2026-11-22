import { NextRequest, NextResponse } from "next/server";

import {
  notifyLearnerCorrectionRequested,
  notifyLearnerMissionValidated,
} from "@/lib/tuteur/mission-emails";
import { recordTutorValidatedProof } from "@/lib/tuteur/skill-proof";
import { requireTutorClient } from "@/lib/tuteur/require-tutor";
import { getServiceRoleClient } from "@/lib/supabase/server";

function mapBodyStatutToDb(
  statut: string,
): "assigned" | "submitted" | "validated" | "changes_requested" | null {
  const v = String(statut ?? "").toUpperCase().replace(/\s/g, "_");
  if (v === "VALIDEE" || v === "DONE" || v === "VALIDÉE" || v === "VALIDATED") return "validated";
  if (
    v === "INVALIDEE" ||
    v === "INVALID" ||
    v === "CORRECTION_REQUESTED" ||
    v === "CHANGES_REQUESTED" ||
    v === "A_REPRENDRE"
  ) {
    return "changes_requested";
  }
  if (v === "SUBMITTED" || v === "A_VALIDER") return "submitted";
  if (v === "TODO" || v === "A_FAIRE" || v === "ASSIGNED" || v === "EN_COURS" || v === "IN_PROGRESS") {
    return "assigned";
  }
  return null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const auth = await requireTutorClient();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { missionId } = await params;
  const { data: mission, error } = await auth.ctx.supabase
    .from("tutor_missions")
    .select(
      "id, assignment_id, title, instructions, status, due_date, invalidation_reason, learner_note, proof_url, proof_links, proof_files, submitted_at, skill_id, created_at",
    )
    .eq("id", missionId)
    .maybeSingle();

  if (error || !mission) {
    return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  }

  // Marque l'ouverture tuteur (bloque le retrait apprenant)
  await auth.ctx.supabase
    .from("tutor_missions")
    .update({ tutor_opened_at: new Date().toISOString() })
    .eq("id", missionId)
    .is("tutor_opened_at", null);

  return NextResponse.json(mission);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ missionId: string }> },
) {
  const auth = await requireTutorClient();
  if (!auth.ok) {
    return NextResponse.json({ error: auth.message }, { status: auth.status });
  }

  const { missionId } = await params;
  let body: { statut?: string; motif?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const dbStatus = mapBodyStatutToDb(String(body.statut ?? ""));
  if (!dbStatus) {
    return NextResponse.json({ error: "Statut inconnu" }, { status: 400 });
  }

  if (dbStatus === "changes_requested" && !String(body.motif ?? "").trim()) {
    return NextResponse.json({ error: "Motif obligatoire pour une demande de correction" }, { status: 400 });
  }

  const supabase = auth.ctx.supabase;
  const userId = auth.ctx.userId;

  const { data: existing, error: fetchErr } = await supabase
    .from("tutor_missions")
    .select(
      "id, assignment_id, status, title, skill_id, learner_note, proof_url, competency_label",
    )
    .eq("id", missionId)
    .maybeSingle();

  if (fetchErr || !existing) {
    return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  }

  const { data: assignment } = await supabase
    .from("tutor_assignments")
    .select("id, tutor_id, learner_id")
    .eq("id", existing.assignment_id)
    .maybeSingle();
  if (!assignment || assignment.tutor_id !== userId) {
    return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  }

  const updatePayload: Record<string, unknown> = {
    status: dbStatus,
    tutor_opened_at: new Date().toISOString(),
  };

  const validated = dbStatus === "validated";
  const correction = dbStatus === "changes_requested";
  if (validated) {
    updatePayload.completed_at = new Date().toISOString();
    updatePayload.validated_at = new Date().toISOString();
    updatePayload.tutor_comment = String(body.motif ?? "").trim() || null;
    updatePayload.invalidation_reason = null;
  } else if (correction) {
    const motif = String(body.motif ?? "").trim();
    updatePayload.invalidation_reason = motif;
    updatePayload.tutor_comment = motif;
    updatePayload.completed_at = null;
    updatePayload.validated_at = null;
  } else {
    updatePayload.invalidation_reason = null;
    updatePayload.completed_at = null;
  }

  let updatedResult = await supabase
    .from("tutor_missions")
    .update(updatePayload)
    .eq("id", missionId)
    .select("id, status, completed_at, invalidation_reason")
    .single();

  if (updatedResult.error && (updatedResult.error.code === "42703" || updatedResult.error.code === "23514")) {
    const fallback = { ...updatePayload };
    delete fallback.validated_at;
    delete fallback.tutor_opened_at;
    if (fallback.status === "changes_requested") fallback.status = "correction_requested";
    if (fallback.status === "assigned") fallback.status = "todo";
    updatedResult = await supabase
      .from("tutor_missions")
      .update(fallback)
      .eq("id", missionId)
      .select("id, status, completed_at, invalidation_reason")
      .single();
  }
  const updated = updatedResult.data;
  const upErr = updatedResult.error;

  if (upErr) {
    console.error("[tuteur/missions PATCH]", upErr);
    return NextResponse.json({ error: "Mise à jour impossible" }, { status: 500 });
  }

  const logType = validated ? "validation" : correction ? "blocking" : "update";
  const logContent = validated
    ? "Mission validée par le tuteur"
    : correction
      ? String(body.motif ?? "").trim()
      : `Statut : ${dbStatus}`;

  await supabase.from("tutor_mission_logs").insert({
    mission_id: missionId,
    author_id: userId,
    entry_type: logType,
    content: logContent,
  });

  const mailDb = getServiceRoleClient() ?? supabase;
  const missionTitle = String(existing.title ?? "Mission").trim() || "Mission";
  const motif = String(body.motif ?? "").trim();
  const learnerId = String(assignment.learner_id);

  if (validated) {
    let label = missionTitle;
    if (existing.competency_label) label = String(existing.competency_label);
    const note = motif || "Validée par le tuteur";
    await recordTutorValidatedProof(learnerId, label, note);

    // Rattache la preuve à une déclaration skills existante, sinon suggestion via notification
    const skillId = existing.skill_id ? String(existing.skill_id) : null;
    let skillAttached = false;
    if (skillId) {
      const { data: decl } = await mailDb
        .from("skill_declarations")
        .select("id")
        .eq("user_id", learnerId)
        .eq("skill_id", skillId)
        .in("status", ["declared", "proven"])
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (decl?.id) {
        await mailDb
          .from("skill_declarations")
          .update({
            status: "proven",
            proof_review_status: "validated",
            proof_review_note: `Preuve issue de la mission « ${missionTitle} » validée par le tuteur.`,
            proof_note: existing.learner_note || note,
            proof_url: existing.proof_url || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", decl.id);
        skillAttached = true;
      } else {
        const { data: skill } = await mailDb.from("skills").select("label").eq("id", skillId).maybeSingle();
        const skillLabel = skill?.label ? String(skill.label) : label;
        await supabase.from("notifications").insert({
          user_id: learnerId,
          type: "info",
          title: "Compétence à déclarer",
          message: `Ta mission validée prouve « ${skillLabel} ». L'ajouter ? → /dashboard/apprenant/skills/develop?skill=${encodeURIComponent(skillId)}`,
          read: false,
        });
      }
    }

    await supabase.from("notifications").insert({
      user_id: learnerId,
      type: "info",
      title: "Mission validée",
      message: `${label} a été validée par votre tuteur.${skillAttached ? " Preuve rattachée à ta compétence." : ""}`,
      read: false,
    });
    void notifyLearnerMissionValidated({
      db: mailDb,
      learnerId,
      tutorName: auth.ctx.tutorName,
      missionTitle: label,
      message: motif || null,
    }).catch((err) => console.warn("[tuteur/missions] mail validation", err));
  } else if (correction) {
    await supabase.from("notifications").insert({
      user_id: learnerId,
      type: "info",
      title: "À reprendre",
      message: motif || "Votre tuteur demande une correction.",
      read: false,
    });
    void notifyLearnerCorrectionRequested({
      db: mailDb,
      learnerId,
      tutorName: auth.ctx.tutorName,
      missionTitle,
      message: motif,
    }).catch((err) => console.warn("[tuteur/missions] mail correction", err));
  }

  return NextResponse.json({
    id: updated?.id ?? missionId,
    updated: true,
    status: updated?.status,
  });
}
