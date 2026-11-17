/**
 * Vidéos tuto associées aux procédures qualité (bandeau /super/crm/qualiopi/process).
 * Mapping code uniquement — pas de colonne SQL pour l’instant.
 */

export type ProcedureVideoSlot = {
  slug: string;
  title: string;
  /** URL publique mp4 ; null = « À venir » */
  videoUrl: string | null;
};

export const PROCEDURE_VIDEO_SLOTS: ProcedureVideoSlot[] = [
  {
    slug: "reclamations",
    title: "Traitement des réclamations",
    videoUrl:
      "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/App/tuto_reclamation_voixoff.mp4",
  },
  {
    slug: "paq",
    title: "Comité qualité et plan d’amélioration",
    videoUrl: null,
  },
  {
    slug: "moyens",
    title: "Moyens matériels et locaux",
    videoUrl: null,
  },
  {
    slug: "formateurs",
    title: "Plan de développement des compétences des formateurs",
    videoUrl: null,
  },
  {
    slug: "signalements",
    title: "Signalements (violences, harcèlement, discriminations)",
    videoUrl: null,
  },
];
