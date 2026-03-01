"use client";

import {
  GameState,
  JERSEY_SIZES,
  JerseySize,
  KPIsState,
  PartnerState,
  PricingState,
  SizeAllocation,
  WorldBible,
} from "./types";

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function createSizeAllocation(initialValue = 0): SizeAllocation {
  return JERSEY_SIZES.reduce((acc, size) => {
    acc[size] = initialValue;
    return acc;
  }, {} as SizeAllocation);
}

export function cloneSizeAllocation(allocation: SizeAllocation): SizeAllocation {
  const clone = createSizeAllocation(0);
  JERSEY_SIZES.forEach((size) => {
    clone[size] = Number.isFinite(allocation[size]) ? allocation[size] : 0;
  });
  return clone;
}

export function sumSizeAllocation(allocation: SizeAllocation): number {
  return JERSEY_SIZES.reduce((total, size) => total + (allocation[size] ?? 0), 0);
}

export function normalizeSizeAllocation(
  allocation: Record<JerseySize, number>,
  fallback?: SizeAllocation,
): SizeAllocation {
  const normalized = createSizeAllocation(0);
  let total = 0;
  JERSEY_SIZES.forEach((size) => {
    const value = Number(allocation[size] ?? 0);
    if (Number.isFinite(value) && value > 0) {
      normalized[size] = value;
      total += value;
    }
  });
  if (total <= 0) {
    if (fallback) {
      return cloneSizeAllocation(fallback);
    }
    const equalShare = 1 / JERSEY_SIZES.length;
    return createSizeAllocation(equalShare);
  }
  const result = createSizeAllocation(0);
  JERSEY_SIZES.forEach((size) => {
    result[size] = normalized[size] / total;
  });
  return result;
}

export function distributeUnitsByAllocation(
  totalUnits: number,
  allocation: SizeAllocation,
): SizeAllocation {
  const result = createSizeAllocation(0);
  if (totalUnits <= 0) {
    return result;
  }

  const normalized = normalizeSizeAllocation(allocation);
  const remainders: Array<{ size: JerseySize; remainder: number }> = [];

  let allocated = 0;
  JERSEY_SIZES.forEach((size) => {
    const ideal = totalUnits * normalized[size];
    const floored = Math.floor(ideal);
    result[size] = floored;
    allocated += floored;
    remainders.push({ size, remainder: ideal - floored });
  });

  let remaining = totalUnits - allocated;
  if (remaining > 0) {
    remainders
      .sort((a, b) => b.remainder - a.remainder)
      .forEach(({ size }) => {
        if (remaining <= 0) {
          return;
        }
        result[size] += 1;
        remaining -= 1;
      });
  }

  return result;
}

export function clampGameState(state: GameState, bible: WorldBible): GameState {
  return {
    ...state,
    cash: clamp(state.cash, bible.limits.minCash, bible.limits.maxCash),
    fansMood: clamp(
      state.fansMood,
      bible.limits.satisfactionBounds[0],
      bible.limits.satisfactionBounds[1],
    ),
    brandAwareness: clamp(
      state.brandAwareness,
      bible.limits.satisfactionBounds[0],
      bible.limits.satisfactionBounds[1],
    ),
    sponsorPortfolio: state.sponsorPortfolio.map((partner) => clampPartner(partner, bible)),
  };
}

export function clampPartner(partner: PartnerState, bible: WorldBible): PartnerState {
  return {
    ...partner,
    satisfaction: clamp(
      partner.satisfaction,
      bible.limits.satisfactionBounds[0],
      bible.limits.satisfactionBounds[1],
    ),
    loyalty: clamp(partner.loyalty, bible.limits.loyaltyBounds[0], bible.limits.loyaltyBounds[1]),
    churnRisk: clamp(partner.churnRisk, 0, 100),
  };
}

export function updatePartnerById(
  state: GameState,
  partnerId: string,
  updater: (partner: PartnerState) => PartnerState,
): GameState {
  return {
    ...state,
    sponsorPortfolio: state.sponsorPortfolio.map((partner) =>
      partner.id === partnerId ? updater(partner) : partner,
    ),
  };
}

export function addCash(state: GameState, delta: number): GameState {
  return { ...state, cash: state.cash + delta };
}

export function adjustFansMood(state: GameState, delta: number): GameState {
  return { ...state, fansMood: clamp(state.fansMood + delta, 0, 100) };
}

export function createPricingFromBible(bible: WorldBible): PricingState {
  return {
    ticket: {
      ...bible.referencePrices.ticket,
    },
    subscription: {
      ...bible.referencePrices.subscription,
    },
    jersey: bible.referencePrices.jersey,
    sponsor: {
      ...bible.referencePrices.sponsor,
    },
    advertising: {
      ledMatch: bible.referencePrices.sponsor.led,
      screenMatch: bible.referencePrices.sponsor.giantScreen,
      matchdayPack: bible.referencePrices.sponsor.hospitality,
      instagramPost: bible.referencePrices.sponsor.digital,
      instagramStory: Math.round(bible.referencePrices.sponsor.digital * 0.75),
      socialPack: Math.round(
        (bible.referencePrices.sponsor.digital + bible.referencePrices.sponsor.backdrop) / 2,
      ),
    },
    vip: {
      seatPrice:
        bible.vip?.defaultSeatPrice ??
        bible.referencePrices.ticket.hospitality,
      boxPackPrice:
        bible.vip?.defaultBoxPackPrice ??
        Math.max(10000, bible.referencePrices.ticket.hospitality * 200),
      boxesSold: 0,
    },
  };
}

export function createEmptyKpis(): KPIsState {
  return {
    turn: 0,
    matchday: {
      stadiumCapacity: 0,
      attendance: 0,
      fillRate: 0,
      ticketRevenuePerMatch: 0,
      avgRevenuePerSpectator: 0,
      matchdayVariableCost: 0,
      matchdayVipCost: 0,
      matchdayTotalCost: 0,
      matchdayGrossProfit: 0,
      matchdayGrossMarginRate: 0,
      vipSeatRevenue: 0,
      vipBoxRevenue: 0,
      vipRevenueTotal: 0,
      vipBoxesSold: 0,
      vipHospitalityCost: 0,
      vipGrossProfit: 0,
    },
    subscriptions: {
      subscribersVirage: 0,
      subscribersCentrale: 0,
      subscriptionsRevenue: 0,
    },
    merchandising: {
      jerseyPrice: 0,
      jerseyUnitsSold: 0,
      jerseyUnitsSoldBySize: createSizeAllocation(0),
      jerseyRevenue: 0,
      jerseyCogs: 0,
      jerseyGrossMargin: 0,
      jerseyGrossMarginRate: 0,
      jerseyStockInitial: 0,
      jerseyStockRemaining: 0,
      jerseyStockBySizeInitial: createSizeAllocation(0),
      jerseyStockBySizeRemaining: createSizeAllocation(0),
      jerseyInventoryValue: 0,
      jerseyRupture: false,
      jerseySurstock: false,
      jerseyRuptureSizes: [],
      jerseySurstockSizes: [],
    },
    sponsoring: {
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
        led: 0,
        screen: 0,
        post: 0,
        story: 0,
      },
      activePartners: 0,
      totalPartnersBaseline: 0,
      sponsorRetentionRate: 0,
      sponsorSatisfactionIndex: 0,
      sponsorChurnRiskIndex: 0,
    },
    transverse: {
      cash: 0,
      cashDeltaThisTurn: 0,
      brandIndex: 0,
      brandDeltaThisTurn: 0,
      fansIndex: 0,
      fansDeltaThisTurn: 0,
    },
  };
}
