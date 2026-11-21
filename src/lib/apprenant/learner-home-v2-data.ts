import type { CareerMatchingResult } from "@/lib/career-profiles/career-profile-matching";

/**
 * Compatibilité / écarts aujourd’hui (GPS) :
 * - % = moyenne des maîtrises des compétences du référentiel métier
 *   (analyzeCareerMatching → compatibilityScore), ou sinon le % de complétion profil.
 * - « Écarts » = develop.length + consolidate.length (pas les non évaluées).
 *
 * Lot 2 : on n’affiche plus le %. On mappe :
 * - strengths → compétences acquises
 * - develop + consolidate → à renforcer
 * (données existantes uniquement, rien d’inventé).
 */

export type HomeSkillStatus = "acquired" | "to_strengthen";

export type HomeSkillRow = {
  name: string;
  status: HomeSkillStatus;
};

export function skillsFromMatching(matching: CareerMatchingResult | null): {
  acquired: HomeSkillRow[];
  toStrengthen: HomeSkillRow[];
  all: HomeSkillRow[];
} {
  if (!matching) {
    return { acquired: [], toStrengthen: [], all: [] };
  }
  const acquired = matching.strengths.map((name) => ({
    name,
    status: "acquired" as const,
  }));
  const toStrengthen = [...matching.develop, ...matching.consolidate].map((name) => ({
    name,
    status: "to_strengthen" as const,
  }));
  // Affichage : à renforcer d’abord, puis acquises
  const all = [...toStrengthen, ...acquired];
  return { acquired, toStrengthen, all };
}

export type ProfileInfoField = {
  id: string;
  label: string;
  filled: boolean;
};

/** 6 infos profil pour le ratio « n infos sur 6 » (bandeau + Mon profil). */
export function buildProfileInfoFields(profile: Record<string, unknown> | null): ProfileInfoField[] {
  const p = profile ?? {};
  const phone = String(p.phone ?? p.telephone ?? "").trim();
  const city = String(p.city ?? "").trim();
  const diploma = String(p.last_diploma ?? p.diplome ?? "").trim();
  const situation = String(p.type_profil ?? "").trim();
  const experience =
    Array.isArray(p.hard_skills) && (p.hard_skills as unknown[]).length > 0
      ? true
      : Boolean(String(p.experience_summary ?? "").trim());
  // expérience : au moins une expérience_pro passée séparément ; ici on marque via flag
  const hasExperienceFlag = Boolean(p.__has_experience);
  const email = String(p.email ?? "").trim();

  return [
    { id: "email", label: "E-mail", filled: Boolean(email) },
    { id: "phone", label: "Téléphone", filled: Boolean(phone) },
    { id: "city", label: "Ville", filled: Boolean(city) },
    { id: "diploma", label: "Dernier diplôme", filled: Boolean(diploma) },
    { id: "situation", label: "Situation", filled: Boolean(situation) },
    {
      id: "experience",
      label: "Expérience",
      filled: hasExperienceFlag || experience,
    },
  ];
}

export type HomeTimelineStepId = "tests" | "objectif" | "profil" | "parcours" | "badge";

export type HomeTimelineStep = {
  id: HomeTimelineStepId;
  label: string;
  detail: string;
  status: "done" | "current" | "upcoming";
};

/**
 * Frise ordonnée : une étape ne peut pas être cochée si la précédente ne l’est pas.
 */
export function buildHomeTimeline(input: {
  testsDone: number;
  testsTotal: number;
  hasObjective: boolean;
  profileFilled: number;
  profileTotal: number;
  hasExpertParcours: boolean;
  hasBadge: boolean;
}): HomeTimelineStep[] {
  const rawDone: Record<HomeTimelineStepId, boolean> = {
    tests: input.testsDone >= input.testsTotal && input.testsTotal > 0,
    objectif: input.hasObjective,
    profil: input.profileFilled >= input.profileTotal && input.profileTotal > 0,
    parcours: input.hasExpertParcours,
    badge: input.hasBadge,
  };

  const order: HomeTimelineStepId[] = ["tests", "objectif", "profil", "parcours", "badge"];
  const lockedDone: Record<HomeTimelineStepId, boolean> = {
    tests: false,
    objectif: false,
    profil: false,
    parcours: false,
    badge: false,
  };
  let prevOk = true;
  for (const id of order) {
    lockedDone[id] = prevOk && rawDone[id];
    prevOk = lockedDone[id];
  }

  const details: Record<HomeTimelineStepId, string> = {
    tests: `${input.testsDone} sur ${input.testsTotal}`,
    objectif: input.hasObjective ? "défini" : "à définir",
    profil: `${input.profileFilled} infos sur ${input.profileTotal}`,
    parcours: input.hasExpertParcours ? "avec un expert" : "à planifier",
    badge: input.hasBadge ? "obtenu" : "à préparer",
  };

  const labels: Record<HomeTimelineStepId, string> = {
    tests: "Tests",
    objectif: "Objectif",
    profil: "Profil",
    parcours: "Parcours",
    badge: "Badge",
  };

  let currentSet = false;
  return order.map((id) => {
    if (lockedDone[id]) {
      return { id, label: labels[id], detail: details[id], status: "done" as const };
    }
    if (!currentSet) {
      currentSet = true;
      return { id, label: labels[id], detail: details[id], status: "current" as const };
    }
    return { id, label: labels[id], detail: details[id], status: "upcoming" as const };
  });
}

export type HomeNextStep = {
  title: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  nextHint: string;
  ringLabel: string;
  ringFilled: number;
  ringTotal: number;
};

/** Priorité serveur : tests → profil → objectif → expert → module → badge. */
export function pickHomeNextStep(input: {
  testsDone: number;
  testsTotal: number;
  profileFilled: number;
  profileTotal: number;
  missingLabels: string[];
  hasObjective: boolean;
  hasExpertParcours: boolean;
  resumeHref: string | null;
  resumeTitle: string | null;
  badgeReadyName: string | null;
}): HomeNextStep {
  if (input.testsDone < input.testsTotal) {
    return {
      title: "Passe tes tests",
      body: `Il te reste ${input.testsTotal - input.testsDone} test${
        input.testsTotal - input.testsDone > 1 ? "s" : ""
      } pour mieux choisir ton parcours et ta façon d’apprendre.`,
      ctaLabel: "Ouvrir Mes tests →",
      ctaHref: "/dashboard/apprenant/tests",
      nextHint: "Ensuite : compléter ton profil",
      ringLabel: `${input.testsDone}/${input.testsTotal} tests`,
      ringFilled: input.testsDone,
      ringTotal: input.testsTotal,
    };
  }

  if (input.profileFilled < input.profileTotal) {
    const miss = input.missingLabels.slice(0, 2).join(" et ");
    return {
      title: "Complète ton profil",
      body: miss
        ? `Il manque ${miss}. Ça prend 2 minutes et ça débloque les recommandations.`
        : "Quelques infos manquent encore pour affiner ton parcours.",
      ctaLabel: "Compléter mon profil →",
      ctaHref: "/dashboard/apprenant/profil",
      nextHint: "Ensuite : définir ton objectif",
      ringLabel: `${input.profileFilled}/${input.profileTotal} infos du profil`,
      ringFilled: input.profileFilled,
      ringTotal: input.profileTotal,
    };
  }

  if (!input.hasObjective) {
    return {
      title: "Définis ton objectif",
      body: "Choisis le métier que tu vises pour que Byound aligne compétences et formation.",
      ctaLabel: "Choisir mon objectif →",
      ctaHref: "/dashboard/apprenant/profil-comportemental/projet",
      nextHint: "Ensuite : construire ton parcours avec un expert",
      ringLabel: "Objectif",
      ringFilled: 0,
      ringTotal: 1,
    };
  }

  if (!input.hasExpertParcours) {
    return {
      title: "Construis ton parcours avec un expert",
      body: "Un échange de 30 min pour prioriser les modules et ton premier badge.",
      ctaLabel: "Prendre rendez-vous →",
      ctaHref: "/dashboard/apprenant/mon-projet-expert",
      nextHint: "Ensuite : continuer ton module",
      ringLabel: "Parcours expert",
      ringFilled: 0,
      ringTotal: 1,
    };
  }

  if (input.resumeHref) {
    return {
      title: "Reprends où tu t’es arrêté·e",
      body: input.resumeTitle
        ? `Continue « ${input.resumeTitle} » — quelques minutes suffisent pour avancer.`
        : "Ton module t’attend dans le Training center.",
      ctaLabel: "Continuer →",
      ctaHref: input.resumeHref,
      nextHint: input.badgeReadyName
        ? `Ensuite : préparer « ${input.badgeReadyName} »`
        : "Ensuite : préparer ton badge",
      ringLabel: "Module",
      ringFilled: 1,
      ringTotal: 1,
    };
  }

  return {
    title: input.badgeReadyName
      ? `Prépare « ${input.badgeReadyName} »`
      : "Prépare ton premier Open Badge",
    body: "Un badge certifie une compétence, vérifiable par n’importe quelle entreprise.",
    ctaLabel: "Ouvrir Mes compétences →",
    ctaHref: "/dashboard/apprenant/skills",
    nextHint: "Ensuite : explorer les opportunités",
    ringLabel: "Badge",
    ringFilled: 0,
    ringTotal: 1,
  };
}

export function formatFrenchLongDate(d = new Date()) {
  return d.toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}
