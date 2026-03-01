"use client";

import {
  clamp,
  clampGameState,
  updatePartnerById,
  addCash,
  adjustFansMood,
  createSizeAllocation,
  cloneSizeAllocation,
  normalizeSizeAllocation,
  sumSizeAllocation,
  distributeUnitsByAllocation,
} from "../game-state/utils";
import {
  ChoiceDecision,
  GameState,
  JerseySize,
  KPIsState,
  PricingState,
  TurnPackage,
  WorldBible,
  JERSEY_SIZES,
} from "../game-state/types";
import { TurnTemplate } from "../seeds/turnTemplates";
import { calculateJerseyUnitCost } from "./calculateJerseyUnitCost";
import { calculateKpis, computeDeltas } from "./kpi/calculateKpis";

export type ValidationIssue =
  | { code: "SCHEMA_INVALID"; detail: string }
  | { code: "DECISION_OUT_OF_RANGE"; detail: string }
  | { code: "TOO_MANY_EVENTS"; detail: string }
  | { code: "MISSING_DECISION"; detail: string };

export interface AppliedDecisions {
  sliders: Record<string, number>;
  choices: Record<string, string>;
}

const SIZE_SLIDER_IDS: Record<JerseySize, string> = {
  XXS: "S_JERSEY_SIZE_XXS",
  XS: "S_JERSEY_SIZE_XS",
  S: "S_JERSEY_SIZE_S",
  M: "S_JERSEY_SIZE_M",
  L: "S_JERSEY_SIZE_L",
  XL: "S_JERSEY_SIZE_XL",
  XXL: "S_JERSEY_SIZE_XXL",
};

const SLIDER_ID_TO_SIZE: Record<string, JerseySize> = Object.fromEntries(
  Object.entries(SIZE_SLIDER_IDS).map(([size, sliderId]) => [sliderId, size as JerseySize]),
) as Record<string, JerseySize>;

export class RulesEngine {
  validate(
    turnPackage: TurnPackage,
    template: TurnTemplate,
    bible: WorldBible,
  ): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    if (turnPackage.events.length > bible.limits.maxEventsPerTurn) {
      issues.push({
        code: "TOO_MANY_EVENTS",
        detail: `Events=${turnPackage.events.length}`,
      });
    }

    template.requiredDecisions.sliders.forEach((expected) => {
      const slider = turnPackage.decisions.sliders.find((s) => s.id === expected.id);
      if (!slider) {
        issues.push({
          code: "MISSING_DECISION",
          detail: `Slider ${expected.id} manquant`,
        });
        return;
      }
      if (slider.min !== expected.min || slider.max !== expected.max) {
        issues.push({
          code: "DECISION_OUT_OF_RANGE",
          detail: `Slider ${expected.id} bornes différentes`,
        });
      }
    });

    template.requiredDecisions.choices.forEach((expected) => {
      const choice = turnPackage.decisions.choices.find((c) => c.id === expected.id);
      if (!choice) {
        issues.push({
          code: "MISSING_DECISION",
          detail: `Choice ${expected.id} manquant`,
        });
      } else if (choice.options.length !== expected.options.length) {
        issues.push({
          code: "DECISION_OUT_OF_RANGE",
          detail: `Choice ${expected.id} options mismatch`,
        });
      }
    });

    return issues;
  }

  applyTurn(
    state: GameState,
    bible: WorldBible,
    template: TurnTemplate,
    turnPackage: TurnPackage,
    decisions: AppliedDecisions,
  ): GameState {
    const updatedPricing: PricingState = {
      ticket: { ...state.pricing.ticket },
      subscription: { ...state.pricing.subscription },
      jersey: state.pricing.jersey,
      sponsor: { ...state.pricing.sponsor },
      advertising: { ...state.pricing.advertising },
      vip: { ...state.pricing.vip },
    };

    let carryoverStockBySize = state.merchandising?.jerseyStockBySizeRemaining
      ? cloneSizeAllocation(state.merchandising.jerseyStockBySizeRemaining)
      : null;

    if (!carryoverStockBySize) {
      const previousStockValue = Math.max(0, state.merchandising?.jerseyStockRemaining ?? 0);
      const fallbackMix = normalizeSizeAllocation(
        bible.merchandising.jerseyDefaultSizeMix,
        bible.merchandising.jerseyDefaultSizeMix,
      );
      carryoverStockBySize =
        previousStockValue > 0
          ? distributeUnitsByAllocation(previousStockValue, fallbackMix)
          : createSizeAllocation(0);
    }

    const carryoverStockBySizeResolved = carryoverStockBySize;

    const carryoverStock = Math.max(
      0,
      Math.round(sumSizeAllocation(carryoverStockBySizeResolved)),
    );
    const carryoverValue = Math.max(0, state.merchandising?.jerseyInventoryValue ?? 0);

    let merchandisingState = {
      jerseyStockInitial: carryoverStock,
      jerseyStockRemaining: carryoverStock,
      jerseyStockBySizeInitial: cloneSizeAllocation(carryoverStockBySizeResolved),
      jerseyStockBySizeRemaining: cloneSizeAllocation(carryoverStockBySizeResolved),
      jerseyUnitsSoldBySize: createSizeAllocation(0),
      jerseyInventoryValue: carryoverValue,
      jerseyRupture: false,
      jerseySurstock: false,
      jerseyRuptureSizes: [] as JerseySize[],
      jerseySurstockSizes: [] as JerseySize[],
    };

    let nextState: GameState = {
      ...state,
      turn: turnPackage.turnNumber,
      pricing: updatedPricing,
      merchandising: merchandisingState,
    };

    const previousKpis = state.kpis;

    const sliderSelections: Record<string, number> = {};
    template.requiredDecisions.sliders.forEach((slider) => {
      const rawValue = decisions.sliders[slider.id];
      const fallbackValue = slider.defaultValue ?? slider.min;
      const numericValue = typeof rawValue === "number" ? rawValue : fallbackValue;
      sliderSelections[slider.id] = clamp(numericValue, slider.min, slider.max);
    });

    const sizeAllocationInputs = createSizeAllocation(0);
    let hasCustomSizeMix = false;
    JERSEY_SIZES.forEach((size) => {
      const sliderId = SIZE_SLIDER_IDS[size];
      const value = sliderSelections[sliderId];
      if (typeof value === "number" && Number.isFinite(value) && value >= 0) {
        sizeAllocationInputs[size] = value;
        if (value > 0) {
          hasCustomSizeMix = true;
        }
      }
    });

    let productionVolume = 0;
    let productionCost = 0;

    template.requiredDecisions.sliders.forEach((slider) => {
      const bounded = sliderSelections[slider.id];
      if (bounded === undefined) {
        return;
      }

      if (SLIDER_ID_TO_SIZE[slider.id]) {
        return;
      }

      switch (slider.id) {
        case "S_VIP_SEAT_PRICE_HT": {
          updatedPricing.vip.seatPrice = Math.max(0, bounded);
          updatedPricing.ticket.hospitality = Math.max(0, bounded);
          break;
        }
        case "S_VIP_BOX_PACK_PRICE_HT": {
          updatedPricing.vip.boxPackPrice = Math.max(0, bounded);
          break;
        }
        case "S_VIP_BOXES_SOLD": {
          const maxBoxes = bible.vip?.vipBoxMaxSoldPerMatch ?? slider.max ?? bounded;
          updatedPricing.vip.boxesSold = Math.round(clamp(bounded, slider.min, maxBoxes));
          break;
        }
        case "S_JERSEY_PRODUCTION_VOLUME": {
          productionVolume = Math.max(0, Math.round(bounded));
          if (productionVolume > 0) {
            const unitCost = calculateJerseyUnitCost(productionVolume, bible.jerseyUnitCostTable);
            productionCost = Math.round(unitCost * productionVolume);
            if (productionCost > 0) {
              nextState.cash -= productionCost;
            }
          } else {
            productionCost = 0;
          }
          break;
        }
        case "S_JERSEY_PRICE_HT":
        case "S_JERSEY_PRICE":
          updatedPricing.jersey = bounded;
          break;
        case "S_TICKET_PRICE_VIRAGE":
          updatedPricing.ticket.virage = bounded;
          break;
        case "S_TICKET_PRICE_CENTRALE":
          updatedPricing.ticket.centrale = bounded;
          break;
        case "S_TICKET_PRICE_VIP":
          updatedPricing.ticket.hospitality = bounded;
          updatedPricing.vip.seatPrice = bounded;
          break;
        default:
          applySliderToPricing(updatedPricing, slider.id, bounded);
          break;
      }
    });

    if (hasCustomSizeMix) {
      const allocationSum = JERSEY_SIZES.reduce(
        (acc, size) => acc + (sizeAllocationInputs[size] ?? 0),
        0,
      );
      if (Math.abs(allocationSum - 100) > 0.5) {
        console.warn(
          `[BeyondFC][rulesEngine] Répartition tailles (${allocationSum.toFixed(
            2,
          )}%) ≠ 100%. Normalisation appliquée.`,
        );
      }
    }

    const defaultSizeMix = bible.merchandising.jerseyDefaultSizeMix;
    const normalizedSizeMix = normalizeSizeAllocation(
      hasCustomSizeMix ? sizeAllocationInputs : defaultSizeMix,
      defaultSizeMix,
    );

    const productionBySize =
      productionVolume > 0
        ? distributeUnitsByAllocation(productionVolume, normalizedSizeMix)
        : createSizeAllocation(0);

    const stockBySizeInitial = cloneSizeAllocation(carryoverStockBySizeResolved);
    JERSEY_SIZES.forEach((size) => {
      stockBySizeInitial[size] =
        (stockBySizeInitial[size] ?? 0) + (productionBySize[size] ?? 0);
    });

    const totalStockUnits = Math.max(0, Math.round(sumSizeAllocation(stockBySizeInitial)));
    const stockBySizeRemaining = cloneSizeAllocation(stockBySizeInitial);

    merchandisingState = {
      jerseyStockInitial: totalStockUnits,
      jerseyStockRemaining: totalStockUnits,
      jerseyStockBySizeInitial: stockBySizeInitial,
      jerseyStockBySizeRemaining: stockBySizeRemaining,
      jerseyUnitsSoldBySize: createSizeAllocation(0),
      jerseyInventoryValue: carryoverValue + productionCost,
      jerseyRupture: false,
      jerseySurstock: false,
      jerseyRuptureSizes: [],
      jerseySurstockSizes: [],
    };

    nextState = {
      ...nextState,
      merchandising: merchandisingState,
    };

    template.requiredDecisions.choices.forEach((choice) => {
      const pickedOptionId = decisions.choices[choice.id];
      if (!pickedOptionId) return;
      const option = choice.options.find((opt) => opt.id === pickedOptionId);
      if (!option) return;
      switch (option.id) {
        case "A":
          nextState = adjustFansMood(nextState, 4);
          break;
        case "B":
          nextState = adjustFansMood(nextState, -2);
          nextState = addCash(nextState, 2000);
          break;
        case "C":
          nextState = addCash(nextState, 4000);
          break;
        case "D":
          nextState = adjustFansMood(nextState, -4);
          break;
        default:
          break;
      }
    });

    template.partnerSeeds.forEach((partnerSeed) => {
      nextState = updatePartnerById(nextState, partnerSeed.partnerId, (partner) => ({
        ...partner,
        satisfaction: clamp(partner.satisfaction + (partnerSeed.profile === "EMOTIONAL" ? -10 : -5), 0, 100),
        notes: [
          ...partner.notes,
          {
            turn: turnPackage.turnNumber,
            summary: `Événement: ${turnPackage.title}`,
          },
        ],
      }));
    });

    const clampedState = clampGameState(
      {
        ...nextState,
        pricing: updatedPricing,
      },
      bible,
    );

    const kpis = calculateKpis({
      state: clampedState,
      worldBible: bible,
      previousKpis,
      decisionsApplied: decisions,
    });

    const previousCashValue = previousKpis?.transverse.cash ?? state.cash;
    const jerseyRevenue = kpis.merchandising.jerseyRevenue;

    let workingState: GameState = {
      ...clampedState,
      cash: clampedState.cash + jerseyRevenue,
      merchandising: {
        ...clampedState.merchandising,
        jerseyStockInitial: kpis.merchandising.jerseyStockInitial,
        jerseyStockRemaining: kpis.merchandising.jerseyStockRemaining,
        jerseyStockBySizeInitial: cloneSizeAllocation(
          kpis.merchandising.jerseyStockBySizeInitial,
        ),
        jerseyStockBySizeRemaining: cloneSizeAllocation(
          kpis.merchandising.jerseyStockBySizeRemaining,
        ),
        jerseyUnitsSoldBySize: cloneSizeAllocation(
          kpis.merchandising.jerseyUnitsSoldBySize,
        ),
        jerseyInventoryValue: kpis.merchandising.jerseyInventoryValue,
        jerseyRupture: kpis.merchandising.jerseyRupture,
        jerseySurstock: kpis.merchandising.jerseySurstock,
        jerseyRuptureSizes: [...kpis.merchandising.jerseyRuptureSizes],
        jerseySurstockSizes: [...kpis.merchandising.jerseySurstockSizes],
      },
    };

    if (kpis.merchandising.jerseyRupture) {
      const [minSatisfaction, maxSatisfaction] = bible.limits.satisfactionBounds;
      workingState = {
        ...workingState,
        fansMood: clamp(workingState.fansMood - 2, minSatisfaction, maxSatisfaction),
        brandAwareness: clamp(
          workingState.brandAwareness - 1,
          minSatisfaction,
          maxSatisfaction,
        ),
      };
    }

    const ruptureSizesCount = kpis.merchandising.jerseyRuptureSizes.length;
    if (ruptureSizesCount > 0) {
      const sizePenalty = bible.merchandising.jerseySizePenalty;
      const extraFansPenalty = Math.min(
        sizePenalty.maxTotalPenaltyPerTurn,
        ruptureSizesCount * sizePenalty.ruptureFansPenaltyPerSize,
      );
      const extraBrandPenalty = Math.min(
        sizePenalty.maxTotalPenaltyPerTurn,
        ruptureSizesCount * sizePenalty.ruptureBrandPenaltyPerSize,
      );
      if (extraFansPenalty > 0 || extraBrandPenalty > 0) {
        const [minSatisfaction, maxSatisfaction] = bible.limits.satisfactionBounds;
        workingState = {
          ...workingState,
          fansMood: clamp(workingState.fansMood - extraFansPenalty, minSatisfaction, maxSatisfaction),
          brandAwareness: clamp(
            workingState.brandAwareness - extraBrandPenalty,
            minSatisfaction,
            maxSatisfaction,
          ),
        };
      }
    }

    const finalCash = workingState.cash;
    const finalFans = workingState.fansMood;
    const finalBrand = workingState.brandAwareness;

    const kpisAdjusted: KPIsState = {
      ...kpis,
      merchandising: {
        ...kpis.merchandising,
      },
      transverse: {
        ...kpis.transverse,
        cash: finalCash,
        brandIndex: finalBrand,
        fansIndex: finalFans,
        cashDeltaThisTurn: finalCash - previousCashValue,
      },
    };

    const deltas = computeDeltas(previousKpis, kpisAdjusted);

    const kpisWithDeltas: KPIsState = {
      ...kpisAdjusted,
      transverse: {
        ...kpisAdjusted.transverse,
        cashDeltaThisTurn: deltas.cashDeltaThisTurn,
        brandDeltaThisTurn: deltas.brandDeltaThisTurn,
        fansDeltaThisTurn: deltas.fansDeltaThisTurn,
      },
    };

    const finalState = clampGameState(
      {
        ...workingState,
        pricing: updatedPricing,
        lastTurnKpis: previousKpis,
        kpis: kpisWithDeltas,
      },
      bible,
    );

    return finalState;
  }
}

export const rulesEngine = new RulesEngine();

function applySliderToPricing(pricing: PricingState, sliderId: string, value: number) {
  switch (sliderId) {
    case "S_JERSEY_PRICE":
    case "S_JERSEY_PRICE_HT":
      pricing.jersey = value;
      break;
    case "S_SUB_VIRAGE":
      pricing.subscription.virage = value;
      break;
    case "S_SUB_CENTRALE":
      pricing.subscription.centrale = value;
      break;
    case "S_TICKET_PRICE_VIRAGE":
      pricing.ticket.virage = value;
      break;
    case "S_TICKET_PRICE_CENTRALE":
      pricing.ticket.centrale = value;
      break;
    case "S_TICKET_PRICE_VIP":
      pricing.ticket.hospitality = value;
      break;
    case "S_LED_PRICE_MATCH_HT":
    case "S_LED_PRICE":
      pricing.advertising.ledMatch = value;
      break;
    case "S_SCREEN_PRICE_MATCH_HT":
    case "S_SCREEN_PRICE":
      pricing.advertising.screenMatch = value;
      break;
    case "S_MATCHDAY_PACK_PRICE_HT":
      pricing.advertising.matchdayPack = value;
      break;
    case "S_IG_POST_PRICE_HT":
      pricing.advertising.instagramPost = value;
      break;
    case "S_IG_STORY_PRICE_HT":
      pricing.advertising.instagramStory = value;
      break;
    case "S_SOCIAL_PACK_PRICE_HT":
      pricing.advertising.socialPack = value;
      break;
    default:
      break;
  }
}


