export const openBadgesBusiness = {
  meta: {
    title: "Open Badges pour les entreprises | Byound",
    description:
      "Des badges numériques signés et vérifiables, qui prouvent les compétences de vos équipes. Évalués par des épreuves et validés par des experts métier.",
  },
  /** Même visibilité que la section experts de la home. */
  showExperts: true,
  /** À confirmer par Darcy. */
  exportEntretiens: false,
  /** Badge de démonstration public. Vide : le bouton d'exemple est masqué. */
  demoBadgeUrl: "",
  hero: {
    pill: "Open Badges pour les entreprises",
    title: "Rendez visible",
    accent: "l'invisible.",
    text: "Des badges numériques signés, vérifiables par n'importe qui, qui prouvent les compétences de vos équipes. Chaque badge est évalué, et validé par des experts métier.",
    primary: "Demander une démo",
    secondary: "Voir un badge vérifié",
    fanSummary:
      "Exemples de badges : Prospection B2B pour Hugo M., Négociation commerciale pour Camille R., IA appliquée au métier pour Inès B.",
    cards: [
      { titre: "Prospection B2B", titulaire: "Hugo M.", date: "Mars 2026", teinte: "#8FF2C4", place: "left" as const },
      { titre: "Négociation commerciale", titulaire: "Camille R.", date: "Mars 2026", teinte: "#F5C85C", place: "center" as const },
      { titre: "IA appliquée au métier", titulaire: "Inès B.", date: "Mars 2026", teinte: "#C9C2FF", place: "right" as const },
    ],
  },
  why: {
    title: "Une compétence qui ne se voit pas ne compte pas.",
    cards: [
      {
        title: "Valoriser les acquis",
        text: "Rendre visibles les compétences acquises sur le terrain et en formation.",
        dark: false,
      },
      {
        title: "Prouver, pas déclarer",
        text: "Un badge signé, vérifiable, rattaché à des critères et à des épreuves.",
        dark: true,
      },
      {
        title: "Renforcer votre marque employeur",
        text: "Des preuves de compétences qui rendent votre exigence visible.",
        dark: false,
      },
    ],
  },
  anatomy: {
    title: "Ce que contient un badge Byound.",
    summary:
      "Exemple : badge Négociation commerciale de Camille R., 3 compétences, 6 critères évalués sur 6, validation par un expert métier, signature valide.",
    badge: {
      titre: "Négociation commerciale",
      titulaire: "Camille R.",
      date: "Mars 2026",
      teinte: "#C9C2FF",
    },
    rows: [
      { label: "Titulaire", value: "Camille R." },
      { label: "Compétences", value: "3" },
      { label: "Critères évalués", value: "6 / 6" },
      { label: "Validation", value: "Expert métier" },
      { label: "Signature", value: "✓ Valide" },
    ],
    points: [
      { n: "1", title: "Le titulaire et la date", text: "Le nom de la personne et la date d'obtention." },
      { n: "2", title: "Les compétences", text: "2 à 5, issues de la bibliothèque Byound validée par des experts." },
      { n: "3", title: "Les critères", text: "Ce qui a été évalué, et le niveau attendu." },
      { n: "4", title: "Les épreuves", text: "Les preuves passées pour obtenir le badge." },
      { n: "5", title: "La validation", text: "Par un expert métier, par une IA contrôlée, ou automatiquement." },
      { n: "6", title: "La signature numérique", text: "Une signature qui permet à n'importe qui de vérifier l'authenticité." },
    ],
  },
  merit: {
    title: "Un badge se mérite.",
    proofs: [
      { title: "Questionnaire", text: "Des questions sur la compétence." },
      { title: "Étude de cas", text: "Un cas à traiter par écrit." },
      { title: "Mise en situation", text: "Une situation professionnelle à résoudre." },
      { title: "Réponse orale", text: "Une réponse à l'oral." },
      { title: "Vidéo", text: "Une preuve filmée." },
      { title: "Module interactif", text: "Un parcours à réaliser dans le module." },
    ],
    levelsTitle: "Trois niveaux de validation, au choix pour chaque badge",
    levels: [
      { title: "Validé par un expert", text: "Un expert métier évalue les preuves.", bars: 3, featured: true },
      { title: "IA contrôlée par expert", text: "L'IA pré-corrige, un expert contrôle un échantillon des badges délivrés.", bars: 2, featured: false },
      { title: "Évaluation automatique", text: "La correction suit une grille définie à l'avance.", bars: 1, featured: false },
    ],
  },
  experts: {
    title: "Validé par ceux qui pratiquent.",
    link: "Voir tous les experts ›",
  },
  pilot: {
    title: "Pilotez les compétences de vos équipes.",
    points: [
      { text: "Suivre les compétences réellement acquises", gated: false },
      { text: "Voir qui a obtenu quel badge", gated: false },
      { text: "Export pour vos entretiens annuels", gated: true },
    ],
    summary: "Exemple illustratif : équipe commerciale de 12 collaborateurs, négociation 4 sur 6, prospection 5 sur 6, IA 2 sur 6.",
    board: {
      team: "Équipe commerciale · 12 collaborateurs",
      pill: "+3 badges ce trimestre",
      skills: [
        { label: "Négociation", filled: 4, total: 6 },
        { label: "Prospection", filled: 5, total: 6 },
        { label: "IA", filled: 2, total: 6 },
      ],
    },
  },
  verify: {
    title: "Vérifiable en un clic, par n'importe qui.",
    text: "Chaque badge est signé numériquement par Byound et conforme au standard Open Badges 3.0. N'importe qui peut en vérifier l'authenticité.",
    note: "Les badges sont privés par défaut : c'est le titulaire qui choisit de les rendre publics. Les livrables ne sont visibles que par les entreprises connectées.",
    pill: "Authenticité vérifiée",
    rows: [
      { label: "Émis par", value: "Byound" },
      { label: "Signature numérique", value: "Valide" },
      { label: "Statut", value: "Non révoqué" },
      { label: "Standard", value: "Open Badges 3.0" },
    ],
    example: "Voir un exemple de badge",
  },
  steps: {
    title: "Lancé en trois étapes.",
    items: [
      { n: "01", title: "On définit le badge", text: "Compétences, critères et épreuves." },
      { n: "02", title: "Vos équipes passent les épreuves", text: "Questionnaire, cas, mise en situation, oral, vidéo ou module." },
      { n: "03", title: "Le badge est délivré", text: "Signé, vérifiable, privé par défaut." },
    ],
  },
  cta: {
    title: "Prêt à délivrer vos premiers badges ?",
    primary: "Demander une démo",
    secondary: "Parler à un conseiller",
  },
};
