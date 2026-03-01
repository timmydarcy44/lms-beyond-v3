"use client";

import { aiEngine, GenerateTurnInput } from "../ai-engine/aiEngine";
import { rulesEngine, AppliedDecisions } from "../rules-engine/rulesEngine";
import {
  GameState,
  TurnPackage,
  WorldBible,
  TurnHistoryEntry,
  PricingState,
} from "../game-state/types";
import { turnTemplates } from "../seeds/turnTemplates";
import { clampGameState } from "../game-state/utils";
import { generateGameMasterFeedback, GameMasterFeedback } from "../ai-engine/gameMasterFeedback";
import { generateTurnReactions, TurnReaction } from "../ai-engine/reactionsEngine";

export type PricingFlags = {
  jerseyPriceExtreme?: boolean;
  ticketPriceExtreme?: boolean;
  vipPriceExtreme?: boolean;
  stadiumAdvertisingExtreme?: boolean;
  socialAdvertisingExtreme?: boolean;
};

export interface TurnPipelineResult {
  turnPackage: TurnPackage;
  nextState: GameState;
  issues: string[];
  feedback: GameMasterFeedback;
  reactions: TurnReaction[];
  pricingFlags: PricingFlags;
}

export async function runTurnPipeline(
  input: GenerateTurnInput,
  decisions: AppliedDecisions,
): Promise<TurnPipelineResult> {
  const turnPackage = await aiEngine.generateTurnPackage(input);
  const template =
    turnTemplates.find((tpl) => tpl.turnNumber === turnPackage.turnNumber) ??
    turnTemplates[0];

  const validation = rulesEngine.validate(
    turnPackage,
    template,
    input.worldBible,
  );
  if (validation.length > 0) {
    await aiEngine.feedbackInvalid(validation.map((issue) => issue.detail), turnPackage);
    throw new Error(
      `TurnPackage invalide: ${validation
        .map((issue) => `${issue.code}:${issue.detail}`)
        .join(", ")}`,
    );
  }

  const updatedState = rulesEngine.applyTurn(
    input.gameState,
    input.worldBible,
    template,
    turnPackage,
    decisions,
  );

  const nextState = clampGameState(updatedState, input.worldBible);
  const pricingFlags = detectPricingExtremes(
    nextState.pricing,
    input.worldBible,
    decisions,
  );
  const feedback = generateGameMasterFeedback({
    gameState: nextState,
    kpis: nextState.kpis,
    turnNumber: turnPackage.turnNumber,
    turnTitle: turnPackage.title,
  });
  const reactions = generateTurnReactions({
    state: nextState,
    kpis: nextState.kpis,
    turnNumber: turnPackage.turnNumber,
    pricingFlags,
  });

  return {
    turnPackage,
    nextState,
    issues: [],
    feedback,
    reactions,
    pricingFlags,
  };
}

export function appendHistory(
  history: TurnHistoryEntry[],
  entry: TurnHistoryEntry,
  maxEntries = 6,
): TurnHistoryEntry[] {
  return [entry, ...history].slice(0, maxEntries);
}

export function detectPricingExtremes(
  pricing: PricingState,
  worldBible: WorldBible,
  decisions?: AppliedDecisions,
): PricingFlags {
  const result: PricingFlags = {};
  const { referencePrices, vip } = worldBible;

  const jerseyReference = referencePrices.jersey;
  const jerseyDecision = decisions?.sliders?.S_JERSEY_PRICE_HT;
  if (
    isExtremeCandidate(jerseyDecision, jerseyReference) ||
    isExtreme(pricing.jersey, jerseyReference)
  ) {
    result.jerseyPriceExtreme = true;
  }

  const ticketRefs = referencePrices.ticket;
  const ticketValues = [
    {
      decision: decisions?.sliders?.S_TICKET_PRICE_VIRAGE,
      value: pricing.ticket.virage,
      reference: ticketRefs.virage,
    },
    {
      decision: decisions?.sliders?.S_TICKET_PRICE_CENTRALE,
      value: pricing.ticket.centrale,
      reference: ticketRefs.centrale,
    },
    {
      decision:
        decisions?.sliders?.S_TICKET_PRICE_VIP ??
        decisions?.sliders?.S_VIP_SEAT_PRICE_HT,
      value: pricing.ticket.hospitality,
      reference: ticketRefs.hospitality,
    },
  ];
  if (
    ticketValues.some(({ decision, value, reference }) =>
      isExtremeCandidate(decision, reference) || isExtreme(value, reference),
    )
  ) {
    result.ticketPriceExtreme = true;
  }

  const vipSeatRef = vip?.defaultSeatPrice ?? ticketRefs.hospitality;
  const vipBoxRef = vip?.defaultBoxPackPrice ?? (vipSeatRef > 0 ? vipSeatRef * 200 : 0);
  const vipValues = [
    {
      decision:
        decisions?.sliders?.S_VIP_SEAT_PRICE_HT ??
        decisions?.sliders?.S_TICKET_PRICE_VIP,
      value: pricing.vip?.seatPrice ?? pricing.ticket.hospitality,
      reference: vipSeatRef,
    },
    {
      decision: decisions?.sliders?.S_VIP_BOX_PACK_PRICE_HT,
      value: pricing.vip?.boxPackPrice ?? 0,
      reference: vipBoxRef,
    },
  ];
  if (
    vipValues.some(({ decision, value, reference }) =>
      isExtremeCandidate(decision, reference) || isExtreme(value, reference),
    )
  ) {
    result.vipPriceExtreme = true;
  }

  const sponsoringConfig = worldBible.sponsoring;
  if (sponsoringConfig) {
    const stadiumCompetitors = sponsoringConfig.competitors.stadium;
    const stadiumBenchmarks = {
      led: averagePrice([
        stadiumCompetitors.basketProB.ledPrice,
        stadiumCompetitors.rugby.ledPrice,
      ]),
      screen: averagePrice([
        stadiumCompetitors.basketProB.screenPrice,
        stadiumCompetitors.rugby.screenPrice,
      ]),
      matchdayPack: averagePrice([
        stadiumCompetitors.basketProB.matchdayPackPrice,
        stadiumCompetitors.rugby.matchdayPackPrice,
      ]),
    };

    const stadiumValues = [
      {
        decision: decisions?.sliders?.S_LED_PRICE_MATCH_HT ?? decisions?.sliders?.S_LED_PRICE,
        value: pricing.advertising.ledMatch,
        reference: stadiumBenchmarks.led,
      },
      {
        decision:
          decisions?.sliders?.S_SCREEN_PRICE_MATCH_HT ?? decisions?.sliders?.S_SCREEN_PRICE,
        value: pricing.advertising.screenMatch,
        reference: stadiumBenchmarks.screen,
      },
      {
        decision: decisions?.sliders?.S_MATCHDAY_PACK_PRICE_HT,
        value: pricing.advertising.matchdayPack,
        reference: stadiumBenchmarks.matchdayPack,
      },
    ];

    if (
      stadiumValues.some(({ decision, value, reference }) =>
        isExtremeCandidate(decision, reference) || isExtreme(value, reference),
      )
    ) {
      result.stadiumAdvertisingExtreme = true;
    }

    const socialCompetitors = sponsoringConfig.competitors.social;
    const socialBenchmarks = {
      post: averagePrice([
        socialCompetitors.higherReach.postPrice,
        socialCompetitors.lowerReach.postPrice,
      ]),
      story: averagePrice([
        socialCompetitors.higherReach.storyPrice,
        socialCompetitors.lowerReach.storyPrice,
      ]),
      pack: averagePrice([
        socialCompetitors.higherReach.packPrice,
        socialCompetitors.lowerReach.packPrice,
      ]),
    };

    const socialValues = [
      {
        decision: decisions?.sliders?.S_IG_POST_PRICE_HT,
        value: pricing.advertising.instagramPost,
        reference: socialBenchmarks.post,
      },
      {
        decision: decisions?.sliders?.S_IG_STORY_PRICE_HT,
        value: pricing.advertising.instagramStory,
        reference: socialBenchmarks.story,
      },
      {
        decision: decisions?.sliders?.S_SOCIAL_PACK_PRICE_HT,
        value: pricing.advertising.socialPack,
        reference: socialBenchmarks.pack,
      },
    ];

    if (
      socialValues.some(({ decision, value, reference }) =>
        isExtremeCandidate(decision, reference) || isExtreme(value, reference),
      )
    ) {
      result.socialAdvertisingExtreme = true;
    }
  }

  return result;
}

function isExtremeCandidate(value: number | undefined, reference: number): boolean {
  if (value === undefined) {
    return false;
  }
  return isExtreme(value, reference);
}

function isExtreme(value: number, reference: number): boolean {
  if (!Number.isFinite(value)) {
    return false;
  }
  if (value <= 0) {
    return true;
  }
  if (!Number.isFinite(reference) || reference <= 0) {
    return value <= 0;
  }
  const lowerBound = reference * 0.25;
  const upperBound = reference * 3;
  return value < lowerBound || value > upperBound;
}

function averagePrice(values: number[]): number {
  const valid = values.filter((entry) => Number.isFinite(entry) && entry > 0);
  if (valid.length === 0) {
    return 1;
  }
  const sum = valid.reduce((acc, entry) => acc + entry, 0);
  return sum / valid.length;
}


