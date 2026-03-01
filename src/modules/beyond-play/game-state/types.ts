"use client";

import type { TurnPipelineResult } from "../execution/pipeline";

export type JerseySize = "XXS" | "XS" | "S" | "M" | "L" | "XL" | "XXL";

export const JERSEY_SIZES: readonly JerseySize[] = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
] as const;

export type SizeAllocation = Record<JerseySize, number>;

export type PartnerCategory =
  | "led"
  | "jumbo"
  | "jersey"
  | "boxes"
  | "digital";

export interface PartnerNote {
  turn: number;
  summary: string;
}

export interface PartnerState {
  id: string;
  name: string;
  category: PartnerCategory;
  contractValueCurrent: number;
  satisfaction: number; // 0..100
  loyalty: number; // 0..100
  churnRisk: number; // 0..100
  notes: PartnerNote[];
}

export interface TicketPricingConfig {
  virage: number;
  centrale: number;
  hospitality: number;
}

export interface VipPricingState {
  seatPrice: number;
  boxPackPrice: number;
  boxesSold: number;
}

export interface SubscriptionPricingConfig {
  virage: number;
  centrale: number;
}

export interface SponsorPricingConfig {
  led: number;
  giantScreen: number;
  hospitality: number;
  jersey: number;
  digital: number;
  backdrop: number;
}

export interface AdvertisingPricingConfig {
  ledMatch: number;
  screenMatch: number;
  matchdayPack: number;
  instagramPost: number;
  instagramStory: number;
  socialPack: number;
}

export interface PricingState {
  ticket: TicketPricingConfig;
  subscription: SubscriptionPricingConfig;
  jersey: number;
  sponsor: SponsorPricingConfig;
  advertising: AdvertisingPricingConfig;
  vip: VipPricingState;
}

export interface MatchdayKpis {
  stadiumCapacity: number;
  attendance: number;
  fillRate: number;
  ticketRevenuePerMatch: number;
  avgRevenuePerSpectator: number;
  matchdayVariableCost: number;
  matchdayVipCost: number;
  matchdayTotalCost: number;
  matchdayGrossProfit: number;
  matchdayGrossMarginRate: number;
  vipSeatRevenue: number;
  vipBoxRevenue: number;
  vipRevenueTotal: number;
  vipBoxesSold: number;
  vipHospitalityCost: number;
  vipGrossProfit: number;
}

export interface SubscriptionKpis {
  subscribersVirage: number;
  subscribersCentrale: number;
  subscriptionsRevenue: number;
}

export interface MerchandisingKpis {
  jerseyPrice: number;
  jerseyUnitsSold: number;
  jerseyUnitsSoldBySize: SizeAllocation;
  jerseyRevenue: number;
  jerseyCogs: number;
  jerseyGrossMargin: number;
  jerseyGrossMarginRate: number;
  jerseyStockInitial: number;
  jerseyStockRemaining: number;
  jerseyStockBySizeInitial: SizeAllocation;
  jerseyStockBySizeRemaining: SizeAllocation;
  jerseyInventoryValue: number;
  jerseyRupture: boolean;
  jerseySurstock: boolean;
  jerseyRuptureSizes: JerseySize[];
  jerseySurstockSizes: JerseySize[];
}

export interface SponsorRevenueBreakdown {
  led: number;
  giantScreen: number;
  hospitality: number;
  jersey: number;
  digital: number;
  backdrop: number;
  stadiumExtras: number;
  socialExtras: number;
}

export interface SponsoringSalesBreakdown {
  ledMatches: number;
  screenMatches: number;
  matchdayPacks: number;
  instagramPosts: number;
  instagramStories: number;
  socialPacks: number;
}

export type SponsoringDealOutcome = "WON" | "LOST";

export interface SponsoringDeal {
  channel: "STADIUM" | "SOCIAL";
  product: string;
  outcome: SponsoringDealOutcome;
  reason: string;
}

export interface AdvertisingLead {
  leadId: string;
  name: string;
  statement: string;
  weights: {
    hospitality: number;
    stadium: number;
    social: number;
  };
  priceSensitivity: number;
  budgetReference: number;
  minBrandRequired: number;
  threshold: number;
}

export interface SponsoringKpis {
  totalRevenue: number;
  revenueByCategory: SponsorRevenueBreakdown;
  stadiumRevenue: number;
  socialRevenue: number;
  stadiumSales: SponsoringSalesBreakdown;
  socialSales: SponsoringSalesBreakdown;
  brandImpactDelta: number;
  pricingPositioningScore: number;
  deals: SponsoringDeal[];
  vacancy: {
    led: number;
    screen: number;
    post: number;
    story: number;
  };
  activePartners: number;
  totalPartnersBaseline: number;
  sponsorRetentionRate: number;
  sponsorSatisfactionIndex: number;
  sponsorChurnRiskIndex: number;
}

export interface TransverseKpis {
  cash: number;
  cashDeltaThisTurn: number;
  brandIndex: number;
  brandDeltaThisTurn: number;
  fansIndex: number;
  fansDeltaThisTurn: number;
}

export interface KPIsState {
  turn: number;
  matchday: MatchdayKpis;
  subscriptions: SubscriptionKpis;
  merchandising: MerchandisingKpis;
  sponsoring: SponsoringKpis;
  transverse: TransverseKpis;
}

export interface GameState {
  turn: number;
  cash: number;
  fansMood: number;
  brandAwareness: number;
  sponsorPortfolio: PartnerState[];
  pendingIncidents: string[];
  pricing: PricingState;
  kpis: KPIsState;
  lastTurnKpis?: KPIsState;
  merchandising: MerchandisingState;
  baselines: {
    sponsorCount: number;
  };
}

export interface MerchandisingState {
  jerseyStockInitial: number;
  jerseyStockRemaining: number;
  jerseyStockBySizeInitial: SizeAllocation;
  jerseyStockBySizeRemaining: SizeAllocation;
  jerseyUnitsSoldBySize: SizeAllocation;
  jerseyInventoryValue: number;
  jerseyRupture: boolean;
  jerseySurstock: boolean;
  jerseyRuptureSizes: JerseySize[];
  jerseySurstockSizes: JerseySize[];
}

export interface WorldBible {
  referencePrices: {
    ticket: TicketPricingConfig;
    subscription: SubscriptionPricingConfig;
    jersey: number;
    sponsor: SponsorPricingConfig;
  };
  stadium: {
    capacity: number;
    capacityTotal: number;
    segments: Record<"virage" | "centrale" | "hospitality", { seats: number }>;
  };
  limits: {
    maxPriceVariationPct: number;
    maxEventsPerTurn: number;
    minCash: number;
    maxCash: number;
    satisfactionBounds: [number, number];
    loyaltyBounds: [number, number];
    attendanceDeltaPerTurn: number;
    jerseyUnitsDeltaPerTurn: number;
  };
  unitCosts: {
    jersey: number;
  };
  jerseyUnitCostTable: Array<{
    minVolume: number;
    unitCost: number;
  }>;
  demandModel: {
    baseAttendanceRate: number;
    baseJerseyDemand: number;
    ticketDemandElasticity: number;
    jerseyDemandElasticity: number;
    fansWeight: number;
    brandWeight: number;
    fansWeightMatchday: number;
    brandWeightMatchday: number;
    priceSensitivity: number;
  };
  matchdayCosts: {
    stadiumCostPerAttendee: number;
    vipBoxFixedCostPerMatch: number;
    vipBoxCostAppliesWhen: "ALWAYS" | "IF_VIP_REVENUE";
  };
  vip: {
    vipSeatCapacity: number;
    vipBoxCapacity: number;
    vipBoxMaxSoldPerMatch: number;
    vipHospitalityFixedCostPerMatch: number;
    defaultSeatPrice?: number;
    defaultBoxPackPrice?: number;
  };
  merchandising: {
    jerseyDefaultSizeMix: SizeAllocation;
    jerseyDemandSizeWeights: SizeAllocation;
    jerseySizeSurstockThreshold: number;
    jerseySizePenalty: {
      ruptureFansPenaltyPerSize: number;
      ruptureBrandPenaltyPerSize: number;
      maxTotalPenaltyPerTurn: number;
    };
  };
  sponsoring: {
    competitors: {
      stadium: {
        basketProB: {
          ledPrice: number;
          screenPrice: number;
          matchdayPackPrice: number;
          attractiveness: number;
        };
        rugby: {
          ledPrice: number;
          screenPrice: number;
          matchdayPackPrice: number;
          attractiveness: number;
        };
      };
      social: {
        higherReach: {
          postPrice: number;
          storyPrice: number;
          packPrice: number;
          reachFactor: number;
        };
        lowerReach: {
          postPrice: number;
          storyPrice: number;
          packPrice: number;
          reachFactor: number;
        };
      };
    };
    inventory: {
      ledMatches: number;
      screenMatches: number;
      matchdayPacks: number;
      instagramPosts: number;
      instagramStories: number;
      socialPacks: number;
      ledSlotsTotal: number;
      screenSlotsTotal: number;
      socialPostSlotsTotal: number;
      socialStorySlotsTotal: number;
    };
    advertising: {
      marketBudgetStadium: number;
      marketBudgetSocial: number;
      ledSlotsPerPack: number;
      screenSlotsPerPack: number;
      postSlotsPerPack: number;
      storySlotsPerPack: number;
    };
    leads: AdvertisingLead[];
  };
  negotiationConfig: {
    defaultTrust: number;
    defaultTension: number;
  };
}

export type SliderMetric =
  | "price_led"
  | "price_ticket"
  | "price_subscription"
  | "activation_budget"
  | "marketing_cut"
  | "custom";

export interface SliderDecision {
  id: string;
  label: string;
  metric: SliderMetric;
  unit?: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  recommendedRange?: { min: number; max: number };
}

export interface ChoiceOption {
  id: string;
  label: string;
  summary?: string;
  hint?: string;
}

export interface ChoiceDecision {
  id: string;
  prompt: string;
  options: ChoiceOption[];
}

export interface Scene {
  id: string;
  type: "scene" | "briefing" | "internal" | "media" | "negotiation";
  title: string;
  description: string;
  involvedPartners: string[];
}

export interface NegotiationStep {
  step: number;
  objection: string;
  responses: Array<{
    id: string;
    label: string;
    intent: "concede" | "neutral" | "push" | "creative";
  }>;
}

export interface NegotiationScene extends Scene {
  type: "negotiation";
  partnerId: string;
  context: {
    trust: number;
    tension: number;
    valueGap: number;
  };
  steps: NegotiationStep[];
  outcome?: {
    resolution: "deal" | "escalate" | "break";
    summary: string;
  };
}

export interface EventSummary {
  id: string;
  type:
    | "sponsorship"
    | "fan_mood"
    | "crisis"
    | "opportunity"
    | "social_backlash"
    | "hospitality_incident"
    | "match_result"
    | "good_news";
  severity: "low" | "medium" | "high";
  summary: string;
  partnerInvolved?: string;
}

export interface TurnPackage {
  turnNumber: number;
  contextNarrative: string;
  title: string;
  learningGoal: string;
  events: EventSummary[];
  decisions: {
    sliders: SliderDecision[];
    choices: ChoiceDecision[];
  };
  scenes: Array<Scene | NegotiationScene>;
}

export interface TurnHistoryEntry {
  turnNumber: number;
  package: TurnPackage;
  appliedDecisions: {
    sliders: Record<string, number>;
    choices: Record<string, string>;
  };
  stateAfter: GameState;
  result: TurnPipelineResult;
}


