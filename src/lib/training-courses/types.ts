import type {
  TrainingInstructor,
  TrainingPageBlock,
  TrainingProgramSection,
  TrainingSessionRow,
} from "@/lib/training-courses/cms-types";

export type TrainingCourseProgramStep = {
  title: string;
  duration: string;
};

export type TrainingCourseFaqItem = {
  q: string;
  a: string;
};

export type TrainingCourseRow = {
  id: string;
  slug: string;
  title: string;
  short_description: string | null;
  long_description: string | null;
  domain: string | null;
  cover_url: string | null;
  duration: string | null;
  level: string | null;
  formats: string[] | null;
  objectives: string[] | null;
  skills: string[] | null;
  program: TrainingCourseProgramStep[] | null;
  prerequisites: string | null;
  audience: string[] | null;
  intra_price: number | null;
  inter_price: number | null;
  max_intra_participants: number | null;
  badge_name: string | null;
  meta_description: string | null;
  seo_tags: string[] | null;
  faq: TrainingCourseFaqItem[] | null;
  why_choose: string[] | null;
  instructors: TrainingInstructor[] | null;
  badge_class_id: string | null;
  program_structure: TrainingProgramSection[] | null;
  /** Formation LMS liée (créée depuis le programme catalogue). */
  lms_course_id?: string | null;
  page_blocks: TrainingPageBlock[] | null;
  sessions: TrainingSessionRow[] | null;
  benefits: string[] | null;
  case_studies: string[] | null;
  deliverables: string[] | null;
  methodology: string[] | null;
  illustrations: string[] | null;
  trainer_id: string | null;
  trainer_name: string | null;
  trainer_headline: string | null;
  trainer_photo_url: string | null;
  is_active: boolean | null;
  /** Compte client si formation Sur-mesure ; null = catalogue public. */
  organization_id?: string | null;
  /** catalogue | surmesure */
  source?: "catalogue" | "surmesure" | null;
  /** Besoins spécifiques / adaptations (Qualiopi). */
  specific_needs?: string | null;
  /** Qualiopi ind.1 — type de reconnaissance. */
  recognition_type?: string | null;
  recognition_detail?: string | null;
  /** Qualiopi ind.1 — modalité pédagogique structurée. */
  pedagogical_modality?: string | null;
  pedagogical_modality_detail?: string | null;
  /** Qualiopi ind.1 — modalités de financement (texte). */
  financing_modalities?: string | null;
  /** Qualiopi ind.1 — afficher « Sur devis » si true. */
  price_on_quote?: boolean | null;
  /** Qualiopi ind.2 — surcharge méthode de calcul des indicateurs. */
  results_method_override?: string | null;
  /** Contact référent affiché (ex. « Jessica Contentin — jessica@… »). */
  contact_referent?: string | null;
  /**
   * Indicateurs qualité par clé (satisfaction, success, dropout, recommendation, completion).
   * Shape : { value: number|null, period?: string|null, respondents?: number|null }
   */
  quality_indicators?: Record<
    string,
    { value: number | null; period?: string | null; respondents?: number | null }
  > | null;
  created_at: string | null;
  updated_at: string | null;
};

export type TrainingCoursePublic = TrainingCourseRow & {
  rating: number;
  companies_count: number;
  price_label: string;
};

export const EDGE_ONLINE_EXTERNAL_URL = "https://www.byound.fr/edgeonline";

export const TRAINING_FORMATION_BASE_PATH = "/business/formations";
