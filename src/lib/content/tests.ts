export const testsPage = {
  meta: {
    title: "Tests Soft Skills, IDMC et comportemental | Byound",
    description:
      "Trois tests pour savoir sur quoi faire progresser vos collaborateurs, comment les former efficacement et comment mieux travailler ensemble.",
  },
  /** Vue équipe. À confirmer par Darcy. Le texte reste aligné sur le choix de partage du collaborateur. */
  showTeamView: true,
  hero: {
    pill: "Tests Byound",
    title: "Comprenez vos équipes.",
    accent: "Formez juste.",
    text: "Trois tests pour savoir sur quoi faire progresser chacun, comment le former efficacement et comment mieux travailler ensemble.",
    primary: "Demander une démo",
    secondary: "Voir les tests",
    fanSummary:
      "Aperçus fictifs : Soft Skills au centre, IDMC à gauche, test comportemental à droite.",
  },
  questions: [
    { name: "Soft Skills", text: "Sur quoi faire progresser chacun ?" },
    { name: "IDMC", text: "Comment les former efficacement ?" },
    { name: "Comportemental", text: "Comment mieux travailler ensemble ?" },
  ],
  catalog: {
    title: "Trois tests.",
    accent: "Une vision complète.",
    soft: {
      title: "Sur quoi faire progresser chacun.",
      text: "Les compétences qui se voient dans le travail : écoute, organisation, prise de parole.",
      develop: { kicker: "À développer", title: "Prise de parole" },
      module: { kicker: "Module recommandé", title: "Convaincre en réunion", action: "Ajouter au parcours" },
    },
    idmc: {
      title: "Accélérer la montée en compétence.",
      text: "Comment chacun traite l'information et s'adapte. Pour choisir le bon format de formation et réussir les prises de poste.",
    },
    behavior: {
      title: "Mieux vendre, manager et collaborer.",
      text: "Le style de communication de chacun, pour ajuster la vente, le management et le travail à plusieurs.",
    },
    notes: [
      { title: "En ligne", text: "Chacun passe les tests depuis son téléphone ou son ordinateur." },
      { title: "Restitution claire", text: "Un profil lisible, avec les points forts et ce qui reste à travailler." },
      { title: "Relié aux parcours", text: "Les résultats orientent les modules proposés. Ils ne sortent pas du compte." },
    ],
  },
  skills: {
    title: "Mes 5 points forts",
    rows: [
      { label: "Écoute active", filled: 5 },
      { label: "Adaptabilité", filled: 5 },
      { label: "Collaboration", filled: 4 },
      { label: "Organisation", filled: 4 },
      { label: "Gestion du stress", filled: 3 },
    ],
    next: { kicker: "Prochaine étape", title: "Prise de parole" },
  },
  idmc: {
    title: "Ma façon de monter en compétence",
    format: "Format conseillé · Mise en situation",
    levels: {
      appui: { label: "Point d'appui", color: "#8DB8FF" },
      progres: { label: "En progrès", color: "#B5BAC6" },
      developper: { label: "À développer", color: "#F2CF6B" },
    },
    rows: [
      { name: "Attention", hint: "Rester concentré sur une tâche longue", filled: 4, level: "appui" as const },
      { name: "Raisonnement", hint: "Analyser et résoudre un problème nouveau", filled: 3, level: "progres" as const },
      { name: "Flexibilité", hint: "S'adapter à un changement de méthode", filled: 2, level: "progres" as const },
      { name: "Stratégies d'apprentissage", hint: "Organiser son propre apprentissage", filled: 1, level: "developper" as const },
    ],
  },
  behavior: {
    title: "Mon style de communication",
    cells: [
      { label: "Dominance", tone: "idle" as const },
      { label: "Influence", tone: "dominant" as const },
      { label: "Conformité", tone: "secondary" as const },
      { label: "Stabilité", tone: "idle" as const },
    ],
    reading: "Style dominant : Influence. Style secondaire : Conformité.",
  },
  team: {
    title: "La carte de votre équipe,",
    accent: "en un coup d'œil.",
    note: "Cette vue ne reprend que les profils que les collaborateurs ont choisi de partager avec leur entreprise. Chacun peut garder ses résultats privés.",
    summary:
      "Exemple fictif : équipe commerciale de 12 collaborateurs, 11 profils partagés. Styles, forces en ratios, trois formations suggérées.",
    board: {
      team: "Équipe commerciale · 12 collaborateurs · 11 profils complétés",
      export: "Exporter",
      stylesTitle: "Styles de communication",
      stylesNote: "L'échange domine : commencer par le lien avant la consigne.",
      counts: [
        { label: "Dominance", count: 2, tone: "idle" as const },
        { label: "Influence", count: 4, tone: "dominant" as const },
        { label: "Conformité", count: 3, tone: "secondary" as const },
        { label: "Stabilité", count: 2, tone: "idle" as const },
      ],
      forcesTitle: "Forces de l'équipe",
      forces: [
        { label: "Écoute active", filled: 9, total: 11 },
        { label: "Adaptabilité", filled: 8, total: 11 },
        { label: "Organisation", filled: 7, total: 11 },
        { label: "Prise de parole", filled: 5, total: 11 },
        { label: "Gestion du stress", filled: 4, total: 11 },
      ],
      planTitle: "Formations suggérées",
      plan: ["Convaincre en réunion", "Accueillir un changement de méthode", "Tenir une tâche longue"],
      planAction: "Créer le plan de formation",
    },
  },
  path: {
    title: "Du test à la compétence prouvée.",
    steps: [
      { n: "1", title: "Le test", text: "Soft Skills, IDMC ou test comportemental, en ligne." },
      { n: "2", title: "Le profil", text: "Une restitution claire, remise à la personne." },
      { n: "3", title: "Le parcours", text: "Des modules choisis à partir du profil." },
      { n: "4", title: "L'Open Badge", text: "La compétence prouvée. Les résultats du test n'y figurent pas." },
    ],
  },
  privacy: {
    title: "Des résultats qui restent privés.",
    points: [
      { title: "Jamais publics", text: "Un résultat de test ne s'affiche pas sur une page ouverte." },
      { title: "Jamais dans un badge", text: "Un Open Badge prouve une compétence, pas un résultat de test." },
      { title: "Restitués à la personne", text: "Chacun reçoit son profil et décide de le partager." },
      { title: "Pour orienter, pas pour trier", text: "Les tests servent à choisir une formation, pas à classer les personnes." },
    ],
  },
  cta: {
    title: "Testez avec votre équipe.",
    primary: "Demander une démo",
    secondary: "Passer un test",
  },
};
