"use client";

import {
  AppliedDecisions,
  rulesEngine,
} from "../rules-engine/rulesEngine";
import {
  GameState,
  TurnHistoryEntry,
  TurnPackage,
  WorldBible,
  KPIsState,
} from "../game-state/types";
import { TurnTemplate } from "../seeds/turnTemplates";
import { runKpiSanityChecks, SanityIssue } from "../rules-engine/kpi/kpiSanity";
import { clamp } from "../game-state/utils";
import { generateGameMasterFeedback } from "../ai-engine/gameMasterFeedback";
import { generateTurnReactions } from "../ai-engine/reactionsEngine";
import { detectPricingExtremes } from "./pipeline";
import type { TurnPipelineResult } from "./pipeline";

export type StressPreset =
  | "LOW_PRICES"
  | "HIGH_PRICES"
  | "MAX_MARKETING"
  | "MIN_MARKETING"
  | "AGGRESSIVE_SPONSOR_PRICING";

export interface StressTestResult {
  entries: TurnHistoryEntry[];
  sanity: SanityIssue[];
}

export function runStressTest(params: {
  presets: StressPreset[];
  turnsCount?: number;
  seedTurns: TurnTemplate[];
  worldBible: WorldBible;
  initialState: GameState;
}): StressTestResult {
  const {
    presets,
    seedTurns,
    worldBible,
    initialState,
    turnsCount = 10,
  } = params;

  const issues: SanityIssue[] = [];
  const history: TurnHistoryEntry[] = [];

  let currentState = cloneState(initialState);
  let previousKpis: KPIsState | undefined = currentState.lastTurnKpis;

  for (let turnIndex = 0; turnIndex < turnsCount; turnIndex += 1) {
    const template =
      seedTurns[turnIndex % seedTurns.length] ??
      seedTurns[seedTurns.length - 1];

    const decisions = generateDecisions(template, presets);
    const turnPackage = buildTurnPackageFromTemplate(template, currentState);

    const nextState = rulesEngine.applyTurn(
      currentState,
      worldBible,
      template,
      turnPackage,
      decisions,
    );

    const sanityForTurn = runKpiSanityChecks({
      state: nextState,
      worldBible,
      kpis: nextState.kpis,
      lastKpis: previousKpis,
    }).map((issue) => ({
      ...issue,
      turnNumber: turnPackage.turnNumber,
    }));

    issues.push(...sanityForTurn);

    const feedback = generateGameMasterFeedback({
      gameState: nextState,
      kpis: nextState.kpis,
      turnNumber: turnPackage.turnNumber,
      turnTitle: turnPackage.title,
    });
    const pricingFlags = detectPricingExtremes(nextState.pricing, worldBible);
    const reactions = generateTurnReactions({
      state: nextState,
      kpis: nextState.kpis,
      turnNumber: turnPackage.turnNumber,
      pricingFlags,
    });

    const turnResult: TurnPipelineResult = {
      turnPackage,
      nextState,
      issues: sanityForTurn.map((issue) => issue.code),
      feedback,
      reactions,
      pricingFlags,
    };

    history.push({
      turnNumber: turnPackage.turnNumber,
      package: turnPackage,
      appliedDecisions: decisions,
      stateAfter: nextState,
      result: turnResult,
    });

    previousKpis = nextState.kpis;
    currentState = nextState;
  }

  return {
    entries: history,
    sanity: issues.slice(0, 50),
  };
}

function generateDecisions(
  template: TurnTemplate,
  presets: StressPreset[],
): AppliedDecisions {
  const sliders: Record<string, number> = {};
  const choices: Record<string, string> = {};

  template.requiredDecisions.sliders.forEach((slider) => {
    let value = slider.defaultValue;
    presets.forEach((preset) => {
      switch (preset) {
        case "LOW_PRICES":
          if (isPriceSlider(slider)) {
            value = slider.min;
          }
          break;
        case "HIGH_PRICES":
          if (isPriceSlider(slider)) {
            value = slider.max;
          }
          break;
        case "MAX_MARKETING":
          if (isMarketingSlider(slider)) {
            value = slider.max;
          }
          break;
        case "MIN_MARKETING":
          if (isMarketingSlider(slider)) {
            value = slider.min;
          }
          break;
        case "AGGRESSIVE_SPONSOR_PRICING":
          if (isSponsorSlider(slider)) {
            value = slider.max;
          }
          break;
        default:
          break;
      }
    });
    sliders[slider.id] = clamp(value, slider.min, slider.max);
  });

  template.requiredDecisions.choices.forEach((choice) => {
    const defaultOption = choice.options[0];
    let selected = defaultOption.id;
    presets.forEach((preset) => {
      switch (preset) {
        case "LOW_PRICES":
          selected = choice.options[0]?.id ?? selected;
          break;
        case "HIGH_PRICES":
        case "AGGRESSIVE_SPONSOR_PRICING":
          selected = choice.options[choice.options.length - 1]?.id ?? selected;
          break;
        case "MAX_MARKETING":
          selected = choice.options[Math.min(2, choice.options.length - 1)]?.id ?? selected;
          break;
        case "MIN_MARKETING":
          selected = choice.options[0]?.id ?? selected;
          break;
        default:
          break;
      }
    });
    choices[choice.id] = selected;
  });

  return { sliders, choices };
}

function buildTurnPackageFromTemplate(
  template: TurnTemplate,
  state: GameState,
): TurnPackage {
  const turnNumber = state.turn + 1;

  return {
    turnNumber,
    title: template.title,
    learningGoal: template.learningGoal,
    contextNarrative: template.fixedContext.lastWeekHook ?? "",
    events: template.forcedEvents.slice(0, 3).map((event, idx) => ({
      id: `evt-stress-${turnNumber}-${idx}`,
      type:
        event.type === "SPONSOR_COMPLAINT"
          ? "sponsorship"
          : event.type === "SOCIAL_BACKLASH"
          ? "social_backlash"
          : event.type === "MATCH_RESULT_NEWS"
          ? "match_result"
          : event.type === "HOSPITALITY_INCIDENT"
          ? "hospitality_incident"
          : "good_news",
      severity: event.severity === 3 ? "high" : event.severity === 2 ? "medium" : "low",
      summary: event.seed,
      partnerInvolved: template.partnerSeeds[0]?.partnerId,
    })),
    decisions: {
      sliders: template.requiredDecisions.sliders.map((slider) => ({ ...slider })),
      choices: template.requiredDecisions.choices.map((choice) => ({ ...choice })),
    },
    scenes: [],
  };
}

function cloneState(state: GameState): GameState {
  if (typeof structuredClone === "function") {
    return structuredClone(state);
  }
  return JSON.parse(JSON.stringify(state)) as GameState;
}

function isPriceSlider(slider: TurnTemplate["requiredDecisions"]["sliders"][number]): boolean {
  return (
    slider.metric === "price_led" ||
    slider.metric === "price_ticket" ||
    slider.metric === "price_subscription" ||
    /prix/i.test(slider.label)
  );
}

function isMarketingSlider(
  slider: TurnTemplate["requiredDecisions"]["sliders"][number],
): boolean {
  return (
    slider.metric === "activation_budget" ||
    slider.metric === "marketing_cut" ||
    /budget/i.test(slider.label) ||
    /marketing/i.test(slider.label)
  );
}

function isSponsorSlider(
  slider: TurnTemplate["requiredDecisions"]["sliders"][number],
): boolean {
  return (
    slider.metric === "price_led" ||
    /sponsor/i.test(slider.label) ||
    /pack/i.test(slider.label)
  );
}


