"use client";

export type Tour1PresetName = "RUPTURE" | "SURSTOCK";

type DecisionValue = number | string;

type DecisionMap = Record<string, DecisionValue>;

const PRESET_CONFIG: Record<Tour1PresetName, DecisionMap> = {
  RUPTURE: {
    S_JERSEY_PRODUCTION_VOLUME: 2000,
    S_JERSEY_PRICE_HT: 52,
    C_JERSEY_STYLE: "MODERN",
    S_TICKET_PRICE_VIRAGE: 15,
    S_TICKET_PRICE_CENTRALE: 35,
    S_VIP_SEAT_PRICE_HT: 118,
    S_VIP_BOX_PACK_PRICE_HT: 32000,
    S_VIP_BOXES_SOLD: 6,
    S_JERSEY_SIZE_XXS: 3,
    S_JERSEY_SIZE_XS: 7,
    S_JERSEY_SIZE_S: 16,
    S_JERSEY_SIZE_M: 26,
    S_JERSEY_SIZE_L: 25,
    S_JERSEY_SIZE_XL: 17,
    S_JERSEY_SIZE_XXL: 6,
  },
  SURSTOCK: {
    S_JERSEY_PRODUCTION_VOLUME: 20000,
    S_JERSEY_PRICE_HT: 76,
    C_JERSEY_STYLE: "PREMIUM",
    S_TICKET_PRICE_VIRAGE: 20,
    S_TICKET_PRICE_CENTRALE: 50,
    S_VIP_SEAT_PRICE_HT: 175,
    S_VIP_BOX_PACK_PRICE_HT: 42000,
    S_VIP_BOXES_SOLD: 24,
    S_JERSEY_SIZE_XXS: 3,
    S_JERSEY_SIZE_XS: 7,
    S_JERSEY_SIZE_S: 16,
    S_JERSEY_SIZE_M: 26,
    S_JERSEY_SIZE_L: 25,
    S_JERSEY_SIZE_XL: 17,
    S_JERSEY_SIZE_XXL: 6,
  },
};

export function getTour1PresetDecisions(preset: Tour1PresetName): DecisionMap {
  return { ...PRESET_CONFIG[preset] };
}

