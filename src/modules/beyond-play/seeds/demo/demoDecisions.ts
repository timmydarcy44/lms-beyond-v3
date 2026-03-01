"use client";

import { TurnTemplate } from "../turnTemplates";
import { turnTemplates } from "../turnTemplates";

export type DemoDecision = {
  turnNumber: number;
  sliders: Record<string, number>;
  choices: Record<string, string>;
};

const demoBaseTurns: TurnTemplate[] = turnTemplates.slice(0, 10).map((turn) =>
  typeof structuredClone === "function"
    ? structuredClone(turn)
    : (JSON.parse(JSON.stringify(turn)) as TurnTemplate),
);

function computeMidpoint(value: { min: number; max: number }): number {
  return Number(((value.min + value.max) / 2).toFixed(2));
}

export const demoDecisions: DemoDecision[] = demoBaseTurns.map((template) => {
  const sliders = Object.fromEntries(
    template.requiredDecisions.sliders.map((slider) => {
      const midpoint = computeMidpoint({ min: slider.min, max: slider.max });
      return [slider.id, midpoint];
    }),
  );

  const choices = Object.fromEntries(
    template.requiredDecisions.choices.map((choice) => [
      choice.id,
      choice.options[0]?.id ?? "",
    ]),
  );

  return {
    turnNumber: template.turnNumber,
    sliders,
    choices,
  };
});

export const demoTurns: TurnTemplate[] = demoBaseTurns.map((template) => {
  const decisions = demoDecisions.find(
    (decision) => decision.turnNumber === template.turnNumber,
  );
  if (!decisions) {
    return template;
  }

  return {
    ...template,
    requiredDecisions: {
      sliders: template.requiredDecisions.sliders.map((slider) => ({
        ...slider,
        defaultValue:
          typeof decisions.sliders[slider.id] === "number"
            ? decisions.sliders[slider.id]
            : slider.defaultValue,
      })),
      choices: template.requiredDecisions.choices.map((choice) => ({ ...choice })),
    },
  };
});

