import { nanoid } from "nanoid";

import type { CourseBuilderSubchapter, WorkshopConfig, WorkshopMode } from "@/types/course-builder";

/** Uniquement pour un bloc `case_study`. Une leçon sans ce kind n'a pas de mode. */
export function workshopMode(workshop?: WorkshopConfig | null): WorkshopMode {
  return workshop?.mode === "atelier" ? "atelier" : "evaluation";
}

export function workshopActivityLabel(workshop?: WorkshopConfig | null): "Atelier" | "Étude de cas" {
  return workshopMode(workshop) === "atelier" ? "Atelier" : "Étude de cas";
}

export function workshopMaxImprovements(workshop?: WorkshopConfig | null): number {
  const value = Number(workshop?.maxImprovements);
  if (!Number.isFinite(value)) return 2;
  return Math.min(6, Math.max(0, Math.round(value)));
}

export function emptyWorkshop(mode: WorkshopMode = "atelier"): WorkshopConfig {
  return {
    mode,
    brief: "",
    situation: "",
    example: "",
    fields: [{ id: nanoid(), label: "", placeholder: "", type: "long" }],
    criteria: [
      { id: nanoid(), label: "" },
      { id: nanoid(), label: "" },
    ],
    maxImprovements: 2,
  };
}

export function isWorkshopBlock(item: { kind?: string | null }): boolean {
  return item.kind === "case_study";
}

export function readWorkshopConfig(raw: unknown): WorkshopConfig | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const value = raw as Record<string, unknown>;
  const fields = Array.isArray(value.fields)
    ? value.fields.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const field = item as Record<string, unknown>;
        const id = String(field.id ?? "").trim();
        if (!id) return [];
        return [
          {
            id,
            label: typeof field.label === "string" ? field.label : "",
            placeholder: typeof field.placeholder === "string" ? field.placeholder : "",
            type: field.type === "short" ? ("short" as const) : ("long" as const),
          },
        ];
      })
    : [];
  const criteria = Array.isArray(value.criteria)
    ? value.criteria.flatMap((item) => {
        if (!item || typeof item !== "object") return [];
        const criterion = item as Record<string, unknown>;
        const id = String(criterion.id ?? "").trim();
        if (!id) return [];
        return [{ id, label: typeof criterion.label === "string" ? criterion.label : "" }];
      })
    : [];
  return {
    mode: value.mode === "atelier" ? "atelier" : value.mode === "evaluation" ? "evaluation" : undefined,
    brief: typeof value.brief === "string" ? value.brief : "",
    situation: typeof value.situation === "string" ? value.situation : "",
    example: typeof value.example === "string" ? value.example : "",
    fields,
    criteria,
    maxImprovements: workshopMaxImprovements({ maxImprovements: Number(value.maxImprovements) }),
  };
}

export function findWorkshopBlock(
  snapshot: { sections?: { chapters?: { subchapters?: CourseBuilderSubchapter[] }[] }[] } | null,
  blockId: string,
): CourseBuilderSubchapter | null {
  for (const section of snapshot?.sections ?? []) {
    for (const chapter of section.chapters ?? []) {
      const found = (chapter.subchapters ?? []).find((sub) => sub.id === blockId && !sub.deleted_at);
      if (found) return found;
    }
  }
  return null;
}
