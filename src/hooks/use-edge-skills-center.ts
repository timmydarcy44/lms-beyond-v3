"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  analyzeCareerMatching,
  type CareerMatchingResult,
} from "@/lib/career-profiles/career-profile-matching";
import {
  getCareerProfileBySlug,
  type CareerProfile,
} from "@/lib/career-profiles/career-profiles-data";
import {
  buildObjectiveGaps,
  buildTrainingFocusList,
  computeSkillsCapital,
  type ObjectiveSkillGap,
  type SkillsCapital,
  type TrainingFocus,
} from "@/lib/apprenant/edge-skills-center";
import { parseStoredDiscScores } from "@/lib/disc/disc-scoring";
import {
  buildHardSkillRecord,
  buildStoredMeta,
  findReferentialCategory,
  levelToSelfAssessment,
  parseHardSkillPortfolio,
  resolveDisplayCategory,
  type LearnerHardSkillRecord,
  type StoredHardSkillMeta,
} from "@/lib/hard-skills/hard-skills-portfolio";
import type { HardSkillLevel } from "@/lib/particulier/profil-edge-maturity";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  buildUserObjectiveDisplay,
  migrateLegacyProjectToV2,
} from "@/lib/particulier/edge-professional-project-v2";
import {
  mergeObjectiveDetailsIntoProject,
  extractCareerTitleFromProject,
} from "@/lib/particulier/professional-project-fields";
import { parseProfessionalProject } from "@/lib/particulier/profil-edge-maturity";

export type EdgeSkillsCenterData = {
  loading: boolean;
  error: string | null;
  records: LearnerHardSkillRecord[];
  meta: Record<string, StoredHardSkillMeta>;
  capital: SkillsCapital;
  training: TrainingFocus[];
  objectiveLabel: string;
  objectiveGaps: ObjectiveSkillGap[];
  matching: CareerMatchingResult | null;
  careerTitle: string | null;
  reload: () => Promise<void>;
  upsertSkill: (
    name: string,
    level: HardSkillLevel,
    opts?: { targetLevel?: HardSkillLevel; source?: "catalog" | "manual" },
  ) => Promise<void>;
  attachProofNote: (
    name: string,
    note: string,
    proofType?: "link" | "document" | "portfolio" | "other",
  ) => Promise<void>;
};

async function loadCareer(slug: string): Promise<CareerProfile | null> {
  try {
    const res = await fetch(`/api/career-profiles/search?slug=${encodeURIComponent(slug)}`);
    const json = await res.json();
    if (res.ok && json.profile) return json.profile as CareerProfile;
  } catch {
    /* fallback local */
  }
  return getCareerProfileBySlug(slug) ?? null;
}

export function useEdgeSkillsCenter(): EdgeSkillsCenterData {
  const supabase = createSupabaseBrowserClient();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hardSkills, setHardSkills] = useState<string[]>([]);
  const [meta, setMeta] = useState<Record<string, StoredHardSkillMeta>>({});
  const [badgeCount, setBadgeCount] = useState(0);
  const [matching, setMatching] = useState<CareerMatchingResult | null>(null);
  const [objectiveLabel, setObjectiveLabel] = useState("");
  const [careerTitle, setCareerTitle] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setError("Session introuvable.");
      return;
    }
    setUserId(uid);

    const [profileRes, discRes] = await Promise.all([
      supabase
        .from("profiles")
        .select(
          "hard_skills, skills_metadata, target_career_slug, type_profil, professional_project, objective_details, cross_profile_completion",
        )
        .eq("id", uid)
        .maybeSingle(),
      supabase.from("disc_resultats").select("scores").eq("profile_id", uid).maybeSingle(),
    ]);

    if (profileRes.error) {
      setError("Impossible de charger vos compétences.");
      return;
    }

    const profile = profileRes.data ?? {};
    const hs = Array.isArray(profile.hard_skills) ? (profile.hard_skills as string[]) : [];
    const parsedMeta = (profile.skills_metadata as Record<string, StoredHardSkillMeta>) ?? {};
    setHardSkills(hs);
    setMeta(parsedMeta);

    const disc = parseStoredDiscScores((discRes.data?.scores as Record<string, unknown>) ?? null);

    const completion = profile.cross_profile_completion as {
      badge_awarded_at?: string;
      badge_id?: string;
    } | null;
    setBadgeCount(completion?.badge_awarded_at ? 1 : 0);

    const project = migrateLegacyProjectToV2(
      mergeObjectiveDetailsIntoProject(
        profile.type_profil ? String(profile.type_profil) : null,
        parseProfessionalProject(profile.professional_project),
        (profile.objective_details as Record<string, string>) ?? {},
      ),
    );
    const label =
      buildUserObjectiveDisplay(project) ||
      extractCareerTitleFromProject(profile.type_profil ? String(profile.type_profil) : null, project) ||
      "";
    setObjectiveLabel(label);

    const slug = profile.target_career_slug ? String(profile.target_career_slug) : "";
    if (slug && disc) {
      const career = await loadCareer(slug);
      setCareerTitle(career?.title ?? label ?? null);
      if (career) {
        setMatching(
          analyzeCareerMatching({
            career,
            discScores: disc,
            softSkillsScores: null,
            hardSkills: hs,
            skillsMetadata: parsedMeta,
            experiences: [],
            diplomas: [],
            hasIdmc: false,
          }),
        );
      } else {
        setMatching(null);
      }
    } else {
      setCareerTitle(label || null);
      setMatching(null);
    }
  }, [supabase]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        await load();
      } catch {
        if (!cancelled) setError("Impossible de charger EDGE Skills.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  const records = useMemo(() => parseHardSkillPortfolio(hardSkills, meta), [hardSkills, meta]);

  const capital = useMemo(
    () => computeSkillsCapital(records, meta, badgeCount),
    [records, meta, badgeCount],
  );
  const training = useMemo(
    () => buildTrainingFocusList(records, meta, matching, 4),
    [records, meta, matching],
  );
  const objectiveGaps = useMemo(() => buildObjectiveGaps(matching), [matching]);

  const upsertSkill = useCallback(
    async (
      name: string,
      level: HardSkillLevel,
      opts?: { targetLevel?: HardSkillLevel; source?: "catalog" | "manual" },
    ) => {
      if (!userId) return;
      const clean = name.trim();
      if (!clean) return;
      const refCat = findReferentialCategory(clean);
      const prev = meta[clean];
      const record = buildHardSkillRecord(clean, {
        ...prev,
        level,
        selfAssessment: levelToSelfAssessment(level),
        category: prev?.category ?? resolveDisplayCategory(clean, refCat),
        referentialCategory: prev?.referentialCategory ?? refCat,
        proofLevel: prev?.proofLevel ?? "declared",
        source: opts?.source ?? prev?.source ?? "catalog",
        trainingTargetLevel: opts?.targetLevel ?? prev?.trainingTargetLevel,
        trainingStartedAt: opts?.targetLevel
          ? new Date().toISOString()
          : prev?.trainingStartedAt,
      });
      const stored = buildStoredMeta(record, prev?.validation);
      const nextMeta: Record<string, StoredHardSkillMeta> = {
        ...meta,
        [clean]: {
          ...stored,
          trainingTargetLevel: opts?.targetLevel ?? prev?.trainingTargetLevel,
          trainingStartedAt: opts?.targetLevel
            ? new Date().toISOString()
            : prev?.trainingStartedAt,
        },
      };
      const nextNames = hardSkills.some((s) => s.toLowerCase() === clean.toLowerCase())
        ? hardSkills
        : [...hardSkills, clean];
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ hard_skills: nextNames, skills_metadata: nextMeta })
        .eq("id", userId);
      if (upErr) throw upErr;
      setHardSkills(nextNames);
      setMeta(nextMeta);
      await load();
    },
    [userId, meta, hardSkills, supabase, load],
  );

  const attachProofNote = useCallback(
    async (
      name: string,
      note: string,
      proofType: "link" | "document" | "portfolio" | "other" = "document",
    ) => {
      if (!userId) return;
      const clean = name.trim();
      const prev = meta[clean];
      const level = (prev?.level as HardSkillLevel) || "Intermédiaire";
      const trimmed = note.trim();
      const record = buildHardSkillRecord(clean, {
        ...prev,
        level,
        selfAssessment: levelToSelfAssessment(level),
        proofLevel: "justified",
        proof: {
          type: proofType,
          note: trimmed || undefined,
          url: trimmed.startsWith("http") ? trimmed : prev?.proof?.url,
        },
        source: prev?.source ?? "manual",
      });
      const nextMeta: Record<string, StoredHardSkillMeta> = {
        ...meta,
        [clean]: buildStoredMeta(record, prev?.validation),
      };
      const nextNames = hardSkills.some((s) => s.toLowerCase() === clean.toLowerCase())
        ? hardSkills
        : [...hardSkills, clean];
      const { error: upErr } = await supabase
        .from("profiles")
        .update({ hard_skills: nextNames, skills_metadata: nextMeta })
        .eq("id", userId);
      if (upErr) throw upErr;
      setHardSkills(nextNames);
      setMeta(nextMeta);
      await load();
    },
    [userId, meta, hardSkills, supabase, load],
  );

  return {
    loading,
    error,
    records,
    meta,
    capital,
    training,
    objectiveLabel,
    objectiveGaps,
    matching,
    careerTitle,
    reload: load,
    upsertSkill,
    attachProofNote,
  };
}
