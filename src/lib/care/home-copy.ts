import { CARE_DOMAINS } from "@/lib/care/domains";

/** Textes d’accueil Byound Care (maquette Main.dc.html). */
export const CARE_HOME = {
  nav: {
    domaines: "Domaines",
    methode: "Méthode",
    praticiens: "Praticiens",
    devenir: "Devenir praticien",
    connexion: "Connexion",
  },
  audience: {
    particuliers: "Particuliers",
    entreprises: "Entreprises",
  },
  hero: {
    particuliers: {
      eyebrow: "Accompagnement fondé sur les neurosciences",
      title: "Comprendre comment vous fonctionnez.",
      lead: "Un bilan unique, un praticien certifié, un compagnon IA au quotidien — pour aller mieux et aller plus loin, dans tous les domaines de votre vie.",
      primary: "Faire mon bilan",
      secondary: "Trouver un praticien",
    },
    entreprises: {
      eyebrow: "Byound Care pour les entreprises",
      title: "La performance commence par la personne.",
      lead: "Un bilan pour vos collaborateurs, un réseau de praticiens certifiés, un tableau de bord RH agrégé et anonyme.",
      primary: "Demander une démo",
      secondary: "Voir l'offre",
    },
  },
  mocks: {
    bilanTitle: "Votre bilan Byound",
    practitionerLabel: "Votre praticienne",
    practitionerName: "Jessica Contentin",
    practitionerRole: "Psychopédagogue",
  },
  manifeste: {
    eyebrow: "Notre conviction",
    title: "On ne performe pas en pièces détachées.",
    lead: "Votre vie n'est pas compartimentée. Le stress, l'attention, la famille, le couple, la performance, la carrière — tout est relié.",
  },
  domaines: {
    eyebrow: "Six domaines de vie",
    title: "Un praticien pour chaque partie de votre vie.",
    cta: "Voir les praticiens",
    cards: [
      {
        id: CARE_DOMAINS[0].id,
        program: CARE_DOMAINS[0].program,
        name: CARE_DOMAINS[0].label,
        text: "Stress, rumination, charge mentale. Comprendre ce qui se joue, puis avancer.",
        practitioners: "Psychopédagogues · coachs certifiés",
      },
      {
        id: CARE_DOMAINS[1].id,
        program: CARE_DOMAINS[1].program,
        name: CARE_DOMAINS[1].label,
        text: "Attention, planification, TDAH. Des outils concrets pour tenir le rythme.",
        practitioners: "Psychopédagogues · neuroéducation",
      },
      {
        id: CARE_DOMAINS[2].id,
        program: CARE_DOMAINS[2].program,
        name: CARE_DOMAINS[2].label,
        text: "Parentalité, petite enfance, adolescents. Un cadre pour toute la famille.",
        practitioners: "Psychopédagogues · coachs parentaux",
        inverted: true,
      },
      {
        id: CARE_DOMAINS[3].id,
        program: CARE_DOMAINS[3].program,
        name: CARE_DOMAINS[3].label,
        text: "Communication, conflits, vie intime. Deux personnes, un même langage.",
        practitioners: "Praticiens couple · médiation",
      },
      {
        id: CARE_DOMAINS[4].id,
        program: CARE_DOMAINS[4].program,
        name: CARE_DOMAINS[4].label,
        text: "Sport, scène, haute exigence. Préparer le mental sans casser le corps.",
        practitioners: "Préparation mentale · coachs",
      },
      {
        id: CARE_DOMAINS[5].id,
        program: CARE_DOMAINS[5].program,
        name: CARE_DOMAINS[5].label,
        text: "Reconversion, orientation, prise de poste. Choisir la suite en conscience.",
        practitioners: "Orientation · transitions",
      },
    ],
  },
  methode: {
    title: "On mesure avant. On mesure après. Entre les deux, on vous accompagne.",
    steps: [
      {
        n: "01",
        title: "Bilan",
        text: "Un bilan unique, dans six domaines de vie. Vous voyez comment vous fonctionnez, pas seulement ce qui cloche.",
      },
      {
        n: "02",
        title: "Praticien certifié",
        text: "Un praticien du réseau, formé et badgeé, lit le bilan avec vous et pose un cadre clair.",
      },
      {
        n: "03",
        title: "Compagnon",
        text: "Entre les séances, un compagnon IA vous aide au quotidien. Il ne remplace pas l'humain.",
      },
      {
        n: "04",
        title: "Mesure",
        text: "On reprend les mêmes indicateurs. Vous voyez ce qui a bougé, et ce qui reste à travailler.",
        inverted: true,
      },
    ],
  },
  reseau: {
    title: "Pas un annuaire de coachs. Un réseau certifié.",
    guarantees: [
      "Une expérience de terrain exigée dans chaque domaine.",
      "Un socle commun en neuroéducation et une spécialisation, prouvés par des Open Badges vérifiables.",
      "Des relais cliniques — psychologues, médecins, orthophonistes — quand un diagnostic s'impose.",
    ],
    explorerTitle: "Explorer l'annuaire",
    explorerText: "Tous les praticiens certifiés, filtrés par domaine, format et public.",
    explorerCta: "Voir les praticiens",
  },
  entreprises: {
    eyebrow: "Byound Care Entreprises",
    title: "Vos équipes ne laissent pas leur vie au vestiaire.",
    lead: "Un accès au réseau pour vos collaborateurs. Un tableau de bord RH agrégé et anonyme pour vous. Aucune donnée individuelle n'est exposée.",
    cta: "Demander une démo",
    dashboardLabel: "Agrégé · anonyme",
    tiles: [
      { label: "Accompagnés", value: "128" },
      { label: "Évolution", value: "+18 %" },
      { label: "Satisfaction", value: "4,6 / 5" },
    ],
    barsTitle: "Domaines les plus sollicités",
    bars: [
      { label: "Émotions", value: 72 },
      { label: "Famille", value: 54 },
      { label: "Carrière", value: 41 },
    ],
    illustration: "Illustration — indicateurs réels à brancher",
  },
  formules: {
    eyebrow: "Particuliers",
    title: "Simple. Sans engagement.",
    featured: "Le plus choisi",
    choose: "Choisir",
  },
  devenir: {
    title: "Rejoignez le réseau Byound Care.",
    launch: {
      title: "Je me lance",
      text: "Vous certifiez votre pratique, vous rejoignez le réseau, vous recevez vos premières demandes.",
      cta: "Candidater",
    },
    cabinet: {
      title: "Je développe mon cabinet",
      text: "Vous avez déjà une clientèle. Byound Care vous apporte le bilan, le compagnon et la visibilité.",
      cta: "En savoir plus",
    },
  },
  finalCta: {
    title: "Tout commence par comprendre comment vous fonctionnez.",
    cta: "Faire mon bilan",
  },
  footer: {
    tagline: "Byound Business développe les compétences. Byound Care développe la personne.",
    helpline:
      "Byound Care ne remplace pas un suivi médical ou psychologique. En cas de détresse ou de pensées suicidaires, appelez le 3114, gratuit, 24 h/24. En cas d'urgence vitale, le 15 ou le 112.",
    columns: [
      {
        title: "Offre",
        links: [
          { href: "/care#domaines", label: "Domaines" },
          { href: "/care#methode", label: "Méthode" },
          { href: "/care/praticiens", label: "Praticiens" },
          { href: "/care#formules", label: "Formules" },
        ],
      },
      {
        title: "Entreprises",
        links: [
          { href: "/care#entreprises", label: "L'offre" },
          { href: "/care#entreprises", label: "Demander une démo" },
        ],
      },
      {
        title: "Réseau",
        links: [
          { href: "/care#devenir", label: "Devenir praticien" },
          { href: "/expert/register", label: "Candidater" },
          { href: "/login?from=/care", label: "Connexion" },
        ],
      },
    ],
  },
  demo: {
    title: "Demander une démo",
    submit: "Envoyer",
    success: "Message envoyé. Nous vous recontactons.",
    fields: {
      name: "Nom",
      company: "Entreprise",
      email: "E-mail",
      headcount: "Effectif",
      message: "Message",
    },
  },
} as const;
