import { DISC_PROFILE_LABELS } from "@/lib/disc/disc-constants";
import { resolveDiscProfile } from "@/lib/disc/disc-scoring";
import { AXES_LABELS, type AxisKey } from "@/lib/idmc/idmc-display";
import {
  JADE_DISC_SCORES,
  JADE_IDMC_AXES,
  JADE_SOFT_SKILLS_RADAR,
} from "@/lib/demo/jade-dashboard-mocks";
import { resolveEmployeeNextStep } from "@/lib/salarie/employee-next-step";
import { enterpriseVisibilityForEmployee } from "@/lib/salarie/enterprise-visibility";
import type { SalarieHomePayload } from "@/lib/salarie/load-employee-home";

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(10, 0, 0, 0);
  return date.toISOString();
}

function daysAhead(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
}

/** Accueil salarié de Jade : les trois bilans, une formation et un historique. */
export function buildJadeSalarieHome(): SalarieHomePayload {
  const disc = resolveDiscProfile(JADE_DISC_SCORES);
  const axes = (Object.keys(AXES_LABELS) as AxisKey[]).map((key) => JADE_IDMC_AXES[key]);
  const rankedAxes = (Object.keys(AXES_LABELS) as AxisKey[])
    .map((key) => ({ key, value: JADE_IDMC_AXES[key] }))
    .sort((a, b) => b.value - a.value);
  const soft = [...JADE_SOFT_SKILLS_RADAR].sort((a, b) => b.score - a.score);
  const formationHref = "/catalog/formations";

  return {
    profile: { firstName: "Jade", lastName: "Martin", initials: "JM" },
    notifications: 2,
    formation: {
      id: "jade-course-ccp1",
      title: "CCP1 — Stratégie de prospection",
      href: formationHref,
      completed: 8,
      total: 13,
      percent: 62,
      nextLeafTitle: "Qualifier un prospect",
      complete: false,
    },
    bilans: {
      completed: 3,
      expected: 3,
      disc: {
        dominant: DISC_PROFILE_LABELS[disc.dominant],
        bars: (["D", "I", "S", "C"] as const).map((key) => ({ key, value: JADE_DISC_SCORES[key] })),
        takenAt: daysAgo(18),
      },
      idmc: {
        strong: AXES_LABELS[rankedAxes[0].key],
        weak: AXES_LABELS[rankedAxes[rankedAxes.length - 1].key],
        axes,
        takenAt: daysAgo(12),
      },
      soft: {
        top: soft.slice(0, 3).map((row) => row.skill),
        flat: false,
        takenAt: daysAgo(6),
      },
    },
    skills: { declared: 6, withProof: 2 },
    badges: { count: 2, names: ["Prospection B2B", "Prise de parole"] },
    analysis:
      "Jade est Influente, avec un point fort en organisation et anticipation. Sa force n°1 en soft skills soutient la prospection. La prochaine marche est le closing, déjà engagé dans CCP1.",
    nextStep: resolveEmployeeNextStep({
      pendingBilan: null,
      formation: {
        title: "CCP1 — Stratégie de prospection",
        href: formationHref,
        nextLeafTitle: "Qualifier un prospect",
        complete: false,
      },
      upcoming: {
        title: "Coaching commercial",
        dateLabel: daysAhead(3),
        href: "/dashboard/salarie/coachings",
      },
    }),
    history: [
      {
        id: "jade-h1",
        kind: "coaching",
        title: "Coaching commercial",
        subtitle: "Avec Camille Bernard",
        status: "Planifié",
        done: false,
        at: new Date(Date.now() + 3 * 86400000).toISOString(),
      },
      {
        id: "jade-h2",
        kind: "demande",
        title: "Négociation commerciale",
        subtitle: "Demande envoyée à Byound Business",
        status: "Envoyée",
        done: false,
        at: daysAgo(2),
      },
      {
        id: "jade-h3",
        kind: "bilan",
        title: "Bilan soft skills",
        subtitle: "20 compétences",
        status: "Terminé",
        done: true,
        at: daysAgo(6),
      },
      {
        id: "jade-h4",
        kind: "bilan",
        title: "Bilan IDMC",
        subtitle: AXES_LABELS[rankedAxes[0].key],
        status: "Terminé",
        done: true,
        at: daysAgo(12),
      },
      {
        id: "jade-h5",
        kind: "intervention",
        title: "Atelier closing",
        subtitle: "Promo NTC 2026",
        status: "Terminé",
        done: true,
        at: daysAgo(21),
      },
    ],
    visibility: enterpriseVisibilityForEmployee({
      consentement_donne: true,
      disc_shared: true,
      idmc_shared: true,
      soft_skills_shared: false,
    }),
    search: [
      { label: "CCP1 — Stratégie de prospection", href: formationHref },
      { label: "NTC AI Business", href: formationHref },
      { label: "Bilan DISC", href: "/dashboard/salarie#bilans" },
      { label: "Bilan IDMC", href: "/dashboard/salarie#bilans" },
      { label: "Soft skills", href: "/dashboard/salarie#bilans" },
    ],
  };
}
