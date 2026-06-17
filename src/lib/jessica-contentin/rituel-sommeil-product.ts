export const RITUEL_SOMMEIL_IMAGES = [
  {
    url: "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/jessica%20contentin/Carte%20rituel%20du%20sommeil%20eco.png",
    alt: "Jeu de cartes Rituel du sommeil — emballage écologique",
  },
  {
    url: "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/jessica%20contentin/carte%20rituel%20du%20sommeil.png",
    alt: "Jeu de cartes Rituel du sommeil — boîte et cartes illustrées",
  },
] as const;

/** @deprecated Utiliser RITUEL_SOMMEIL_IMAGES */
export const RITUEL_SOMMEIL_IMAGE_URL = RITUEL_SOMMEIL_IMAGES[1].url;

export const RITUEL_SOMMEIL_PRODUCT = {
  title: "Rituel du sommeil",
  shortDescription:
    "Un jeu de cartes pour transformer le coucher en moment de lien. Chaque soir, votre enfant tire une carte et vous partagez une activité douce ensemble — sans écran, sans pression.",
  longDescription:
    "Le coucher peut être une source de tension. Ce jeu transforme ce moment en rituel positif : l'enfant tire une carte, le parent lit l'activité et vous vivez ensemble un instant privilégié. Chaque carte propose une action concrète, réalisable en quelques minutes : raconter une histoire, construire une cabane, un massage des pieds ou des mains, une respiration calme… 12 activités pour varier les soirées et créer une habitude apaisante que l'enfant attend avec plaisir.",
  details: [
    "Jeu de cartes illustré — boîte et cartes de qualité",
    "12 activités pour les soirées",
    "Adapté aux enfants de 3 à 11 ans",
    "Conçu par Jessica Contentin, psychopédagogue",
    "Idéal en cadeau pour les jeunes parents",
  ],
  shipping:
    "Expédition en France métropolitaine sous 5 à 7 jours ouvrés. Retrait possible sur rendez-vous au cabinet de Bretteville-sur-Odon (Caen). Les frais de port sont calculés à l'étape de paiement.",
  activityCount: 12,
  defaultPrice: 24.9,
} as const;

export type RituelSommeilProductData = {
  catalogItemId: string | null;
  contentId: string | null;
  price: number;
  stripeCheckoutUrl: string | null;
  isFree: boolean;
};
