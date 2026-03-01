"use client";

import { WorldBible } from "../../game-state/types";
import { defaultWorldBible } from "../../game-state/worldBible";

export const demoWorldBible: WorldBible = {
  ...defaultWorldBible,
  referencePrices: {
    ticket: {
      virage: 22,
      centrale: 42,
      hospitality: 135,
    },
    subscription: {
      virage: 240,
      centrale: 540,
    },
    jersey: 49,
    sponsor: {
      ...defaultWorldBible.referencePrices.sponsor,
      led: 21500,
      giantScreen: 11500,
      hospitality: 16500,
      jersey: 19500,
      digital: 6500,
      backdrop: 8000,
    },
  },
  stadium: {
    ...defaultWorldBible.stadium,
    capacityTotal: 28500,
    capacity: 28500,
    segments: {
      virage: { seats: 14500 },
      centrale: { seats: 11000 },
      hospitality: { seats: 3000 },
    },
  },
  limits: {
    ...defaultWorldBible.limits,
    attendanceDeltaPerTurn: 0.18,
    jerseyUnitsDeltaPerTurn: 2,
    minCash: -150000,
    maxCash: 1600000,
  },
  demandModel: {
    ...defaultWorldBible.demandModel,
    baseAttendanceRate: 0.72,
    baseJerseyDemand: 980,
    ticketDemandElasticity: 0.14,
    jerseyDemandElasticity: 0.22,
    fansWeight: 0.4,
    brandWeight: 0.3,
    fansWeightMatchday: 0.32,
    brandWeightMatchday: 0.22,
    priceSensitivity: 0.18,
  },
};

