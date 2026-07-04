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
  created_at: string | null;
  updated_at: string | null;
};

export type TrainingCoursePublic = TrainingCourseRow & {
  rating: number;
  companies_count: number;
  price_label: string;
};

export const EDGE_ONLINE_EXTERNAL_URL = "https://edgebs.fr/edgeonline";

export const TRAINING_FORMATION_BASE_PATH = "/business/formations";
