import { CourseBuilderSnapshot } from "@/types/course-builder";

/**
 * Calcule la durée estimée d'un cours en analysant son contenu
 */
export function calculateCourseDuration(snapshot: CourseBuilderSnapshot): string {
  if (!snapshot || !snapshot.sections || snapshot.sections.length === 0) {
    return "À déterminer";
  }

  let totalMinutes = 0;

  // Parcourir toutes les sections
  for (const section of snapshot.sections) {
    if (!section.chapters || section.chapters.length === 0) {
      continue;
    }

    // Parcourir tous les chapitres
    for (const chapter of section.chapters) {
      // Si le chapitre a une durée explicite, l'utiliser
      if (chapter.duration) {
        const chapterMinutes = parseDuration(chapter.duration);
        if (chapterMinutes > 0) {
          totalMinutes += chapterMinutes;
          continue; // Skip subchapters si le chapitre a déjà une durée
        }
      }

      // Sinon, estimer depuis le type et le contenu
      const chapterMinutes = estimateChapterDuration(chapter);
      totalMinutes += chapterMinutes;

      // Ajouter les sous-chapitres
      if (chapter.subchapters && chapter.subchapters.length > 0) {
        for (const subchapter of chapter.subchapters) {
          if (subchapter.duration) {
            const subMinutes = parseDuration(subchapter.duration);
            if (subMinutes > 0) {
              totalMinutes += subMinutes;
              continue;
            }
          }

          const subMinutes = estimateSubchapterDuration(subchapter);
          totalMinutes += subMinutes;
        }
      }
    }
  }

  // Formater la durée
  return formatDuration(totalMinutes);
}

/**
 * Parse une durée au format "12 min", "1h30", "45m", etc.
 */
function parseDuration(durationStr: string): number {
  if (!durationStr) return 0;

  // Extraire les heures et minutes
  const hourMatch = durationStr.match(/(\d+)\s*h/i);
  const minuteMatch = durationStr.match(/(\d+)\s*m/i);

  const hours = hourMatch ? parseInt(hourMatch[1], 10) : 0;
  const minutes = minuteMatch ? parseInt(minuteMatch[1], 10) : 0;

  return hours * 60 + minutes;
}

/**
 * Estime la durée d'un chapitre basé sur son type et contenu
 */
function estimateChapterDuration(chapter: any): number {
  if (!chapter) return 0;

  const type = chapter.type || "text";
  const content = chapter.content || "";
  const summary = chapter.summary || "";

  // Estimer la longueur du contenu en mots
  const contentWords = (content + " " + summary).split(/\s+/).length;

  switch (type) {
    case "video":
      // Vidéo : utiliser durée si présente, sinon estimer 5-10 min par chapitre
      if (chapter.duration) {
        const parsed = parseDuration(chapter.duration);
        if (parsed > 0) return parsed;
      }
      // Estimer basé sur le contenu : ~1 min par 100 mots de description
      return Math.max(5, Math.min(60, Math.ceil(contentWords / 100)));

    case "audio":
      // Audio : similaire à vidéo
      if (chapter.duration) {
        const parsed = parseDuration(chapter.duration);
        if (parsed > 0) return parsed;
      }
      return Math.max(3, Math.min(45, Math.ceil(contentWords / 100)));

    case "text":
    case "document":
      // Texte/Document : ~2 min par 500 mots
      return Math.max(2, Math.ceil(contentWords / 250));

    default:
      // Par défaut : 5 minutes
      return 5;
  }
}

/**
 * Estime la durée d'un sous-chapitre
 */
function estimateSubchapterDuration(subchapter: any): number {
  if (!subchapter) return 0;

  const type = subchapter.type || "text";
  const content = subchapter.content || "";
  const summary = subchapter.summary || "";
  const contentWords = (content + " " + summary).split(/\s+/).length;

  switch (type) {
    case "video":
      if (subchapter.duration) {
        const parsed = parseDuration(subchapter.duration);
        if (parsed > 0) return parsed;
      }
      return Math.max(3, Math.min(30, Math.ceil(contentWords / 100)));

    case "audio":
      if (subchapter.duration) {
        const parsed = parseDuration(subchapter.duration);
        if (parsed > 0) return parsed;
      }
      return Math.max(2, Math.min(20, Math.ceil(contentWords / 100)));

    case "text":
    case "document":
      return Math.max(1, Math.ceil(contentWords / 300));

    default:
      return 3;
  }
}

/**
 * Formate une durée en minutes vers un format lisible
 */
function formatDuration(totalMinutes: number): string {
  if (totalMinutes === 0) {
    return "À déterminer";
  }

  if (totalMinutes < 60) {
    return `${totalMinutes} min`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours}h`;
  }

  return `${hours}h${minutes}`;
}









