import { z } from "zod";

export const situationFileSchema = z
  .object({
    format: z.literal("byound-mise-en-situation"),
    formatVersion: z.number().int().optional(),
    id: z.string().min(1).max(80),
    version: z.number().int().optional(),
    title: z.string().min(1).max(200),
    character: z.object({
      name: z.string().min(1).max(120),
      role: z.string().min(1).max(200),
      initials: z.string().min(1).max(4),
    }),
    learnerBrief: z.string().min(1).max(20_000),
    characterPrompt: z.string().min(20).max(100_000),
    variants: z
      .array(
        z.object({
          id: z.string().min(1).max(80),
          name: z.string().min(1).max(120),
          instructions: z.string().min(1).max(20_000),
          opening: z.string().min(1).max(4_000),
        }),
      )
      .min(1)
      .max(20),
    variantMode: z.enum(["random", "fixed"]),
    fixedVariantId: z.string().max(80).optional(),
    maxTurns: z.number().int().min(1).max(40),
    minTurns: z.number().int().min(1).max(40),
    stateTag: z
      .object({
        name: z.string().optional(),
        endMove: z.string().optional(),
      })
      .optional(),
    evaluationPrompt: z.string().min(20).max(100_000),
    scoring: z.object({
      max: z.number().int().optional(),
      passingScore: z.number().int().min(0).max(100),
      criteria: z
        .array(
          z.object({
            id: z.string().min(1).max(80),
            label: z.string().min(1).max(200),
            max: z.number().int().min(1).max(100),
          }),
        )
        .min(1)
        .max(12),
      endings: z
        .array(
          z.object({
            id: z.string().min(1).max(80),
            min: z.number().int().min(0).max(100),
            title: z.string().min(1).max(200),
          }),
        )
        .min(1)
        .max(12),
    }),
    resultSchema: z.record(z.string(), z.unknown()),
    model: z
      .object({
        character: z.object({ temperature: z.number().min(0).max(2).optional() }).optional(),
        evaluation: z.object({ temperature: z.number().min(0).max(2).optional() }).optional(),
      })
      .optional(),
  })
  .refine((data) => data.minTurns <= data.maxTurns, {
    message: "Le minimum d'échanges doit être inférieur ou égal au maximum.",
    path: ["minTurns"],
  });

export type SituationScenario = z.infer<typeof situationFileSchema>;

export type SituationPublic = {
  title: string;
  character: SituationScenario["character"];
  learnerBrief: string;
  minTurns: number;
  maxTurns: number;
  passingScore: number;
  criteria: SituationScenario["scoring"]["criteria"];
  endings: SituationScenario["scoring"]["endings"];
};

export function situationPublicView(scenario: SituationScenario): SituationPublic {
  return {
    title: scenario.title,
    character: scenario.character,
    learnerBrief: scenario.learnerBrief,
    minTurns: scenario.minTurns,
    maxTurns: scenario.maxTurns,
    passingScore: scenario.scoring.passingScore,
    criteria: scenario.scoring.criteria,
    endings: scenario.scoring.endings,
  };
}

export function formatSituationIssues(error: z.ZodError): string {
  return error.issues.map((issue) => `${issue.path.join(".") || "fichier"}: ${issue.message}`).join("\n");
}
