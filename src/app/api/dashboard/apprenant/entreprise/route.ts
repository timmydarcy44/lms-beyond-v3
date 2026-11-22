import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveLearnerSituation } from "@/lib/apprenant/learner-situation";
import { getServiceRoleClient, getServerClient } from "@/lib/supabase/server";
import {
  isActionableForLearner,
  learnerMissionLabel,
  normalizeMissionStatus,
  type MissionStatus,
} from "@/lib/tuteur/mission-status";

export const dynamic = "force-dynamic";

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

function tutorShortName(full: string | null) {
  if (!full) return null;
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return null;
  if (parts.length === 1) return parts[0];
  return `${parts[0]} ${parts[parts.length - 1][0]?.toUpperCase()}.`;
}

export async function GET() {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getServiceRoleClient() ?? (await getServerClient());
  if (!db) return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });

  const userId = session.id;
  const situation = await resolveLearnerSituation(db, userId);
  if (!situation.showAlternanceNav || !situation.companyId) {
    return NextResponse.json({
      assigned: false,
      company: null,
      tutor: null,
      contract: null,
      missions: [],
      counts: { todoByYou: 0, withTutor: 0, validated: 0, nextDue: null },
      livret: { periods: [] },
      todos: { missionsOpen: 0, livretOpen: 0, total: 0 },
    });
  }

  const companyId = situation.companyId;

  const [{ data: company }, { data: assignments }] = await Promise.all([
    db
      .from("cfa_companies")
      .select("id, company_name, city, company_address, siret")
      .eq("id", companyId)
      .maybeSingle(),
    db
      .from("tutor_assignments")
      .select("id, tutor_id, status, started_at")
      .eq("learner_id", userId)
      .in("status", ["active", "paused"])
      .order("started_at", { ascending: false }),
  ]);

  const activeAssignment = (assignments ?? [])[0] as
    | { id: string; tutor_id: string; status: string }
    | undefined;

  let contractMeta: {
    type: string | null;
    rythme: string | null;
  } | null = null;
  if (situation.activeContractId) {
    const { data: contract } = await db
      .from("alternance_contracts")
      .select("type_contrat, rythme_alternance, contract_type")
      .eq("id", situation.activeContractId)
      .maybeSingle();
    if (contract) {
      const type =
        String(
          (contract as { type_contrat?: string | null }).type_contrat ??
            (contract as { contract_type?: string | null }).contract_type ??
            "",
        ).trim() || null;
      const rythme =
        String((contract as { rythme_alternance?: string | null }).rythme_alternance ?? "").trim() ||
        null;
      contractMeta = { type, rythme };
    }
  }

  let tutor: {
    id: string | null;
    name: string | null;
    shortName: string | null;
    initials: string | null;
    email: string | null;
    jobTitle: string | null;
  } | null = null;

  const tutorUserId = situation.tutorId || activeAssignment?.tutor_id || null;
  if (tutorUserId) {
    const { data: t } = await db
      .from("profiles")
      .select("id, first_name, last_name, full_name, email")
      .eq("id", tutorUserId)
      .maybeSingle();
    if (t) {
      const name =
        [t.first_name, t.last_name].filter(Boolean).join(" ").trim() ||
        String(t.full_name ?? "").trim() ||
        null;
      tutor = {
        id: String(t.id),
        name,
        shortName: tutorShortName(name),
        initials: name ? initials(name) : null,
        email: t.email ? String(t.email) : null,
        jobTitle: null,
      };
    }
  }

  if (situation.applicationId) {
    const { data: placement } = await db
      .from("apprentice_placements")
      .select("tutor_id")
      .eq("apprentice_id", situation.applicationId)
      .in("status", ["active", "pending"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const companyTutorId = String(
      (placement as { tutor_id?: string | null } | null)?.tutor_id ?? "",
    ).trim();
    if (companyTutorId) {
      const { data: ct } = await db
        .from("company_tutors")
        .select("id, first_name, last_name, email, job_title, user_id")
        .eq("id", companyTutorId)
        .maybeSingle();
      if (ct) {
        const name =
          [ct.first_name, ct.last_name].filter(Boolean).join(" ").trim() || null;
        const mergedName = tutor?.name || name;
        tutor = {
          id: ct.user_id ? String(ct.user_id) : String(ct.id),
          name: mergedName,
          shortName: tutorShortName(mergedName),
          initials: mergedName ? initials(mergedName) : null,
          email: tutor?.email || (ct.email ? String(ct.email) : null),
          jobTitle: ct.job_title ? String(ct.job_title) : null,
        };
      }
    }
  }

  type MissionOut = {
    id: string;
    title: string;
    instructions: string | null;
    status: MissionStatus;
    statusLabel: string;
    statusColor: "amber" | "blue" | "green";
    dueDate: string | null;
    late: boolean;
    deliverable: string | null;
    tutorComment: string | null;
    learnerNote: string | null;
    proofUrl: string | null;
    proofLinks: Array<{ url: string; label?: string }>;
    proofFiles: Array<{ path: string; name: string; size: number; mime: string }>;
    submittedAt: string | null;
    validatedAt: string | null;
    tutorOpenedAt: string | null;
    skillId: string | null;
    skillLabel: string | null;
    canWithdraw: boolean;
  };

  let missions: MissionOut[] = [];

  if (activeAssignment?.id) {
    const rich = await db
      .from("tutor_missions")
      .select(
        "id, title, instructions, status, due_date, deliverable, tutor_comment, invalidation_reason, learner_note, proof_url, proof_links, proof_files, submitted_at, validated_at, completed_at, tutor_opened_at, skill_id",
      )
      .eq("assignment_id", activeAssignment.id)
      .order("due_date", { ascending: true, nullsFirst: false });

    const rows = rich.error
      ? (
          await db
            .from("tutor_missions")
            .select(
              "id, title, instructions, status, due_date, deliverable, tutor_comment, invalidation_reason, learner_note, proof_url, submitted_at, validated_at, completed_at",
            )
            .eq("assignment_id", activeAssignment.id)
        ).data
      : rich.data;

    const skillIds = [
      ...new Set(
        (rows ?? [])
          .map((r) => (r as { skill_id?: string | null }).skill_id)
          .filter(Boolean)
          .map(String),
      ),
    ];
    const skillLabels = new Map<string, string>();
    if (skillIds.length) {
      const { data: skills } = await db.from("skills").select("id, label").in("id", skillIds);
      for (const s of skills ?? []) {
        skillLabels.set(String((s as { id: string }).id), String((s as { label: string }).label));
      }
    }

    const now = Date.now();
    missions = (rows ?? []).map((row) => {
      const status = normalizeMissionStatus(String((row as { status?: string }).status ?? "assigned"));
      const due = (row as { due_date?: string | null }).due_date
        ? String((row as { due_date: string }).due_date)
        : null;
      const closed = status === "validated";
      const label = learnerMissionLabel(status, { dueDate: due, started: true });
      const proofLinks = Array.isArray((row as { proof_links?: unknown }).proof_links)
        ? ((row as { proof_links: Array<{ url: string; label?: string }> }).proof_links ?? [])
        : [];
      const proofFiles = Array.isArray((row as { proof_files?: unknown }).proof_files)
        ? ((row as {
            proof_files: Array<{ path: string; name: string; size: number; mime: string }>;
          }).proof_files ?? [])
        : [];
      const proofUrl = (row as { proof_url?: string | null }).proof_url
        ? String((row as { proof_url: string }).proof_url)
        : proofLinks[0]?.url || null;
      const tutorOpenedAt = (row as { tutor_opened_at?: string | null }).tutor_opened_at
        ? String((row as { tutor_opened_at: string }).tutor_opened_at)
        : null;
      const skillId = (row as { skill_id?: string | null }).skill_id
        ? String((row as { skill_id: string }).skill_id)
        : null;
      return {
        id: String((row as { id: string }).id),
        title: String((row as { title?: string }).title ?? "Mission"),
        instructions: (row as { instructions?: string | null }).instructions
          ? String((row as { instructions: string }).instructions)
          : null,
        status,
        statusLabel: label.label,
        statusColor: label.color,
        dueDate: due,
        late: Boolean(due && !closed && new Date(due).getTime() < now),
        deliverable: (row as { deliverable?: string | null }).deliverable
          ? String((row as { deliverable: string }).deliverable)
          : null,
        tutorComment: (row as { tutor_comment?: string | null }).tutor_comment
          ? String((row as { tutor_comment: string }).tutor_comment)
          : (row as { invalidation_reason?: string | null }).invalidation_reason
            ? String((row as { invalidation_reason: string }).invalidation_reason)
            : null,
        learnerNote: (row as { learner_note?: string | null }).learner_note
          ? String((row as { learner_note: string }).learner_note)
          : null,
        proofUrl,
        proofLinks,
        proofFiles,
        submittedAt: (row as { submitted_at?: string | null }).submitted_at
          ? String((row as { submitted_at: string }).submitted_at)
          : null,
        validatedAt: (row as { validated_at?: string | null }).validated_at
          ? String((row as { validated_at: string }).validated_at)
          : (row as { completed_at?: string | null }).completed_at
            ? String((row as { completed_at: string }).completed_at)
            : null,
        tutorOpenedAt,
        skillId,
        skillLabel: skillId ? skillLabels.get(skillId) ?? null : null,
        canWithdraw: status === "submitted" && !tutorOpenedAt,
      };
    });
  }

  const sortRank = (s: MissionStatus) => {
    if (s === "changes_requested") return 0;
    if (s === "assigned") return 1;
    if (s === "submitted") return 2;
    return 3;
  };
  missions.sort((a, b) => {
    const r = sortRank(a.status) - sortRank(b.status);
    if (r !== 0) return r;
    const ad = a.dueDate ? new Date(a.dueDate).getTime() : Number.POSITIVE_INFINITY;
    const bd = b.dueDate ? new Date(b.dueDate).getTime() : Number.POSITIVE_INFINITY;
    return ad - bd;
  });

  const todoByYou = missions.filter((m) => isActionableForLearner(m.status)).length;
  const withTutor = missions.filter((m) => m.status === "submitted").length;
  const validated = missions.filter((m) => m.status === "validated").length;
  const nextOpen = missions.find((m) => m.status !== "validated" && m.dueDate);
  const nextDue = nextOpen
    ? { date: nextOpen.dueDate, title: nextOpen.title, id: nextOpen.id }
    : null;

  const co = company as {
    id: string;
    company_name?: string | null;
    city?: string | null;
    company_address?: string | null;
    siret?: string | null;
  } | null;

  const companyName = co
    ? String(co.company_name ?? "").trim() || "Entreprise d’accueil"
    : null;

  return NextResponse.json({
    assigned: true,
    company: co
      ? {
          id: co.id,
          name: companyName,
          initials: companyName ? initials(companyName) : null,
          city: co.city ? String(co.city).trim() : null,
          address: co.company_address ? String(co.company_address).trim() : null,
          siret: co.siret ? String(co.siret).trim() : null,
        }
      : null,
    contract: contractMeta,
    tutor,
    hasActiveTutorLink: Boolean(activeAssignment),
    missions,
    counts: {
      todoByYou,
      withTutor,
      validated,
      nextDue,
    },
    livret: {
      bookletId: null as string | null,
      periods: [] as unknown[],
    },
    todos: {
      missionsOpen: todoByYou + withTutor,
      livretOpen: 0,
      total: todoByYou + withTutor,
    },
  });
}
