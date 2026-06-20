export const SOFT_SKILLS_FREQUENCY_OPTIONS = [
  { value: 1, shortLabel: "1", label: "Jamais" },
  { value: 2, shortLabel: "2", label: "Rarement" },
  { value: 3, shortLabel: "3", label: "Parfois" },
  { value: 4, shortLabel: "4", label: "Souvent" },
  { value: 5, shortLabel: "5", label: "Toujours" },
] as const;

/** @deprecated Alias conservé pour imports existants */
export const SOFT_SKILLS_LIKERT_OPTIONS = SOFT_SKILLS_FREQUENCY_OPTIONS;
