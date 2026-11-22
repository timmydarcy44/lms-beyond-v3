import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveLearnerSituation } from "@/lib/apprenant/learner-situation";
import { getServiceRoleClient, getServerClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const OPEN_MISSION = new Set(["todo", "in_progress", "submitted", "correction_requested"]);
const DONE_MISSION = new Set(["done", "validated"]);

function missionLabel(status: string) {
  switch (status) {
    case "todo":
      return "À faire";
    case "in_progress":
      return "En cours";
    case "submitted":
      return "Envoyée au tuteur";
    case "correction_requested":
      return "À corriger";
    case "done":
    case "validated":
      return "Validée";
    case "invalid":
      return "Non réalisable";
    default:
      return status;
  }
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
      missions: [],
      livret: { periods: [] },
      todos: { missionsOpen: 0, livretOpen: 0 },
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

  // Tutor display
  let tutor: {
    id: string | null;
    name: string | null;
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
      tutor = {
        id: String(t.id),
        name:
          [t.first_name, t.last_name].filter(Boolean).join(" ").trim() ||
          String(t.full_name ?? "").trim() ||
          null,
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
        tutor = {
          id: ct.user_id ? String(ct.user_id) : String(ct.id),
          name: tutor?.name || name,
          email: tutor?.email || (ct.email ? String(ct.email) : null),
          jobTitle: ct.job_title ? String(ct.job_title) : null,
        };
      }
    }
  }

  // Missions (via active assignment)
  let missions: Array<{
    id: string;
    title: string;
    instructions: string | null;
    status: string;
    statusLabel: string;
    dueDate: string | null;
    late: boolean;
    deliverable: string | null;
    tutorComment: string | null;
    learnerNote: string | null;
    proofUrl: string | null;
  }> = [];

  if (activeAssignment?.id) {
    const rich = await db
      .from("tutor_missions")
      .select(
        "id, title, instructions, status, due_date, deliverable, tutor_comment, learner_note, proof_url, submitted_at, validated_at, completed_at",
      )
      .eq("assignment_id", activeAssignment.id)
      .order("due_date", { ascending: true, nullsFirst: false });

    const rows = rich.error
      ? (
          await db
            .from("tutor_missions")
            .select("id, title, instructions, status, due_date, deliverable, tutor_comment")
            .eq("assignment_id", activeAssignment.id)
        ).data
      : rich.data;

    const now = Date.now();
    missions = (rows ?? []).map((row) => {
      const status = String((row as { status?: string }).status ?? "todo");
      const due = (row as { due_date?: string | null }).due_date
        ? String((row as { due_date: string }).due_date)
        : null;
      const closed = DONE_MISSION.has(status);
      return {
        id: String((row as { id: string }).id),
        title: String((row as { title?: string }).title ?? "Mission"),
        instructions: (row as { instructions?: string | null }).instructions
          ? String((row as { instructions: string }).instructions)
          : null,
        status,
        statusLabel: missionLabel(status),
        dueDate: due,
        late: Boolean(due && !closed && new Date(due).getTime() < now),
        deliverable: (row as { deliverable?: string | null }).deliverable
          ? String((row as { deliverable: string }).deliverable)
          : null,
        tutorComment: (row as { tutor_comment?: string | null }).tutor_comment
          ? String((row as { tutor_comment: string }).tutor_comment)
          : null,
        learnerNote: (row as { learner_note?: string | null }).learner_note
          ? String((row as { learner_note: string }).learner_note)
          : null,
        proofUrl: (row as { proof_url?: string | null }).proof_url
          ? String((row as { proof_url: string }).proof_url)
          : null,
      };
    });
  }

  // Livret periods needing student action
  const { data: booklet } = await db
    .from("apprenticeship_booklets")
    .select("id")
    .eq("student_id", userId)
    .maybeSingle();

  let livretPeriods: Array<{
    id: string;
    index: number;
    status: string;
    startDate: string | null;
    endDate: string | null;
    needsStudent: boolean;
  }> = [];

  if (booklet?.id) {
    const { data: periods } = await db
      .from("booklet_periods")
      .select("id, index, status, start_date, end_date")
      .eq("booklet_id", booklet.id)
      .order("index");
    livretPeriods = (periods ?? []).map((p) => {
      const status = String((p as { status?: string }).status ?? "");
      return {
        id: String((p as { id: string }).id),
        index: Number((p as { index?: number }).index ?? 0),
        status,
        startDate: (p as { start_date?: string | null }).start_date
          ? String((p as { start_date: string }).start_date)
          : null,
        endDate: (p as { end_date?: string | null }).end_date
          ? String((p as { end_date: string }).end_date)
          : null,
        needsStudent: status === "awaiting_student",
      };
    });
  }

  const co = company as {
    id: string;
    company_name?: string | null;
    city?: string | null;
    company_address?: string | null;
    siret?: string | null;
  } | null;

  const missionsOpen = missions.filter((m) => OPEN_MISSION.has(m.status)).length;
  const livretOpen = livretPeriods.filter((p) => p.needsStudent).length;

  return NextResponse.json({
    assigned: true,
    company: co
      ? {
          id: co.id,
          name: String(co.company_name ?? "").trim() || "Entreprise d’accueil",
          city: co.city ? String(co.city).trim() : null,
          address: co.company_address ? String(co.company_address).trim() : null,
          siret: co.siret ? String(co.siret).trim() : null,
        }
      : null,
    tutor,
    hasActiveTutorLink: Boolean(activeAssignment),
    missions,
    livret: {
      bookletId: booklet?.id ? String(booklet.id) : null,
      periods: livretPeriods,
    },
    todos: {
      missionsOpen,
      livretOpen,
      total: missionsOpen + livretOpen,
    },
  });
}
