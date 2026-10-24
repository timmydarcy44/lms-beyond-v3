import type { SupabaseClient } from "@supabase/supabase-js";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import {
  PROFILE_ANALYSIS_TONE_PROMPT_LINES,
  sanitizeProfileAnalysisTone,
} from "@/lib/learner/profile-analysis-tone";
import {
  collectLearnerProfileCandidates,
  fetchDiscScoresForCandidates,
  fetchIdmcAxesForCandidates,
  fetchSoftSkillsRadarForCandidates,
} from "@/lib/learner/resolve-learner-profile-candidates";

/** Snapshot matching carrière pour ancrer l'orientation OpenAI. */
export type ProfileAnalysisCareerMatching = {
  compatibilityScore?: number | null;
  strengths?: string[];
  consolidate?: string[];
  develop?: string[];
  unevaluated?: string[];
  nextPrioritySkill?: string | null;
};

export type ProfileAnalysisInput = {
  firstName: string;
  jobTitle?: string | null;
  /** Objectif professionnel affiché (cap Byound). */
  objectiveLabel?: string | null;
  discScores: Record<string, number>;
  idmcScores: Record<string, number>;
  softSkillsTop: Array<{ skill: string; score: number }>;
  /** Compétences métiers issues du matching carrière. */
  careerMatching?: ProfileAnalysisCareerMatching | null;
  /** learner : vouvoiement. hr : le texte s'adresse au RH, au sujet du collaborateur. */
  audience?: "learner" | "hr";
};

export type StoredProfileAnalysis = {
  text: string;
  updatedAt: string | null;
  testsSignature: string | null;
};

export type ParsedProfileAnalysisSections = {
  strengths: string[];
  improvements: string[];
  summary: string | null;
  /** Texte situant le profil par rapport à l'objectif pro. */
  orientation: string | null;
};

export function buildProfileAnalysisTestsSignature(input: {
  discScores?: Record<string, number> | null;
  idmcScores?: Record<string, number> | null;
  softSkills?: Array<{ skill: string; score: number }>;
  hardSkills?: string[] | null;
  skillsMetadata?: Record<string, { level?: string }> | null;
  experiences?: Array<{
    employeur?: string | null;
    intitule?: string | null;
    date_debut?: string | null;
  }> | null;
  diplomas?: Array<{
    intitule?: string | null;
    ecole?: string | null;
    annee_obtention?: number | null;
  }> | null;
}): string {
  return JSON.stringify({
    disc: input.discScores ?? {},
    idmc: input.idmcScores ?? {},
    soft: (input.softSkills ?? []).map((s) => [s.skill, s.score]),
    hard: (input.hardSkills ?? []).slice().sort(),
    meta: Object.entries(input.skillsMetadata ?? {})
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, meta]) => [name, meta?.level ?? ""]),
    exp: (input.experiences ?? []).map((e) => [e.employeur ?? "", e.intitule ?? "", e.date_debut ?? ""]),
    dip: (input.diplomas ?? []).map((d) => [d.intitule ?? "", d.ecole ?? "", d.annee_obtention ?? ""]),
  });
}

export function parseStoredProfileAnalysis(raw: unknown): StoredProfileAnalysis | null {
  if (!raw) return null;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw) as { text?: string; updated_at?: string; tests_signature?: string };
      if (parsed?.text) {
        return {
          text: parsed.text,
          updatedAt: parsed.updated_at ?? null,
          testsSignature: parsed.tests_signature ?? null,
        };
      }
    } catch {
      return { text: raw, updatedAt: null, testsSignature: null };
    }
    return { text: raw, updatedAt: null, testsSignature: null };
  }
  return null;
}

function bodyToBulletItems(body: string): string[] {
  const cleaned = body.replace(/\*\*[^*]+\*\*/g, "").trim();
  const lines = cleaned
    .split(/\n/)
    .map((line) => line.replace(/^[-*•]\s*/, "").trim())
    .filter(Boolean);

  if (lines.length > 1) return lines.slice(0, 5);

  const dashSplit = cleaned
    .split(/\s+-\s+/)
    .map((part) => part.trim())
    .filter((part) => part.length > 12);
  if (dashSplit.length >= 2) return dashSplit.slice(0, 5);

  const paragraph = cleaned.trim();
  if (!paragraph) return [];
  return [paragraph];
}

/** Découpe le markdown aux titres **Section** (ligne seule ou inline). */
function splitMarkdownByBoldSections(markdown: string): Array<{ title: string; body: string }> {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();
  const parts = normalized.split(/\*\*([^*]+)\*\*/);
  if (parts.length < 3) return [];

  const out: Array<{ title: string; body: string }> = [];
  for (let i = 1; i < parts.length; i += 2) {
    const title = parts[i]?.trim() ?? "";
    const body = parts[i + 1]?.trim() ?? "";
    if (title) out.push({ title, body });
  }
  return out;
}

function classifyAnalysisSectionTitle(title: string): keyof ParsedProfileAnalysisSections | null {
  const t = title.toLowerCase();
  if (t.includes("orientation") || t.includes("objectif professionnel")) return "orientation";
  if (t.includes("forces")) return "strengths";
  if (t.includes("axes") || t.includes("amélioration")) return "improvements";
  if (t.includes("synthèse")) return "summary";
  return null;
}

/** Extrait Orientation / Forces / Axes / Synthèse Byound (markdown ## ou libellés **…**). */
export function parseProfileAnalysisSections(markdown: string): ParsedProfileAnalysisSections {
  const sections: Partial<Record<keyof ParsedProfileAnalysisSections, string>> = {};
  const normalized = markdown.replace(/\r\n/g, "\n").trim();

  const boldSections = splitMarkdownByBoldSections(normalized);
  if (boldSections.length > 0) {
    for (const block of boldSections) {
      const key = classifyAnalysisSectionTitle(block.title);
      if (key) sections[key] = block.body;
    }
  } else {
    const boldParts = normalized.split(/\n(?=\*\*[^*]+\*\*\s*$)/m).filter(Boolean);
    if (boldParts.length > 1 || /^\*\*[^*]+\*\*/m.test(normalized)) {
      for (const part of boldParts) {
        const match = part.match(/^\*\*([^*]+)\*\*\s*\n?([\s\S]*)$/);
        if (!match) continue;
        const key = classifyAnalysisSectionTitle(match[1].trim());
        if (key) sections[key] = match[2].trim();
      }
    } else {
      const parts = normalized.split(/^##\s+/m).filter(Boolean);
      for (const part of parts) {
        const newline = part.indexOf("\n");
        const title = (newline >= 0 ? part.slice(0, newline) : part).trim();
        const body = (newline >= 0 ? part.slice(newline + 1) : "").trim();
        const key = classifyAnalysisSectionTitle(title);
        if (key) sections[key] = body;
      }
    }
  }

  let strengths = bodyToBulletItems(sections.strengths ?? "");
  let improvements = bodyToBulletItems(sections.improvements ?? "");
  let summary = sections.summary?.replace(/\*\*/g, "").trim() || null;
  let orientation = sections.orientation?.replace(/\*\*/g, "").trim() || null;

  // Orientation qui contient encore d'autres rubriques (legacy / mauvais format)
  if (orientation && orientation.length > 320) {
    const nested = splitMarkdownByBoldSections(orientation);
    if (nested.length > 0) {
      orientation = null;
      for (const block of nested) {
        const key = classifyAnalysisSectionTitle(block.title);
        if (key === "orientation") orientation = block.body.replace(/\*\*/g, "").trim();
        if (key === "strengths" && !strengths.length) strengths = bodyToBulletItems(block.body);
        if (key === "improvements" && !improvements.length) {
          improvements = bodyToBulletItems(block.body);
        }
        if (key === "summary" && !summary) summary = block.body.replace(/\*\*/g, "").trim();
      }
    }
  }

  if (orientation && orientation.length > 420) {
    const sentences = orientation.match(/[^.!?]+[.!?]+/g)?.map((s) => s.trim()) ?? [];
    orientation = sentences.slice(0, 3).join(" ") || orientation.slice(0, 420).trim() + "…";
  }

  return {
    strengths,
    improvements,
    summary,
    orientation: orientation || null,
  };
}

export function isProfileAnalysisCacheValid(
  cached: StoredProfileAnalysis | null,
  currentSignature: string,
): boolean {
  if (!cached?.text?.trim()) return false;
  if (!cached.testsSignature) return false;
  return cached.testsSignature === currentSignature;
}

export async function generateProfileAnalysisText(input: ProfileAnalysisInput): Promise<string> {
  const openai = getOpenAIClient();
  if (!openai) {
    throw new Error("OpenAI non configuré.");
  }

  const hr = input.audience === "hr";
  const name = input.firstName.trim() || "Ce collaborateur";
  const jobContext = input.jobTitle?.trim()
    ? ` Poste actuel : ${input.jobTitle.trim()}.`
    : "";
  const objective = input.objectiveLabel?.trim() || null;
  const objectiveContext = objective ? ` Objectif professionnel visé : ${objective}.` : "";
  const matching = input.careerMatching ?? null;
  const matchingContext = matching
    ? ` Matching compétences métiers : ${JSON.stringify({
        scoreCompatibilite: matching.compatibilityScore ?? null,
        forcesMetier: matching.strengths ?? [],
        aConsolider: matching.consolidate ?? [],
        aDevelopper: matching.develop ?? [],
        nonEvaluees: matching.unevaluated ?? [],
        prioriteSuivante: matching.nextPrioritySkill ?? null,
      })}`
    : " Matching compétences métiers : non disponible.";

  const toneLines = PROFILE_ANALYSIS_TONE_PROMPT_LINES.filter(
    (line) => !hr || !line.includes("Vouvoiement"),
  );
  const voice = hr
    ? `- Tu t'adresses à un responsable RH qui lit la fiche de ${name}. Le collaborateur n'est pas le lecteur.
- Interdit, pour parler de ${name} : « vous », « votre », « vos », « tu », « ton », « ta », « tes ».
- Sujet : le prénom « ${name} ». Pour alléger, alterne avec « il » ou « elle », un seul genre, choisi d'après le prénom et tenu jusqu'au bout.
- Si le prénom est mixte, n'utilise que « ${name} ».
- La synthèse commence par « ${name} », jamais par « Vous êtes ».`
    : "- Toujours vouvoyer";

  const prompt = `Tu es un analyste comportemental senior Byound. Tu rédiges une lecture croisée exigeante.${jobContext}${objectiveContext}
Les scores ci-dessous sont des matières premières : tu dois les INTERPRÉTER en combinaison (DISC × IDMC × soft skills × compétences métiers), pas les reformuler.

Scores DISC : ${JSON.stringify(input.discScores)}
Scores IDMC (axes A1–A8, 0–100) : ${JSON.stringify(input.idmcScores)}
Top soft skills : ${JSON.stringify(input.softSkillsTop)}
${matchingContext}

Structure la réponse en français avec exactement ces 4 parties, chacune introduite par un libellé en gras sur sa propre ligne (syntaxe **Libellé**, pas de ##) :

**Orientation objectif**
(2 à 4 phrases. ${
    objective
      ? hr
        ? `Commence par « L'objectif de ${name} est de devenir ${objective}. » Puis une recommandation métier précise, au sujet de ${name}. Explique POURQUOI ces priorités comptent pour cet objectif.`
        : `Commence par « Votre objectif est de devenir ${objective}. » Puis enchaîne sur une recommandation métier précise du type « À la lecture des compétences métiers, nous vous suggérons de… ». Explique POURQUOI ces priorités comptent pour cet objectif (pas une simple liste).`
      : hr
        ? `Commence par « Pour le projet professionnel de ${name}, » puis propose 1 à 3 priorités avec le raisonnement.`
        : `Commence par « Pour avancer sur votre projet professionnel, » puis propose 1 à 3 priorités compétences métiers avec le raisonnement.`
  })

**Forces majeures**
(3 à 5 puces. Chaque puce = un levier d'action. Format : ce que ${hr ? name : "la personne"} fait naturellement + l'avantage concret. Interdit : « Soft skill dominante : X », « Style comportemental Y ».)

**Axes d'amélioration**
(3 à 5 puces. Chaque puce = un risque ou un frein + ce qu'il faut entraîner.)

**Synthèse**
(1 paragraphe de 4 à 6 phrases, commence obligatoirement par « ${hr ? name : "Vous êtes"} ». Portrait croisé, dynamique de travail, tension principale, implication pour l'objectif.)

Contraintes strictes :
${toneLines.join("\n")}
${voice}
- Zéro paraphrase des scores / classements visibles
- Chaque phrase doit apporter une lecture que le lecteur ne peut pas déduire d'un simple regard sur les barres
- 240 à 380 mots au total`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: hr
            ? `Tu es un analyste Byound senior. Tu écris pour un responsable RH, au sujet de ${name}. Jamais de vouvoiement adressé au collaborateur. Français sobre, précis.`
            : "Tu es un analyste Byound senior. Tu croises DISC, IDMC, soft skills et compétences métiers pour produire une lecture décisionnelle. Tu n'énumères jamais des labels déjà visibles. Français vouvoyé, sobre, précis.",
        },
        { role: "user", content: prompt },
      ],
      temperature: 0.55,
      max_tokens: 1200,
    });

    const raw = response.choices[0]?.message?.content?.trim() || "";
    if (!raw) {
      throw new Error("OpenAI a renvoyé une réponse vide.");
    }
    const cleaned = sanitizeProfileAnalysisTone(raw);
    return hr ? rewriteAnalysisForHr(cleaned, name) : cleaned;
  } catch (error: unknown) {
    const apiError = error as { status?: number; message?: string; code?: string };
    if (apiError?.status === 401) {
      throw new Error("OpenAI : clé API invalide ou absente.");
    }
    if (apiError?.status === 429) {
      throw new Error("OpenAI : quota ou limite de débit atteint.");
    }
    if (apiError?.code === "insufficient_quota") {
      throw new Error("OpenAI : crédits insuffisants sur le compte.");
    }
    if (error instanceof Error && error.message.includes("OpenAI")) {
      throw error;
    }
    const detail = error instanceof Error ? error.message : "erreur inconnue";
    throw new Error(`OpenAI : ${detail}`);
  }
}

export async function loadProfileAnalysisFromDb(
  service: SupabaseClient,
  profileId: string,
): Promise<StoredProfileAnalysis | null> {
  const { data } = await service.from("profiles").select("ai_analysis").eq("id", profileId).maybeSingle();
  return parseStoredProfileAnalysis(data?.ai_analysis);
}

export async function saveProfileAnalysisToDb(
  service: SupabaseClient,
  profileId: string,
  text: string,
  meta: { testsSignature: string; discUpdatedAt?: string | null; idmcUpdatedAt?: string | null },
): Promise<string> {
  const updatedAt = new Date().toISOString();
  const payload = JSON.stringify({
    text,
    updated_at: updatedAt,
    tests_signature: meta.testsSignature,
    disc_updated_at: meta.discUpdatedAt ?? null,
    idmc_updated_at: meta.idmcUpdatedAt ?? null,
  });

  const { error } = await service.from("profiles").update({ ai_analysis: payload }).eq("id", profileId);
  if (error) throw new Error(error.message);
  return updatedAt;
}

export function rewriteAnalysisForHr(text: string, firstName: string): string {
  const name = firstName.trim() || "Ce collaborateur";
  const rules: Array<[RegExp, string]> = [
    [/\bVotre objectif est de devenir\b/g, `L'objectif de ${name} est de devenir`],
    [/\bPour avancer sur votre projet professionnel\b/gi, `Pour le projet professionnel de ${name}`],
    [/\bnous vous suggérons de\b/gi, `l'orientation pour ${name} est de`],
    [/\bVous êtes\b/g, `${name} est`],
    [/\bvous êtes\b/g, `${name} est`],
    [/\bVous avez\b/g, `${name} a`],
    [/\bvous avez\b/g, `${name} a`],
    [/\bVotre\b/g, "Son"],
    [/\bvotre\b/g, "son"],
    [/\bVos\b/g, "Ses"],
    [/\bvos\b/g, "ses"],
    [/\bVous\b/g, name],
    [/\bvous\b/g, name],
  ];
  return rules.reduce((current, [pattern, value]) => current.replace(pattern, value), text);
}

function readAnalysisRecord(raw: unknown): Record<string, unknown> {
  if (typeof raw === "string" && raw.trim()) {
    try {
      const parsed = JSON.parse(raw) as unknown;
      if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    } catch {
      return { text: raw };
    }
    return { text: raw };
  }
  return {};
}

export async function resolveProfileAnalysisForProfile(
  service: SupabaseClient,
  profileId: string,
  input: ProfileAnalysisInput,
  options?: { forceRegenerate?: boolean; audience?: "learner" | "hr" },
): Promise<{ analysis: string; updatedAt: string; cached: boolean; sections: ParsedProfileAnalysisSections }> {
  const signature = buildProfileAnalysisTestsSignature({
    discScores: input.discScores,
    idmcScores: input.idmcScores,
    softSkills: input.softSkillsTop,
  });

  if (options?.audience === "hr") {
    const { data } = await service.from("profiles").select("ai_analysis").eq("id", profileId).maybeSingle();
    const record = readAnalysisRecord(data?.ai_analysis);
    const cachedHr = typeof record.hr_text === "string" ? record.hr_text : "";
    const cachedSig = typeof record.hr_tests_signature === "string" ? record.hr_tests_signature : "";
    const cachedStillAddressesThePerson = /\b(vous|votre|vos)\b/i.test(cachedHr);
    const voice = typeof record.hr_voice === "string" ? record.hr_voice : "";
    if (
      !options.forceRegenerate &&
      cachedHr.trim() &&
      cachedSig === signature &&
      voice === "rh-prenom-v1" &&
      !cachedStillAddressesThePerson
    ) {
      return {
        analysis: cachedHr,
        updatedAt: typeof record.hr_updated_at === "string" ? record.hr_updated_at : new Date().toISOString(),
        cached: true,
        sections: parseProfileAnalysisSections(cachedHr),
      };
    }

    let analysis = "";
    try {
      analysis = await generateProfileAnalysisText({ ...input, audience: "hr" });
    } catch (error) {
      const learnerText = typeof record.text === "string" ? record.text : "";
      if (!learnerText.trim()) throw error;
      analysis = rewriteAnalysisForHr(learnerText, input.firstName);
    }
    if (!analysis.trim()) throw new Error("Analyse vide.");

    const updatedAt = new Date().toISOString();
    record.hr_text = analysis;
    record.hr_tests_signature = signature;
    record.hr_updated_at = updatedAt;
    record.hr_voice = "rh-prenom-v1";
    const { error } = await service
      .from("profiles")
      .update({ ai_analysis: JSON.stringify(record) })
      .eq("id", profileId);
    if (error) throw new Error(error.message);

    return {
      analysis,
      updatedAt,
      cached: false,
      sections: parseProfileAnalysisSections(analysis),
    };
  }

  const cached = await loadProfileAnalysisFromDb(service, profileId);

  if (!options?.forceRegenerate && isProfileAnalysisCacheValid(cached, signature) && cached?.text) {
    return {
      analysis: cached.text,
      updatedAt: cached.updatedAt ?? new Date().toISOString(),
      cached: true,
      sections: parseProfileAnalysisSections(cached.text),
    };
  }

  const analysis = await generateProfileAnalysisText(input);
  if (!analysis) {
    throw new Error("Analyse vide.");
  }

  const updatedAt = await saveProfileAnalysisToDb(service, profileId, analysis, { testsSignature: signature });

  return {
    analysis,
    updatedAt,
    cached: false,
    sections: parseProfileAnalysisSections(analysis),
  };
}

/** Régénère profiles.ai_analysis si la signature tests a changé (ou si force). */
export async function maybeRefreshProfileAnalysisIfStale(
  service: SupabaseClient,
  userId: string,
  options?: { forceRegenerate?: boolean },
): Promise<{ refreshed: boolean; reason: string }> {
  const uid = userId.trim();
  if (!uid) return { refreshed: false, reason: "missing_user_id" };

  const { data: profile } = await service
    .from("profiles")
    .select("first_name, email, poste_actuel, hard_skills, skills_metadata")
    .eq("id", uid)
    .maybeSingle();
  if (!profile) return { refreshed: false, reason: "profile_not_found" };

  const email = String(profile.email ?? "").trim();
  const profileIds = await collectLearnerProfileCandidates(service, uid, email);

  const [discScores, idmcAxes, softSkillsRadar, experiencesRes, diplomasRes] = await Promise.all([
    fetchDiscScoresForCandidates(service, profileIds),
    fetchIdmcAxesForCandidates(service, profileIds),
    fetchSoftSkillsRadarForCandidates(service, profileIds),
    service
      .from("experiences_pro")
      .select("employeur, intitule, date_debut")
      .eq("learner_id", uid)
      .order("date_debut", { ascending: false }),
    service
      .from("diplomes")
      .select("intitule, ecole, annee_obtention")
      .eq("learner_id", uid)
      .order("annee_obtention", { ascending: false }),
  ]);

  if (!discScores && !idmcAxes && softSkillsRadar.length === 0) {
    return { refreshed: false, reason: "no_tests" };
  }

  const signature = buildProfileAnalysisTestsSignature({
    discScores: discScores ?? {},
    idmcScores: idmcAxes ?? {},
    softSkills: softSkillsRadar.slice(0, 5),
    hardSkills: Array.isArray(profile.hard_skills)
      ? (profile.hard_skills as string[])
      : typeof profile.hard_skills === "string"
        ? profile.hard_skills.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    skillsMetadata:
      profile.skills_metadata && typeof profile.skills_metadata === "object"
        ? (profile.skills_metadata as Record<string, { level?: string }>)
        : {},
    experiences: experiencesRes.data ?? [],
    diplomas: diplomasRes.data ?? [],
  });

  const cached = await loadProfileAnalysisFromDb(service, uid);
  if (!options?.forceRegenerate && isProfileAnalysisCacheValid(cached, signature)) {
    return { refreshed: false, reason: "cache_valid" };
  }

  await resolveProfileAnalysisForProfile(
    service,
    uid,
    {
      firstName: String(profile.first_name ?? "Apprenant").trim() || "Apprenant",
      jobTitle: profile.poste_actuel,
      discScores: discScores ?? { D: 0, I: 0, S: 0, C: 0 },
      idmcScores: idmcAxes ?? {},
      softSkillsTop: softSkillsRadar.slice(0, 5),
    },
    { forceRegenerate: true },
  );

  return { refreshed: true, reason: "regenerated" };
}
