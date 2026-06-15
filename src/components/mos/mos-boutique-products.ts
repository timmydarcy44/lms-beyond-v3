export type BoutiqueProduct = {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  badge?: "Nouveau" | "Meilleure vente" | "Promotions";
  category: "Maillots" | "Training" | "Lifestyle" | "Accessoires";
  gender: "Homme" | "Femme" | "Unisex";
  image: string;
  images?: string[];
  sizes: string[];
  featured?: boolean;
  longDescription: string;
  details: string[];
  shipping: string;
};

export const BOUTIQUE_PRODUCTS: BoutiqueProduct[] = [
  {
    id: "maillot-domicile-2026",
    name: "Maillot Domicile MOS 2026",
    description: "Maillot officiel rouge à rayures — Macron · Homme",
    price: 79,
    badge: "Nouveau",
    category: "Maillots",
    gender: "Homme",
    image: "/mos/boutique-maillot-2026.png",
    images: ["/mos/boutique-maillot-2026.png"],
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
    featured: true,
    longDescription:
      "Le maillot domicile officiel MOS Caen saison 2025/2026. Rouge éclatant à fines rayures verticales, écusson brodé et sponsor UNIK. Coupe confort Macron, tissu respirant pour le match comme pour les tribunes.",
    details: [
      "100 % polyester recyclé",
      "Écusson MOS brodé",
      "Macron Hero · Sponsor UNIK",
      "Flocage nom & numéro en option",
    ],
    shipping: "Livraison offerte dès 80 €. Retrait au club sous 48 h ou livraison à domicile sous 3 à 5 jours ouvrés.",
  },
  {
    id: "maillot-third-2026",
    name: "Maillot Third MOS 2026",
    description: "Maillot crème lifestyle — Macron · Femme",
    price: 85,
    badge: "Nouveau",
    category: "Maillots",
    gender: "Femme",
    image: "/mos/boutique-maillot-third.png",
    images: ["/mos/boutique-maillot-third.png"],
    sizes: ["XS", "S", "M", "L", "XL"],
    longDescription:
      "Le maillot third MOS en édition lifestyle. Crème à pinstripes, col et manches bordeaux, sponsor E.Leclerc. Une pièce versatile à porter sur le terrain ou en ville.",
    details: [
      "Coupe femme ajustée",
      "Écusson MOS et Macron",
      "Sponsor E.Leclerc Caen",
      "Entretien machine 30 °C",
    ],
    shipping: "Livraison offerte dès 80 €. Retrait au club sous 48 h.",
  },
  {
    id: "pack-lifestyle",
    name: "Pack Lifestyle MOS",
    description: "T-shirt & casquette noirs — Logo MOS brodé · Unisex",
    price: 65,
    originalPrice: 72,
    badge: "Promotions",
    category: "Lifestyle",
    gender: "Unisex",
    image: "/mos/boutique-lifestyle.png",
    images: ["/mos/boutique-lifestyle.png"],
    sizes: ["S", "M", "L", "XL"],
    longDescription:
      "Pack lifestyle MOS : t-shirt noir ton-sur-ton avec écusson relief et casquette six panels assortie. L'identité de la Maladrerie au quotidien.",
    details: [
      "T-shirt coton 100 % · 180 g",
      "Casquette ajustable",
      "Logo MOS brodé ton sur ton",
      "Unisex · Coupe regular",
    ],
    shipping: "Expédition sous 48 h. Retrait gratuit au club.",
  },
  {
    id: "polo-mos",
    name: "Polo MOS Caen",
    description: "Polo rouge coton piqué — Écusson officiel · Homme",
    price: 45,
    category: "Lifestyle",
    gender: "Homme",
    image: "/mos/boutique-polo.png",
    images: ["/mos/boutique-polo.png"],
    sizes: ["XS", "S", "M", "L", "XL", "2XL"],
    longDescription:
      "Polo rouge MOS Caen en coton piqué. Écusson officiel brodé sur le cœur, finitions tricolores au col. Idéal pour le quotidien et les événements du club.",
    details: [
      "Coton piqué 220 g",
      "Écusson MOS brodé",
      "Col 2 boutons · Bande tricolore",
      "Coupe regular homme",
    ],
    shipping: "Livraison 3 à 5 jours ouvrés. Retrait au club disponible.",
  },
];

export const BOUTIQUE_CATEGORIES = ["Maillots", "Training", "Lifestyle", "Accessoires"] as const;

export function getBoutiqueProduct(id: string): BoutiqueProduct | undefined {
  return BOUTIQUE_PRODUCTS.find((p) => p.id === id);
}

export function getBoutiqueProductIds(): string[] {
  return BOUTIQUE_PRODUCTS.map((p) => p.id);
}
