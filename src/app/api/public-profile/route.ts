import { NextResponse } from "next/server";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const slugToNameParts = (slug: string) => {
  const parts = slug.split("-").filter(Boolean);
  if (parts.length < 2) return null;
  const [firstName, ...rest] = parts;
  return { firstName, lastName: rest.join(" ") };
};

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
    const nameParts = slugToNameParts(slug);
    if (nameParts) {
      const fullName = `${nameParts.firstName} ${nameParts.lastName}`.trim();
      const { data: fullNameMatch } = await supabase
        .from("profiles")
        .select("*")
        .ilike("full_name", `%${fullName}%`)
        .maybeSingle();
      if (fullNameMatch?.id) {
        resolvedUserId = String(fullNameMatch.id);
        profileRow = fullNameMatch as Record<string, unknown>;
      }
      if (!resolvedUserId) {
        const { data: nameMatch } = await supabase
          .from("profiles")
          .select("*")
          .ilike("first_name", nameParts.firstName)
          .ilike("last_name", nameParts.lastName)
          .maybeSingle();
        if (nameMatch?.id) {
          resolvedUserId = String(nameMatch.id);
          profileRow = nameMatch as Record<string, unknown>;
        }
      }
      if (!resolvedUserId) {
        const { data: emailMatch } = await supabase
          .from("profiles")
          .select("*")
          .ilike("email", `%${nameParts.firstName}%`)
          .ilike("email", `%${nameParts.lastName}%`)
          .maybeSingle();
        if (emailMatch?.id) {
          resolvedUserId = String(emailMatch.id);
          profileRow = emailMatch as Record<string, unknown>;
        }
      }
    }
  }

  if (!resolvedUserId && !profileRow) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
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

  const { data: discTest } = await supabase
    .from("tests")
    .select("id,title")
    .ilike("title", "%disc%")
    .limit(1)
    .maybeSingle();

  const [
    discResultats,
    discTestResult,
    idmcResultatsRow,
    softSkillsResult,
    experiencesData,
    diplomeData,
  ] = await Promise.all([
    supabase
      .from("disc_resultats")
      .select("scores")
      .eq("profile_id", resolvedUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => data),
    discTest?.id
      ? supabase
          .from("test_results")
          .select("score")
          .eq("user_id", resolvedUserId)
          .eq("test_id", discTest.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
          .then(({ data }) => data)
      : Promise.resolve(null),
    supabase
      .from("idmc_resultats")
      .select("responses, scores, global_score, level, updated_at")
      .eq("profile_id", resolvedUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => data),
    supabase
      .from("soft_skills_resultats")
      .select("scores")
      .eq("learner_id", resolvedUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => data),
    supabase
      .from("experiences_pro")
      .select("*")
      .eq("learner_id", resolvedUserId)
      .order("date_debut", { ascending: false })
      .then(({ data }) => data),
    supabase
      .from("diplomes")
      .select("*")
      .eq("learner_id", resolvedUserId)
      .order("annee_obtention", { ascending: false })
      .then(({ data }) => data),
  ]);

  const discScores = discResultats?.scores
    ? [
        { label: "D", value: discResultats.scores.D ?? 0 },
        { label: "I", value: discResultats.scores.I ?? 0 },
        { label: "S", value: discResultats.scores.S ?? 0 },
        { label: "C", value: discResultats.scores.C ?? 0 },
      ]
    : [];

  const idmcScores = idmcResultatsRow?.scores ?? null;
  const idmcResponses = idmcResultatsRow?.responses ?? null;
  const idmcAxes = resolveIdmcAxesServer(idmcScores ?? idmcResponses);

  const softSkillsAll =
    softSkillsResult?.scores && typeof softSkillsResult.scores === "object"
      ? Object.entries(softSkillsResult.scores as Record<string, number>).map(([skill, score]) => ({
          label: skill,
          value: Number(score),
        }))
      : [];

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
    idmcScoreValue: null,
    softSkillsAll,
    experiences,
    diplomas,
    settings: settingsData ?? null,
  });
}
