"use client";

import { WorldBible } from "./types";

export const defaultWorldBible: WorldBible = {
  referencePrices: {
    ticket: {
      virage: 18,
      centrale: 35,
      hospitality: 120,
    },
    subscription: {
      virage: 220,
      centrale: 520,
    },
    jersey: 45,
    sponsor: {
      led: 20000,
      giantScreen: 10000,
      hospitality: 15000,
      jersey: 18000,
      digital: 6000,
      backdrop: 7000,
    },
  },
  stadium: {
    capacity: 28000,
    capacityTotal: 28000,
    segments: {
      virage: { seats: 14000 },
      centrale: { seats: 11000 },
      hospitality: { seats: 3000 },
    },
  },
  limits: {
    maxPriceVariationPct: 0.25,
    maxEventsPerTurn: 2,
    minCash: -200000,
    maxCash: 1_500_000,
    satisfactionBounds: [0, 100],
    loyaltyBounds: [0, 100],
    attendanceDeltaPerTurn: 0.15,
    jerseyUnitsDeltaPerTurn: 2,
  },
  unitCosts: {
    jersey: 12,
  },
  jerseyUnitCostTable: [
    { minVolume: 0, unitCost: 28 },
    { minVolume: 6000, unitCost: 24 },
    { minVolume: 10000, unitCost: 22 },
    { minVolume: 15000, unitCost: 20 },
    { minVolume: 20000, unitCost: 18 },
  ],
  demandModel: {
    baseAttendanceRate: 0.68,
    baseJerseyDemand: 12000,
    ticketDemandElasticity: 0.15,
    jerseyDemandElasticity: 1.3,
    fansWeight: 1.05,
    brandWeight: 0.85,
    fansWeightMatchday: 0.3,
    brandWeightMatchday: 0.2,
    priceSensitivity: 0.2,
  },
  matchdayCosts: {
    stadiumCostPerAttendee: 1.34,
    vipBoxFixedCostPerMatch: 75000,
    vipBoxCostAppliesWhen: "IF_VIP_REVENUE",
  },
  vip: {
    vipSeatCapacity: 3000,
    vipBoxCapacity: 40,
    vipBoxMaxSoldPerMatch: 32,
    vipHospitalityFixedCostPerMatch: 75000,
    defaultSeatPrice: 120,
    defaultBoxPackPrice: 35000,
  },
  merchandising: {
    jerseyDefaultSizeMix: {
      XXS: 0.03,
      XS: 0.07,
      S: 0.16,
      M: 0.26,
      L: 0.25,
      XL: 0.17,
      XXL: 0.06,
    },
    jerseyDemandSizeWeights: {
      XXS: 0.03,
      XS: 0.07,
      S: 0.15,
      M: 0.25,
      L: 0.27,
      XL: 0.18,
      XXL: 0.05,
    },
    jerseySizeSurstockThreshold: 0.4,
    jerseySizePenalty: {
      ruptureFansPenaltyPerSize: 0.5,
      ruptureBrandPenaltyPerSize: 0.25,
      maxTotalPenaltyPerTurn: 3,
    },
  },
  sponsoring: {
    competitors: {
      stadium: {
        basketProB: {
          ledPrice: 15000,
          screenPrice: 9000,
          matchdayPackPrice: 18000,
          attractiveness: 0.85,
        },
        rugby: {
          ledPrice: 26000,
          screenPrice: 14000,
          matchdayPackPrice: 23000,
          attractiveness: 1.1,
        },
      },
      social: {
        higherReach: {
          postPrice: 7000,
          storyPrice: 4500,
          packPrice: 9500,
          reachFactor: 1.35,
        },
        lowerReach: {
          postPrice: 2800,
          storyPrice: 1600,
          packPrice: 3800,
          reachFactor: 0.75,
        },
      },
    },
    inventory: {
      ledMatches: 18,
      screenMatches: 18,
      matchdayPacks: 12,
      instagramPosts: 24,
      instagramStories: 36,
      socialPacks: 18,
      ledSlotsTotal: 120,
      screenSlotsTotal: 90,
      socialPostSlotsTotal: 160,
      socialStorySlotsTotal: 210,
    },
    advertising: {
      marketBudgetStadium: 420000,
      marketBudgetSocial: 210000,
      ledSlotsPerPack: 1,
      screenSlotsPerPack: 1,
      postSlotsPerPack: 2,
      storySlotsPerPack: 3,
    },
    leads: [
      {
        leadId: "LEAD_A",
        name: "Groupe HexaMedia",
        statement:
          "Nous cherchons une présence premium jour de match avec de la visibilité terrain et une expérience loge.",
        weights: {
          hospitality: 0.45,
          stadium: 0.4,
          social: 0.15,
        },
        priceSensitivity: 1.1,
        budgetReference: 45000,
        minBrandRequired: 55,
        threshold: 0.52,
      },
      {
        leadId: "LEAD_B",
        name: "StartUp Engage",
        statement:
          "Petit budget mais besoin d’activation digitale régulière pour nos lancements produits.",
        weights: {
          hospitality: 0.1,
          stadium: 0.15,
          social: 0.75,
        },
        priceSensitivity: 1.4,
        budgetReference: 18000,
        minBrandRequired: 48,
        threshold: 0.47,
      },
    ],
  },
  negotiationConfig: {
    defaultTrust: 60,
    defaultTension: 40,
  },
};
