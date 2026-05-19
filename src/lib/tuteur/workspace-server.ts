import type { SupabaseClient } from "@supabase/supabase-js";

export type TutorWorkspaceAssignment = {
  id: string;
  learnerId: string;
  firstName: string;
  lastName: string;
  displayName: string;
  email: string | null;
  phone: string | null;
  ecole: string | null;
  contratType: string | null;
  rythmeAlternance: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  missionsTotal: number;
  missionsValidees: number;
  missionsAValider: number;
  statut: "a_jour" | "en_retard" | "en_cours";
};

export type TutorPendingMission = {
  id: string;
  title: string;
  learnerName: string;
  dueDate: string | null;
  assignmentId: string;
};

export type TutorTodoPreview = { id: string; title: string };

export type TutorWorkspacePayload = {
  tutorName: string;
  assignments: TutorWorkspaceAssignment[];
  pendingMissions: TutorPendingMission[];
  alerts: string[];
  kpis: {
    learners: number;
    pendingMissionActions: number;
    evaluationsTodo: number;
    badgesAwarded: number;
  };
  todoPreview: TutorTodoPreview[];
};

type ProfileRow = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  telephone?: string | null;
  phone_number?: string | null;
  ecole?: string | null;
  type_contrat?: string | null;
  rythme_alternance?: string | null;
  organisme_formation?: string | null;
  date_fin_contrat?: string | null;
  echeance?: string | null;
};

function splitDisplayName(full: string | null | undefined) {
  const s = String(full ?? "").trim();
  if (!s) return { first: "", last: "" };
  const parts = s.split(/\s+/);
  if (parts.length === 1) return { first: parts[0] ?? "", last: "" };
  return { first: parts[0] ?? "", last: parts.slice(1).join(" ") };
}

function learnerDisplayName(p: ProfileRow) {
  const fn = [p.first_name, p.last_name].filter(Boolean).join(" ").trim();
  if (fn) return fn;
  const full = String(p.full_name ?? "").trim();
  if (full) return full;
  return String(p.email ?? "").trim() || "Alternant";
}

function firstLastFromProfile(p: ProfileRow) {
  const fn = String(p.first_name ?? "").trim();
  const ln = String(p.last_name ?? "").trim();
  if (fn || ln) return { firstName: fn || "—", lastName: ln || "—" };
  const { first, last } = splitDisplayName(p.full_name);
  if (first || last) return { firstName: first || "—", lastName: last || "—" };
  const email = String(p.email ?? "").split("@")[0] ?? "—";
  return { firstName: email, lastName: "" };
}

function formatShortDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

function missionStatusRank(statut: TutorWorkspaceAssignment["statut"]) {
  if (statut === "en_retard") return 0;
  if (statut === "en_cours") return 1;
  return 2;
}

export async function buildTutorWorkspace(
  supabase: SupabaseClient,
  tutorId: string,
  tutorName: string,
): Promise<TutorWorkspacePayload> {
  const empty: TutorWorkspacePayload = {
    tutorName,
    assignments: [],
    pendingMissions: [],
    alerts: [],
    kpis: {
      learners: 0,
      pendingMissionActions: 0,
      evaluationsTodo: 0,
      badgesAwarded: 0,
    },
    todoPreview: [],
  };

  const { data: assignments, error: aErr } = await supabase
    .from("tutor_assignments")
    .select("id, learner_id, organization_id, status, started_at")
    .eq("tutor_id", tutorId)
    .in("status", ["active", "paused"])
    .order("started_at", { ascending: false });

  if (aErr || !assignments?.length) {
    if (aErr) console.warn("[tuteur/workspace] tutor_assignments", aErr.message);
    return empty;
  }

  const learnerIds = [...new Set(assignments.map((r) => r.learner_id as string))];
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, first_name, last_name, telephone, phone_number, ecole, type_contrat, rythme_alternance, organisme_formation, date_fin_contrat, echeance",
    )
    .in("id", learnerIds);

  if (pErr) console.warn("[tuteur/workspace] profiles", pErr.message);

  const profileById = new Map<string, ProfileRow>();
  for (const row of (profiles ?? []) as ProfileRow[]) {
    profileById.set(row.id, row);
  }

  const assignmentIds = assignments.map((r) => r.id as string);
  const { data: missions, error: mErr } = await supabase
    .from("tutor_missions")
    .select("id, assignment_id, title, status, due_date")
    .in("assignment_id", assignmentIds);

  if (mErr) console.warn("[tuteur/workspace] tutor_missions", mErr.message);

  const missionsByAssignment = new Map<string, typeof missions>();
  for (const mid of assignmentIds) missionsByAssignment.set(mid, []);
  for (const m of missions ?? []) {
    const aid = m.assignment_id as string;
    const list = missionsByAssignment.get(aid) ?? [];
    list.push(m);
    missionsByAssignment.set(aid, list);
  }

  const now = Date.now();
  const workspaceAssignments: TutorWorkspaceAssignment[] = [];

  for (const a of assignments) {
    const p = profileById.get(a.learner_id as string);
    const { firstName, lastName } = p ? firstLastFromProfile(p) : { firstName: "—", lastName: "" };
    const displayName = p ? learnerDisplayName(p) : "Alternant";
    const list = missionsByAssignment.get(a.id as string) ?? [];
    const total = list.length;
    const validees = list.filter((x) => x.status === "done").length;
    const aValider = list.filter((x) => x.status === "todo" || x.status === "in_progress").length;
    const overdue = list.some((x) => {
      if (!x.due_date || x.status === "done" || x.status === "invalid") return false;
      return new Date(x.due_date as string).getTime() < now;
    });
    let statut: TutorWorkspaceAssignment["statut"] = "en_cours";
    if (overdue) statut = "en_retard";
    else if (total > 0 && validees === total) statut = "a_jour";

    workspaceAssignments.push({
      id: a.id as string,
      learnerId: a.learner_id as string,
      firstName,
      lastName,
      displayName,
      email: p?.email ?? null,
      phone: p?.telephone ?? p?.phone_number ?? null,
      ecole: p?.ecole ?? p?.organisme_formation ?? null,
      contratType: p?.type_contrat ?? null,
      rythmeAlternance: p?.rythme_alternance ?? null,
      dateDebut: a.started_at ? String(a.started_at).slice(0, 10) : null,
      dateFin: p?.date_fin_contrat ?? p?.echeance ?? null,
      missionsTotal: total,
      missionsValidees: validees,
      missionsAValider: aValider,
      statut,
    });
  }

  workspaceAssignments.sort((x, y) => missionStatusRank(x.statut) - missionStatusRank(y.statut));

  const pendingMissions: TutorPendingMission[] = [];
  for (const m of missions ?? []) {
    if (m.status !== "todo" && m.status !== "in_progress") continue;
    const a = assignments.find((x) => x.id === m.assignment_id);
    if (!a) continue;
    const p = profileById.get(a.learner_id as string);
    pendingMissions.push({
      id: m.id as string,
      title: String(m.title ?? ""),
      learnerName: p ? learnerDisplayName(p) : "Alternant",
      dueDate: formatShortDate(m.due_date as string | null),
      assignmentId: a.id as string,
    });
  }

  const alerts: string[] = [];
  for (const row of workspaceAssignments) {
    if (row.statut === "en_retard") {
      alerts.push(`${row.displayName} : mission(s) en retard ou échéance dépassée`);
    }
  }

  let evaluationsTodo = 0;
  for (const a of assignments) {
    const orgId = a.organization_id as string | null;
    let formQuery = supabase
      .from("tutor_followup_forms")
      .select("id")
      .eq("active", true);
    if (orgId) {
      formQuery = formQuery.or(`organization_id.is.null,organization_id.eq.${orgId}`);
    } else {
      formQuery = formQuery.is("organization_id", null);
    }
    const { data: forms } = await formQuery;
    const formIds = (forms ?? []).map((f) => f.id as string);
    for (const fid of formIds) {
      const { count: qCount } = await supabase
        .from("tutor_followup_questions")
        .select("id", { count: "exact", head: true })
        .eq("form_id", fid);
      const questions = qCount ?? 0;
      if (questions === 0) continue;
      const { count: rCount } = await supabase
        .from("tutor_followup_responses")
        .select("id", { count: "exact", head: true })
        .eq("form_id", fid)
        .eq("assignment_id", a.id as string);
      const responses = rCount ?? 0;
      if (responses < questions) evaluationsTodo += 1;
    }
  }

  const { data: todos } = await supabase
    .from("todo_tasks")
    .select("id, title, role_filter")
    .eq("school_id", tutorId)
    .or("role_filter.eq.tutor,role_filter.is.null")
    .order("created_at", { ascending: false })
    .limit(5);

  const todoPreview: TutorTodoPreview[] = (todos ?? []).map((t) => ({
    id: t.id as string,
    title: String(t.title ?? ""),
  }));

  return {
    tutorName,
    assignments: workspaceAssignments,
    pendingMissions,
    alerts,
    kpis: {
      learners: workspaceAssignments.length,
      pendingMissionActions: pendingMissions.length,
      evaluationsTodo,
      badgesAwarded: 0,
    },
    todoPreview,
  };
}

export type TutorAssignmentDetail = {
  assignment: { id: string; learnerId: string; organizationId: string | null; startedAt: string | null };
  learner: {
    displayName: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    ecole: string | null;
    contratType: string | null;
    rythmeAlternance: string | null;
    dateDebut: string | null;
    dateFin: string | null;
  };
  missions: Array<{ id: string; title: string; description: string | null; status: string; dueDate: string | null }>;
  evaluations: Array<{ id: string; title: string; status: string; dueDate: string | null }>;
  timeline: Array<{ id: string; label: string; dateLabel: string }>;
};

export async function loadTutorAssignmentDetail(
  supabase: SupabaseClient,
  tutorId: string,
  assignmentId: string,
): Promise<TutorAssignmentDetail | null> {
  const { data: a, error } = await supabase
    .from("tutor_assignments")
    .select("id, learner_id, organization_id, started_at, tutor_id")
    .eq("id", assignmentId)
    .maybeSingle();

  if (error || !a || (a as { tutor_id: string }).tutor_id !== tutorId) {
    return null;
  }

  const learnerId = (a as { learner_id: string }).learner_id;
  const { data: p } = await supabase
    .from("profiles")
    .select(
      "id, email, full_name, first_name, last_name, telephone, phone_number, ecole, type_contrat, rythme_alternance, organisme_formation, date_fin_contrat, echeance",
    )
    .eq("id", learnerId)
    .maybeSingle();

  const profile = (p ?? {}) as ProfileRow;
  const { firstName, lastName } = firstLastFromProfile(profile);
  const displayName = learnerDisplayName(profile);

  const { data: missionRows } = await supabase
    .from("tutor_missions")
    .select("id, title, instructions, status, due_date, invalidation_reason")
    .eq("assignment_id", assignmentId)
    .order("created_at", { ascending: true });

  const missions = (missionRows ?? []).map((m) => {
    const st = String(m.status ?? "");
    const desc =
      st === "invalid" && m.invalidation_reason
        ? String(m.invalidation_reason)
        : (m.instructions as string) || null;
    return {
      id: m.id as string,
      title: String(m.title ?? ""),
      description: desc,
      status: mapMissionStatusToUi(st),
      dueDate: (m.due_date as string) || null,
    };
  });

  const orgId = (a as { organization_id: string | null }).organization_id;
  let formQuery = supabase
    .from("tutor_followup_forms")
    .select("id, title, description, created_at")
    .eq("active", true);
  if (orgId) {
    formQuery = formQuery.or(`organization_id.is.null,organization_id.eq.${orgId}`);
  } else {
    formQuery = formQuery.is("organization_id", null);
  }
  const { data: forms } = await formQuery;

  const evaluations: TutorAssignmentDetail["evaluations"] = [];
  for (const f of forms ?? []) {
    const fid = f.id as string;
    const { count: qCount } = await supabase
      .from("tutor_followup_questions")
      .select("id", { count: "exact", head: true })
      .eq("form_id", fid);
    const questions = qCount ?? 0;
    const { count: rCount } = await supabase
      .from("tutor_followup_responses")
      .select("id", { count: "exact", head: true })
      .eq("form_id", fid)
      .eq("assignment_id", assignmentId);
    const responses = rCount ?? 0;
    const complete = questions > 0 && responses >= questions;
    evaluations.push({
      id: fid,
      title: String(f.title ?? "Formulaire"),
      status: complete ? "COMPLETE" : questions === 0 ? "VIDE" : "A_REMPLIR",
      dueDate: null,
    });
  }

  const missionIds = (missionRows ?? []).map((m) => m.id as string);
  let timeline: TutorAssignmentDetail["timeline"] = [];
  if (missionIds.length) {
    const { data: logs } = await supabase
      .from("tutor_mission_logs")
      .select("id, mission_id, entry_type, content, created_at")
      .in("mission_id", missionIds)
      .order("created_at", { ascending: false })
      .limit(25);

    timeline = (logs ?? []).map((log) => ({
      id: log.id as string,
      label: formatLogLabel(log as { entry_type: string; content: string | null }),
      dateLabel: formatRelativeFr(log.created_at as string),
    }));
  }

  return {
    assignment: {
      id: assignmentId,
      learnerId,
      organizationId: orgId,
      startedAt: (a as { started_at: string | null }).started_at,
    },
    learner: {
      displayName,
      firstName,
      lastName,
      email: profile.email ?? null,
      phone: profile.telephone ?? profile.phone_number ?? null,
      ecole: profile.ecole ?? profile.organisme_formation ?? null,
      contratType: profile.type_contrat ?? null,
      rythmeAlternance: profile.rythme_alternance ?? null,
      dateDebut: (a as { started_at: string | null }).started_at?.slice(0, 10) ?? null,
      dateFin: profile.date_fin_contrat ?? profile.echeance ?? null,
    },
    missions,
    evaluations,
    timeline,
  };
}

function mapMissionStatusToUi(db: string) {
  const s = String(db ?? "").toLowerCase();
  if (s === "done") return "VALIDEE";
  if (s === "in_progress") return "EN_COURS";
  if (s === "invalid") return "INVALIDEE";
  return "A_FAIRE";
}

function formatLogLabel(log: { entry_type: string; content: string | null }) {
  const t = String(log.entry_type ?? "");
  if (t === "validation") return `Validation — ${log.content ?? "mission"}`;
  if (t === "blocking") return `Blocage / invalidation — ${log.content ?? ""}`;
  if (t === "comment") return log.content ?? "Commentaire";
  return log.content ?? "Mise à jour";
}

function formatRelativeFr(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l’instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 14) return `il y a ${days} jour${days > 1 ? "s" : ""}`;
  return d.toLocaleDateString("fr-FR");
}
