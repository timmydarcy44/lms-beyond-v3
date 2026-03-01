"use client";

import type { GameState, KPIsState } from "../game-state/types";
import type { PricingFlags } from "../execution/pipeline";

export type ReactionSeverity = "LOW" | "MEDIUM" | "HIGH";

export type ReactionChannel = "FANS" | "BOARD" | "MEDIA" | "OPERATIONS";

export interface TurnReaction {
  id: string;
  title: string;
  body: string;
  channel: ReactionChannel;
  severity: ReactionSeverity;
}

interface ReactionInput {
  state: GameState;
  kpis: KPIsState;
  turnNumber: number;
  pricingFlags?: PricingFlags;
}

const SEVERITY_RANK: Record<ReactionSeverity, number> = {
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1,
};

export function generateTurnReactions({
  state,
  kpis,
  turnNumber,
  pricingFlags,
}: ReactionInput): TurnReaction[] {
  const reactions: TurnReaction[] = [];
  const merch = kpis.merchandising;
  const matchday = kpis.matchday;

  if (merch.jerseyRuptureSizes.length >= 3) {
    reactions.push({
      id: `fans-rupture-${turnNumber}`,
      channel: "FANS",
      severity: "HIGH",
      title: "Fans en colère : ruptures multiples",
      body:
        "Les supporters se plaignent : au moins trois tailles de maillot sont introuvables. Les messages sur les réseaux s’enchaînent et la boutique est débordée.",
    });
  }

  if (merch.jerseySurstockSizes.length >= 3) {
    reactions.push({
      id: `board-surstock-${turnNumber}`,
      channel: "BOARD",
      severity: "MEDIUM",
      title: "Board inquiet : surstock important",
      body:
        "La direction s'alarme : plusieurs tailles restent invendues et immobilisent de la trésorerie. On vous demande un plan de déstockage rapide.",
    });
  }

  if (merch.jerseyGrossMarginRate < 0.2) {
    reactions.push({
      id: `board-margin-${turnNumber}`,
      channel: "BOARD",
      severity: "MEDIUM",
      title: "Marge maillot jugée trop faible",
      body:
        "Le board souligne que la marge sur le maillot tombe sous les 20 %. Des ajustements prix/coût sont attendus pour redresser la rentabilité merchandising.",
    });
  }

  if (matchday.matchdayGrossProfit < 0) {
    reactions.push({
      id: `ops-matchday-loss-${turnNumber}`,
      channel: "OPERATIONS",
      severity: "HIGH",
      title: "Matchday déficitaire",
      body:
        "Les équipes opérations alertent : le matchday est déficitaire. Entre charges fixes et variable, la structure n'est pas couverte par les recettes billetterie.",
    });
  }

  if (matchday.matchdayVipCost > 0 && matchday.vipRevenueTotal < matchday.matchdayVipCost) {
    reactions.push({
      id: `board-vip-loss-${turnNumber}`,
      channel: "BOARD",
      severity: "MEDIUM",
      title: "Hospitalités déficitaires",
      body:
        "Malgré l'ouverture des loges, la recette VIP ne couvre pas les 75 k€ d'accueil. La direction attend des solutions (pricing, upsell ou fermeture partielle).",
    });
  } else if (matchday.vipGrossProfit > 0 && reactions.length < 4) {
    reactions.push({
      id: `board-vip-success-${turnNumber}`,
      channel: "BOARD",
      severity: "LOW",
      title: "Hospitalités rentables",
      body:
        "Bonne nouvelle : les loges et sièges VIP couvrent leurs coûts et dégagent un profit. Le board vous encourage à consolider cette dynamique.",
    });
  }

  if (pricingFlags?.jerseyPriceExtreme) {
    reactions.push({
      id: `board-jersey-price-${turnNumber}`,
      channel: "BOARD",
      severity: "HIGH",
      title: "Tarif maillot hors marché",
      body:
        "La direction estime que le prix maillot fixé est très éloigné des standards du marché. Un recalibrage est attendu avant les prochaines ventes.",
    });
  }

  if (pricingFlags?.ticketPriceExtreme) {
    reactions.push({
      id: `media-ticket-price-${turnNumber}`,
      channel: "MEDIA",
      severity: "MEDIUM",
      title: "Billetterie pointée du doigt",
      body:
        "Les médias locaux commentent un positionnement prix billetterie jugé extrême. Les supporters attendent des explications sur la stratégie tarifaire.",
    });
  }

  if (pricingFlags?.vipPriceExtreme) {
    reactions.push({
      id: `board-vip-price-${turnNumber}`,
      channel: "BOARD",
      severity: "MEDIUM",
      title: "Offre hospitalités contestée",
      body:
        "Le board considère que l’offre VIP/loges n’est pas réaliste face aux attentes des partenaires. Il faudra ajuster la proposition de valeur.",
    });
  }

  if (pricingFlags?.stadiumAdvertisingExtreme) {
    reactions.push({
      id: `media-stadium-ads-${turnNumber}`,
      channel: "MEDIA",
      severity: "MEDIUM",
      title: "Offres stade jugées mal positionnées",
      body:
        "Les médias locaux relèvent que vos tarifs LED/écran diffèrent fortement du marché (basket, rugby). Les partenaires s’interrogent sur la valeur délivrée.",
    });
  }

  if (pricingFlags?.socialAdvertisingExtreme) {
    reactions.push({
      id: `board-social-ads-${turnNumber}`,
      channel: "BOARD",
      severity: "MEDIUM",
      title: "Grille digitale contestée",
      body:
        "La direction note un écart important avec la concurrence sur vos packages réseaux sociaux. Un recalibrage est attendu pour rester compétitif.",
    });
  }

  const sorted = reactions
    .sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity])
    .slice(0, 4);

  return sorted;
}

