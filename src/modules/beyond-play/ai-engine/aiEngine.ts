"use client";

import Ajv, { type ErrorObject } from "ajv";
import addFormats from "ajv-formats";

import schema from "./schemas/turn-package.schema.json";
import { turnTemplates, TurnTemplate } from "../seeds/turnTemplates";
import {
  GameState,
  KPIsState,
  EventSummary,
  TurnPackage,
  WorldBible,
  Scene,
  NegotiationScene,
} from "../game-state/types";
import { TurnHistoryEntry } from "../game-state/types";

export interface GenerateTurnInput {
  gameState: GameState;
  worldBible: WorldBible;
  history: TurnHistoryEntry[];
  templateOverride?: number;
}

type ValidationError = Pick<ErrorObject, "instancePath" | "message" | "keyword">;

const ajv = new Ajv({ strict: false, allErrors: true });
addFormats(ajv);
const validateTurnPackage = ajv.compile<TurnPackage>(schema);

const severityMap: Record<number, "low" | "medium" | "high"> = {
  1: "low",
  2: "medium",
  3: "high",
};

const aiCurrencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const aiPercentFormatter = new Intl.NumberFormat("fr-FR", {
  style: "percent",
  maximumFractionDigits: 0,
});

function pickTemplate(turnNumber: number, override?: number): TurnTemplate {
  if (override) {
    const template = turnTemplates.find((tpl) => tpl.turnNumber === override);
    if (template) return template;
  }
  return (
    turnTemplates.find((tpl) => tpl.turnNumber === turnNumber) ??
    turnTemplates[0]
  );
}

function buildContextNarrative(template: TurnTemplate): string {
  const { fixedContext } = template;
  const parts = [
    fixedContext.lastWeekHook,
    fixedContext.seasonRecap,
    `Tonalité: ${fixedContext.tone}`,
  ].filter(Boolean);
  return parts.join(" • ");
}

function buildScenes(template: TurnTemplate): Array<Scene | NegotiationScene> {
  return template.requiredScenes.slice(0, 2).map((seed, idx) => {
    if (seed.type === "NEGOTIATION") {
      const negotiation: NegotiationScene = {
        id: `scene-neg-${template.turnNumber}-${idx}`,
        type: "negotiation",
        title: template.title,
        description: seed.seed,
        involvedPartners: template.partnerSeeds.map((p) => p.partnerId).slice(
          0,
          2,
        ),
        partnerId: template.partnerSeeds[0]?.partnerId ?? "partner-unknown",
        context: {
          trust: 60,
          tension: 45,
          valueGap: 1500,
        },
        steps: Array.from({ length: 5 }).map((_, stepIdx) => ({
          step: stepIdx + 1,
          objection: `Objection ${stepIdx + 1}: ${seed.seed}`,
          responses: [
            { id: "concede", label: "Concéder partiellement", intent: "concede" },
            { id: "neutral", label: "Recentrer sur les chiffres", intent: "neutral" },
            { id: "push", label: "Mettre la pression positive", intent: "push" },
            { id: "creative", label: "Proposer une alternative créative", intent: "creative" },
          ],
        })),
      };
      return negotiation;
    }

    const scene: Scene = {
      id: `scene-${template.turnNumber}-${idx}`,
      type:
        seed.type === "BRIEFING"
          ? "briefing"
          : seed.type === "MEDIA"
          ? "media"
          : "internal",
      title: seed.seed.split(":")[0] ?? template.title,
      description: seed.seed,
      involvedPartners: template.partnerSeeds.map((p) => p.partnerId).slice(
        0,
        2,
      ),
    };
    return scene;
  });
}

export class AIEngine {
  async generateTurnPackage(input: GenerateTurnInput): Promise<TurnPackage> {
    const template = pickTemplate(
      input.gameState.turn + 1,
      input.templateOverride,
    );

    const events: EventSummary[] = template.forcedEvents.slice(0, 2).map((event, idx) => {
      const eventType: EventSummary["type"] =
        event.type === "MATCH_RESULT_NEWS"
          ? "match_result"
          : event.type === "SOCIAL_BACKLASH"
          ? "social_backlash"
          : event.type === "SPONSOR_COMPLAINT"
          ? "sponsorship"
          : event.type === "HOSPITALITY_INCIDENT"
          ? "hospitality_incident"
          : "good_news";

      return {
        id: `evt-${template.turnNumber}-${idx}`,
        type: eventType,
        severity: severityMap[event.severity] ?? "medium",
        summary: event.seed,
        partnerInvolved: template.partnerSeeds[0]?.partnerId,
      };
    });

    const scenes = buildScenes(template);

    const turnPackage: TurnPackage = {
      turnNumber: template.turnNumber,
      title: template.title,
      learningGoal: template.learningGoal,
      contextNarrative: buildContextNarrative(template),
      events,
      decisions: {
        sliders: template.requiredDecisions.sliders.map((slider) => ({
          ...slider,
        })),
        choices: template.requiredDecisions.choices.map((choice) => ({
          ...choice,
        })),
      },
      scenes,
    };

    if (input.gameState.kpis) {
      const snapshot = formatKpiSnapshot(input.gameState.kpis);
      turnPackage.contextNarrative = `${turnPackage.contextNarrative}\nKPIs: ${snapshot}`;
    }

    return turnPackage;
  }

  async feedbackInvalid(
    errors: (ValidationError | string)[],
    draft: unknown,
  ): Promise<void> {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[AIEngine] invalid draft", { errors, draft });
    }
  }

  validateSchema(candidate: TurnPackage): ValidationError[] {
    const valid = validateTurnPackage(candidate);
    if (!valid) {
      return (validateTurnPackage.errors ?? []).map(
        ({ instancePath, message, keyword }) => ({
          instancePath,
          message,
          keyword,
        }),
      );
    }
    return [];
  }
}

export const aiEngine = new AIEngine();

function formatKpiSnapshot(kpis: KPIsState): string {
  const fillRatePercent = aiPercentFormatter.format(Math.max(0, Math.min(1, kpis.matchday.fillRate)));
  const ticketRevenue = aiCurrencyFormatter.format(Math.round(kpis.matchday.ticketRevenuePerMatch));
  const jerseyMargin = aiCurrencyFormatter.format(Math.round(kpis.merchandising.jerseyGrossMargin));
  const sponsorRevenue = aiCurrencyFormatter.format(Math.round(kpis.sponsoring.totalRevenue));
  const cash = aiCurrencyFormatter.format(Math.round(kpis.transverse.cash));

  return [
    `Remplissage ${fillRatePercent} (${kpis.matchday.attendance} spectateurs)`,
    `Billetterie ${ticketRevenue}`,
    `Marge maillots ${jerseyMargin}`,
    `Sponsoring ${sponsorRevenue} · Sat ${Math.round(kpis.sponsoring.sponsorSatisfactionIndex)}/100`,
    `Cash ${cash}`,
    `Fans ${Math.round(kpis.transverse.fansIndex)}/100`,
    `Marque ${Math.round(kpis.transverse.brandIndex)}/100`,
  ].join(" • ");
}


