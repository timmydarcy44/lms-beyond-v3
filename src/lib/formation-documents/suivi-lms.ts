import { jsPDF } from "jspdf";
import type { SupabaseClient } from "@supabase/supabase-js";
import { newDocToken, uploadFormationPdf } from "@/lib/formation-documents/storage";
import {
  collectProgressLeafIds,
  type OutlineSection,
} from "@/lib/courses/learner-outline-progress";

export const SUIVI_LMS_KIND = "suivi_lms";
export const SUIVI_LMS_SESSION_KIND = "suivi_lms_session";

export type SuiviConnection = {
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  duration_active_seconds: number;
  content_type: string;
  content_id: string;
  content_label: string;
};

export type SuiviModuleTime = {
  content_id: string;
  label: string;
  active_seconds: number;
  total_seconds: number;
};

export type SuiviQuiz = {
  test_id: string;
  title: string;
  score: number | null;
  max_score: number | null;
  percentage: number | null;
  completed_at: string | null;
  source: "quiz_submissions" | "test_attempts";
};

export type ParticipantSuiviLms = {
  participant_id: string;
  profile_id: string;
  learner_name: string;
  learner_email: string | null;
  lms_course_id: string;
  course_title: string;
  progress_percent: number | null;
  last_accessed_at: string | null;
  completed_at: string | null;
  connections: SuiviConnection[];
  modules: SuiviModuleTime[];
  quizzes: SuiviQuiz[];
  total_active_seconds: number;
  total_seconds: number;
};

function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (h > 0) return `${h} h ${m} min`;
  if (m > 0) return `${m} min`;
  return s >= 1 ? `${s} s` : "—";
}

function formatDt(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("fr-FR", { timeZone: "Europe/Paris" });
}

function displayName(p: {
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
}): string {
  return (
    String(p.full_name ?? "").trim() ||
    [p.first_name, p.last_name].filter(Boolean).join(" ").trim() ||
    String(p.email ?? "Apprenant")
  );
}

function outlineFromSnapshot(snapshot: unknown): OutlineSection[] {
  if (!snapshot || typeof snapshot !== "object") return [];
  const sections = (snapshot as { sections?: unknown }).sections;
  if (!Array.isArray(sections)) return [];
  return sections as OutlineSection[];
}

function labelMapFromOutline(sections: OutlineSection[], courseTitle: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const s of sections) {
    const sTitle = String(s.title ?? "Module").trim() || "Module";
    for (const ch of s.chapters ?? []) {
      const chId = String(ch.id ?? "").trim();
      const chTitle = String(ch.title ?? "Chapitre").trim() || "Chapitre";
      if (chId) map.set(chId, `${sTitle} › ${chTitle}`);
      for (const sub of ch.subchapters ?? []) {
        const sid = String(sub.id ?? "").trim();
        if (sid) map.set(sid, `${sTitle} › ${chTitle} › ${String(sub.title ?? "Leçon").trim()}`);
      }
    }
  }
  map.set("__course__", courseTitle);
  return map;
}

export function dossierHasDistanciel(params: {
  modality_presence?: string | null;
  pedagogical_modality?: string | null;
  lms_course_id?: string | null;
}): boolean {
  const presence = String(params.modality_presence ?? "").toLowerCase();
  if (presence.includes("distan") || presence === "hybride") return true;
  const ped = String(params.pedagogical_modality ?? "").toLowerCase();
  if (
    ped.includes("distan") ||
    ped.includes("elearning") ||
    ped.includes("e-learning") ||
    ped === "mixte"
  ) {
    return true;
  }
  return Boolean(params.lms_course_id);
}

/** Résout le cours LMS lié au dossier (catalogue → training_courses.lms_course_id). */
export async function resolveDossierLmsCourseId(
  service: SupabaseClient,
  dossierId: string,
): Promise<{
  lmsCourseId: string | null;
  courseTitle: string | null;
  modalityPresence: string | null;
  pedagogicalModality: string | null;
  dossierTitle: string | null;
  hasDistanciel: boolean;
}> {
  const { data: dossier } = await service
    .from("formation_dossiers")
    .select("id, course_title, training_course_id, modality_presence")
    .eq("id", dossierId)
    .maybeSingle();
  if (!dossier) {
    return {
      lmsCourseId: null,
      courseTitle: null,
      modalityPresence: null,
      pedagogicalModality: null,
      dossierTitle: null,
      hasDistanciel: false,
    };
  }

  let lmsCourseId: string | null = null;
  let pedagogicalModality: string | null = null;
  let courseTitle: string | null = null;

  if (dossier.training_course_id) {
    const { data: tc } = await service
      .from("training_courses")
      .select("id, title, lms_course_id, pedagogical_modality")
      .eq("id", dossier.training_course_id)
      .maybeSingle();
    if (tc) {
      lmsCourseId = tc.lms_course_id ? String(tc.lms_course_id) : null;
      pedagogicalModality = tc.pedagogical_modality ? String(tc.pedagogical_modality) : null;
      courseTitle = tc.title ? String(tc.title) : null;
    }
  }

  const hasDistanciel = dossierHasDistanciel({
    modality_presence: dossier.modality_presence ? String(dossier.modality_presence) : null,
    pedagogical_modality: pedagogicalModality,
    lms_course_id: lmsCourseId,
  });

  return {
    lmsCourseId,
    courseTitle,
    modalityPresence: dossier.modality_presence ? String(dossier.modality_presence) : null,
    pedagogicalModality,
    dossierTitle: dossier.course_title ? String(dossier.course_title) : courseTitle,
    hasDistanciel,
  };
}

/** Crée les enrollments manquants pour tous les participants du dossier. */
export async function ensureLmsEnrollments(
  service: SupabaseClient,
  dossierId: string,
  lmsCourseId: string,
): Promise<number> {
  const { data: parts } = await service
    .from("formation_participants")
    .select("id")
    .eq("dossier_id", dossierId);
  let created = 0;
  for (const p of parts ?? []) {
    const { error } = await service.from("formation_lms_enrollments").upsert(
      {
        dossier_id: dossierId,
        participant_id: p.id,
        lms_course_id: lmsCourseId,
      },
      { onConflict: "dossier_id,participant_id,lms_course_id", ignoreDuplicates: true },
    );
    if (!error) created += 1;
  }
  return created;
}

export async function buildParticipantSuivi(
  service: SupabaseClient,
  params: {
    dossierId: string;
    participantId: string;
    lmsCourseId: string;
  },
): Promise<ParticipantSuiviLms | null> {
  const { data: participant } = await service
    .from("formation_participants")
    .select("id, profile_id, dossier_id")
    .eq("id", params.participantId)
    .eq("dossier_id", params.dossierId)
    .maybeSingle();
  if (!participant) return null;

  const profileId = String(participant.profile_id);
  const { data: profile } = await service
    .from("profiles")
    .select("id, full_name, first_name, last_name, email")
    .eq("id", profileId)
    .maybeSingle();

  const { data: course } = await service
    .from("courses")
    .select("id, title, builder_snapshot")
    .eq("id", params.lmsCourseId)
    .maybeSingle();
  const courseTitle = course?.title ? String(course.title) : "Cours LMS";
  const sections = outlineFromSnapshot(course?.builder_snapshot);
  const leafIds = collectProgressLeafIds(sections);
  const labels = labelMapFromOutline(sections, courseTitle);
  const contentIds = [...new Set([params.lmsCourseId, ...leafIds, ...labels.keys()])].filter(
    (id) => id !== "__course__",
  );

  const { data: progress } = await service
    .from("course_progress")
    .select("progress_percent, last_accessed_at")
    .eq("user_id", profileId)
    .eq("course_id", params.lmsCourseId)
    .maybeSingle();

  let enrollmentCompleted: string | null = null;
  const { data: enrollment } = await service
    .from("formation_lms_enrollments")
    .select("completed_at")
    .eq("dossier_id", params.dossierId)
    .eq("participant_id", params.participantId)
    .eq("lms_course_id", params.lmsCourseId)
    .maybeSingle();
  if (enrollment?.completed_at) enrollmentCompleted = String(enrollment.completed_at);

  // Fallback enrollments LMS générique (colonnes progress/updated_at optionnelles)
  if (!enrollmentCompleted) {
    const enrQuery = await service
      .from("enrollments")
      .select("progress, updated_at")
      .eq("user_id", profileId)
      .eq("course_id", params.lmsCourseId)
      .maybeSingle();
    if (!enrQuery.error && enrQuery.data) {
      const enr = enrQuery.data as { progress?: number; updated_at?: string };
      if (typeof enr.progress === "number" && enr.progress >= 98) {
        enrollmentCompleted = enr.updated_at ? String(enr.updated_at) : null;
      }
    }
  }

  const sessionsQuery = contentIds.length
    ? await service
        .from("learning_sessions")
        .select(
          "content_type, content_id, started_at, ended_at, duration_seconds, duration_active_seconds",
        )
        .eq("user_id", profileId)
        .in("content_id", contentIds)
        .order("started_at", { ascending: true })
        .limit(2000)
    : { data: [] as Array<Record<string, unknown>> };

  // Aussi sessions content_type=course pour ce cours
  const { data: courseSessions } = await service
    .from("learning_sessions")
    .select(
      "content_type, content_id, started_at, ended_at, duration_seconds, duration_active_seconds",
    )
    .eq("user_id", profileId)
    .eq("content_type", "course")
    .eq("content_id", params.lmsCourseId)
    .order("started_at", { ascending: true })
    .limit(500);

  const sessionRows = [
    ...((sessionsQuery.data ?? []) as Array<Record<string, unknown>>),
    ...((courseSessions ?? []) as Array<Record<string, unknown>>),
  ];
  const seenSession = new Set<string>();
  const connections: SuiviConnection[] = [];
  const moduleAgg = new Map<string, SuiviModuleTime>();
  let totalActive = 0;
  let totalSec = 0;

  for (const row of sessionRows) {
    const key = `${row.started_at}|${row.content_id}|${row.duration_active_seconds}`;
    if (seenSession.has(key)) continue;
    seenSession.add(key);
    const cid = String(row.content_id ?? "");
    const active = Math.max(0, Number(row.duration_active_seconds) || 0);
    const total = Math.max(0, Number(row.duration_seconds) || 0);
    totalActive += active;
    totalSec += total;
    const label =
      cid === params.lmsCourseId
        ? courseTitle
        : labels.get(cid) || `Contenu ${cid.slice(0, 8)}`;
    connections.push({
      started_at: String(row.started_at ?? ""),
      ended_at: row.ended_at ? String(row.ended_at) : null,
      duration_seconds: total,
      duration_active_seconds: active,
      content_type: String(row.content_type ?? ""),
      content_id: cid,
      content_label: label,
    });
    const prev = moduleAgg.get(cid) ?? {
      content_id: cid,
      label,
      active_seconds: 0,
      total_seconds: 0,
    };
    prev.active_seconds += active;
    prev.total_seconds += total;
    moduleAgg.set(cid, prev);
  }

  const modules = [...moduleAgg.values()].sort((a, b) => b.active_seconds - a.active_seconds);

  // Quiz : submissions + attempts dans la fenêtre des sessions (ou 1 an)
  const sessionStarts = connections
    .map((c) => new Date(c.started_at).getTime())
    .filter((t) => !Number.isNaN(t));
  const windowStart =
    sessionStarts.length > 0
      ? new Date(Math.min(...sessionStarts) - 7 * 86400000).toISOString()
      : new Date(Date.now() - 365 * 86400000).toISOString();
  const windowEnd =
    sessionStarts.length > 0
      ? new Date(Math.max(...sessionStarts) + 30 * 86400000).toISOString()
      : new Date().toISOString();

  const quizzes: SuiviQuiz[] = [];

  const { data: quizSubs } = await service
    .from("quiz_submissions")
    .select("test_id, score, created_at, tests(id, title)")
    .eq("user_id", profileId)
    .gte("created_at", windowStart)
    .lte("created_at", windowEnd)
    .order("created_at", { ascending: true })
    .limit(200);

  for (const q of quizSubs ?? []) {
    const tests = q.tests as { id?: string; title?: string } | { id?: string; title?: string }[] | null;
    const t = Array.isArray(tests) ? tests[0] : tests;
    quizzes.push({
      test_id: String(q.test_id),
      title: String(t?.title ?? "Quiz").trim() || "Quiz",
      score: typeof q.score === "number" ? q.score : Number(q.score) || null,
      max_score: null,
      percentage: null,
      completed_at: q.created_at ? String(q.created_at) : null,
      source: "quiz_submissions",
    });
  }

  const { data: attempts } = await service
    .from("test_attempts")
    .select(
      "test_id, score, percentage, total_score, max_score, completed_at, status, tests(id, title)",
    )
    .eq("user_id", profileId)
    .not("completed_at", "is", null)
    .gte("completed_at", windowStart)
    .lte("completed_at", windowEnd)
    .order("completed_at", { ascending: true })
    .limit(200);

  for (const a of attempts ?? []) {
    const tests = a.tests as { id?: string; title?: string } | { id?: string; title?: string }[] | null;
    const t = Array.isArray(tests) ? tests[0] : tests;
    quizzes.push({
      test_id: String(a.test_id),
      title: String(t?.title ?? "Test").trim() || "Test",
      score:
        typeof a.total_score === "number"
          ? a.total_score
          : typeof a.score === "number"
            ? a.score
            : Number(a.score) || null,
      max_score: typeof a.max_score === "number" ? a.max_score : Number(a.max_score) || null,
      percentage:
        typeof a.percentage === "number" ? a.percentage : Number(a.percentage) || null,
      completed_at: a.completed_at ? String(a.completed_at) : null,
      source: "test_attempts",
    });
  }

  const progressPercent =
    progress?.progress_percent != null
      ? Number(progress.progress_percent)
      : connections.length
        ? null
        : null;

  // Auto-mark completed if progress >= 98
  if (
    !enrollmentCompleted &&
    progressPercent != null &&
    progressPercent >= 98
  ) {
    enrollmentCompleted = progress?.last_accessed_at
      ? String(progress.last_accessed_at)
      : new Date().toISOString();
  }

  return {
    participant_id: String(participant.id),
    profile_id: profileId,
    learner_name: profile ? displayName(profile) : "Apprenant",
    learner_email: profile?.email ? String(profile.email) : null,
    lms_course_id: params.lmsCourseId,
    course_title: courseTitle,
    progress_percent: progressPercent,
    last_accessed_at: progress?.last_accessed_at ? String(progress.last_accessed_at) : null,
    completed_at: enrollmentCompleted,
    connections,
    modules,
    quizzes,
    total_active_seconds: totalActive,
    total_seconds: totalSec,
  };
}

function writeSuiviPdf(suivi: ParticipantSuiviLms, dossierTitle: string | null): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 16;
  let y = 18;

  const ensureSpace = (need: number) => {
    if (y + need > 280) {
      doc.addPage();
      y = 18;
    }
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Releve de suivi distanciel (LMS)", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(dossierTitle || suivi.course_title, margin, y);
  y += 6;
  doc.text(`Apprenant : ${suivi.learner_name}${suivi.learner_email ? ` <${suivi.learner_email}>` : ""}`, margin, y);
  y += 5;
  doc.text(`Cours LMS : ${suivi.course_title}`, margin, y);
  y += 5;
  doc.text(
    `Progression : ${suivi.progress_percent != null ? `${Math.round(suivi.progress_percent)} %` : "—"} · Temps actif : ${formatDuration(suivi.total_active_seconds)} · Temps total : ${formatDuration(suivi.total_seconds)}`,
    margin,
    y,
  );
  y += 5;
  doc.text(
    `Dernier acces : ${formatDt(suivi.last_accessed_at)} · Achevement : ${formatDt(suivi.completed_at)}`,
    margin,
    y,
  );
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.text("Connexions", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  if (!suivi.connections.length) {
    doc.text("Aucune connexion enregistree.", margin, y);
    y += 6;
  } else {
    for (const c of suivi.connections.slice(0, 80)) {
      ensureSpace(12);
      const line = `${formatDt(c.started_at)} — ${c.content_label} · actif ${formatDuration(c.duration_active_seconds)} / total ${formatDuration(c.duration_seconds)}`;
      const wrapped = doc.splitTextToSize(line, 178);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 5 + 1;
    }
  }

  y += 4;
  ensureSpace(16);
  doc.setFont("helvetica", "bold");
  doc.text("Temps par module / contenu", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  if (!suivi.modules.length) {
    doc.text("Aucun temps module.", margin, y);
    y += 6;
  } else {
    for (const m of suivi.modules.slice(0, 40)) {
      ensureSpace(10);
      const line = `${m.label} — actif ${formatDuration(m.active_seconds)} / total ${formatDuration(m.total_seconds)}`;
      const wrapped = doc.splitTextToSize(line, 178);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 5 + 1;
    }
  }

  y += 4;
  ensureSpace(16);
  doc.setFont("helvetica", "bold");
  doc.text("Quiz / evaluations", margin, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  if (!suivi.quizzes.length) {
    doc.text("Aucun quiz enregistre sur la periode.", margin, y);
    y += 6;
  } else {
    for (const q of suivi.quizzes.slice(0, 40)) {
      ensureSpace(10);
      const score =
        q.percentage != null
          ? `${Math.round(q.percentage)} %`
          : q.score != null
            ? q.max_score != null
              ? `${q.score}/${q.max_score}`
              : String(q.score)
            : "—";
      const line = `${formatDt(q.completed_at)} — ${q.title} · score ${score}`;
      const wrapped = doc.splitTextToSize(line, 178);
      doc.text(wrapped, margin, y);
      y += wrapped.length * 5 + 1;
    }
  }

  y += 8;
  ensureSpace(10);
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    "Document archive pour le coffre Qualiopi — indicateur 19 (suivi effectif du distanciel).",
    margin,
    y,
  );

  return Buffer.from(doc.output("arraybuffer"));
}

function writeSessionSuiviPdf(
  suvis: ParticipantSuiviLms[],
  dossierTitle: string | null,
): Buffer {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const margin = 16;
  let y = 18;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Releve global suivi distanciel (session)", margin, y);
  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(dossierTitle || "Formation", margin, y);
  y += 6;
  doc.text(`Apprenants : ${suvis.length} · Genere le ${formatDt(new Date().toISOString())}`, margin, y);
  y += 10;

  for (const s of suvis) {
    if (y > 250) {
      doc.addPage();
      y = 18;
    }
    doc.setFont("helvetica", "bold");
    doc.text(s.learner_name, margin, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    const line = `Progression ${s.progress_percent != null ? `${Math.round(s.progress_percent)} %` : "—"} · actif ${formatDuration(s.total_active_seconds)} · connexions ${s.connections.length} · quiz ${s.quizzes.length} · achevement ${formatDt(s.completed_at)}`;
    const wrapped = doc.splitTextToSize(line, 178);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 5 + 4;
  }

  y += 6;
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(
    "Synthese session — coffre Qualiopi indicateur 19. Detail par apprenant dans les releves individuels.",
    margin,
    y,
  );

  return Buffer.from(doc.output("arraybuffer"));
}

async function upsertCoffreDoc(
  service: SupabaseClient,
  params: {
    dossierId: string;
    kind: string;
    title: string;
    participantId?: string | null;
    buffer: Buffer;
    meta: Record<string, unknown>;
    actorUserId?: string | null;
  },
): Promise<{ ok: true; documentId: string } | { ok: false; error: string }> {
  const uploaded = await uploadFormationPdf(service, {
    dossierId: params.dossierId,
    kind: params.kind,
    buffer: params.buffer,
  });
  if (!uploaded) return { ok: false, error: "Upload PDF impossible" };

  const now = new Date().toISOString();
  let query = service
    .from("formation_documents")
    .select("id")
    .eq("dossier_id", params.dossierId)
    .eq("kind", params.kind);
  if (params.participantId) {
    query = query.eq("participant_id", params.participantId);
  } else {
    query = query.is("participant_id", null);
  }
  const { data: existing } = await query.maybeSingle();

  const patch: Record<string, unknown> = {
    title: params.title,
    status: "signed",
    signed_at: now,
    generated_at: now,
    updated_at: now,
    participant_id: params.participantId ?? null,
    meta: params.meta,
    file_url: uploaded.fileUrl,
    storage_bucket: uploaded.bucket,
    storage_path: uploaded.path,
  };

  if (existing?.id) {
    const { error } = await service
      .from("formation_documents")
      .update(patch)
      .eq("id", existing.id);
    if (error) return { ok: false, error: error.message };
    return { ok: true, documentId: String(existing.id) };
  }

  const { data: inserted, error } = await service
    .from("formation_documents")
    .insert({
      dossier_id: params.dossierId,
      kind: params.kind,
      title: params.title,
      access_token: newDocToken(),
      ...patch,
    })
    .select("id")
    .maybeSingle();
  if (error || !inserted?.id) {
    return { ok: false, error: error?.message || "Insertion document impossible" };
  }

  await service.from("formation_events").insert({
    dossier_id: params.dossierId,
    event_type: "suivi_lms_archived",
    actor_user_id: params.actorUserId ?? null,
    payload: {
      kind: params.kind,
      document_id: inserted.id,
      participant_id: params.participantId ?? null,
    },
  });

  return { ok: true, documentId: String(inserted.id) };
}

/**
 * Génère et archive les relevés LMS (par apprenant + global session) dans le coffre.
 */
export async function archiveSuiviLmsForDossier(
  service: SupabaseClient,
  params: { dossierId: string; actorUserId?: string | null },
): Promise<
  | {
      ok: true;
      has_distanciel: boolean;
      archived_learners: number;
      archived_session: boolean;
      skipped_reason?: string;
    }
  | { ok: false; error: string; code?: string }
> {
  const resolved = await resolveDossierLmsCourseId(service, params.dossierId);
  if (!resolved.hasDistanciel) {
    return {
      ok: true,
      has_distanciel: false,
      archived_learners: 0,
      archived_session: false,
      skipped_reason: "Pas de distanciel / e-learning sur ce dossier",
    };
  }
  if (!resolved.lmsCourseId) {
    return {
      ok: false,
      error:
        "Cours LMS non lié : renseignez training_courses.lms_course_id sur la fiche catalogue",
      code: "lms_course_missing",
    };
  }

  await ensureLmsEnrollments(service, params.dossierId, resolved.lmsCourseId);

  const { data: parts } = await service
    .from("formation_participants")
    .select("id")
    .eq("dossier_id", params.dossierId)
    .order("created_at", { ascending: true });

  if (!parts?.length) {
    return {
      ok: true,
      has_distanciel: true,
      archived_learners: 0,
      archived_session: false,
      skipped_reason: "Aucun participant",
    };
  }

  const suvis: ParticipantSuiviLms[] = [];
  let archived = 0;

  for (const p of parts) {
    const suivi = await buildParticipantSuivi(service, {
      dossierId: params.dossierId,
      participantId: String(p.id),
      lmsCourseId: resolved.lmsCourseId,
    });
    if (!suivi) continue;
    suvis.push(suivi);

    // Marquer completed_at sur enrollment si achevé
    if (suivi.completed_at) {
      await service
        .from("formation_lms_enrollments")
        .update({ completed_at: suivi.completed_at })
        .eq("dossier_id", params.dossierId)
        .eq("participant_id", suivi.participant_id)
        .eq("lms_course_id", resolved.lmsCourseId);
    }

    const buffer = writeSuiviPdf(suivi, resolved.dossierTitle);
    const saved = await upsertCoffreDoc(service, {
      dossierId: params.dossierId,
      kind: SUIVI_LMS_KIND,
      title: `Suivi LMS — ${suivi.learner_name}`,
      participantId: suivi.participant_id,
      buffer,
      actorUserId: params.actorUserId,
      meta: {
        progress_percent: suivi.progress_percent,
        seconds_active: suivi.total_active_seconds,
        seconds_total: suivi.total_seconds,
        quiz_count: suivi.quizzes.length,
        connection_count: suivi.connections.length,
        last_accessed_at: suivi.last_accessed_at,
        completed_at: suivi.completed_at,
        lms_course_id: suivi.lms_course_id,
        generated_at: new Date().toISOString(),
      },
    });
    if (saved.ok) archived += 1;
  }

  let archivedSession = false;
  if (suvis.length) {
    const sessionBuf = writeSessionSuiviPdf(suvis, resolved.dossierTitle);
    const saved = await upsertCoffreDoc(service, {
      dossierId: params.dossierId,
      kind: SUIVI_LMS_SESSION_KIND,
      title: "Suivi LMS — synthèse session",
      participantId: null,
      buffer: sessionBuf,
      actorUserId: params.actorUserId,
      meta: {
        learner_count: suvis.length,
        generated_at: new Date().toISOString(),
        lms_course_id: resolved.lmsCourseId,
      },
    });
    archivedSession = saved.ok;
  }

  return {
    ok: true,
    has_distanciel: true,
    archived_learners: archived,
    archived_session: archivedSession,
  };
}
