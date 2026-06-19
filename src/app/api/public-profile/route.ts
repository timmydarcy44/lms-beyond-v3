import { NextResponse } from "next/server";
import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";
import {
  collectLearnerProfileCandidates,
  fetchDiscScoresForCandidates,
  fetchIdmcAxesForCandidates,
  fetchSoftSkillsRadarForCandidates,
} from "@/lib/learner/resolve-learner-profile-candidates";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { loadPublicProfileEarnedBadges } from "@/lib/openbadges/public-profile-earned-badges";

export const dynamic = "force-dynamic";

type AxisKey = "A1" | "A2" | "A3" | "A4" | "A5" | "A6" | "A7" | "A8";

const AXES_LABELS: Record<AxisKey, string> = {
  A1: "Connaissance de soi",
  A2: "Maîtrise des méthodes",
  A3: "Adaptation au contexte",
  A4: "Organisation et anticipation",
  A5: "Traitement de l'information",
  A6: "Résolution de difficultés",
  A7: "Suivi de progression",
  A8: "Auto-évaluation finale",
};

const resolveIdmcAxesServer = (scores: unknown): Record<AxisKey, number> | null => {
  if (!scores || typeof scores !== "object") return null;
  const candidate = scores as Record<string, unknown>;
  if (candidate.axes && typeof candidate.axes === "object") {
    return candidate.axes as Record<AxisKey, number>;
  }
  if (candidate.points && typeof candidate.points === "object") {
    const points = candidate.points as Record<AxisKey, number>;
    const axes = {} as Record<AxisKey, number>;
    (Object.keys(AXES_LABELS) as AxisKey[]).forEach((key) => {
      const value = typeof points[key] === "number" ? points[key] : 0;
      axes[key] = Math.round((value / 15) * 100);
    });
    return axes;
  }
  const hasAllAxes = (Object.keys(AXES_LABELS) as AxisKey[]).every(
    (key) => typeof candidate[key] === "number"
  );
  if (hasAllAxes) return candidate as Record<AxisKey, number>;
  return null;
};

function discScoresToChartRows(scores: DiscScores | null): Array<{ label: string; value: number }> {
  if (!scores) return [];
  return [
    { label: "D", value: Number(scores.D ?? 0) },
    { label: "I", value: Number(scores.I ?? 0) },
    { label: "S", value: Number(scores.S ?? 0) },
    { label: "C", value: Number(scores.C ?? 0) },
  ];
}

async function fetchLatestIdmcRowForCandidates(
  db: Awaited<ReturnType<typeof getServiceRoleClientOrFallback>>,
  profileIds: string[],
): Promise<{
  scores: unknown;
  responses: unknown;
  global_score: number | null;
  level: string | null;
} | null> {
  if (!db || !profileIds.length) return null;

  let bestRow: {
    scores: unknown;
    responses: unknown;
    global_score: number | null;
    level: string | null;
    updated_at: string | null;
  } | null = null;
  let bestTime = 0;

  for (const profileId of profileIds) {
    const { data, error } = await db
      .from("idmc_resultats")
      .select("scores, responses, global_score, level, updated_at")
      .eq("profile_id", profileId)
      .maybeSingle();
    if (error || !data) continue;
    const updatedAt = Date.parse(String(data.updated_at ?? "")) || 0;
    if (!bestRow || updatedAt >= bestTime) {
      bestRow = data;
      bestTime = updatedAt;
    }
  }

  if (!bestRow) return null;
  return {
    scores: bestRow.scores,
    responses: bestRow.responses,
    global_score: typeof bestRow.global_score === "number" ? bestRow.global_score : null,
    level: typeof bestRow.level === "string" ? bestRow.level : null,
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const slug = searchParams.get("slug") || "";
  const paramUserId = searchParams.get("userId");
  if (!slug && !paramUserId) {
    return NextResponse.json({ error: "Missing slug" }, { status: 400 });
  }

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
  }

  let resolvedUserId = paramUserId || null;
  let profileRow: Record<string, unknown> | null = null;
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(slug);

  if (isUuid) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", slug)
      .maybeSingle();
    profileRow = data ?? null;
    resolvedUserId = profileRow ? String((profileRow as { id?: string }).id ?? slug) : null;
  }

  if (!resolvedUserId && slug) {
    const { data: settingsData } = await supabase
      .from("user_profile_settings")
      .select("user_id")
      .eq("public_slug", slug)
      .maybeSingle();
    resolvedUserId = settingsData?.user_id ?? null;
  }

  if (!resolvedUserId && slug) {
    const slugParts = slug
      .split("-")
      .map((part) => part.trim())
      .filter(Boolean);
    const firstPart = slugParts[0] ?? "";
    const lastPart = slugParts.slice(1).join(" ");
    if (firstPart) {
      const { data: profileByNames } = await supabase
        .from("profiles")
        .select("*")
        .ilike("first_name", firstPart)
        .ilike("last_name", lastPart || "%")
        .limit(1)
        .maybeSingle();
      if (profileByNames) {
        profileRow = profileByNames as Record<string, unknown>;
        resolvedUserId = String((profileByNames as { id?: string }).id ?? "");
      }
    }
    if (!resolvedUserId && lastPart) {
      const { data: byLast } = await supabase
        .from("profiles")
        .select("*")
        .ilike("first_name", firstPart ? `%${firstPart}%` : "%")
        .ilike("last_name", `%${lastPart}%`)
        .limit(1)
        .maybeSingle();
      if (byLast) {
        profileRow = byLast as Record<string, unknown>;
        resolvedUserId = String((byLast as { id?: string }).id ?? "");
      }
    }
  }

  if (!resolvedUserId && !profileRow) {
    return NextResponse.json({
      publicUserId: null,
      profileRow: null,
      skillsMetadata: {},
      hardSkills: [],
      stackTools: [],
      discScores: [],
      idmcAxes: null,
      idmcScores: null,
      idmcResponses: null,
      discScoreValue: null,
      idmcScoreValue: null,
      softSkillsAll: [],
      experiences: [],
      diplomas: [],
      settings: null,
      earnedOpenBadges: [],
      idmcGlobalScore: null,
    });
  }

  if (!profileRow && resolvedUserId) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", resolvedUserId)
      .maybeSingle();
    profileRow = data ?? null;
  }

  if (resolvedUserId && slug) {
    try {
      await supabase
        .from("user_profile_settings")
        .upsert({ user_id: resolvedUserId, public_slug: slug }, { onConflict: "user_id" });
    } catch {
      // ignore slug upsert errors
    }
  }

  const { data: settingsData } = await supabase
    .from("user_profile_settings")
    .select("theme, accent_color, show_logo, show_disc, show_soft_skills, show_badges, show_idmc, show_dys")
    .eq("user_id", resolvedUserId)
    .maybeSingle();

  const metadataRaw = (profileRow as Record<string, unknown> | null)?.skills_metadata;
  let skillsMetadata = {} as Record<
    string,
    { level: "Débutant" | "Intermédiaire" | "Expert"; validated: boolean; source: "manual" | "badge" }
  >;
  if (metadataRaw && typeof metadataRaw === "object") {
    skillsMetadata = metadataRaw as Record<
      string,
      { level: "Débutant" | "Intermédiaire" | "Expert"; validated: boolean; source: "manual" | "badge" }
    >;
  } else if (typeof metadataRaw === "string") {
    try {
      skillsMetadata = JSON.parse(metadataRaw) as Record<
        string,
        { level: "Débutant" | "Intermédiaire" | "Expert"; validated: boolean; source: "manual" | "badge" }
      >;
    } catch {
      skillsMetadata = {};
    }
  }

  const hardSkills = Array.isArray((profileRow as Record<string, unknown> | null)?.hard_skills)
    ? ((profileRow as Record<string, unknown>).hard_skills as string[])
    : [];
  const stackRaw = (profileRow as Record<string, unknown> | null)?.stack_technique;
  let stackTools: string[] = [];
  if (typeof stackRaw === "string" && stackRaw.trim()) {
    try {
      const parsed = JSON.parse(stackRaw) as { tools?: string[] };
      stackTools = parsed.tools ?? [];
    } catch {
      stackTools = stackRaw
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  const profileEmail =
    profileRow && typeof (profileRow as { email?: unknown }).email === "string"
      ? String((profileRow as { email?: string }).email).trim()
      : "";

  const profileIds = resolvedUserId
    ? await collectLearnerProfileCandidates(supabase, resolvedUserId, profileEmail)
    : [];

  const [
    discScoresParsed,
    idmcResultatsRow,
    idmcAxesFetched,
    softSkillsRadar,
    discTestResult,
    experiencesData,
    diplomeData,
  ] = await Promise.all([
    fetchDiscScoresForCandidates(supabase, profileIds),
    fetchLatestIdmcRowForCandidates(supabase, profileIds),
    fetchIdmcAxesForCandidates(supabase, profileIds),
    fetchSoftSkillsRadarForCandidates(supabase, profileIds),
    supabase
      .from("tests")
      .select("id,title")
      .ilike("title", "%disc%")
      .limit(1)
      .maybeSingle()
      .then(async ({ data: discTest }) => {
        if (!discTest?.id || !resolvedUserId) return null;
        const { data } = await supabase
          .from("test_results")
          .select("score")
          .eq("user_id", resolvedUserId)
          .eq("test_id", discTest.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        return data;
      }),
    profileIds.length
      ? supabase
          .from("experiences_pro")
          .select("*")
          .in("learner_id", profileIds)
          .order("date_debut", { ascending: false })
          .then(({ data }) => data ?? [])
      : Promise.resolve([]),
    profileIds.length
      ? supabase
          .from("diplomes")
          .select("*")
          .in("learner_id", profileIds)
          .order("annee_obtention", { ascending: false })
          .then(({ data }) => data ?? [])
      : Promise.resolve([]),
  ]);

  const discScores = discScoresToChartRows(discScoresParsed);

  const idmcScores = idmcResultatsRow?.scores ?? null;
  const idmcResponses = idmcResultatsRow?.responses ?? null;
  const idmcAxes =
    idmcAxesFetched ??
    resolveIdmcAxesServer(idmcScores ?? idmcResponses);
  const idmcGlobalScore =
    typeof idmcResultatsRow?.global_score === "number"
      ? idmcResultatsRow.global_score
      : idmcAxes
        ? Math.round(
            (Object.values(idmcAxes) as number[]).reduce((sum, v) => sum + v, 0) /
              Object.keys(idmcAxes).length,
          )
        : null;

  const softSkillsAll = softSkillsRadar.map(({ skill, score }) => ({
    label: skill,
    value: score,
  }));

  let earnedOpenBadges: Awaited<ReturnType<typeof loadPublicProfileEarnedBadges>> = [];
  if (resolvedUserId) {
    try {
      earnedOpenBadges = await loadPublicProfileEarnedBadges(supabase, resolvedUserId);
    } catch (err) {
      console.warn("[public-profile] earned badges:", err);
    }
  }

  const experiences = (experiencesData ?? []).map((exp) => ({
    start: String(exp.date_debut ?? "—"),
    end: String(exp.date_fin ?? "—"),
    title: String(exp.type_contrat ?? "Expérience"),
    company: String(exp.employeur ?? "Entreprise"),
    missions: String(exp.missions ?? ""),
  }));
  const diplomas = (diplomeData ?? []).map((dip) => ({
    start: String(dip.annee_obtention ?? "—"),
    end: "—",
    title: String(dip.intitule ?? "Diplôme"),
    school: String(dip.ecole ?? "École"),
    status: String(dip.mode ?? "—"),
  }));

  return NextResponse.json({
    publicUserId: resolvedUserId,
    profileRow,
    skillsMetadata,
    hardSkills,
    stackTools,
    discScores,
    idmcAxes,
    idmcScores,
    idmcResponses,
    discScoreValue: discTestResult?.score ?? null,
    idmcScoreValue: idmcGlobalScore,
    softSkillsAll,
    experiences,
    diplomas,
    settings: settingsData ?? null,
    earnedOpenBadges,
    idmcGlobalScore,
  });
}
