import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { getServiceRoleClient, getServerClient } from "@/lib/supabase/server";
import { notifyTutorMissionSubmitted } from "@/lib/tuteur/mission-emails";

export const dynamic = "force-dynamic";

const PROOF_BUCKET = "public";

function sanitizeFileName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

/** L'alternant démarre ou soumet une mission assignée par son tuteur. */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getServiceRoleClient() ?? (await getServerClient());
  if (!db) return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });

  const { id: missionId } = await params;

  const contentType = request.headers.get("content-type") ?? "";
  let action = "";
  let learnerNote = "";
  let proofUrl = "";
  let file: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const form = await request.formData();
    action = String(form.get("action") ?? "");
    learnerNote = String(form.get("learnerNote") ?? "").trim();
    proofUrl = String(form.get("proofUrl") ?? "").trim();
    const raw = form.get("file");
    file = raw instanceof File && raw.size > 0 ? raw : null;
  } else {
    const body = (await request.json().catch(() => null)) as {
      action?: string;
      learnerNote?: string;
      proofUrl?: string;
    } | null;
    action = String(body?.action ?? "");
    learnerNote = String(body?.learnerNote ?? "").trim();
    proofUrl = String(body?.proofUrl ?? "").trim();
  }

  const nextStatus =
    action === "start"
      ? "in_progress"
      : action === "submit" || action === "update_proof"
        ? "submitted"
        : null;
  if (!nextStatus) {
    return NextResponse.json({ error: "Action inconnue (start | submit | update_proof)" }, { status: 400 });
  }

  const { data: mission } = await db
    .from("tutor_missions")
    .select("id, assignment_id, status, title")
    .eq("id", missionId)
    .maybeSingle();
  if (!mission) return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });

  const { data: assignment } = await db
    .from("tutor_assignments")
    .select("id, learner_id, tutor_id, status")
    .eq("id", (mission as { assignment_id: string }).assignment_id)
    .maybeSingle();

  if (
    !assignment ||
    String((assignment as { learner_id: string }).learner_id) !== session.id ||
    !["active", "paused"].includes(String((assignment as { status?: string }).status ?? ""))
  ) {
    return NextResponse.json({ error: "Mission introuvable" }, { status: 404 });
  }

  const current = String((mission as { status?: string }).status ?? "todo");
  if (action === "start" && !["todo", "correction_requested"].includes(current)) {
    return NextResponse.json({ error: "Cette mission n’est plus à démarrer." }, { status: 400 });
  }
  if (
    action === "submit" &&
    !["todo", "in_progress", "correction_requested"].includes(current)
  ) {
    return NextResponse.json({ error: "Cette mission n’est plus à envoyer." }, { status: 400 });
  }
  if (action === "update_proof" && current !== "submitted") {
    return NextResponse.json(
      { error: "Tu ne peux compléter la preuve que sur une mission déjà envoyée." },
      { status: 400 },
    );
  }

  if (action === "submit" || action === "update_proof") {
    if (!learnerNote && !proofUrl && !file) {
      return NextResponse.json(
        { error: "Ajoute un commentaire, un lien ou un document pour prouver ton travail." },
        { status: 400 },
      );
    }
  }

  if (file && (action === "submit" || action === "update_proof")) {
    if (file.size > 12 * 1024 * 1024) {
      return NextResponse.json({ error: "Fichier trop volumineux (max 12 Mo)." }, { status: 400 });
    }
    const safeName = sanitizeFileName(file.name || "preuve");
    const path = `tutor-missions/${missionId}/${Date.now()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadErr } = await db.storage.from(PROOF_BUCKET).upload(path, buffer, {
      contentType: file.type || "application/octet-stream",
      upsert: true,
    });
    if (uploadErr) {
      return NextResponse.json(
        { error: `Upload impossible : ${uploadErr.message}` },
        { status: 400 },
      );
    }
    const { data: pub } = db.storage.from(PROOF_BUCKET).getPublicUrl(path);
    proofUrl = pub?.publicUrl || proofUrl;
  }

  const payload: Record<string, unknown> = {
    status: nextStatus,
  };
  if (nextStatus === "submitted") {
    payload.submitted_at = new Date().toISOString();
    if (learnerNote) payload.learner_note = learnerNote;
    if (proofUrl) payload.proof_url = proofUrl;
  }

  const { error } = await db.from("tutor_missions").update(payload).eq("id", missionId);
  if (error) {
    // Colonnes absentes (migration pas encore appliquée) → status + log de preuve
    if (/learner_note|proof_url|column/i.test(error.message)) {
      const fallback: Record<string, unknown> = {
        status: nextStatus,
      };
      if (nextStatus === "submitted") {
        fallback.submitted_at = new Date().toISOString();
      }
      const retry = await db.from("tutor_missions").update(fallback).eq("id", missionId);
      if (retry.error) return NextResponse.json({ error: retry.error.message }, { status: 400 });
      const composed = [learnerNote, proofUrl ? `Preuve : ${proofUrl}` : ""].filter(Boolean).join("\n\n");
      if (composed) {
        await db.from("tutor_mission_logs").insert({
          mission_id: missionId,
          author_id: session.id,
          entry_type: "comment",
          content: composed.slice(0, 4000),
        });
      }
    } else {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
  }

  if (action === "submit" || action === "update_proof") {
    const tutorId = String((assignment as { tutor_id?: string | null }).tutor_id ?? "");
    if (tutorId) {
      const { data: learnerProfile } = await db
        .from("profiles")
        .select("full_name, first_name, last_name, email")
        .eq("id", session.id)
        .maybeSingle();
      const learnerName =
        String((learnerProfile as { full_name?: string | null } | null)?.full_name ?? "").trim() ||
        [
          (learnerProfile as { first_name?: string | null } | null)?.first_name,
          (learnerProfile as { last_name?: string | null } | null)?.last_name,
        ]
          .filter(Boolean)
          .join(" ")
          .trim() ||
        String((learnerProfile as { email?: string | null } | null)?.email ?? "Alternant");
      void notifyTutorMissionSubmitted({
        db,
        tutorId,
        learnerName,
        missionTitle: String((mission as { title?: string }).title ?? "Mission"),
        learnerNote: learnerNote || null,
        proofUrl: proofUrl || null,
      }).catch((err) => console.warn("[apprenant/missions] mail tutor submit", err));
    }
  }

  return NextResponse.json({ ok: true, status: nextStatus, proofUrl: proofUrl || null });
}
