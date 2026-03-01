"use client";

import {
  GameState,
  KPIsState,
  MatchdayKpis,
  MerchandisingKpis,
  SponsoringDeal,
  SponsoringKpis,
  SponsoringSalesBreakdown,
  SubscriptionKpis,
  TransverseKpis,
  WorldBible,
  SponsorRevenueBreakdown,
  TicketPricingConfig,
  PricingState,
  JERSEY_SIZES,
  JerseySize,
} from "../../game-state/types";
import type { PricingFlags } from "../../execution/pipeline";
import {
  clamp,
  createSizeAllocation,
  normalizeSizeAllocation,
  cloneSizeAllocation,
  sumSizeAllocation,
  distributeUnitsByAllocation,
} from "../../game-state/utils";
import { calculateJerseyUnitCost } from "../calculateJerseyUnitCost";

const STYLE_FACTORS: Record<string, (params: { fansMood: number }) => number> = {
  TRADITIONAL: () => 1.05,
  MODERN: () => 1.1,
  PREMIUM: () => 0.95,
  RUPTURE: ({ fansMood }) => (fansMood >= 55 ? 1.2 : 0.8),
};

export interface KpiCalculationParams {
  state: GameState;
  worldBible: WorldBible;
  previousKpis?: KPIsState;
  decisionsApplied: {
    sliders: Record<string, number>;
    choices: Record<string, string>;
  };
}

export interface KpiDeltas {
  cashDeltaThisTurn: number;
  brandDeltaThisTurn: number;
  fansDeltaThisTurn: number;
}

const EPSILON = 1e-6;

export function calculateKpis({
  state,
  worldBible,
  previousKpis,
  decisionsApplied,
}: KpiCalculationParams): KPIsState {
  const { pricing } = state;
  const { referencePrices, stadium, unitCosts, demandModel, limits, jerseyUnitCostTable } =
    worldBible;

  const baseAttendanceTarget = demandModel.baseAttendanceRate * stadium.capacityTotal;
  const baseJerseyDemand = demandModel.baseJerseyDemand;

  const previousAttendance = previousKpis?.matchday.attendance ?? baseAttendanceTarget;
  const previousJerseyUnits = previousKpis?.merchandising.jerseyUnitsSold ?? baseJerseyDemand;
  const previousSubscribersVirage = previousKpis?.subscriptions.subscribersVirage ?? Math.round(
    stadium.segments.virage.seats * 0.35,
  );
  const previousSubscribersCentrale = previousKpis?.subscriptions.subscribersCentrale ?? Math.round(
    stadium.segments.centrale.seats * 0.32,
  );

  const ticketing = computeMatchdayKpis({
    state,
    pricing,
    worldBible,
    previousAttendance,
    demandModel,
    limits,
  });

  const subscriptions = computeSubscriptionsKpis({
    pricing,
    stadium,
    demandModel,
    referencePrices,
    previous: {
      virage: previousSubscribersVirage,
      centrale: previousSubscribersCentrale,
    },
  });

  const merchandising = computeMerchandisingKpis({
    pricing,
    referencePrices,
    unitCostTable: jerseyUnitCostTable,
    fallbackUnitCost: unitCosts.jersey,
    demandModel,
    baseJerseyDemand,
    previousJerseyUnits,
    state,
    decisionsApplied,
    limits,
    merchConfig: worldBible.merchandising,
  });

  const sponsoring = computeSponsoringKpis({
    state,
    pricing,
    worldBible,
  });

  const transverse = computeTransverseKpis({
    state,
    previous: previousKpis,
  });

  const kpisState: KPIsState = {
    turn: state.turn,
    matchday: ticketing,
    subscriptions,
    merchandising,
    sponsoring,
    transverse,
  };

  if (process.env.NODE_ENV !== "production") {
    validateKpiState(kpisState);
  }

  return kpisState;
}

export function computeDeltas(previous: KPIsState | undefined, next: KPIsState): KpiDeltas {
  if (!previous) {
    return {
      cashDeltaThisTurn: next.transverse.cashDeltaThisTurn,
      brandDeltaThisTurn: next.transverse.brandDeltaThisTurn,
      fansDeltaThisTurn: next.transverse.fansDeltaThisTurn,
    };
  }

  return {
    cashDeltaThisTurn: next.transverse.cash - previous.transverse.cash,
    brandDeltaThisTurn: next.transverse.brandIndex - previous.transverse.brandIndex,
    fansDeltaThisTurn: next.transverse.fansIndex - previous.transverse.fansIndex,
  };
}

type DemandModel = WorldBible["demandModel"];

interface MatchdayInput {
  state: GameState;
  pricing: GameState["pricing"];
  worldBible: WorldBible;
  previousAttendance: number;
  demandModel: DemandModel;
  limits: WorldBible["limits"];
}

export function computeMatchdayKpis({
  state,
  pricing,
  worldBible,
  previousAttendance,
  demandModel,
  limits,
}: MatchdayInput): MatchdayKpis {
  const capacityTotal = worldBible.stadium.capacityTotal || worldBible.stadium.capacity;
  const referenceWeighted = weightedAveragePrice(
    worldBible.referencePrices.ticket,
    worldBible.stadium.segments,
  );
  const currentWeighted = weightedAveragePrice(pricing.ticket, worldBible.stadium.segments);

  const elasticity = Math.max(demandModel.ticketDemandElasticity, 0.01);
  const ticketPriceFactor = Math.pow(
    (referenceWeighted + EPSILON) / (currentWeighted + EPSILON),
    elasticity,
  );

  const fansComponent =
    1 + ((state.fansMood - 55) / 100) * (demandModel.fansWeightMatchday ?? 0);
  const brandComponent =
    1 + ((state.brandAwareness - 55) / 100) * (demandModel.brandWeightMatchday ?? 0);
  const matchdayImageFactor = Math.max(0.35, fansComponent * brandComponent);

  const desiredAttendance =
    capacityTotal *
    Math.max(0, demandModel.baseAttendanceRate) *
    ticketPriceFactor *
    matchdayImageFactor;

  const maxAttendanceDelta = limits.attendanceDeltaPerTurn * capacityTotal;

  const attendance = clamp(
    desiredAttendance,
    Math.max(0, previousAttendance - maxAttendanceDelta),
    Math.min(capacityTotal, previousAttendance + maxAttendanceDelta),
  );

  const segmentAttendance = distributeAttendance(
    attendance,
    pricing.ticket,
    worldBible.referencePrices.ticket,
    worldBible.stadium.segments,
    demandModel,
  );

  const vipConfig = worldBible.vip ?? {
    vipSeatCapacity: worldBible.stadium.segments.hospitality?.seats ?? 0,
    vipBoxCapacity: 0,
    vipBoxMaxSoldPerMatch: 0,
    vipHospitalityFixedCostPerMatch:
      worldBible.matchdayCosts?.vipBoxFixedCostPerMatch ?? 0,
  };

  const seatPrice =
    pricing.vip?.seatPrice ?? pricing.ticket.hospitality ?? 0;
  const vipBoxesSoldRaw = pricing.vip?.boxesSold ?? 0;
  const vipBoxesSold = clamp(
    vipBoxesSoldRaw,
    0,
    vipConfig.vipBoxMaxSoldPerMatch ?? 0,
  );
  const vipBoxPackPrice = Math.max(0, pricing.vip?.boxPackPrice ?? 0);

  const vipSeatRevenue = Math.max(
    0,
    (segmentAttendance.hospitality ?? 0) * Math.max(0, seatPrice),
  );
  const vipBoxRevenue = Math.max(0, vipBoxesSold * vipBoxPackPrice);
  const vipRevenueTotal = vipSeatRevenue + vipBoxRevenue;

  const ticketRevenuePerMatch =
    segmentAttendance.virage * pricing.ticket.virage +
    segmentAttendance.centrale * pricing.ticket.centrale +
    vipSeatRevenue +
    vipBoxRevenue;

  const matchdayCostsConfig = worldBible.matchdayCosts ?? {
    stadiumCostPerAttendee: 1.34,
    vipBoxFixedCostPerMatch: 75000,
    vipBoxCostAppliesWhen: "IF_VIP_REVENUE" as const,
  };

  const matchdayVariableCost =
    Math.round((attendance > 0 ? attendance : 0) * matchdayCostsConfig.stadiumCostPerAttendee);

  const vipFixedCostReference =
    matchdayCostsConfig.vipBoxFixedCostPerMatch > 0
      ? matchdayCostsConfig.vipBoxFixedCostPerMatch
      : vipConfig.vipHospitalityFixedCostPerMatch ?? 0;

  const vipCostApplies =
    matchdayCostsConfig.vipBoxCostAppliesWhen === "ALWAYS" ||
    (matchdayCostsConfig.vipBoxCostAppliesWhen === "IF_VIP_REVENUE" && vipRevenueTotal > 0);
  const matchdayVipCost = vipCostApplies ? vipFixedCostReference : 0;

  const matchdayTotalCost = matchdayVariableCost + matchdayVipCost;
  const matchdayGrossProfit = ticketRevenuePerMatch - matchdayTotalCost;
  const matchdayGrossMarginRate =
    ticketRevenuePerMatch > 0 ? clamp(matchdayGrossProfit / ticketRevenuePerMatch, -1, 1) : 0;

  const avgRevenuePerSpectator =
    attendance > 0 ? ticketRevenuePerMatch / attendance : ticketRevenuePerMatch;

  return {
    stadiumCapacity: capacityTotal,
    attendance: Math.round(attendance),
    fillRate: clamp(attendance / (capacityTotal + EPSILON), 0, 1),
    ticketRevenuePerMatch: Math.round(ticketRevenuePerMatch),
    avgRevenuePerSpectator: Math.round(avgRevenuePerSpectator),
    matchdayVariableCost: Math.round(matchdayVariableCost),
    matchdayVipCost: Math.round(matchdayVipCost),
    matchdayTotalCost: Math.round(matchdayTotalCost),
    matchdayGrossProfit: Math.round(matchdayGrossProfit),
    matchdayGrossMarginRate,
    vipSeatRevenue: Math.round(vipSeatRevenue),
    vipBoxRevenue: Math.round(vipBoxRevenue),
    vipRevenueTotal: Math.round(vipRevenueTotal),
    vipBoxesSold: Math.round(vipBoxesSold),
    vipHospitalityCost: Math.round(matchdayVipCost),
    vipGrossProfit: Math.round(vipRevenueTotal - matchdayVipCost),
  };
}

interface SubscriptionsInput {
  pricing: GameState["pricing"];
  stadium: WorldBible["stadium"];
  demandModel: DemandModel;
  referencePrices: WorldBible["referencePrices"];
  previous: { virage: number; centrale: number };
}

function computeSubscriptionsKpis({
  pricing,
  stadium,
  demandModel,
  referencePrices,
  previous,
}: SubscriptionsInput): SubscriptionKpis {
  const baseVirage = Math.round(stadium.segments.virage.seats * 0.36);
  const baseCentrale = Math.round(stadium.segments.centrale.seats * 0.33);

  const virageSubscribers = clampSubscriberLevel({
    baselineCount: baseVirage,
    previousCount: previous.virage,
    currentPrice: pricing.subscription.virage,
    basePrice: referencePrices.subscription.virage,
    elasticity: demandModel.ticketDemandElasticity * 0.8,
  });

  const centraleSubscribers = clampSubscriberLevel({
    baselineCount: baseCentrale,
    previousCount: previous.centrale,
    currentPrice: pricing.subscription.centrale,
    basePrice: referencePrices.subscription.centrale,
    elasticity: demandModel.ticketDemandElasticity * 0.7,
  });

  return {
    subscribersVirage: Math.round(virageSubscribers),
    subscribersCentrale: Math.round(centraleSubscribers),
    subscriptionsRevenue: Math.round(
      virageSubscribers * pricing.subscription.virage +
        centraleSubscribers * pricing.subscription.centrale,
    ),
  };
}

interface MerchandisingInput {
  pricing: GameState["pricing"];
  referencePrices: WorldBible["referencePrices"];
  unitCostTable: WorldBible["jerseyUnitCostTable"];
  fallbackUnitCost: number;
  demandModel: DemandModel;
  baseJerseyDemand: number;
  previousJerseyUnits: number;
  state: GameState;
  decisionsApplied: KpiCalculationParams["decisionsApplied"];
  limits: WorldBible["limits"];
  merchConfig: WorldBible["merchandising"];
}

function computeMerchandisingKpis({
  pricing,
  referencePrices,
  unitCostTable,
  fallbackUnitCost,
  demandModel,
  baseJerseyDemand,
  previousJerseyUnits,
  state,
  decisionsApplied,
  limits,
  merchConfig,
}: MerchandisingInput): MerchandisingKpis {
  let stockBySizeInitial = state.merchandising?.jerseyStockBySizeInitial
    ? cloneSizeAllocation(state.merchandising.jerseyStockBySizeInitial)
    : null;

  if (!stockBySizeInitial) {
    const fallbackBySize = state.merchandising?.jerseyStockBySizeRemaining
      ? cloneSizeAllocation(state.merchandising.jerseyStockBySizeRemaining)
      : null;
    if (fallbackBySize) {
      stockBySizeInitial = fallbackBySize;
    } else {
      const fallbackStock = Math.max(0, state.merchandising?.jerseyStockInitial ?? 0);
      const fallbackMix = normalizeSizeAllocation(
        merchConfig.jerseyDefaultSizeMix,
        merchConfig.jerseyDefaultSizeMix,
      );
      stockBySizeInitial =
        fallbackStock > 0
          ? distributeUnitsByAllocation(fallbackStock, fallbackMix)
          : createSizeAllocation(0);
    }
  }

  const stockInitial = Math.max(0, Math.round(sumSizeAllocation(stockBySizeInitial)));

  const existingInventoryValue = Math.max(
    0,
    state.merchandising?.jerseyInventoryValue ?? 0,
  );
  const inferredUnitCost =
    stockInitial > 0 && existingInventoryValue > 0
      ? existingInventoryValue / stockInitial
      : calculateJerseyUnitCost(stockInitial, unitCostTable);
  const unitCost = Math.max(inferredUnitCost || fallbackUnitCost, 0);
  const priceHT = Math.max(pricing.jersey, EPSILON);
  const priceReference = Math.max(referencePrices.jersey, EPSILON);
  const jerseyElasticity = Math.max(demandModel.jerseyDemandElasticity, 0.01);

  const priceFactor = Math.pow(priceReference / priceHT, jerseyElasticity);

  const fansFactor =
    1 + ((state.fansMood - 55) / 100) * (demandModel.fansWeight ?? 0);
  const brandFactor =
    1 + ((state.brandAwareness - 55) / 100) * (demandModel.brandWeight ?? 0);
  const imageFactor = Math.max(0.35, fansFactor * brandFactor);

  const styleChoice = decisionsApplied.choices["C_JERSEY_STYLE"];
  const styleHandler = STYLE_FACTORS[styleChoice ?? ""];
  const styleFactor = styleHandler ? styleHandler({ fansMood: state.fansMood }) : 1;

  const rawDemand = baseJerseyDemand * priceFactor * imageFactor * styleFactor;
  const demandWeights = normalizeSizeAllocation(
    merchConfig.jerseyDemandSizeWeights,
    merchConfig.jerseyDefaultSizeMix,
  );

  const maxDeltaUnits = Math.max(
    limits.jerseyUnitsDeltaPerTurn * Math.max(previousJerseyUnits || baseJerseyDemand, 1),
    50,
  );

  const minUnits = Math.max(0, previousJerseyUnits - maxDeltaUnits);
  const maxUnits = Math.min(stockInitial, previousJerseyUnits + maxDeltaUnits);
  const constrainedDemand = clamp(Math.min(rawDemand, stockInitial), minUnits, maxUnits);
  const targetUnits = Math.min(constrainedDemand, stockInitial);
  const sellableTarget = Math.min(Math.round(targetUnits), stockInitial);

  const rawDemandBySize = createSizeAllocation(0);
  JERSEY_SIZES.forEach((size) => {
    rawDemandBySize[size] = rawDemand * demandWeights[size];
  });

  const soldBySize = createSizeAllocation(0);
  const stockBySizeInitialSafe = cloneSizeAllocation(stockBySizeInitial);

  if (sellableTarget > 0) {
    const remainders: Array<{ size: JerseySize; remainder: number }> = [];
    let allocated = 0;
    JERSEY_SIZES.forEach((size) => {
      const desired = Math.min(
        stockBySizeInitialSafe[size],
        targetUnits * demandWeights[size],
      );
      const floored = Math.min(Math.floor(desired), stockBySizeInitialSafe[size]);
      soldBySize[size] = floored;
      allocated += floored;
      remainders.push({ size, remainder: Math.max(0, desired - floored) });
    });

    let remainingToAllocate = Math.max(
      0,
      Math.min(
        sellableTarget,
        Math.round(sumSizeAllocation(stockBySizeInitialSafe)),
      ) - allocated,
    );
    if (remainingToAllocate > 0) {
      remainders.sort((a, b) => b.remainder - a.remainder);
      let safety = 0;
      while (remainingToAllocate > 0 && safety < 12) {
        let progressed = false;
        for (const { size } of remainders) {
          if (remainingToAllocate <= 0) {
            break;
          }
          const capacityLeft = stockBySizeInitialSafe[size] - soldBySize[size];
          if (capacityLeft <= 0) {
            continue;
          }
          soldBySize[size] += 1;
          remainingToAllocate -= 1;
          progressed = true;
        }
        if (!progressed) {
          break;
        }
        safety += 1;
      }
    }
  }

  const remainingBySize = createSizeAllocation(0);
  JERSEY_SIZES.forEach((size) => {
    remainingBySize[size] = Math.max(0, stockBySizeInitialSafe[size] - soldBySize[size]);
  });

  const jerseyUnitsSold = sumSizeAllocation(soldBySize);
  const stockRemaining = Math.max(0, Math.round(sumSizeAllocation(remainingBySize)));

  const jerseyRevenueValue = jerseyUnitsSold * priceHT;
  const jerseyCogsValue = jerseyUnitsSold * unitCost;
  const jerseyGrossMarginValue = jerseyRevenueValue - jerseyCogsValue;
  const jerseyRevenueRounded = Math.round(jerseyRevenueValue);
  const jerseyCogsRounded = Math.round(jerseyCogsValue);
  const jerseyGrossMarginRounded = Math.round(jerseyGrossMarginValue);
  const jerseyGrossMarginRate =
    jerseyRevenueValue > 0 ? clamp(jerseyGrossMarginValue / jerseyRevenueValue, -1, 1) : 0;

  const inventoryValue = Math.max(0, existingInventoryValue - jerseyCogsRounded);
  const jerseyRuptureSizes: JerseySize[] = JERSEY_SIZES.filter(
    (size) => rawDemandBySize[size] > stockBySizeInitialSafe[size] + 1e-3,
  );
  const jerseySurstockSizes: JerseySize[] = JERSEY_SIZES.filter((size) => {
    const initial = stockBySizeInitialSafe[size];
    if (initial <= 0) {
      return false;
    }
    return remainingBySize[size] > initial * merchConfig.jerseySizeSurstockThreshold;
  });
  const jerseyRupture = jerseyRuptureSizes.length > 0;
  const jerseySurstock = jerseySurstockSizes.length > 0;

  return {
    jerseyPrice: priceHT,
    jerseyUnitsSold: Math.round(jerseyUnitsSold),
    jerseyUnitsSoldBySize: soldBySize,
    jerseyRevenue: jerseyRevenueRounded,
    jerseyCogs: jerseyCogsRounded,
    jerseyGrossMargin: jerseyGrossMarginRounded,
    jerseyGrossMarginRate,
    jerseyStockInitial: stockInitial,
    jerseyStockRemaining: stockRemaining,
    jerseyStockBySizeInitial: stockBySizeInitialSafe,
    jerseyStockBySizeRemaining: remainingBySize,
    jerseyInventoryValue: Math.round(inventoryValue),
    jerseyRupture,
    jerseySurstock,
    jerseyRuptureSizes,
    jerseySurstockSizes,
  };
}

interface SponsoringInput {
  state: GameState;
  pricing: PricingState;
  worldBible: WorldBible;
}

function computeSponsoringKpis({ state, pricing, worldBible }: SponsoringInput): SponsoringKpis {
  const demand = calculateSponsoringDemand({
    pricing,
    bible: worldBible,
    state,
  });

  const revenueBreakdown: SponsorRevenueBreakdown = {
    led: Math.round(demand.stadiumRevenueBreakdown.led),
    giantScreen: Math.round(demand.stadiumRevenueBreakdown.screen),
    hospitality: Math.round(demand.stadiumRevenueBreakdown.matchdayPack),
    jersey: 0,
    digital: Math.round(demand.socialRevenueBreakdown.post + demand.socialRevenueBreakdown.story),
    backdrop: 0,
    stadiumExtras: Math.round(demand.stadiumRevenueBreakdown.matchdayPack),
    socialExtras: Math.round(demand.socialRevenueBreakdown.pack),
  };

  const totalRevenue = Math.round(demand.stadiumRevenue + demand.socialRevenue);

  const inventory =
    worldBible.sponsoring?.inventory ?? {
      ledMatches: 0,
      screenMatches: 0,
      matchdayPacks: 0,
      instagramPosts: 0,
      instagramStories: 0,
      socialPacks: 0,
    };

  const totalOpportunities = Math.max(
    1,
    inventory.ledMatches +
      inventory.screenMatches +
      inventory.matchdayPacks +
      inventory.instagramPosts +
      inventory.instagramStories +
      inventory.socialPacks,
  );

  const activePartners = Math.round(
    demand.stadiumSales.ledMatches +
      demand.stadiumSales.screenMatches +
      demand.stadiumSales.matchdayPacks +
      demand.socialSales.instagramPosts +
      demand.socialSales.instagramStories +
      demand.socialSales.socialPacks,
  );

  const sponsorRetentionRate = clamp(activePartners / totalOpportunities, 0, 1);
  const sponsorSatisfactionIndex = clamp(
    50 + demand.satisfactionScore * 40 + demand.pricingScore * 20,
    0,
    100,
  );
  const sponsorChurnRiskIndex = clamp(100 - sponsorSatisfactionIndex, 0, 100);

  return {
    totalRevenue,
    revenueByCategory: revenueBreakdown,
    stadiumRevenue: Math.round(demand.stadiumRevenue),
    socialRevenue: Math.round(demand.socialRevenue),
    stadiumSales: demand.stadiumSales,
    socialSales: demand.socialSales,
    brandImpactDelta: clamp(demand.brandImpact, -15, 20),
    pricingPositioningScore: clamp(demand.pricingScore, 0, 1),
    deals: demand.deals,
    vacancy: {
      led: Math.max(0, inventory.ledMatches - demand.stadiumSales.ledMatches),
      screen: Math.max(0, inventory.screenMatches - demand.stadiumSales.screenMatches),
      post: Math.max(0, inventory.instagramPosts - demand.socialSales.instagramPosts),
      story: Math.max(0, inventory.instagramStories - demand.socialSales.instagramStories),
    },
    activePartners,
    totalPartnersBaseline: totalOpportunities,
    sponsorRetentionRate,
    sponsorSatisfactionIndex,
    sponsorChurnRiskIndex,
  };
}

interface SponsoringDemandResult {
  stadiumSales: SponsoringSalesBreakdown;
  socialSales: SponsoringSalesBreakdown;
  stadiumRevenue: number;
  socialRevenue: number;
  stadiumRevenueBreakdown: {
    led: number;
    screen: number;
    matchdayPack: number;
  };
  socialRevenueBreakdown: {
    post: number;
    story: number;
    pack: number;
  };
  pricingScore: number;
  satisfactionScore: number;
  brandImpact: number;
  deals: SponsoringDeal[];
}

function calculateSponsoringDemand({
  pricing,
  bible,
  state,
}: {
  pricing: PricingState;
  bible: WorldBible;
  state: GameState;
}): SponsoringDemandResult {
  const sponsoringConfig = bible.sponsoring;
  const inventory = sponsoringConfig?.inventory ?? {
    ledMatches: 0,
    screenMatches: 0,
    matchdayPacks: 0,
    instagramPosts: 0,
    instagramStories: 0,
    socialPacks: 0,
  };

  const baseAttendRef = Math.max(bible.demandModel.baseAttendanceRate, 0.4);
  const currentFill =
    state.kpis.matchday?.fillRate > 0 ? state.kpis.matchday.fillRate : baseAttendRef;

  const brandFactor = clamp(state.brandAwareness / 65, 0.6, 1.4);
  const fansFactor = clamp(state.fansMood / 65, 0.6, 1.4);
  const attendanceFactor = clamp(currentFill / baseAttendRef, 0.5, 1.5);
  const demandFactor = clamp((brandFactor + fansFactor + attendanceFactor) / 3, 0.4, 1.6);

  const stadiumCompetitors = sponsoringConfig?.competitors.stadium;
  const socialCompetitors = sponsoringConfig?.competitors.social;

  const resolvedStadium = resolveStadiumDemand({
    pricing,
    inventory,
    competition: stadiumCompetitors,
    demandFactor,
    advertising: sponsoringConfig?.advertising,
  });

  const resolvedSocial = resolveSocialDemand({
    pricing,
    inventory,
    competition: socialCompetitors,
    demandFactor,
    advertising: sponsoringConfig?.advertising,
  });

  const totalInventory =
    inventory.ledMatches +
    inventory.screenMatches +
    inventory.matchdayPacks +
    inventory.instagramPosts +
    inventory.instagramStories +
    inventory.socialPacks;

  const weightedPriceScore =
    totalInventory > 0
      ? (resolvedStadium.weightedPriceScore + resolvedSocial.weightedPriceScore) / totalInventory
      : 0;
  const weightedFill =
    totalInventory > 0
      ? (resolvedStadium.weightedFill + resolvedSocial.weightedFill) / totalInventory
      : 0;

  const satisfactionScore = clamp(
    weightedPriceScore * 0.55 + weightedFill * 0.45,
    0,
    1,
  );
  const pricingScore = clamp(weightedPriceScore, 0, 1);

  const brandImpact = clamp(
    (weightedFill - 0.5) * 22 + (pricingScore - 0.5) * 10,
    -15,
    20,
  );

  const stadiumSales: SponsoringSalesBreakdown = {
    ledMatches: resolvedStadium.led.sold,
    screenMatches: resolvedStadium.screen.sold,
    matchdayPacks: resolvedStadium.pack.sold,
    instagramPosts: 0,
    instagramStories: 0,
    socialPacks: 0,
  };

  const socialSales: SponsoringSalesBreakdown = {
    ledMatches: 0,
    screenMatches: 0,
    matchdayPacks: 0,
    instagramPosts: resolvedSocial.post.sold,
    instagramStories: resolvedSocial.story.sold,
    socialPacks: resolvedSocial.pack.sold,
  };

  const stadiumRevenue = resolvedStadium.led.revenue + resolvedStadium.screen.revenue + resolvedStadium.pack.revenue;
  const socialRevenue = resolvedSocial.post.revenue + resolvedSocial.story.revenue + resolvedSocial.pack.revenue;

  const deals = buildSponsoringDeals({
    stadium: resolvedStadium,
    social: resolvedSocial,
    pricingFlags: {
      stadiumAdvertisingExtreme: resolvedStadium.extremePricing,
      socialAdvertisingExtreme: resolvedSocial.extremePricing,
    },
  });

  return {
    stadiumSales,
    socialSales,
    stadiumRevenue,
    socialRevenue,
    stadiumRevenueBreakdown: {
      led: resolvedStadium.led.revenue,
      screen: resolvedStadium.screen.revenue,
      matchdayPack: resolvedStadium.pack.revenue,
    },
    socialRevenueBreakdown: {
      post: resolvedSocial.post.revenue,
      story: resolvedSocial.story.revenue,
      pack: resolvedSocial.pack.revenue,
    },
    pricingScore,
    satisfactionScore,
    brandImpact,
    deals,
  };
}

function resolveStadiumDemand({
  pricing,
  inventory,
  competition,
  demandFactor,
  advertising,
}: {
  pricing: PricingState;
  inventory: WorldBible["sponsoring"]["inventory"];
  competition?: WorldBible["sponsoring"]["competitors"]["stadium"];
  demandFactor: number;
  advertising?: WorldBible["sponsoring"]["advertising"];
}) {
  const attractiveness =
    competition
      ? average([
          competition.basketProB.attractiveness,
          competition.rugby.attractiveness,
        ])
      : 1;

  const ledBenchmark = competition
    ? average([competition.basketProB.ledPrice, competition.rugby.ledPrice])
    : Math.max(pricing.advertising.ledMatch, 1);
  const screenBenchmark = competition
    ? average([competition.basketProB.screenPrice, competition.rugby.screenPrice])
    : Math.max(pricing.advertising.screenMatch, 1);
  const packBenchmark = competition
    ? average([
        competition.basketProB.matchdayPackPrice,
        competition.rugby.matchdayPackPrice,
      ])
    : Math.max(pricing.advertising.matchdayPack, 1);

  const ledSlotsPerPack = advertising?.ledSlotsPerPack ?? 1;
  const screenSlotsPerPack = advertising?.screenSlotsPerPack ?? 1;

  const remainingInventory = {
    ledMatches: inventory.ledMatches,
    screenMatches: inventory.screenMatches,
  };

  const pack = resolveProductDemand({
    price: pricing.advertising.matchdayPack,
    benchmark: packBenchmark,
    inventory: inventory.matchdayPacks,
    attractiveness: attractiveness * 1.05,
    demandFactor,
    slotConsumption: {
      led: ledSlotsPerPack,
      screen: screenSlotsPerPack,
    },
    inventoryRef: remainingInventory,
  });

  const led = resolveProductDemand({
    price: pricing.advertising.ledMatch,
    benchmark: ledBenchmark,
    inventory: remainingInventory.ledMatches,
    attractiveness,
    demandFactor,
    inventoryRef: remainingInventory,
    slotConsumption: { led: 1, screen: 0 },
  });
  const screen = resolveProductDemand({
    price: pricing.advertising.screenMatch,
    benchmark: screenBenchmark,
    inventory: remainingInventory.screenMatches,
    attractiveness,
    demandFactor,
    inventoryRef: remainingInventory,
    slotConsumption: { led: 0, screen: 1 },
  });

  return {
    led,
    screen,
    pack,
    weightedPriceScore:
      led.priceScore * inventory.ledMatches +
      screen.priceScore * inventory.screenMatches +
      pack.priceScore * inventory.matchdayPacks,
    weightedFill:
      led.fill * inventory.ledMatches +
      screen.fill * inventory.screenMatches +
      pack.fill * inventory.matchdayPacks,
    extremePricing:
      led.extremePricing || screen.extremePricing || pack.extremePricing,
  };
}

function resolveSocialDemand({
  pricing,
  inventory,
  competition,
  demandFactor,
  advertising,
}: {
  pricing: PricingState;
  inventory: WorldBible["sponsoring"]["inventory"];
  competition?: WorldBible["sponsoring"]["competitors"]["social"];
  demandFactor: number;
  advertising?: WorldBible["sponsoring"]["advertising"];
}) {
  const reachFactorAverage = competition
    ? average([competition.higherReach.reachFactor, competition.lowerReach.reachFactor])
    : 1;

  const postBenchmark = competition
    ? average([competition.higherReach.postPrice, competition.lowerReach.postPrice])
    : Math.max(pricing.advertising.instagramPost, 1);
  const storyBenchmark = competition
    ? average([competition.higherReach.storyPrice, competition.lowerReach.storyPrice])
    : Math.max(pricing.advertising.instagramStory, 1);
  const packBenchmark = competition
    ? average([competition.higherReach.packPrice, competition.lowerReach.packPrice])
    : Math.max(pricing.advertising.socialPack, 1);

  const postSlotsPerPack = advertising?.postSlotsPerPack ?? 2;
  const storySlotsPerPack = advertising?.storySlotsPerPack ?? 3;

  const remainingInventory = {
    instagramPosts: inventory.instagramPosts,
    instagramStories: inventory.instagramStories,
  };

  const pack = resolveProductDemand({
    price: pricing.advertising.socialPack,
    benchmark: packBenchmark,
    inventory: inventory.socialPacks,
    attractiveness: reachFactorAverage * 1.05,
    demandFactor,
    reachFactor: reachFactorAverage,
    slotConsumption: { post: postSlotsPerPack, story: storySlotsPerPack },
    inventoryRef: remainingInventory,
  });

  const post = resolveProductDemand({
    price: pricing.advertising.instagramPost,
    benchmark: postBenchmark,
    inventory: remainingInventory.instagramPosts,
    attractiveness: reachFactorAverage,
    demandFactor,
    reachFactor: competition?.higherReach.reachFactor ?? reachFactorAverage,
    slotConsumption: { post: 1, story: 0 },
    inventoryRef: remainingInventory,
  });
  const story = resolveProductDemand({
    price: pricing.advertising.instagramStory,
    benchmark: storyBenchmark,
    inventory: remainingInventory.instagramStories,
    attractiveness: reachFactorAverage * 0.95,
    demandFactor,
    reachFactor: competition?.lowerReach.reachFactor ?? reachFactorAverage,
    slotConsumption: { post: 0, story: 1 },
    inventoryRef: remainingInventory,
  });

  return {
    post,
    story,
    pack,
    weightedPriceScore:
      post.priceScore * inventory.instagramPosts +
      story.priceScore * inventory.instagramStories +
      pack.priceScore * inventory.socialPacks,
    weightedFill:
      post.fill * inventory.instagramPosts +
      story.fill * inventory.instagramStories +
      pack.fill * inventory.socialPacks,
    extremePricing:
      post.extremePricing || story.extremePricing || pack.extremePricing,
  };
}

function resolveProductDemand({
  price,
  benchmark,
  inventory,
  attractiveness,
  demandFactor,
  reachFactor = 1,
  slotConsumption,
  inventoryRef,
}: {
  price: number;
  benchmark: number;
  inventory: number;
  attractiveness: number;
  demandFactor: number;
  reachFactor?: number;
  slotConsumption?: {
    led?: number;
    screen?: number;
    post?: number;
    story?: number;
  };
  inventoryRef?: {
    ledMatches?: number;
    screenMatches?: number;
    instagramPosts?: number;
    instagramStories?: number;
  };
}) {
  const safeInventory = Math.max(0, inventory);
  if (safeInventory <= 0) {
    return { sold: 0, revenue: 0, priceScore: 1, fill: 0, extremePricing: false };
  }

  const safeBenchmark = benchmark > 0 ? benchmark : 1;
  const safePrice = Math.max(price, 0);
  const ratio = safePrice / safeBenchmark;
  const priceDelta = ratio - 1;
  const priceScore = clamp(1 - Math.abs(priceDelta), 0, 1);
  const priceFactor = clamp(1 - priceDelta * 0.6, 0.2, 1.6);

  const baseDemand =
    safeInventory *
    clamp(attractiveness, 0.3, 1.8) *
    clamp(demandFactor, 0.3, 1.8) *
    clamp(reachFactor, 0.3, 2);

  const potentialSold = clamp(Math.round(baseDemand * priceFactor), 0, safeInventory);
  let sold = potentialSold;

  if (slotConsumption && inventoryRef) {
    if (slotConsumption.led && inventoryRef.ledMatches !== undefined) {
      const maxByLed = Math.floor(
        (inventoryRef.ledMatches ?? 0) / Math.max(1, slotConsumption.led),
      );
      sold = Math.min(sold, maxByLed);
      inventoryRef.ledMatches = Math.max(
        0,
        (inventoryRef.ledMatches ?? 0) - sold * slotConsumption.led,
      );
    }
    if (slotConsumption.screen && inventoryRef.screenMatches !== undefined) {
      const maxByScreen = Math.floor(
        (inventoryRef.screenMatches ?? 0) / Math.max(1, slotConsumption.screen),
      );
      sold = Math.min(sold, maxByScreen);
      inventoryRef.screenMatches = Math.max(
        0,
        (inventoryRef.screenMatches ?? 0) - sold * slotConsumption.screen,
      );
    }
    if (slotConsumption.post && inventoryRef.instagramPosts !== undefined) {
      const maxByPost = Math.floor(
        (inventoryRef.instagramPosts ?? 0) / Math.max(1, slotConsumption.post),
      );
      sold = Math.min(sold, maxByPost);
      inventoryRef.instagramPosts = Math.max(
        0,
        (inventoryRef.instagramPosts ?? 0) - sold * slotConsumption.post,
      );
    }
    if (slotConsumption.story && inventoryRef.instagramStories !== undefined) {
      const maxByStory = Math.floor(
        (inventoryRef.instagramStories ?? 0) / Math.max(1, slotConsumption.story),
      );
      sold = Math.min(sold, maxByStory);
      inventoryRef.instagramStories = Math.max(
        0,
        (inventoryRef.instagramStories ?? 0) - sold * slotConsumption.story,
      );
    }
  }

  const revenue = safePrice * sold;
  const fill = sold / safeInventory;

  return {
    sold,
    revenue,
    priceScore,
    fill,
    extremePricing: priceScore < 0.4 || sold <= 0,
  };
}

function average(values: number[]): number {
  const valid = values.filter((value) => Number.isFinite(value) && value > 0);
  if (valid.length === 0) {
    return 1;
  }
  const total = valid.reduce((acc, value) => acc + value, 0);
  return total / valid.length;
}

function buildSponsoringDeals({
  stadium,
  social,
  pricingFlags,
}: {
  stadium: ReturnType<typeof resolveStadiumDemand>;
  social: ReturnType<typeof resolveSocialDemand>;
  pricingFlags: PricingFlags;
}): SponsoringDeal[] {
  const deals: SponsoringDeal[] = [];

  const totalStadiumSold =
    stadium.led.sold + stadium.screen.sold + stadium.pack.sold;
  const totalSocialSold =
    social.post.sold + social.story.sold + social.pack.sold;

  if (totalStadiumSold > 0) {
    deals.push({
      channel: "STADIUM",
      product:
        stadium.pack.sold > 0
          ? "Pack matchday"
          : stadium.led.sold > stadium.screen.sold
            ? "LED bord terrain"
            : "Écran géant",
      outcome: pricingFlags.stadiumAdvertisingExtreme ? "WON" : "WON",
      reason:
        stadium.pack.sold > 0
          ? "La formule intégrée (loge + activation) a trouvé preneur malgré la concurrence."
          : "Positionnement tarifaire jugé compétitif face aux clubs voisins.",
    });
  } else {
    deals.push({
      channel: "STADIUM",
      product: "Offres stade",
      outcome: "LOST",
      reason:
        "Les partenaires ont préféré des clubs concurrents, les tarifs étant jugés peu alignés avec le marché.",
    });
  }

  if (totalSocialSold > 0) {
    deals.push({
      channel: "SOCIAL",
      product:
        social.pack.sold > 0
          ? "Pack social"
          : social.post.sold >= social.story.sold
            ? "Post sponsorisé"
            : "Story sponsorisée",
      outcome: "WON",
      reason:
        "La portée et l’engagement proposés ont convaincu malgré un benchmark serré.",
    });
  } else {
    deals.push({
      channel: "SOCIAL",
      product: "Offres digitales",
      outcome: "LOST",
      reason:
        "Les agences ont privilégié des comptes à portée différente, vos prix étant jugés trop éloignés des benchmarks.",
    });
  }

  if (pricingFlags.socialAdvertisingExtreme || pricingFlags.stadiumAdvertisingExtreme) {
    deals.push({
      channel: pricingFlags.socialAdvertisingExtreme ? "SOCIAL" : "STADIUM",
      product: "Benchmark concurrentiel",
      outcome: "LOST",
      reason:
        "Les comparaisons impliquées montrent un écart marqué avec la grille concurrente. Un recalibrage est recommandé.",
    });
  }

  return deals.slice(0, 3);
}

interface TransverseInput {
  state: GameState;
  previous?: KPIsState;
}

function computeTransverseKpis({ state, previous }: TransverseInput): TransverseKpis {
  return {
    cash: state.cash,
    cashDeltaThisTurn: previous ? state.cash - previous.transverse.cash : 0,
    brandIndex: state.brandAwareness,
    brandDeltaThisTurn: previous ? state.brandAwareness - previous.transverse.brandIndex : 0,
    fansIndex: state.fansMood,
    fansDeltaThisTurn: previous ? state.fansMood - previous.transverse.fansIndex : 0,
  };
}

function weightedAveragePrice(
  prices: TicketPricingConfig,
  segments: WorldBible["stadium"]["segments"],
): number {
  const total =
    segments.virage.seats + segments.centrale.seats + segments.hospitality.seats;
  if (total === 0) {
    return prices.virage;
  }
  return (
    (prices.virage * segments.virage.seats +
      prices.centrale * segments.centrale.seats +
      prices.hospitality * segments.hospitality.seats) /
    total
  );
}

function distributeAttendance(
  attendance: number,
  pricing: TicketPricingConfig,
  reference: TicketPricingConfig,
  segments: WorldBible["stadium"]["segments"],
  demandModel: DemandModel,
): {
  virage: number;
  centrale: number;
  hospitality: number;
} {
  const totalCapacity =
    segments.virage.seats + segments.centrale.seats + segments.hospitality.seats;
  if (totalCapacity === 0) {
    return { virage: 0, centrale: 0, hospitality: 0 };
  }

  const hospitalityBaseShare = segments.hospitality.seats / totalCapacity;
  const hospitalityElasticity = Math.max(demandModel.ticketDemandElasticity * 0.4, 0);
  const hospitalityFactor = Math.pow(
    (reference.hospitality + EPSILON) / (pricing.hospitality + EPSILON),
    hospitalityElasticity,
  );

  let hospitalityAttendance = clamp(
    attendance * hospitalityBaseShare * hospitalityFactor,
    0,
    segments.hospitality.seats,
  );

  let remaining = Math.max(0, attendance - hospitalityAttendance);

  const virageWeight =
    segments.virage.seats *
    Math.pow(
      (reference.virage + EPSILON) / (pricing.virage + EPSILON),
      demandModel.ticketDemandElasticity * 1.05,
    );
  const centraleWeight =
    segments.centrale.seats *
    Math.pow(
      (reference.centrale + EPSILON) / (pricing.centrale + EPSILON),
      demandModel.ticketDemandElasticity * 0.9,
    );

  const weightTotal = virageWeight + centraleWeight;
  let virageAttendance =
    weightTotal > 0 ? (remaining * virageWeight) / weightTotal : remaining * 0.55;
  let centraleAttendance =
    weightTotal > 0 ? (remaining * centraleWeight) / weightTotal : remaining * 0.45;

  virageAttendance = clamp(virageAttendance, 0, segments.virage.seats);
  centraleAttendance = clamp(centraleAttendance, 0, segments.centrale.seats);

  let allocated = hospitalityAttendance + virageAttendance + centraleAttendance;
  if (allocated < attendance) {
    remaining = attendance - allocated;

    const slots: Array<{
      capacity: number;
      current: number;
      set: (value: number) => void;
    }> = [
      {
        capacity: segments.virage.seats,
        current: virageAttendance,
        set: (value) => {
          virageAttendance = value;
        },
      },
      {
        capacity: segments.centrale.seats,
        current: centraleAttendance,
        set: (value) => {
          centraleAttendance = value;
        },
      },
      {
        capacity: segments.hospitality.seats,
        current: hospitalityAttendance,
        set: (value) => {
          hospitalityAttendance = value;
        },
      },
    ];

    slots.forEach((slot) => {
      if (remaining <= 0) {
        return;
      }
      if (slot.current >= slot.capacity) {
        return;
      }
      const available = slot.capacity - slot.current;
      const allocation = Math.min(available, remaining);
      slot.set(slot.current + allocation);
      remaining -= allocation;
    });
  }

  return {
    virage: Math.round(virageAttendance),
    centrale: Math.round(centraleAttendance),
    hospitality: Math.round(hospitalityAttendance),
  };
}

function clampSubscriberLevel({
  baselineCount,
  previousCount,
  currentPrice,
  basePrice,
  elasticity,
}: {
  baselineCount: number;
  previousCount: number;
  currentPrice: number;
  basePrice: number;
  elasticity: number;
}): number {
  const priceGap = (currentPrice - basePrice) / (basePrice + EPSILON);
  const target = baselineCount * (1 - elasticity * priceGap);
  const maxDelta = Math.max(baselineCount * 0.15, 50);
  return clamp(target, Math.max(0, previousCount - maxDelta), previousCount + maxDelta);
}

function validateKpiState(kpis: KPIsState) {
  const numericValues: Array<[string, number]> = [
    ["matchday.attendance", kpis.matchday.attendance],
    ["matchday.fillRate", kpis.matchday.fillRate],
    ["matchday.ticketRevenuePerMatch", kpis.matchday.ticketRevenuePerMatch],
    ["matchday.avgRevenuePerSpectator", kpis.matchday.avgRevenuePerSpectator],
    ["subscriptions.subscribersVirage", kpis.subscriptions.subscribersVirage],
    ["subscriptions.subscribersCentrale", kpis.subscriptions.subscribersCentrale],
    ["subscriptions.subscriptionsRevenue", kpis.subscriptions.subscriptionsRevenue],
    ["merchandising.jerseyPrice", kpis.merchandising.jerseyPrice],
    ["merchandising.jerseyUnitsSold", kpis.merchandising.jerseyUnitsSold],
    ["merchandising.jerseyRevenue", kpis.merchandising.jerseyRevenue],
    ["merchandising.jerseyCogs", kpis.merchandising.jerseyCogs],
    ["merchandising.jerseyGrossMargin", kpis.merchandising.jerseyGrossMargin],
    ["merchandising.jerseyGrossMarginRate", kpis.merchandising.jerseyGrossMarginRate],
    ["merchandising.jerseyStockInitial", kpis.merchandising.jerseyStockInitial],
    ["merchandising.jerseyStockRemaining", kpis.merchandising.jerseyStockRemaining],
    ["merchandising.jerseyInventoryValue", kpis.merchandising.jerseyInventoryValue],
    ["sponsoring.totalRevenue", kpis.sponsoring.totalRevenue],
    ["sponsoring.activePartners", kpis.sponsoring.activePartners],
    ["sponsoring.sponsorRetentionRate", kpis.sponsoring.sponsorRetentionRate],
    ["sponsoring.sponsorSatisfactionIndex", kpis.sponsoring.sponsorSatisfactionIndex],
    ["sponsoring.sponsorChurnRiskIndex", kpis.sponsoring.sponsorChurnRiskIndex],
    ["transverse.cash", kpis.transverse.cash],
    ["transverse.cashDeltaThisTurn", kpis.transverse.cashDeltaThisTurn],
    ["transverse.brandIndex", kpis.transverse.brandIndex],
    ["transverse.brandDeltaThisTurn", kpis.transverse.brandDeltaThisTurn],
    ["transverse.fansIndex", kpis.transverse.fansIndex],
    ["transverse.fansDeltaThisTurn", kpis.transverse.fansDeltaThisTurn],
  ];

  numericValues.forEach(([label, value]) => {
    if (!Number.isFinite(value)) {
      console.warn("[BeyondFC][KPIs] valeur invalide détectée", label, value);
    }
  });
}

