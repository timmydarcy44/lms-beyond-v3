"use client";

import {
  GameState,
  JerseySize,
  KPIsState,
  JERSEY_SIZES,
} from "../game-state/types";

export interface GameMasterFeedback {
  summary: string;
  supportersFeedback: string;
  managementFeedback: string;
  brandFeedback: string;
  sizeAlerts: string[];
  keyTakeaway: string;
}

type FeedbackInput = {
  gameState: GameState;
  kpis: KPIsState;
  turnNumber: number;
  turnTitle: string;
};

const MAX_ALERTS = 5;

function formatSizeList(sizes: JerseySize[]): string {
  if (sizes.length === 0) {
    return "";
  }
  if (sizes.length === 1) {
    return sizes[0];
  }
  const allButLast = sizes.slice(0, -1).join(", ");
  const last = sizes[sizes.length - 1];
  return `${allButLast} et ${last}`;
}

function formatPoints(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)} pt${Math.abs(value) >= 2 ? "s" : ""}`;
}

export function generateGameMasterFeedback(input: FeedbackInput): GameMasterFeedback {
  const { gameState, kpis, turnTitle } = input;
  const merchandising = kpis.merchandising;
  const transverse = kpis.transverse;
  const matchday = kpis.matchday;

  const hasRupture = merchandising.jerseyRupture;
  const hasSurstock = merchandising.jerseySurstock;
  const ruptureSizes = merchandising.jerseyRuptureSizes;
  const surstockSizes = merchandising.jerseySurstockSizes;

  const fansDelta = transverse.fansDeltaThisTurn ?? 0;
  const brandDelta = transverse.brandDeltaThisTurn ?? 0;
  const cashDelta = transverse.cashDeltaThisTurn ?? 0;
  const inventoryValue = merchandising.jerseyInventoryValue;
  const jerseyMarginRate = merchandising.jerseyGrossMarginRate;
  const jerseyPrice = merchandising.jerseyPrice;
  const unitsSold = merchandising.jerseyUnitsSold;
  const stockInitial = merchandising.jerseyStockInitial || 1;
  const matchdayProfit = matchday?.matchdayGrossProfit ?? 0;
  const matchdayMargin = matchday?.matchdayGrossMarginRate ?? 0;
  const matchdayRevenue = matchday?.ticketRevenuePerMatch ?? 0;
  const matchdayTotalCost = matchday?.matchdayTotalCost ?? 0;
  const matchdayVipCostApplied = (matchday?.matchdayVipCost ?? 0) > 0;

  const summary = hasRupture
    ? "La demande a dépassé tes prévisions dès le lancement. Le succès commercial est réel, mais mal anticipé."
    : hasSurstock
      ? "La production a largement dépassé la demande. Les ventes existent, mais une partie du stock reste immobilisée."
      : "Les ventes et la production sont globalement alignées sur ce tour.";

  const supportersParts: string[] = [];
  if (ruptureSizes.length > 0) {
    supportersParts.push(
      `Rupture sur ${ruptureSizes.length > 1 ? "les tailles" : "la taille"} ${formatSizeList(
        ruptureSizes,
      )} : les supporters concernés repartent frustrés.`,
    );
  }
  if (fansDelta < -0.25) {
    supportersParts.push(
      `L'indice supporters recule (${formatPoints(fansDelta)}), signe d'un mécontentement latent.`,
    );
  } else if (fansDelta > 0.25) {
    supportersParts.push(
      `Les fans apprécient l'initiative (${formatPoints(fansDelta)} sur l'indice supporters).`,
    );
  }
  if (supportersParts.length === 0) {
    supportersParts.push(
      "Les supporters perçoivent ce lancement comme cohérent : pas de mouvement notable dans leur indice de confiance.",
    );
  }
  const supportersFeedback = supportersParts.join(" ");

  const managementParts: string[] = [];
  const cashDeltaAbs = Math.abs(cashDelta);
  if (hasSurstock || inventoryValue > 0) {
    if (inventoryValue > Math.max(gameState.cash, 1) * 0.3) {
      managementParts.push(
        "Une part importante de la trésorerie reste immobilisée en stock : la direction s'inquiète de la rotation des produits.",
      );
    } else if (hasSurstock) {
      managementParts.push(
        "La production dépasse la demande : il faudra écouler le surplus sans casser la marge.",
      );
    }
  }
  if (jerseyMarginRate > 0.35) {
    managementParts.push(
      "La marge brute par maillot reste confortable : le positionnement prix est pertinent.",
    );
  } else if (jerseyMarginRate < 0) {
    managementParts.push(
      "La marge maillot devient négative : la politique tarifaire doit être réévaluée rapidement.",
    );
  }
  if (matchdayProfit < 0) {
    managementParts.push(
      "Le matchday est déficitaire : les recettes billetterie ne couvrent pas les coûts d’exploitation.",
    );
  } else if (matchdayRevenue > 0 && matchdayProfit > 0 && matchdayMargin < 0.1) {
    managementParts.push(
      "Les coûts d’accueil rongent la rentabilité matchday : la direction attend une optimisation des loges et services.",
    );
  }
  if (matchdayVipCostApplied) {
    managementParts.push(
      "Les loges VIP engagent un coût fixe important : chaque soirée doit être valorisée auprès des partenaires.",
    );
  }
  if (cashDelta < -1000 && cashDeltaAbs > 0.01) {
    managementParts.push(
      "La trésorerie recule sur ce tour : la direction attend un plan pour réinjecter du cash rapidement.",
    );
  }
  if (managementParts.length === 0) {
    managementParts.push(
      "La direction note une exécution maîtrisée : les flux financiers restent sous contrôle.",
    );
  }
  const managementFeedback = managementParts.join(" ");

  const brandParts: string[] = [];
  const premiumPositioning = jerseyPrice >= 70;
  const conversionRate = stockInitial > 0 ? unitsSold / stockInitial : 0;
  if (brandDelta < -0.25) {
    brandParts.push(
      `L'image de marque souffre (${formatPoints(brandDelta)}), certains publics doutent de la promesse délivrée.`,
    );
  } else if (brandDelta > 0.25) {
    brandParts.push(
      `L'image progresse (${formatPoints(brandDelta)}) : la narration autour du maillot fonctionne.`,
    );
  } else {
    brandParts.push("La perception de la marque reste stable : à toi de choisir la prochaine impulsion.");
  }
  if (premiumPositioning && conversionRate < 0.4) {
    brandParts.push(
      "Le positionnement premium limite l'adoption : sans histoire forte, le public cible reste étroit.",
    );
  }
  const brandFeedback = brandParts.join(" ");

  const sizeAlerts: string[] = [];
  if (ruptureSizes.length > 0) {
    sizeAlerts.push(
      `Rupture de stock sur les tailles ${formatSizeList(
        ruptureSizes,
      )} : frustration immédiate en boutique.`,
    );
  }
  if (surstockSizes.length > 0) {
    sizeAlerts.push(
      `Surstock important sur les tailles ${formatSizeList(
        surstockSizes,
      )} : mauvaise adéquation avec la demande.`,
    );
  }

  const indexedSizes = JERSEY_SIZES.filter((size) => sizeAlerts.length < MAX_ALERTS)
    .map((size) => ({
      size,
      remaining: merchandising.jerseyStockBySizeRemaining[size] ?? 0,
      initial: merchandising.jerseyStockBySizeInitial[size] ?? 0,
    }))
    .filter(({ remaining, initial }) => initial > 0 && remaining / initial > 0.6);

  indexedSizes.slice(0, MAX_ALERTS - sizeAlerts.length).forEach(({ size, remaining }) => {
    sizeAlerts.push(
      `Stock encore élevé sur la taille ${size} (${remaining} pièces) : planifie une action ciblée.`,
    );
  });

  const trimmedAlerts = sizeAlerts.slice(0, MAX_ALERTS);

  let keyTakeaway: string;
  if (ruptureSizes.length > 0 && surstockSizes.length > 0) {
    keyTakeaway = "Le volume total ne suffit pas : la répartition par taille est décisive.";
  } else if (matchdayProfit < 0) {
    keyTakeaway =
      "Vos soirées matchday perdent de l’argent : revisitez la billetterie et l’offre VIP pour couvrir les coûts.";
  } else if (ruptureSizes.length > 0) {
    keyTakeaway = "Une bonne marge ne compense pas une mauvaise anticipation de la demande par taille.";
  } else if (surstockSizes.length > 0) {
    keyTakeaway = "Produire plus n’est pas toujours vendre mieux : ajuste finement ton mix tailles.";
  } else if (cashDelta < 0 && jerseyMarginRate > 0.3) {
    keyTakeaway = "Préserve la marge tout en sécurisant la trésorerie pour financer le tour suivant.";
  } else {
    keyTakeaway =
      "Anticipe le prochain tour en alignant prix, volumes et promesse de marque pour tenir le cap.";
  }

  return {
    summary,
    supportersFeedback,
    managementFeedback,
    brandFeedback,
    sizeAlerts: trimmedAlerts,
    keyTakeaway,
  };
}

