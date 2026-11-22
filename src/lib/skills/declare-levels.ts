export type DeclareLevelId = "debutant" | "intermediaire" | "confirme" | "expert";

export const DECLARE_LEVELS: ReadonlyArray<{
  id: DeclareLevelId;
  label: string;
  description: string;
  bars: 1 | 2 | 3 | 4;
}> = [
  { id: "debutant", label: "Débutant", description: "Je découvre, j'ai encore besoin d'aide", bars: 1 },
  {
    id: "intermediaire",
    label: "Intermédiaire",
    description: "Je m'en sers dans les situations courantes",
    bars: 2,
  },
  { id: "confirme", label: "Confirmé", description: "Je suis autonome, je m'en sers souvent", bars: 3 },
  { id: "expert", label: "Expert", description: "Je gère les cas complexes et j'aide les autres", bars: 4 },
];

export function declareLevelLabel(level: string | null | undefined): string | null {
  return DECLARE_LEVELS.find((l) => l.id === level)?.label ?? null;
}

export const DECLARE_CONTEXTS = [
  { id: "stage", label: "En stage" },
  { id: "job", label: "En job étudiant" },
  { id: "alternance", label: "En alternance" },
  { id: "asso_club", label: "Dans une asso ou un club" },
  { id: "perso", label: "Perso" },
] as const;

export type DeclareContextId = (typeof DECLARE_CONTEXTS)[number]["id"];

export function declareContextLabel(id: string | null | undefined): string | null {
  return DECLARE_CONTEXTS.find((c) => c.id === id)?.label ?? null;
}
