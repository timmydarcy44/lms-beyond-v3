import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { resolveLearnerSituation } from "@/lib/apprenant/learner-situation";
import {
  buildHomeTimeline,
  buildProfileInfoFields,
  pickHomeNextStep,
  skillsFromMatching,
  formatFrenchLongDate,
} from "@/lib/apprenant/learner-home-v2-data";
import { analyzeCareerMatching } from "@/lib/career-profiles/career-profile-matching";
import { getCareerProfileBySlug } from "@/lib/career-profiles/career-profiles-data";
import {
  buildUserObjectiveDisplay,
  migrateLegacyProjectToV2,
} from "@/lib/particulier/edge-professional-project-v2";
import { parseProfessionalProject } from "@/lib/particulier/profil-edge-maturity";
import { getServiceRoleClient, getServerClient } from "@/lib/supabase/server";
import { resolveLearnerDisplayFirstName } from "@/lib/apprenant/display-first-name";
import { resolveEffectiveApprenantUserId } from "@/lib/control/learner-preview";

export const dynamic = "force-dynamic";

async function loadCareer(slug: string) {
  try {
    const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const res = await fetch(
      `${base}/api/career-profiles/search?slug=${encodeURIComponent(slug)}`,
      { cache: "no-store" },
    );
    if (res.ok) {
      const json = (await res.json()) as { profile?: unknown };
      if (json.profile) return json.profile as ReturnType<typeof getCareerProfileBySlug>;
    }
  } catch {
    /* fallback */
  }
  return getCareerProfileBySlug(slug) ?? null;
}

export async function GET() {
  const session = await getSession();
  if (!session?.id) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const db = getServiceRoleClient() ?? (await getServerClient());
  if (!db) return NextResponse.json({ error: "NO_DB_CLIENT" }, { status: 500 });

  const { userId, preview } = await resolveEffectiveApprenantUserId(session.id);
  const situation = await resolveLearnerSituation(db, userId);

  const { data: profile } = await db
    .from("profiles")
    .select(
      "id, email, first_name, last_name, phone, telephone, city, type_profil, target_career_slug, professional_project, career_goal, career_goal_other, hard_skills, skills_metadata, avatar_url",
    )
    .eq("id", userId)
    .maybeSingle();

  const profileRow = (profile ?? {}) as Record<string, unknown>;

  const [{ count: expCount }, disc, idmc, soft, badges] = await Promise.all([
    db
      .from("experiences_pro")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", userId),
    db.from("disc_resultats").select("scores").eq("profile_id", userId).maybeSingle(),
    db.from("idmc_resultats").select("scores").eq("profile_id", userId).maybeSingle(),
    db
      .from("soft_skills_resultats")
      .select("scores, taken_at")
      .eq("learner_id", userId)
      .order("taken_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db
      .from("badge_assertions")
      .select("id", { count: "exact", head: true })
      .eq("recipient_profile_id", userId)
      .is("revoked_at", null),
  ]);

  profileRow.__has_experience = (expCount ?? 0) > 0;
  profileRow.email = profileRow.email || session.email;

  // Diplôme : dernière entrée diplomes
  const { data: diplome } = await db
    .from("diplomes")
    .select("title, intitule")
    .eq("profile_id", userId)
    .limit(1)
    .maybeSingle();
  if (diplome) {
    profileRow.last_diploma = String(
      (diplome as { title?: string; intitule?: string }).title ||
        (diplome as { intitule?: string }).intitule ||
        "",
    );
  }

  const infoFields = buildProfileInfoFields(profileRow);
  const profileFilled = infoFields.filter((f) => f.filled).length;
  const missingLabels = infoFields.filter((f) => !f.filled).map((f) => f.label.toLowerCase());

  const tests = [
    {
      id: "disc",
      name: "Profil comportemental",
      sub: "DISC",
      done: Boolean(disc?.data),
      date: null as string | null,
    },
    {
      id: "idmc",
      name: "Façon d’apprendre",
      sub: "IDMC",
      done: Boolean(idmc?.data),
      date: null as string | null,
    },
    {
      id: "soft",
      name: "Soft skills",
      sub: null,
      done: Boolean(soft?.data),
      date: soft?.data
        ? String((soft.data as { taken_at?: string }).taken_at ?? "").slice(0, 10)
        : null,
    },
  ];
  const testsDone = tests.filter((t) => t.done).length;

  const projectRaw = parseProfessionalProject(profileRow.professional_project);
  const projectV2 = migrateLegacyProjectToV2(projectRaw);
  const objectiveDisplay = buildUserObjectiveDisplay({
    project: projectV2,
    careerGoal: String(profileRow.career_goal ?? ""),
    careerGoalOther: String(profileRow.career_goal_other ?? ""),
  });
  const slug = String(profileRow.target_career_slug ?? "").trim();
  const hasObjective = Boolean(slug || objectiveDisplay?.trim());

  let matching = null as ReturnType<typeof analyzeCareerMatching> | null;
  let referentialTitle: string | null = null;
  if (slug && disc?.data) {
    const career = await loadCareer(slug);
    if (career) {
      referentialTitle = career.title;
      const softScores = (soft?.data as { scores?: Record<string, number> } | null)?.scores ?? {};
      const { data: experiences } = await db
        .from("experiences_pro")
        .select("*")
        .eq("profile_id", userId)
        .limit(20);
      const { data: diplomas } = await db
        .from("diplomes")
        .select("*")
        .eq("profile_id", userId)
        .limit(20);
      matching = analyzeCareerMatching({
        career,
        discScores: (disc.data as { scores?: Record<string, number> }).scores as never,
        softSkillsScores: softScores,
        hardSkills: Array.isArray(profileRow.hard_skills)
          ? (profileRow.hard_skills as string[])
          : [],
        skillsMetadata:
          (profileRow.skills_metadata as Record<string, never>) ?? {},
        experiences: (experiences ?? []) as never[],
        diplomas: (diplomas ?? []) as never[],
        hasIdmc: Boolean(idmc?.data),
      });
    }
  }

  const skills = skillsFromMatching(matching);
  const objectiveTitle =
    objectiveDisplay?.trim() ||
    referentialTitle ||
    (hasObjective ? "Objectif défini" : "Pas encore d’objectif");

  // Expert parcours : signal soft (table optionnelle)
  let hasExpertParcours = false;
  {
    const coaching = await db
      .from("expert_bookings")
      .select("id", { count: "exact", head: true })
      .eq("learner_id", userId);
    if (!coaching.error) hasExpertParcours = (coaching.count ?? 0) > 0;
  }

  const hasBadge = (badges.count ?? 0) > 0;

  const timeline = buildHomeTimeline({
    testsDone,
    testsTotal: 3,
    hasObjective,
    profileFilled,
    profileTotal: infoFields.length,
    hasExpertParcours,
    hasBadge,
  });

  const nextStep = pickHomeNextStep({
    testsDone,
    testsTotal: 3,
    profileFilled,
    profileTotal: infoFields.length,
    missingLabels,
    hasObjective,
    hasExpertParcours,
    resumeHref: null,
    resumeTitle: null,
    badgeReadyName: skills.toStrengthen[0]?.name ?? null,
  });

  // Alternance bandeau (contrat actif OU entreprise d'accueil déjà assignée)
  let alternance: null | {
    mode: "entreprise" | "ecole" | "vacances";
    companyName: string | null;
    tutorName: string | null;
    nextChangeLabel: string | null;
    nextChangeWhen: string | null;
    daysUntil: number | null;
  } = null;

  if (situation.showAlternanceNav && situation.companyId) {
    let companyName: string | null = null;
    let tutorName: string | null = null;
    const companyId = situation.companyId;
    const tutorId = situation.tutorId;

    const { data: company } = await db
      .from("cfa_companies")
      .select("company_name")
      .eq("id", companyId)
      .maybeSingle();
    companyName = company
      ? String((company as { company_name?: string }).company_name ?? "") || null
      : null;

    if (tutorId) {
      const { data: tutor } = await db
        .from("profiles")
        .select("first_name, last_name, full_name")
        .eq("id", tutorId)
        .maybeSingle();
      if (tutor) {
        tutorName =
          [tutor.first_name, tutor.last_name].filter(Boolean).join(" ").trim() ||
          String(tutor.full_name ?? "") ||
          null;
      }
      if (!tutorName) {
        const { data: companyTutor } = await db
          .from("company_tutors")
          .select("first_name, last_name")
          .eq("user_id", tutorId)
          .maybeSingle();
        if (companyTutor) {
          tutorName =
            [companyTutor.first_name, companyTutor.last_name].filter(Boolean).join(" ").trim() ||
            null;
        }
      }
    }

    alternance = {
      mode: "entreprise",
      companyName,
      tutorName,
      nextChangeLabel: null,
      nextChangeWhen: null,
      daysUntil: null,
    };
  }

  const firstName = resolveLearnerDisplayFirstName({
    profileFirstName: String(profileRow.first_name ?? ""),
    email: String(profileRow.email ?? session.email ?? ""),
  });

  return NextResponse.json({
    dateLabel: formatFrenchLongDate(),
    firstName,
    preview: preview
      ? { active: true, targetName: preview.targetName, targetUserId: preview.targetUserId }
      : null,
    situation,
    nextStep,
    timeline,
    objective: {
      title: objectiveTitle,
      acquiredCount: skills.acquired.length,
      toStrengthenCount: skills.toStrengthen.length,
      skills: skills.all.slice(0, 5),
      moreAcquired: Math.max(0, skills.acquired.length - skills.all.slice(0, 5).filter((s) => s.status === "acquired").length),
    },
    tests: {
      done: testsDone,
      total: 3,
      items: tests,
    },
    badgePreview: skills.toStrengthen[0]?.name ?? null,
    profile: {
      filled: profileFilled,
      total: infoFields.length,
      missingLabels,
    },
    alternance,
  });
}
