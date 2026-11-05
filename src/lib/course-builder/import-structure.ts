import { nanoid } from "nanoid";

import type { CourseBuilderSection, CourseBuilderSubchapter, WorkshopCharacter, WorkshopFieldType, WorkshopPiece } from "@/types/course-builder";

export type ImportWarning = {
  chapter: string;
  title: string;
  message: string;
};

const CONTENT_TYPES = new Set(["video", "audio", "document", "text", "interactive_game"]);

function textOf(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function lessonFrom(raw: unknown, index: number): CourseBuilderSubchapter {
  if (typeof raw === "string") {
    return {
      id: nanoid(),
      title: raw.trim() || `Sous-chapitre ${index + 1}`,
      duration: "",
      type: "text",
      summary: "",
      content: "",
    };
  }
  const row = (raw ?? {}) as Record<string, unknown>;
  const type = textOf(row.type);
  return {
    id: textOf(row.id) || nanoid(),
    title: textOf(row.title) || `Sous-chapitre ${index + 1}`,
    duration: textOf(row.duration),
    type: CONTENT_TYPES.has(type) ? (type as CourseBuilderSubchapter["type"]) : "text",
    summary: textOf(row.summary),
    content: textOf(row.content),
  };
}

function atelierError(chapter: string, title: string, message: string): ImportWarning {
  const where = chapter ? `Chapitre « ${chapter} », atelier « ${title} »` : `Atelier « ${title} »`;
  return {
    chapter,
    title,
    message: `${where} : ${message}`,
  };
}

export function parseAtelierDraftText(text: string):
  | { ok: true; title: string; workshop: NonNullable<CourseBuilderSubchapter["workshop"]> }
  | { ok: false; message: string } {
  const trimmed = text.trim();
  if (!trimmed) return { ok: false, message: "Collez le JSON de l'atelier." };
  let raw: unknown;
  try {
    raw = JSON.parse(trimmed);
  } catch {
    return { ok: false, message: "Ce JSON n'est pas valide." };
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { ok: false, message: "Le JSON doit être un objet atelier." };
  }
  if (Array.isArray((raw as { sections?: unknown }).sections)) {
    return { ok: false, message: "Collez l'objet de l'atelier, pas la structure de la formation." };
  }
  const parsed = readAtelier(raw as Record<string, unknown>, "");
  if ("warning" in parsed) return { ok: false, message: parsed.warning.message };
  return { ok: true, title: parsed.block.title, workshop: parsed.block.workshop ?? { mode: "atelier" } };
}

function readAtelier(
  raw: Record<string, unknown>,
  chapterTitle: string,
): { block: CourseBuilderSubchapter } | { warning: ImportWarning } {
  const title = textOf(raw.title) || "Atelier";
  const instructions = textOf(raw.instructions) || textOf(raw.brief) || textOf(raw.consigne) || textOf(raw.mission);
  const fieldsRaw = Array.isArray(raw.fields) ? raw.fields : [];
  const criteriaRaw = Array.isArray(raw.criteria) ? raw.criteria : [];
  const fields = fieldsRaw.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const field = item as Record<string, unknown>;
    const label = textOf(field.label);
    if (!label) return [];
    const type: WorkshopFieldType = field.type === "short" ? "short" : "long";
    return [{ id: nanoid(), label, placeholder: textOf(field.placeholder), type }];
  });
  const criteria = criteriaRaw.flatMap((item) => {
    const label = typeof item === "string" ? item.trim() : textOf((item as { label?: unknown })?.label);
    return label ? [{ id: nanoid(), label }] : [];
  });
  const maxRaw = raw.max_improvements ?? raw.maxImprovements;
  const max = maxRaw == null || maxRaw === "" ? 2 : Number(maxRaw);

  if (!instructions) return { warning: atelierError(chapterTitle, title, "la mission est obligatoire.") };
  if (fields.length < 1 || fields.length > 6) {
    return { warning: atelierError(chapterTitle, title, "il faut entre 1 et 6 champs.") };
  }
  if (criteria.length < 2 || criteria.length > 6) {
    return { warning: atelierError(chapterTitle, title, "il faut entre 2 et 6 critères.") };
  }
  if (!Number.isInteger(max) || max < 0 || max > 6) {
    return { warning: atelierError(chapterTitle, title, "le nombre d'améliorations doit être un entier entre 0 et 6.") };
  }
  const personnage = readPersonnage(raw.personnage);
  if ("warning" in personnage) return { warning: atelierError(chapterTitle, title, personnage.warning) };
  const pieces = readImportedPieces(raw.pieces, chapterTitle, title);
  if ("warning" in pieces) return pieces;

  return {
    block: {
      id: textOf(raw.id) || nanoid(),
      title,
      duration: textOf(raw.duration),
      type: "text",
      summary: "",
      content: "",
      kind: "case_study",
      workshop: {
        mode: "atelier",
        brief: instructions,
        situation: textOf(raw.scenario) || textOf(raw.situation) || textOf(raw.mise_en_situation),
        example: textOf(raw.example),
        fields,
        criteria,
        maxImprovements: max,
        ...(personnage.personnage ? { personnage: personnage.personnage } : {}),
        ...(pieces.pieces.length ? { pieces: pieces.pieces } : {}),
      },
    },
  };
}

function readPersonnage(raw: unknown): { personnage?: WorkshopCharacter } | { warning: string } {
  if (raw == null) return {};
  if (typeof raw !== "object" || Array.isArray(raw)) return { warning: "le personnage doit être un objet." };
  const row = raw as Record<string, unknown>;
  const personnage = {
    nom: textOf(row.nom),
    fonction: textOf(row.fonction),
    description: textOf(row.description),
  };
  if (!personnage.nom && !personnage.fonction && !personnage.description) return {};
  return { personnage };
}

function readImportedPieces(
  raw: unknown,
  chapterTitle: string,
  title: string,
): { pieces: WorkshopPiece[] } | { warning: ImportWarning } {
  if (raw == null) return { pieces: [] };
  if (!Array.isArray(raw)) return { warning: atelierError(chapterTitle, title, "les pièces doivent être une liste.") };
  if (raw.length > 5) {
    const extra = raw[5];
    const pieceTitle = extra && typeof extra === "object" ? textOf((extra as { titre?: unknown }).titre) : "";
    return { warning: atelierError(chapterTitle, title, `pièce « ${pieceTitle || "6"} » : 5 pièces maximum.`) };
  }
  const pieces: WorkshopPiece[] = [];
  for (let index = 0; index < raw.length; index += 1) {
    const item = raw[index];
    const row = item && typeof item === "object" && !Array.isArray(item) ? (item as Record<string, unknown>) : {};
    const pieceTitle = textOf(row.titre) || `Pièce ${index + 1}`;
    const type = textOf(row.type).toLowerCase();
    const id = textOf(row.id) || nanoid();
    if (type === "mail") {
      pieces.push({ id, type: "mail", titre: pieceTitle, de: textOf(row.de), objet: textOf(row.objet), contenu: textOf(row.contenu) });
      continue;
    }
    if (type === "note") {
      pieces.push({ id, type: "note", titre: pieceTitle, contenu: textOf(row.contenu) });
      continue;
    }
    if (type === "fichier") {
      const url = textOf(row.url);
      if (!url) return { warning: atelierError(chapterTitle, title, `pièce « ${pieceTitle} » : l'url du fichier est obligatoire.`) };
      pieces.push({ id, type: "fichier", titre: pieceTitle, url });
      continue;
    }
    if (type === "donnees") {
      if (!Array.isArray(row.colonnes) || row.colonnes.length === 0) {
        return { warning: atelierError(chapterTitle, title, `pièce « ${pieceTitle} » : indiquez les colonnes.`) };
      }
      const colonnes = row.colonnes.map((cell) => textOf(cell)).filter(Boolean).slice(0, 12);
      if (!colonnes.length) return { warning: atelierError(chapterTitle, title, `pièce « ${pieceTitle} » : indiquez les colonnes.`) };
      if (!Array.isArray(row.lignes)) {
        return { warning: atelierError(chapterTitle, title, `pièce « ${pieceTitle} » : les lignes doivent être une liste.`) };
      }
      const lignes = row.lignes.slice(0, 40).map((line) => {
        const cells = Array.isArray(line) ? line.map((cell) => (cell == null ? "" : String(cell).trim())) : [];
        return colonnes.map((_, cellIndex) => cells[cellIndex] ?? "");
      });
      pieces.push({ id, type: "donnees", titre: pieceTitle, colonnes, lignes });
      continue;
    }
    return { warning: atelierError(chapterTitle, title, `pièce « ${pieceTitle} » : type « ${type || "absent"} » inconnu.`) };
  }
  return { pieces };
}

function isAtelier(raw: unknown) {
  if (!raw || typeof raw !== "object") return false;
  const type = textOf((raw as { type?: unknown }).type).toLowerCase();
  return type === "atelier";
}

function isReadyAtelier(raw: unknown): raw is CourseBuilderSubchapter {
  if (!raw || typeof raw !== "object") return false;
  const row = raw as CourseBuilderSubchapter;
  return row.kind === "case_study" && row.workshop?.mode === "atelier" && textOf(row.workshop.brief).length > 0;
}

/** Leçons dans l'ordre d'origine, ateliers valides ajoutés à la fin du chapitre. */
export function orderImportedSubchapters(
  subs: unknown[],
  chapterTitle: string,
  toLesson: (raw: unknown, index: number) => CourseBuilderSubchapter,
) {
  const learning: CourseBuilderSubchapter[] = [];
  const ateliers: CourseBuilderSubchapter[] = [];
  const warnings: ImportWarning[] = [];
  subs.forEach((sub, index) => {
    if (isAtelier(sub)) {
      const parsed = readAtelier(sub as Record<string, unknown>, chapterTitle);
      if ("warning" in parsed) warnings.push(parsed.warning);
      else ateliers.push(parsed.block);
      return;
    }
    if (isReadyAtelier(sub)) {
      ateliers.push(sub);
      return;
    }
    const lesson = toLesson(sub, index);
    if (lesson.title.trim()) learning.push(lesson);
  });
  return { subchapters: [...learning, ...ateliers], warnings };
}

export function importFormationStructure(raw: unknown): {
  sections: CourseBuilderSection[];
  objectifs: string[];
  warnings: ImportWarning[];
} {
  const root = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  const source = root.structure && typeof root.structure === "object" ? (root.structure as Record<string, unknown>) : root;
  const sectionsRaw = Array.isArray(source.sections) ? source.sections : [];
  const warnings: ImportWarning[] = [];
  const objectifsRaw = source.objectifs ?? source.objectives ?? source.goals;
  const objectifs = Array.isArray(objectifsRaw)
    ? objectifsRaw.map((item) => textOf(item)).filter(Boolean).slice(0, 12)
    : [];

  const sections: CourseBuilderSection[] = sectionsRaw.flatMap((section, sectionIndex) => {
    if (!section || typeof section !== "object") return [];
    const row = section as Record<string, unknown>;
    const title = textOf(row.title) || `Section ${sectionIndex + 1}`;
    const chaptersRaw = Array.isArray(row.chapters) ? row.chapters : [];
    return [
      {
        id: textOf(row.id) || nanoid(),
        title,
        description: textOf(row.description),
        chapters: chaptersRaw.flatMap((chapter, chapterIndex) => {
          if (!chapter || typeof chapter !== "object") return [];
          const chapterRow = chapter as Record<string, unknown>;
          const chapterTitle = textOf(chapterRow.title) || `Chapitre ${chapterIndex + 1}`;
          const subs = Array.isArray(chapterRow.subchapters)
            ? chapterRow.subchapters
            : Array.isArray(chapterRow.subChapters)
              ? chapterRow.subChapters
              : [];
          const ordered = orderImportedSubchapters(subs, chapterTitle, lessonFrom);
          warnings.push(...ordered.warnings);
          return [
            {
              id: textOf(chapterRow.id) || nanoid(),
              title: chapterTitle,
              duration: textOf(chapterRow.duration),
              type: "text" as const,
              summary: textOf(chapterRow.summary),
              content: textOf(chapterRow.content),
              subchapters: ordered.subchapters,
            },
          ];
        }),
      },
    ];
  });

  return { sections, objectifs, warnings };
}

export function parseFormationImportText(text: string) {
  const trimmed = text.trim();
  if (!trimmed.startsWith("{")) return null;
  try {
    const parsed = JSON.parse(trimmed) as unknown;
    if (!parsed || typeof parsed !== "object" || !Array.isArray((parsed as { sections?: unknown }).sections)) return null;
    return importFormationStructure(parsed);
  } catch {
    return null;
  }
}
