import type { SupabaseClient } from "@supabase/supabase-js";
import { getOpenAIClient } from "@/lib/ai/openai-client";
import {
  collectLearnerProfileCandidates,
  fetchDiscScoresForCandidates,
  fetchIdmcAxesForCandidates,
  fetchSoftSkillsRadarForCandidates,
} from "@/lib/learner/resolve-learner-profile-candidates";

export type ProfileAnalysisInput = {
  firstName: string;
  jobTitle?: string | null;
  discScores: Record<string, number>;
  idmcScores: Record<string, number>;
  softSkillsTop: Array<{ skill: string; score: number }>;
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
};

export function buildProfileAnalysisTestsSignature(input: {
  discScores?: Record<string, number> | null;
  idmcScores?: Record<string, number> | null;
  softSkills?: Array<{ skill: string; score: number }>;
}): string {
  return JSON.stringify({
    disc: input.discScores ?? {},
    idmc: input.idmcScores ?? {},
    soft: (input.softSkills ?? []).map((s) => [s.skill, s.score]),
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
  const lines = body
    .split(/\n/)
    .map((line) => line.replace(/^[-*•]\s*/, "").replace(/\*\*/g, "").trim())
    .filter(Boolean);

  if (lines.length > 0) return lines.slice(0, 5);

  const paragraph = body.replace(/\*\*/g, "").trim();
  if (!paragraph) return [];
  return [paragraph];
}

/** Extrait Forces majeures / Axes d'amélioration / Synthèse EDGE (markdown ## ou libellés **…**). */
export function parseProfileAnalysisSections(markdown: string): ParsedProfileAnalysisSections {
  const sections: Record<string, string> = {};
  const normalized = markdown.replace(/\r\n/g, "\n").trim();

  const boldParts = normalized.split(/\n(?=\*\*[^*]+\*\*\s*$)/m).filter(Boolean);
  if (boldParts.length > 1 || /^\*\*[^*]+\*\*/m.test(normalized)) {
    for (const part of boldParts) {
      const match = part.match(/^\*\*([^*]+)\*\*\s*\n?([\s\S]*)$/);
      if (!match) continue;
      const title = match[1].trim().toLowerCase();
      const body = match[2].trim();
      if (title.includes("forces")) sections.strengths = body;
      else if (title.includes("axes") || title.includes("amélioration")) sections.improvements = body;
      else if (title.includes("synthèse")) sections.summary = body;
    }
  } else {
    const parts = normalized.split(/^##\s+/m).filter(Boolean);
    for (const part of parts) {
      const newline = part.indexOf("\n");
      const title = (newline >= 0 ? part.slice(0, newline) : part).trim().toLowerCase();
      const body = (newline >= 0 ? part.slice(newline + 1) : "").trim();
      if (title.includes("forces")) sections.strengths = body;
      else if (title.includes("axes") || title.includes("amélioration")) sections.improvements = body;
      else if (title.includes("synthèse")) sections.summary = body;
    }
  }

  return {
    strengths: bodyToBulletItems(sections.strengths ?? ""),
    improvements: bodyToBulletItems(sections.improvements ?? ""),
    summary: sections.summary?.replace(/\*\*/g, "").trim() || null,
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

  const jobContext = input.jobTitle?.trim()
    ? ` Poste : ${input.jobTitle.trim()}.`
    : "";

  const prompt = `Tu rédiges une synthèse croisée pour ${input.firstName}${jobContext}, en reliant DISC, IDMC et soft skills (ne les traite pas isolément).

Scores DISC : ${JSON.stringify(input.discScores)}
Scores IDMC (axes A1–A8, 0–100) : ${JSON.stringify(input.idmcScores)}
Top soft skills : ${JSON.stringify(input.softSkillsTop)}

Structure la réponse en français avec exactement ces 3 parties, chacune introduite par un libellé en gras sur sa propre ligne (syntaxe **Libellé**, pas de ##) :

**Forces majeures**
(liste à puces, 2 à 4 points factuels)

**Axes d'amélioration**
(liste à puces, 2 à 4 points factuels)

**Synthèse EDGE**
(1 paragraphe court)

Contraintes strictes :
- Ton EDGE : direct, sobre, factuel — jamais sensationnaliste
- Interdits : remarquable, extraordinaire, unique, sommets, professionnel équilibré, coach de vie, parcours exceptionnel
- Pas de point d'exclamation
- 180 à 260 mots au total
- Vouvoiement`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "Tu es un analyste EDGE. Tu écris en français, de façon factuelle et sobre, sans formules creuses ni emphase.",
      },
      { role: "user", content: prompt },
    ],
    temperature: 0.4,
  });

  return response.choices[0]?.message?.content?.trim() || "";
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

export async function resolveProfileAnalysisForProfile(
  service: SupabaseClient,
  profileId: string,
  input: ProfileAnalysisInput,
  options?: { forceRegenerate?: boolean },
): Promise<{ analysis: string; updatedAt: string; cached: boolean; sections: ParsedProfileAnalysisSections }> {
  const signature = buildProfileAnalysisTestsSignature({
    discScores: input.discScores,
    idmcScores: input.idmcScores,
    softSkills: input.softSkillsTop,
  });

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
    .select("first_name, email, poste_actuel")
    .eq("id", uid)
    .maybeSingle();
  if (!profile) return { refreshed: false, reason: "profile_not_found" };

  const email = String(profile.email ?? "").trim();
  const profileIds = await collectLearnerProfileCandidates(service, uid, email);

  const [discScores, idmcAxes, softSkillsRadar] = await Promise.all([
    fetchDiscScoresForCandidates(service, profileIds),
    fetchIdmcAxesForCandidates(service, profileIds),
    fetchSoftSkillsRadarForCandidates(service, profileIds),
  ]);

  if (!discScores && !idmcAxes && softSkillsRadar.length === 0) {
    return { refreshed: false, reason: "no_tests" };
  }

  const signature = buildProfileAnalysisTestsSignature({
    discScores: discScores ?? {},
    idmcScores: idmcAxes ?? {},
    softSkills: softSkillsRadar.slice(0, 5),
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
