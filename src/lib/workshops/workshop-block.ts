import { nanoid } from "nanoid";

import type {
  CourseBuilderSubchapter,
  WorkshopCharacter,
  WorkshopConfig,
  WorkshopMode,
  WorkshopPiece,
} from "@/types/course-builder";

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
  const personnage = readCharacter(value.personnage);
  const pieces = readPieces(value.pieces);
  return {
    mode: value.mode === "atelier" ? "atelier" : value.mode === "evaluation" ? "evaluation" : undefined,
    brief: typeof value.brief === "string" ? value.brief : "",
    situation: typeof value.situation === "string" ? value.situation : "",
    example: typeof value.example === "string" ? value.example : "",
    fields,
    criteria,
    maxImprovements: workshopMaxImprovements({ maxImprovements: Number(value.maxImprovements) }),
    ...(personnage ? { personnage } : {}),
    ...(pieces.length ? { pieces } : {}),
  };
}

function readCharacter(raw: unknown): WorkshopCharacter | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const row = raw as Record<string, unknown>;
  const nom = typeof row.nom === "string" ? row.nom.trim() : "";
  const fonction = typeof row.fonction === "string" ? row.fonction.trim() : "";
  const description = typeof row.description === "string" ? row.description.trim() : "";
  if (!nom && !fonction && !description) return undefined;
  return { nom, fonction, description };
}

function cellText(value: unknown, max = 500) {
  return value == null ? "" : String(value).slice(0, max);
}

function readPieces(raw: unknown): WorkshopPiece[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, 5).flatMap((item, index) => {
    if (!item || typeof item !== "object") return [];
    const row = item as Record<string, unknown>;
    const type = typeof row.type === "string" ? row.type.trim() : "";
    const titre = typeof row.titre === "string" && row.titre.trim() ? row.titre.trim() : `Pièce ${index + 1}`;
    const id = typeof row.id === "string" && row.id.trim() ? row.id.trim() : `piece-${index}`;
    if (type === "mail") {
      return [{ id, type: "mail" as const, titre, de: cellText(row.de), objet: cellText(row.objet, 300), contenu: cellText(row.contenu, 12000) }];
    }
    if (type === "note") return [{ id, type: "note" as const, titre, contenu: cellText(row.contenu, 12000) }];
    if (type === "fichier") {
      const url = typeof row.url === "string" ? row.url.trim() : "";
      return [{ id, type: "fichier" as const, titre, ...(url ? { url } : {}) }];
    }
    if (type === "donnees") {
      const colonnes = Array.isArray(row.colonnes) ? row.colonnes.map((cell) => cellText(cell)).filter(Boolean).slice(0, 12) : [];
      if (!colonnes.length) return [];
      const lignes = Array.isArray(row.lignes)
        ? row.lignes.slice(0, 40).map((line) => {
            const cells = Array.isArray(line) ? line : [];
            return colonnes.map((_, cellIndex) => cellText(cells[cellIndex]));
          })
        : [];
      return [{ id, type: "donnees" as const, titre, colonnes, lignes }];
    }
    return [];
  });
}

function clip(value: string | undefined, max = 3000) {
  const text = (value ?? "").trim();
  if (text.length <= max) return text;
  return `${text.slice(0, max)}…`;
}

/** Texte ajouté au prompt de retour. Un fichier n'envoie que son titre. */
export function workshopCaseBrief(workshop?: WorkshopConfig | null) {
  const lines: string[] = [];
  const situation = clip(workshop?.situation);
  if (situation) lines.push(`Situation :\n${situation}`);
  const person = workshop?.personnage;
  const nom = person?.nom?.trim() ?? "";
  const fonction = person?.fonction?.trim() ?? "";
  const description = clip(person?.description);
  if (nom || fonction || description) {
    lines.push(
      ["Personnage :", nom, fonction ? `Fonction : ${fonction}` : "", description].filter(Boolean).join("\n"),
    );
  }
  const pieces = workshop?.pieces ?? [];
  if (pieces.length) {
    lines.push(
      `Pièces :\n${pieces
        .map((piece) => {
          if (piece.type === "fichier") return `- Fichier « ${piece.titre} »`;
          if (piece.type === "mail") {
            return `- Mail « ${piece.titre} »\nDe : ${piece.de?.trim() || ""}\nObjet : ${piece.objet?.trim() || ""}\n${clip(piece.contenu)}`;
          }
          if (piece.type === "note") return `- Note « ${piece.titre} »\n${clip(piece.contenu)}`;
          const header = piece.colonnes.join(" | ");
          const rows = piece.lignes.map((row) => row.join(" | ")).join("\n");
          return `- Données « ${piece.titre} »\n${header}\n${clip(rows, 4000)}`;
        })
        .join("\n\n")}`,
    );
  }
  return lines.join("\n\n");
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
