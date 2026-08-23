/** Données démo Paris Saint-Germain (présentations équipes). */

export const PSG_ORG_ID = "cb2bc84a-2f19-4744-8539-d5a13a3d7006";

export const PSG_DEMO_VIEWER_EMAILS = new Set([
  "demo@psg.fr",
  "demoapprenant@psg.fr",
  "demoecole@psg.fr",
  "timmydarcy44@gmail.com",
  "jerome.picot@edgebs.fr",
  "contact@edgebs.fr",
]);

export function isPsgDemoViewer(email: string | null | undefined): boolean {
  return Boolean(email && PSG_DEMO_VIEWER_EMAILS.has(email.trim().toLowerCase()));
}

export const PSG_DEMO_METIERS = [
  {
    id: "psg-metier-performance",
    title: "Analyste performance",
    description: "Mesurer et optimiser la performance sportive et individuelle.",
    hard_skills: ["Data sport", "GPS tracking", "Reporting KPI", "Vidéo analyse"],
    soft_skills: ["Rigueur", "Curiosité", "Communication", "Esprit d’équipe"],
  },
  {
    id: "psg-metier-medical",
    title: "Staff médical / récupération",
    description: "Prévenir les blessures et accompagner le retour à la compétition.",
    hard_skills: ["Préparation physique", "Protocoles blessure", "Suivi charge", "Nutrition"],
    soft_skills: ["Empathie", "Discernement", "Calme", "Coordination"],
  },
  {
    id: "psg-metier-academy",
    title: "Éducateur Academy",
    description: "Former les jeunes talents et transmettre la culture club.",
    hard_skills: ["Pédagogie football", "Détection", "Suivi scolaire", "LMS"],
    soft_skills: ["Transmission", "Patience", "Leadership", "Exigence"],
  },
  {
    id: "psg-metier-rh",
    title: "RH / People Club",
    description: "Développer l’engagement et les parcours internes du club.",
    hard_skills: ["GPEC", "Onboarding", "SIRH", "Entretiens"],
    soft_skills: ["Écoute", "Discrétion", "Influence", "Organisation"],
  },
  {
    id: "psg-metier-ops",
    title: "Operations matchday",
    description: "Sécuriser l’organisation des matchs et événements Parc des Princes.",
    hard_skills: ["Logistique", "Sécurité", "Coordination partenaires", "Planning"],
    soft_skills: ["Réactivité", "Stress management", "Collaboration", "Rigueur"],
  },
  {
    id: "psg-metier-commercial",
    title: "Hospitalité & partenariats",
    description: "Valoriser l’expérience VIP et les relations partenaires.",
    hard_skills: ["CRM", "Négociation", "Événementiel", "Relation client"],
    soft_skills: ["Relationnel", "Présentation", "Créativité", "Service"],
  },
] as const;

export const PSG_DEMO_FORMATIONS = {
  presentiel: [
    {
      id: "psg-sess-1",
      title: "Leadership staff technique",
      formateur: "Claire Moreau",
      date: new Date().toISOString().slice(0, 10),
      time: "09:00",
      status: "confirmee",
      confirmed: 14,
      total: 16,
    },
    {
      id: "psg-sess-2",
      title: "Communication de crise media",
      formateur: "Antoine Vidal",
      date: new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10),
      time: "14:00",
      status: "planifiee",
      confirmed: 9,
      total: 12,
    },
    {
      id: "psg-sess-3",
      title: "Mindset & récupération mentale",
      formateur: "Sara Benali",
      date: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
      time: "10:30",
      status: "planifiee",
      confirmed: 18,
      total: 20,
    },
  ],
  elearning: [
    {
      path_id: "psg-path-1",
      title: "Soft skills haute performance",
      enrolled: 48,
      completion_pct: 67,
      avg_quiz_score: 82,
      badges_count: 31,
    },
    {
      path_id: "psg-path-2",
      title: "Communication club & médias",
      enrolled: 36,
      completion_pct: 54,
      avg_quiz_score: 78,
      badges_count: 22,
    },
    {
      path_id: "psg-path-3",
      title: "Sécurité & protocoles matchday",
      enrolled: 28,
      completion_pct: 71,
      avg_quiz_score: 88,
      badges_count: 19,
    },
  ],
} as const;

const dayIso = (offset: number) =>
  new Date(Date.now() + offset * 86400000).toISOString().slice(0, 10);

const isoDaysAgo = (offset: number) =>
  new Date(Date.now() - offset * 86400000).toISOString();

/** Overview dashboard école PSG (demoecole@psg.fr). */
export function buildPsgEcoleDemoOverview() {
  const apprenants = [
    {
      id: "psg-ecole-app-1",
      first_name: "Noah",
      last_name: "Diallo",
      email: "noah.diallo@psg-academy.fr",
      role_type: "apprenant",
      class_name: "Academy U19 Performance",
      promo: "2025-2027",
      contract_status: "signé",
      soft_skills_scores: { Leadership: 74, Communication: 68, Résilience: 81 },
    },
    {
      id: "psg-ecole-app-2",
      first_name: "Inès",
      last_name: "Moreau",
      email: "ines.moreau@psg-academy.fr",
      role_type: "apprenant",
      class_name: "Bachelor Sport Business",
      promo: "2024-2027",
      contract_status: "recherche",
      soft_skills_scores: { Organisation: 79, Créativité: 72, Collaboration: 85 },
    },
    {
      id: "psg-ecole-app-3",
      first_name: "Lucas",
      last_name: "Bernard",
      email: "lucas.bernard@psg-academy.fr",
      role_type: "apprenant",
      class_name: "BTS NDRC Hospitalité",
      promo: "2025-2027",
      contract_status: "signé",
      soft_skills_scores: { Influence: 70, Écoute: 76, Adaptabilité: 73 },
    },
    {
      id: "psg-ecole-app-4",
      first_name: "Aya",
      last_name: "Benali",
      email: "aya.benali@psg-academy.fr",
      role_type: "apprenant",
      class_name: "Academy U19 Performance",
      promo: "2025-2027",
      contract_status: "recherche",
      soft_skills_scores: { Rigueur: 82, Curiosité: 77, Calme: 69 },
    },
    {
      id: "psg-ecole-app-5",
      first_name: "Enzo",
      last_name: "Petit",
      email: "enzo.petit@psg-academy.fr",
      role_type: "apprenant",
      class_name: "Licence Ops Matchday",
      promo: "2024-2026",
      contract_status: "en poste",
      soft_skills_scores: { Réactivité: 84, Collaboration: 78, Stress: 71 },
    },
    {
      id: "psg-ecole-app-6",
      first_name: "Léa",
      last_name: "Martin",
      email: "lea.martin@psg-academy.fr",
      role_type: "apprenant",
      class_name: "Bachelor Sport Business",
      promo: "2025-2028",
      contract_status: "recherche",
      soft_skills_scores: { Présentation: 75, Service: 80, Créativité: 66 },
    },
    {
      id: "psg-ecole-app-7",
      first_name: "Hugo",
      last_name: "Garcia",
      email: "hugo.garcia@psg-academy.fr",
      role_type: "apprenant",
      class_name: "BTS NDRC Hospitalité",
      promo: "2024-2026",
      contract_status: "signé",
      soft_skills_scores: { Relationnel: 83, Organisation: 70, Influence: 68 },
    },
    {
      id: "psg-ecole-app-8",
      first_name: "Sara",
      last_name: "Nguyen",
      email: "sara.nguyen@psg-academy.fr",
      role_type: "apprenant",
      class_name: "Licence Data Performance",
      promo: "2025-2028",
      contract_status: "recherche",
      soft_skills_scores: { Logique: 88, Rigueur: 85, Communication: 64 },
    },
  ];

  const entreprises = [
    {
      id: "psg-ecole-ent-1",
      first_name: "Paris",
      last_name: "Saint-Germain",
      email: "recrutement@psg.fr",
      role_type: "entreprise",
    },
    {
      id: "psg-ecole-ent-2",
      first_name: "Canal+",
      last_name: "Sport",
      email: "alternance@canalplus.fr",
      role_type: "entreprise",
    },
    {
      id: "psg-ecole-ent-3",
      first_name: "Decathlon",
      last_name: "Paris",
      email: "rh.paris@decathlon.com",
      role_type: "entreprise",
    },
  ];

  const latestOffers = [
    {
      id: "psg-ecole-offer-1",
      title: "Alternance Analyste performance Academy",
      city: "Paris 16e",
      salary: "80% SMIC",
      contract_type: "Alternance",
      status: "open",
      description: "GPS tracking, reporting KPI et vidéo analyse au centre de formation.",
      created_at: isoDaysAgo(1),
    },
    {
      id: "psg-ecole-offer-2",
      title: "Alternance Hospitalité VIP Parc des Princes",
      city: "Paris 16e",
      salary: "Selon profil",
      contract_type: "Alternance",
      status: "open",
      description: "Accueil partenaires, events matchday et relation client premium.",
      created_at: isoDaysAgo(3),
    },
    {
      id: "psg-ecole-offer-3",
      title: "Stage Ops matchday & sécurité",
      city: "Boulogne-Billancourt",
      salary: "Gratification",
      contract_type: "Stage",
      status: "open",
      description: "Coordination logistique, protocoles sécurité et planning J-7 / J+1.",
      created_at: isoDaysAgo(5),
    },
    {
      id: "psg-ecole-offer-4",
      title: "Alternance Sport Business & partenariats",
      city: "Paris",
      salary: "Selon grille",
      contract_type: "Alternance",
      status: "open",
      description: "CRM partenaires, activation sponsors et reporting commercial.",
      created_at: isoDaysAgo(8),
    },
  ];

  const latestConnected = apprenants.slice(0, 6).map((a, i) => ({
    ...a,
    updated_at: isoDaysAgo(i),
  }));

  const recentActivities = [
    {
      id: "psg-ecole-act-1",
      job_id: "psg-ecole-offer-1",
      talent_id: "psg-ecole-app-2",
      status: "pending",
      created_at: isoDaysAgo(0),
    },
    {
      id: "psg-ecole-act-2",
      job_id: "psg-ecole-offer-2",
      talent_id: "psg-ecole-app-6",
      status: "interview",
      created_at: isoDaysAgo(1),
    },
    {
      id: "psg-ecole-act-3",
      job_id: "psg-ecole-offer-1",
      talent_id: "psg-ecole-app-1",
      status: "signed",
      created_at: isoDaysAgo(2),
    },
    {
      id: "psg-ecole-act-4",
      job_id: "psg-ecole-offer-4",
      talent_id: "psg-ecole-app-7",
      status: "shortlist",
      created_at: isoDaysAgo(3),
    },
  ];

  return {
    apprenants,
    entreprises,
    latestOffers,
    latestConnected,
    recentActivities,
    offersCount: latestOffers.length + 4,
    effectifTotal: 42,
    alternancesSignees: 18,
    apprenantsEnRecherche: 14,
  };
}

/** Missions / badges dashboard apprenant PSG (demoapprenant@psg.fr). */
export function buildPsgApprenantDemoMissions() {
  return [
    {
      id: "psg-app-mission-1",
      title: "Diagnostic Soft Skills — finaliser",
      description: "Compléter le 3ᵉ axe pour débloquer le badge Profil comportemental EDGE.",
      due_date: dayIso(3),
      status: "in_progress",
      created_at: isoDaysAgo(5),
      updated_at: new Date().toISOString(),
    },
    {
      id: "psg-app-mission-2",
      title: "Parcours Soft skills haute performance — module 2",
      description: "Suivre le module e-learning et valider le quiz associé.",
      due_date: dayIso(8),
      status: "todo",
      created_at: isoDaysAgo(2),
      updated_at: new Date().toISOString(),
    },
    {
      id: "psg-app-mission-3",
      title: "Brief vidéo analyse Academy",
      description: "Préparer 3 clips de feedback pour la séance U19 de mercredi.",
      due_date: dayIso(2),
      status: "todo",
      created_at: isoDaysAgo(1),
      updated_at: new Date().toISOString(),
    },
    {
      id: "psg-app-mission-4",
      title: "Badge Communication club & médias",
      description: "Publier le badge obtenu sur le wallet et le profil LinkedIn.",
      due_date: dayIso(-1),
      status: "done",
      created_at: isoDaysAgo(12),
      updated_at: isoDaysAgo(2),
    },
  ];
}

export function buildPsgApprenantDemoBadges() {
  const share = (id: string) => `https://edgebs.fr/badgeclasses/${id}/criteria`;
  return {
    earnedOpenBadges: [
      {
        id: "psg-badge-comportemental",
        name: "Profil comportemental EDGE",
        imageUrl: null,
        level: 1,
        awardedAt: new Date().toISOString(),
        shareUrl: share("psg-badge-comportemental"),
        linkedInShareUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(share("psg-badge-comportemental"))}`,
      },
      {
        id: "psg-badge-communication",
        name: "Communication club & médias",
        imageUrl: null,
        level: 1,
        awardedAt: isoDaysAgo(10),
        shareUrl: share("psg-badge-communication"),
        linkedInShareUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(share("psg-badge-communication"))}`,
      },
      {
        id: "psg-badge-performance",
        name: "Data performance Academy",
        imageUrl: null,
        level: 2,
        awardedAt: isoDaysAgo(18),
        shareUrl: share("psg-badge-performance"),
        linkedInShareUrl: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(share("psg-badge-performance"))}`,
      },
    ],
    visibleOpenBadges: [
      {
        id: "psg-badge-leadership",
        name: "Leadership staff technique",
        imageUrl: null,
      },
      {
        id: "psg-badge-matchday",
        name: "Protocoles matchday",
        imageUrl: null,
      },
    ],
  };
}

export function buildPsgApprenantDemoParcours() {
  return {
    title: "Soft skills haute performance",
    href: "/dashboard/apprenant/parcours",
  };
}
