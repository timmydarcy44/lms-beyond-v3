"use client";

import { calculateJerseyUnitCost } from "../rules-engine/calculateJerseyUnitCost";
import { GameState, TurnHistoryEntry, WorldBible, SizeAllocation, JerseySize } from "./types";
import {
  createEmptyKpis,
  createPricingFromBible,
  createSizeAllocation,
  distributeUnitsByAllocation,
} from "./utils";

const DEFAULT_INITIAL_CASH = 350_000;
const DEFAULT_INITIAL_FANS_MOOD = 62;
const DEFAULT_INITIAL_BRAND_AWARENESS = 58;
const DEFAULT_JERSEY_SALES_RATIO = 0.78;
const DEFAULT_JERSEY_REMAINING_RATIO = 0.18;

function resolveSegmentAttendance(
  seats: number,
  attendanceRate: number,
): number {
  if (!Number.isFinite(seats) || seats <= 0) return 0;
  const resolved = Math.round(seats * attendanceRate);
  return Math.max(0, Math.min(seats, resolved));
}

function resolveSizeAllocation(
  totalUnits: number,
  mix: SizeAllocation,
): SizeAllocation {
  if (totalUnits <= 0) {
    return createSizeAllocation(0);
  }
  return distributeUnitsByAllocation(totalUnits, mix);
}

export function createInitialGameState(worldBible: WorldBible): GameState {
  const pricing = createPricingFromBible(worldBible);
  const kpis = createEmptyKpis();

  const capacityTotal =
    worldBible.stadium.capacityTotal ?? worldBible.stadium.capacity ?? 0;
  const baseAttendanceRate = Math.max(0, worldBible.demandModel.baseAttendanceRate);
  const baseAttendance = Math.max(
    0,
    Math.min(capacityTotal, Math.round(capacityTotal * baseAttendanceRate)),
  );

  const virageSeats = worldBible.stadium.segments.virage?.seats ?? 0;
  const centraleSeats = worldBible.stadium.segments.centrale?.seats ?? 0;
  const hospitalitySeats = worldBible.stadium.segments.hospitality?.seats ?? 0;

  const virageAttendance = resolveSegmentAttendance(virageSeats, baseAttendanceRate);
  const centraleAttendance = resolveSegmentAttendance(centraleSeats, baseAttendanceRate);
  const hospitalityAttendance = resolveSegmentAttendance(
    hospitalitySeats,
    baseAttendanceRate,
  );

  const vipSeatRevenue = hospitalityAttendance * pricing.ticket.hospitality;
  const vipBoxesSold = 0;
  const vipBoxRevenue = 0;
  const ticketRevenuePerMatch =
    virageAttendance * pricing.ticket.virage +
    centraleAttendance * pricing.ticket.centrale +
    vipSeatRevenue +
    vipBoxRevenue;

  const averageRevenuePerSpectator =
    baseAttendance > 0 ? ticketRevenuePerMatch / baseAttendance : 0;

  const matchdayCostsConfig = worldBible.matchdayCosts ?? {
    stadiumCostPerAttendee: 1.34,
    vipBoxFixedCostPerMatch: 75_000,
    vipBoxCostAppliesWhen: "IF_VIP_REVENUE" as const,
  };

  const matchdayVariableCost = Math.round(
    baseAttendance * matchdayCostsConfig.stadiumCostPerAttendee,
  );
  const matchdayVipCost =
    matchdayCostsConfig.vipBoxCostAppliesWhen === "ALWAYS" ? matchdayCostsConfig.vipBoxFixedCostPerMatch : 0;
  const matchdayTotalCost = matchdayVariableCost + matchdayVipCost;
  const matchdayGrossProfit = ticketRevenuePerMatch - matchdayTotalCost;
  const matchdayGrossMarginRate =
    ticketRevenuePerMatch > 0 ? matchdayGrossProfit / ticketRevenuePerMatch : 0;

  kpis.turn = 0;
  kpis.matchday = {
    stadiumCapacity: capacityTotal,
    attendance: baseAttendance,
    fillRate: capacityTotal > 0 ? baseAttendance / capacityTotal : 0,
    ticketRevenuePerMatch: Math.round(ticketRevenuePerMatch),
    avgRevenuePerSpectator: Math.round(averageRevenuePerSpectator),
    matchdayVariableCost,
    matchdayVipCost,
    matchdayTotalCost,
    matchdayGrossProfit: Math.round(matchdayGrossProfit),
    matchdayGrossMarginRate,
    vipSeatRevenue: Math.round(vipSeatRevenue),
    vipBoxRevenue: Math.round(vipBoxRevenue),
    vipRevenueTotal: Math.round(vipSeatRevenue + vipBoxRevenue),
    vipBoxesSold,
    vipHospitalityCost: matchdayVipCost,
    vipGrossProfit: Math.round(vipSeatRevenue + vipBoxRevenue - matchdayVipCost),
  };

  const subscribersVirage = Math.round(virageSeats * 0.35);
  const subscribersCentrale = Math.round(centraleSeats * 0.32);
  kpis.subscriptions = {
    subscribersVirage,
    subscribersCentrale,
    subscriptionsRevenue: Math.round(
      subscribersVirage * pricing.subscription.virage +
        subscribersCentrale * pricing.subscription.centrale,
    ),
  };

  const baseJerseyDemand = Math.max(
    0,
    Math.round(worldBible.demandModel.baseJerseyDemand),
  );
  const jerseyDefaultMix =
    worldBible.merchandising?.jerseyDefaultSizeMix ?? createSizeAllocation(1 / 7);
  const jerseyStockInitial = Math.max(
    baseJerseyDemand,
    Math.round(baseJerseyDemand / (1 - DEFAULT_JERSEY_REMAINING_RATIO)),
  );
  const jerseyUnitsSold = Math.min(
    jerseyStockInitial,
    Math.round(jerseyStockInitial * DEFAULT_JERSEY_SALES_RATIO),
  );
  const jerseyStockRemaining = Math.max(jerseyStockInitial - jerseyUnitsSold, 0);

  const jerseyUnitsSoldBySize = resolveSizeAllocation(jerseyUnitsSold, jerseyDefaultMix);
  const jerseyStockBySizeInitial = resolveSizeAllocation(
    jerseyStockInitial,
    jerseyDefaultMix,
  );
  const jerseyStockBySizeRemaining = resolveSizeAllocation(
    jerseyStockRemaining,
    jerseyDefaultMix,
  );

  const baselineUnitCost = calculateJerseyUnitCost(
    jerseyStockInitial,
    worldBible.jerseyUnitCostTable,
  );
  const jerseyRevenue = jerseyUnitsSold * pricing.jersey;
  const jerseyCogs = Math.round(jerseyUnitsSold * baselineUnitCost);
  const jerseyGrossMargin = jerseyRevenue - jerseyCogs;
  const jerseyGrossMarginRate =
    jerseyRevenue > 0 ? jerseyGrossMargin / jerseyRevenue : 0;

  kpis.merchandising = {
    jerseyPrice: pricing.jersey,
    jerseyUnitsSold,
    jerseyUnitsSoldBySize,
    jerseyRevenue: Math.round(jerseyRevenue),
    jerseyCogs,
    jerseyGrossMargin: Math.round(jerseyGrossMargin),
    jerseyGrossMarginRate,
    jerseyStockInitial,
    jerseyStockRemaining,
    jerseyStockBySizeInitial,
    jerseyStockBySizeRemaining,
    jerseyInventoryValue: Math.round(jerseyStockRemaining * baselineUnitCost),
    jerseyRupture: false,
    jerseySurstock: false,
    jerseyRuptureSizes: [],
    jerseySurstockSizes: [],
  };

  kpis.sponsoring = {
    ...kpis.sponsoring,
    totalRevenue: 0,
    revenueByCategory: {
      led: 0,
      giantScreen: 0,
      hospitality: 0,
      jersey: 0,
      digital: 0,
      backdrop: 0,
      stadiumExtras: 0,
      socialExtras: 0,
    },
    stadiumRevenue: 0,
    socialRevenue: 0,
    stadiumSales: {
      ledMatches: 0,
      screenMatches: 0,
      matchdayPacks: 0,
      instagramPosts: 0,
      instagramStories: 0,
      socialPacks: 0,
    },
    socialSales: {
      ledMatches: 0,
      screenMatches: 0,
      matchdayPacks: 0,
      instagramPosts: 0,
      instagramStories: 0,
      socialPacks: 0,
    },
    brandImpactDelta: 0,
    pricingPositioningScore: 0,
    deals: [],
    vacancy: {
      led: worldBible.sponsoring?.inventory?.ledMatches ?? 0,
      screen: worldBible.sponsoring?.inventory?.screenMatches ?? 0,
      post: worldBible.sponsoring?.inventory?.instagramPosts ?? 0,
      story: worldBible.sponsoring?.inventory?.instagramStories ?? 0,
    },
    activePartners: 0,
    totalPartnersBaseline: Math.max(
      0,
      (worldBible.sponsoring?.inventory?.ledMatches ?? 0) +
        (worldBible.sponsoring?.inventory?.screenMatches ?? 0) +
        (worldBible.sponsoring?.inventory?.matchdayPacks ?? 0) +
        (worldBible.sponsoring?.inventory?.instagramPosts ?? 0) +
        (worldBible.sponsoring?.inventory?.instagramStories ?? 0) +
        (worldBible.sponsoring?.inventory?.socialPacks ?? 0),
    ),
    sponsorRetentionRate: 0,
    sponsorSatisfactionIndex: 50,
    sponsorChurnRiskIndex: 50,
  };

  kpis.transverse = {
    cash: DEFAULT_INITIAL_CASH,
    cashDeltaThisTurn: 0,
    brandIndex: DEFAULT_INITIAL_BRAND_AWARENESS,
    brandDeltaThisTurn: 0,
    fansIndex: DEFAULT_INITIAL_FANS_MOOD,
    fansDeltaThisTurn: 0,
  };

  const merchandisingState = {
    jerseyStockInitial,
    jerseyStockRemaining,
    jerseyStockBySizeInitial,
    jerseyStockBySizeRemaining,
    jerseyUnitsSoldBySize,
    jerseyInventoryValue: Math.round(jerseyStockRemaining * baselineUnitCost),
    jerseyRupture: false,
    jerseySurstock: false,
    jerseyRuptureSizes: [] as JerseySize[],
    jerseySurstockSizes: [] as JerseySize[],
  };

  return {
    turn: 0,
    cash: DEFAULT_INITIAL_CASH,
    fansMood: DEFAULT_INITIAL_FANS_MOOD,
    brandAwareness: DEFAULT_INITIAL_BRAND_AWARENESS,
    sponsorPortfolio: [],
    pendingIncidents: [],
    pricing,
    kpis,
    lastTurnKpis: undefined,
    merchandising: merchandisingState,
    baselines: {
      sponsorCount: 0,
    },
  };
}

export function createInitialHistory(): TurnHistoryEntry[] {
  return [];
}
