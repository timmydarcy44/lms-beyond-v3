import type { Metadata } from "next";
import { EDGE_MARKETING_PATHS as P } from "@/lib/edge-site/marketing-routes";

export type MarketingSection = {
  title: string;
  body: string;
};

export type MarketingCta = {
  label: string;
  href: string;
  variant?: "primary" | "secondary" | "white";
};

export type MarketingPageContent = {
  meta: { title: string; description: string };
  label?: string;
  hero: {
    title: string;
    subtitle: string;
    tone?: "dark" | "light";
  };
  sections: MarketingSection[];
  ctas?: MarketingCta[];
};

export function marketingMetadata(content: MarketingPageContent): Metadata {
  return {
    title: content.meta.title,
    description: content.meta.description,
  };
}

const DEFAULT_TAGLINE =
  "EDGE développe les compétences qui font la différence, grâce à des parcours concrets, une pédagogie active et une technologie propriétaire.";

function page(
  partial: MarketingPageContent & { meta: { title: string; description: string } },
): MarketingPageContent {
  return partial;
}

export const MARKETING_PAGES = {
  apprenants: page({
    meta: {
      title: "Apprenants — EDGE",
      description:
        "Formations concrètes, alternance et accompagnement pour construire votre avenir professionnel avec EDGE.",
    },
    label: "Apprenants",
    hero: {
      title: "Construisez votre avenir avec EDGE.",
      subtitle:
        "Des formations concrètes, pensées avec les entreprises, pour apprendre un métier, développer vos compétences et préparer votre insertion professionnelle.",
      tone: "dark",
    },
    sections: [
      {
        title: "Trouver une formation",
        body: "Parcours BTS, Bachelor, Mastère, bootcamps et formations en ligne — chaque programme est conçu avec des entreprises pour répondre aux besoins réels du marché.",
      },
      {
        title: "Comprendre l'alternance",
        body: "Alternez entreprises et formation pour acquérir une expérience terrain tout en validant vos compétences. Un rythme exigeant, des résultats concrets.",
      },
      {
        title: "Être accompagné",
        body: "Conseillers, mentors et équipes pédagogiques vous guident à chaque étape : orientation, admission, financement et insertion professionnelle.",
      },
      {
        title: "Construire son projet",
        body: "Clarifiez vos ambitions, identifiez vos forces et construisez un parcours aligné avec vos objectifs et les opportunités du marché.",
      },
      {
        title: "Se préparer au monde professionnel",
        body: "Livrables réels, certifications reconnues et mises en situation professionnelle pour entrer sur le marché avec confiance.",
      },
    ],
    ctas: [
      { label: "Trouver ma formation", href: P.formations, variant: "primary" },
      { label: "Candidater", href: P.admissions, variant: "white" },
    ],
  }),

  business: page({
    meta: {
      title: "Business — EDGE",
      description:
        "Formez vos équipes, créez une académie interne et pilotez les compétences avec EDGE.",
    },
    label: "Business",
    hero: {
      title: "Développez les compétences qui feront grandir votre organisation.",
      subtitle:
        "EDGE accompagne les entreprises dans la formation, la montée en compétences, le recrutement et le pilotage des talents.",
      tone: "dark",
    },
    sections: [
      {
        title: "Former vos équipes",
        body: "Des parcours sur mesure en présentiel, distanciel ou blended pour faire monter en compétences vos collaborateurs sur les métiers clés.",
      },
      {
        title: "Créer une académie interne",
        body: "Structurez votre politique de formation avec une académie d'entreprise clé en main : contenus, parcours, certifications et pilotage.",
      },
      {
        title: "Cartographier les compétences",
        body: "Identifiez les compétences présentes, les écarts à combler et les parcours adaptés pour chaque métier et chaque équipe.",
      },
      {
        title: "Recruter autrement",
        body: "Évaluez les compétences réelles, identifiez les talents et simplifiez vos processus de recrutement avec une approche orientée potentiel.",
      },
      {
        title: "Piloter les résultats",
        body: "Tableaux de bord, analytics et certifications pour mesurer l'impact de vos actions formation et ajuster votre stratégie.",
      },
    ],
    ctas: [
      { label: "Demander une démo", href: P.businessDemo, variant: "primary" },
      { label: "Parler à un conseiller", href: P.contact, variant: "white" },
    ],
  }),

  formateursExperts: page({
    meta: {
      title: "Formateurs & Experts — EDGE",
      description: "Rejoignez l'écosystème EDGE et intervenez sur des parcours structurés et orientés impact.",
    },
    label: "Formateurs / Experts",
    hero: {
      title: "Rejoignez l'écosystème EDGE.",
      subtitle:
        "Vous êtes formateur, consultant ou expert métier ? Intervenez sur des parcours structurés, exigeants et orientés impact.",
      tone: "dark",
    },
    sections: [
      {
        title: "Pourquoi rejoindre EDGE",
        body: "Intégrez un réseau exigeant qui valorise l'expertise terrain, la pédagogie active et l'impact mesurable sur les apprenants et les organisations.",
      },
      {
        title: "Les profils recherchés",
        body: "Formateurs, consultants et experts métier en management, vente, communication, IA, RH et domaines innovants — avec une expérience concrète à partager.",
      },
      {
        title: "Notre méthode pédagogique",
        body: "Parcours orientés livrables, mises en situation réelles et évaluation par les compétences. La théorie sert la pratique, pas l'inverse.",
      },
      {
        title: "Le processus de sélection",
        body: "Candidature en ligne, entretien, validation pédagogique et intégration progressive sur des missions adaptées à votre profil.",
      },
      {
        title: "Créer son espace expert",
        body: "Accédez à votre tableau de bord, gérez vos interventions, vos supports et votre certification interne EDGE.",
      },
    ],
    ctas: [{ label: "Créer mon compte expert", href: P.expertSignup, variant: "primary" }],
  }),

  formations: page({
    meta: { title: "Formations — EDGE", description: DEFAULT_TAGLINE },
    label: "Formations",
    hero: {
      title: "Des formations pensées pour les métiers d'avenir.",
      subtitle:
        "BTS, Bachelor, Mastère, bootcamps et parcours en ligne — des programmes conçus avec les entreprises.",
      tone: "dark",
    },
    sections: [
      {
        title: "Une offre complète",
        body: "De la formation initiale à la formation continue, EDGE propose des parcours adaptés à chaque ambition et chaque niveau.",
      },
      {
        title: "Pédagogie active",
        body: "Projets réels, alternance, workshops et certifications pour apprendre en faisant.",
      },
    ],
    ctas: [{ label: "Trouver ma formation", href: P.formations, variant: "primary" }],
  }),

  formationsBts: page({
    meta: { title: "BTS — EDGE", description: "Parcours BTS en alternance avec EDGE." },
    label: "BTS",
    hero: {
      title: "BTS — apprenez un métier en alternance.",
      subtitle: "Des diplômes reconnus, une immersion en entreprise et un accompagnement personnalisé.",
      tone: "dark",
    },
    sections: [
      { title: "Alternance", body: "Rythme entreprise / centre de formation pour une montée en compétences rapide." },
      { title: "Insertion", body: "Des parcours connectés aux besoins des recruteurs et des secteurs qui recrutent." },
    ],
    ctas: [{ label: "Candidater", href: P.admissions, variant: "primary" }],
  }),

  formationsBachelor: page({
    meta: { title: "Bachelor — EDGE", description: "Bachelor professionnalisant EDGE." },
    label: "Bachelor",
    hero: {
      title: "Bachelor — construisez votre expertise métier.",
      subtitle: "Un diplôme professionnalisant, des projets concrets et une forte employabilité.",
      tone: "dark",
    },
    sections: [
      { title: "Programme", body: "Compétences métier, soft skills et expérience terrain au cœur du parcours." },
    ],
    ctas: [{ label: "Candidater", href: P.admissions, variant: "primary" }],
  }),

  formationsMastere: page({
    meta: { title: "Mastère — EDGE", description: "Mastère spécialisé EDGE." },
    label: "Mastère",
    hero: {
      title: "Mastère — devenez expert de votre domaine.",
      subtitle: "Un niveau d'excellence pour les profils ambitieux visant des postes à responsabilité.",
      tone: "dark",
    },
    sections: [
      { title: "Excellence", body: "Parcours exigeants, intervenants experts et projets à fort impact business." },
    ],
    ctas: [{ label: "Candidater", href: P.admissions, variant: "primary" }],
  }),

  alternance: page({
    meta: { title: "Alternance — EDGE", description: "Comprendre et intégrer l'alternance avec EDGE." },
    label: "Alternance",
    hero: {
      title: "L'alternance, le meilleur accélérateur de compétences.",
      subtitle: "Apprenez en entreprise, validez en formation, entrez sur le marché avec de l'expérience.",
      tone: "dark",
    },
    sections: [
      { title: "Comment ça marche", body: "Contrat d'apprentissage ou de professionnalisation, rythme adapté et suivi personnalisé." },
      { title: "Trouver une entreprise", body: "EDGE vous accompagne dans la recherche et la préparation aux entretiens." },
    ],
    ctas: [{ label: "En savoir plus", href: P.contact, variant: "primary" }],
  }),

  admissions: page({
    meta: { title: "Admissions — EDGE", description: "Processus d'admission EDGE." },
    label: "Admissions",
    hero: {
      title: "Intégrez EDGE.",
      subtitle: "Un processus d'admission clair, humain et orienté projet pour trouver le parcours qui vous correspond.",
      tone: "dark",
    },
    sections: [
      { title: "Étapes", body: "Candidature en ligne, entretien de motivation, validation du projet et confirmation d'admission." },
    ],
    ctas: [{ label: "Candidater", href: P.admissions, variant: "primary" }],
  }),

  financement: page({
    meta: { title: "Financement — EDGE", description: "Solutions de financement des études EDGE." },
    label: "Financement",
    hero: {
      title: "Financez votre parcours.",
      subtitle: "Alternance, OPCO, aides régionales et solutions de paiement — nous vous guidons.",
      tone: "dark",
    },
    sections: [
      { title: "Alternance rémunérée", body: "En alternance, vous êtes rémunéré tout en vous formant." },
      { title: "Accompagnement", body: "Nos équipes vous aident à monter vos dossiers de financement." },
    ],
    ctas: [{ label: "Nous contacter", href: P.contact, variant: "primary" }],
  }),

  vieEtudiante: page({
    meta: { title: "Vie étudiante — EDGE", description: "La vie étudiante chez EDGE." },
    label: "Vie étudiante",
    hero: {
      title: "Une expérience étudiante exigeante et enrichissante.",
      subtitle: "Communauté, événements, entraide et projets collectifs au service de votre progression.",
      tone: "dark",
    },
    sections: [
      { title: "Communauté", body: "Rejoignez une communauté d'apprenants motivés et ambitieux." },
    ],
    ctas: [{ label: "Découvrir les formations", href: P.formations, variant: "primary" }],
  }),

  certifications: page({
    meta: { title: "Certifications — EDGE", description: "Certifications et Open Badges EDGE." },
    label: "Certifications",
    hero: {
      title: "Valorisez vos compétences.",
      subtitle: "Certifications reconnues et Open Badges pour attester de vos acquis de manière crédible.",
      tone: "dark",
    },
    sections: [
      { title: "Reconnaissance", body: "Des certifications alignées sur les standards du marché et les besoins entreprises." },
    ],
    ctas: [{ label: "Voir les parcours", href: P.formations, variant: "primary" }],
  }),

  businessSolutions: page({
    meta: { title: "Solutions entreprise — EDGE", description: DEFAULT_TAGLINE },
    label: "Solutions",
    hero: { title: "Des solutions complètes pour vos enjeux RH et formation.", subtitle: DEFAULT_TAGLINE, tone: "dark" },
    sections: [{ title: "Sur mesure", body: "Formation, compétences, recrutement et pilotage — une approche intégrée." }],
    ctas: [{ label: "Demander une démo", href: P.businessDemo, variant: "primary" }],
  }),

  businessFormations: page({
    meta: { title: "Formations entreprise — EDGE", description: DEFAULT_TAGLINE },
    label: "Formations entreprise",
    hero: { title: "Formez vos équipes sur les compétences clés.", subtitle: "Management, vente, IA, communication, RH.", tone: "dark" },
    sections: [{ title: "Catalogue", body: "Parcours modulaires ou sur mesure, en présentiel ou distanciel." }],
    ctas: [{ label: "Demander une démo", href: P.businessDemo, variant: "primary" }],
  }),

  businessAcademie: page({
    meta: { title: "Académie interne — EDGE", description: DEFAULT_TAGLINE },
    label: "Académie interne",
    hero: { title: "Créez votre académie d'entreprise.", subtitle: "Structurez, déployez et pilotez la montée en compétences.", tone: "dark" },
    sections: [{ title: "Clé en main", body: "Contenus, parcours, certifications et tableaux de bord intégrés." }],
    ctas: [{ label: "Demander une démo", href: P.businessDemo, variant: "primary" }],
  }),

  businessCompetences: page({
    meta: { title: "Gestion des compétences — EDGE", description: DEFAULT_TAGLINE },
    label: "Gestion des compétences",
    hero: { title: "Cartographiez et développez les compétences.", subtitle: "Identifiez les écarts, construisez les parcours, mesurez les progrès.", tone: "dark" },
    sections: [{ title: "Pilotage", body: "Une vision claire des compétences présentes et à développer." }],
    ctas: [{ label: "Demander une démo", href: P.businessDemo, variant: "primary" }],
  }),

  businessRecrutement: page({
    meta: { title: "Recrutement — EDGE", description: DEFAULT_TAGLINE },
    label: "Recrutement",
    hero: { title: "Recrutez par les compétences.", subtitle: "Évaluez le potentiel, pas seulement le CV.", tone: "dark" },
    sections: [{ title: "Talents", body: "Accédez à un vivier qualifié et des outils d'évaluation fiables." }],
    ctas: [{ label: "Demander une démo", href: P.businessDemo, variant: "primary" }],
  }),

  businessCasClients: page({
    meta: { title: "Cas clients — EDGE", description: DEFAULT_TAGLINE },
    label: "Cas clients",
    hero: { title: "Ils nous font confiance.", subtitle: "Découvrez comment des organisations développent leurs talents avec EDGE.", tone: "dark" },
    sections: [{ title: "Impact", body: "Des résultats mesurables en formation, compétences et insertion." }],
    ctas: [{ label: "Demander une démo", href: P.businessDemo, variant: "primary" }],
  }),

  businessDemo: page({
    meta: { title: "Demander une démo — EDGE", description: DEFAULT_TAGLINE },
    label: "Démo",
    hero: { title: "Découvrez EDGE en action.", subtitle: "Échangez avec un conseiller et explorez les solutions adaptées à votre organisation.", tone: "dark" },
    sections: [{ title: "Sur mesure", body: "Une démonstration personnalisée selon vos enjeux et votre secteur." }],
    ctas: [{ label: "Nous contacter", href: P.contact, variant: "primary" }],
  }),

  online: page({
    meta: { title: "EDGE Online", description: "Formations en ligne EDGE." },
    label: "Online",
    hero: { title: "Apprenez où vous voulez, progressez à votre rythme.", subtitle: "Parcours en ligne exigeants, interactifs et orientés résultats.", tone: "dark" },
    sections: [{ title: "Flexibilité", body: "E-learning, bootcamps et certifications accessibles partout." }],
    ctas: [{ label: "Voir les formations", href: P.onlineFormations, variant: "primary" }],
  }),

  onlineFormations: page({
    meta: { title: "Formations en ligne — EDGE", description: DEFAULT_TAGLINE },
    label: "Formations en ligne",
    hero: { title: "Des parcours en ligne qui transforment.", subtitle: "Contenus premium, exercices pratiques et suivi personnalisé.", tone: "dark" },
    sections: [{ title: "Qualité", body: "La même exigence pédagogique qu'en présentiel, dans un format flexible." }],
    ctas: [{ label: "Découvrir", href: P.online, variant: "primary" }],
  }),

  onlineBootcamps: page({
    meta: { title: "Bootcamps — EDGE", description: DEFAULT_TAGLINE },
    label: "Bootcamps",
    hero: { title: "Bootcamps intensifs, compétences concrètes.", subtitle: "Immersion rapide sur des métiers porteurs.", tone: "dark" },
    sections: [{ title: "Intensif", body: "Programmes courts et exigeants pour une montée en compétences accélérée." }],
    ctas: [{ label: "Candidater", href: P.admissions, variant: "primary" }],
  }),

  onlineCertifications: page({
    meta: { title: "Certifications en ligne — EDGE", description: DEFAULT_TAGLINE },
    label: "Certifications en ligne",
    hero: { title: "Certifiez vos compétences en ligne.", subtitle: "Open Badges et certifications reconnues.", tone: "dark" },
    sections: [{ title: "Crédibilité", body: "Valorisez vos acquis auprès des employeurs." }],
    ctas: [{ label: "Voir les parcours", href: P.onlineFormations, variant: "primary" }],
  }),

  aPropos: page({
    meta: { title: "À propos — EDGE", description: DEFAULT_TAGLINE },
    label: "À propos",
    hero: { title: "EDGE, la formation qui développe les compétences qui comptent.", subtitle: DEFAULT_TAGLINE, tone: "dark" },
    sections: [
      { title: "Notre conviction", body: "Les entreprises recherchent des compétences, pas seulement des diplômes. EDGE forme aux deux." },
      { title: "Notre approche", body: "Parcours concrets, pédagogie active, technologie au service de l'apprentissage." },
    ],
    ctas: [{ label: "Notre mission", href: P.notreMission, variant: "primary" }],
  }),

  notreMission: page({
    meta: { title: "Notre mission — EDGE", description: DEFAULT_TAGLINE },
    label: "Notre mission",
    hero: { title: "Développons les compétences qui feront la différence demain.", subtitle: DEFAULT_TAGLINE, tone: "dark" },
    sections: [
      { title: "Mission", body: "Accompagner apprenants et organisations vers l'excellence par les compétences." },
    ],
    ctas: [{ label: "Découvrir EDGE", href: P.decouvrir, variant: "primary" }],
  }),

  ressources: page({
    meta: { title: "Ressources — EDGE", description: "Blog, guides et webinaires EDGE." },
    label: "Ressources",
    hero: { title: "Ressources pour apprendre et progresser.", subtitle: "Articles, guides pratiques et webinaires.", tone: "light" },
    sections: [
      { title: "Blog", body: "Actualités formation, compétences et tendances marché.", },
      { title: "Guides", body: "Guides pratiques pour apprenants et entreprises." },
    ],
    ctas: [{ label: "Lire le blog", href: P.blog, variant: "primary" }],
  }),

  blog: page({
    meta: { title: "Blog — EDGE", description: "Le blog EDGE." },
    label: "Blog",
    hero: { title: "Blog EDGE", subtitle: "Compétences, formation et avenir du travail.", tone: "light" },
    sections: [{ title: "Bientôt", body: "Nos premiers articles arrivent prochainement." }],
  }),

  guides: page({
    meta: { title: "Guides — EDGE", description: "Guides EDGE." },
    label: "Guides",
    hero: { title: "Guides pratiques", subtitle: "Ressources pour réussir votre parcours.", tone: "light" },
    sections: [{ title: "Catalogue", body: "Guides alternance, financement, insertion et plus." }],
  }),

  webinaires: page({
    meta: { title: "Webinaires — EDGE", description: "Webinaires EDGE." },
    label: "Webinaires",
    hero: { title: "Webinaires & événements", subtitle: "Sessions en ligne pour découvrir EDGE et échanger avec nos experts.", tone: "light" },
    sections: [{ title: "Prochains événements", body: "Inscrivez-vous à nos prochains webinaires." }],
    ctas: [{ label: "Nous contacter", href: P.contact, variant: "primary" }],
  }),

  tarifs: page({
    meta: { title: "Tarifs — EDGE", description: "Tarifs et financement EDGE." },
    label: "Tarifs",
    hero: { title: "Investissez dans vos compétences.", subtitle: "Des tarifs transparents et des solutions de financement adaptées.", tone: "light" },
    sections: [{ title: "Sur devis", body: "Contactez-nous pour un devis personnalisé selon votre parcours ou votre organisation." }],
    ctas: [{ label: "Nous contacter", href: P.contact, variant: "primary" }],
  }),

  contact: page({
    meta: { title: "Contact — EDGE", description: "Contactez EDGE." },
    label: "Contact",
    hero: { title: "Parlons de votre projet.", subtitle: "Une question sur nos formations, nos solutions entreprise ou le réseau experts ? Écrivez-nous.", tone: "light" },
    sections: [
      { title: "Apprenants", body: "Orientation, admissions, financement — notre équipe vous répond sous 48h." },
      { title: "Entreprises", body: "Démo, devis, partenariat — échangez avec un conseiller dédié." },
    ],
    ctas: [
      { label: "Trouver ma formation", href: P.formations, variant: "primary" },
      { label: "Demander une démo", href: P.businessDemo, variant: "secondary" },
    ],
  }),
} as const satisfies Record<string, MarketingPageContent>;

export type MarketingPageKey = keyof typeof MARKETING_PAGES;

export function getMarketingContent(key: MarketingPageKey): MarketingPageContent {
  return MARKETING_PAGES[key];
}
