import type { TrainingCourseRow } from "@/lib/training-courses/types";
import type {
  TrainingInstructor,
  TrainingProgramSection,
  TrainingSessionRow,
} from "@/lib/training-courses/cms-types";

function joinList(value: unknown): string {
  if (!Array.isArray(value)) return "";
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const row = item as Record<string, unknown>;
        if (row.title) return String(row.title);
        if (row.q) return `${row.q} → ${row.a ?? ""}`;
      }
      return String(item ?? "");
    })
    .map((s) => s.trim())
    .filter(Boolean)
    .join(" | ");
}

function money(centsOrEuros: number | null | undefined): string {
  if (centsOrEuros == null || !Number.isFinite(Number(centsOrEuros))) return "";
  const n = Number(centsOrEuros);
  // Les prix catalogue sont en euros entiers (pas en centimes)
  return n.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
}

export type CatalogExportSheets = {
  catalogue: Array<Record<string, string | number | boolean>>;
  programme: Array<Record<string, string | number>>;
  sessions: Array<Record<string, string | number>>;
  faq: Array<Record<string, string>>;
  formateurs: Array<Record<string, string | number>>;
};

/** Aplatit le catalogue formations pour export Excel multi-onglets. */
export function buildTrainingCatalogExport(courses: TrainingCourseRow[]): CatalogExportSheets {
  const catalogue: CatalogExportSheets["catalogue"] = [];
  const programme: CatalogExportSheets["programme"] = [];
  const sessions: CatalogExportSheets["sessions"] = [];
  const faq: CatalogExportSheets["faq"] = [];
  const formateurs: CatalogExportSheets["formateurs"] = [];

  for (const course of courses) {
    const programSteps = Array.isArray(course.program)
      ? course.program
          .map((s) => `${s.title}${s.duration ? ` (${s.duration})` : ""}`)
          .join(" | ")
      : "";

    catalogue.push({
      id: course.id,
      slug: course.slug,
      titre: course.title,
      domaine: course.domain ?? "",
      actif: Boolean(course.is_active),
      duree: course.duration ?? "",
      niveau: course.level ?? "",
      formats: joinList(course.formats),
      description_courte: course.short_description ?? "",
      description_longue: course.long_description ?? "",
      objectifs: joinList(course.objectives),
      competences: joinList(course.skills),
      pourquoi_choisir: joinList(course.why_choose),
      benefices: joinList(course.benefits),
      cas_pratiques: joinList(course.case_studies),
      livrables: joinList(course.deliverables),
      methodologie: joinList(course.methodology),
      public: joinList(course.audience),
      prerequis: course.prerequisites ?? "",
      programme_legacy: programSteps,
      prix_inter_eur: money(course.inter_price),
      prix_intra_eur: money(course.intra_price),
      max_participants_intra: course.max_intra_participants ?? "",
      badge: course.badge_name ?? "",
      badge_class_id: course.badge_class_id ?? "",
      formateur_principal: course.trainer_name ?? "",
      formateur_headline: course.trainer_headline ?? "",
      meta_description: course.meta_description ?? "",
      seo_tags: joinList(course.seo_tags),
      cover_url: course.cover_url ?? "",
      illustrations: joinList(course.illustrations),
      lms_course_id: course.lms_course_id ?? "",
      url_publique: course.slug
        ? `https://edgebs.fr/business/formations/${course.slug}`
        : "",
      cree_le: course.created_at ?? "",
      maj_le: course.updated_at ?? "",
    });

    const structure = (course.program_structure ?? []) as TrainingProgramSection[];
    let sectionOrder = 0;
    for (const section of structure) {
      sectionOrder += 1;
      let chapterOrder = 0;
      const chapters = section.chapters ?? [];
      if (!chapters.length) {
        programme.push({
          formation_id: course.id,
          formation: course.title,
          section_ordre: sectionOrder,
          section: section.title,
          section_description: section.description ?? "",
          chapitre_ordre: "",
          chapitre: "",
          sous_chapitre_ordre: "",
          sous_chapitre: "",
        });
        continue;
      }
      for (const chapter of chapters) {
        chapterOrder += 1;
        const subs = chapter.subchapters ?? [];
        if (!subs.length) {
          programme.push({
            formation_id: course.id,
            formation: course.title,
            section_ordre: sectionOrder,
            section: section.title,
            section_description: section.description ?? "",
            chapitre_ordre: chapterOrder,
            chapitre: chapter.title,
            sous_chapitre_ordre: "",
            sous_chapitre: "",
          });
          continue;
        }
        let subOrder = 0;
        for (const sub of subs) {
          subOrder += 1;
          programme.push({
            formation_id: course.id,
            formation: course.title,
            section_ordre: sectionOrder,
            section: section.title,
            section_description: section.description ?? "",
            chapitre_ordre: chapterOrder,
            chapitre: chapter.title,
            sous_chapitre_ordre: subOrder,
            sous_chapitre: sub.title,
          });
        }
      }
    }

    for (const session of (course.sessions ?? []) as TrainingSessionRow[]) {
      sessions.push({
        formation_id: course.id,
        formation: course.title,
        date: session.date ?? "",
        ville: session.city ?? "",
        places: session.seats ?? "",
        prix: session.price ?? "",
        format: session.format ?? "",
      });
    }

    for (const item of course.faq ?? []) {
      faq.push({
        formation_id: course.id,
        formation: course.title,
        question: item.q ?? "",
        reponse: item.a ?? "",
      });
    }

    const instructors = (course.instructors ?? []) as TrainingInstructor[];
    if (instructors.length) {
      for (const instructor of instructors) {
        formateurs.push({
          formation_id: course.id,
          formation: course.title,
          role: instructor.role,
          ordre: instructor.sort_order,
          prenom: instructor.first_name,
          nom: instructor.last_name,
          headline: instructor.headline ?? "",
          expert_id: instructor.expert_id,
        });
      }
    } else if (course.trainer_name) {
      formateurs.push({
        formation_id: course.id,
        formation: course.title,
        role: "primary",
        ordre: 1,
        prenom: "",
        nom: course.trainer_name,
        headline: course.trainer_headline ?? "",
        expert_id: course.trainer_id ?? "",
      });
    }
  }

  return { catalogue, programme, sessions, faq, formateurs };
}
