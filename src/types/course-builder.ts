import type { ModuleOpenMode, ModuleOpenUnit } from "@/lib/lms/module-open";

export type BuilderContentType = "video" | "audio" | "document" | "text" | "interactive_game";

export type CourseBuilderSubchapterKind = "quiz" | "experiential_interview" | "resource" | "case_study";

export type WorkshopFieldType = "short" | "long";

export type WorkshopField = {
  id: string;
  label: string;
  placeholder?: string;
  type: WorkshopFieldType;
};

export type WorkshopCriterion = {
  id: string;
  label: string;
};

/** Absent ou « evaluation » : étude de cas de certification. « atelier » : entraînement. */
export type WorkshopMode = "evaluation" | "atelier";

export type WorkshopConfig = {
  mode?: WorkshopMode;
  brief?: string;
  situation?: string;
  example?: string;
  fields?: WorkshopField[];
  criteria?: WorkshopCriterion[];
  maxImprovements?: number;
};

export type CourseBuilderSubchapter = {
  id: string;
  title: string;
  duration: string;
  type: BuilderContentType;
  summary?: string;
  content?: string;
  mediaUrl?: string;
  /** Pastille verte : contenu revu et validé manuellement */
  content_validated?: boolean;
  /** Soft delete. Les lectures ignorent les lignes dont deleted_at est renseigné. */
  deleted_at?: string | null;
  /** Bloc pédagogique spécial (quiz, entretien expérientiel, …) */
  kind?: CourseBuilderSubchapterKind | string;
  quiz_id?: string;
  /** Ferme le module suivant tant que ce pourcentage de bonnes réponses n’est pas atteint. */
  gate_next_module?: boolean;
  gate_min_percent?: number;
  /** Lien vers une ressource du studio (table resources). */
  resource_id?: string;
  /** Contexte texte pour l’entretien IA (contenu du chapitre au moment de la création). */
  interview_context?: string;
  /** Objectifs pédagogiques guidant les questions de l’entretien. */
  interview_objectives?: string;
  /** experiential = vécu (pro ou parent) ; coaching = questions sur le contenu du cours. */
  interview_style?: "experiential" | "coaching" | "mise_en_situation";
  /** Champs visibles de la mise en situation. Les prompts restent hors du snapshot. */
  situation_public?: {
    title: string;
    character: { name: string; role: string; initials: string };
    learnerBrief: string;
    minTurns: number;
    maxTurns: number;
    passingScore: number;
    criteria: { id: string; label: string; max: number }[];
    endings: { id: string; min: number; title: string }[];
  };
  /** Thématique de l'entretien expérientiel uniquement. */
  interview_audience?: "professional" | "parent";
  /** Étude de cas. Sans mode, ou mode evaluation : épreuve. mode atelier : entraînement. */
  workshop?: WorkshopConfig;
  /** Annonce affichée à l'apprenant avant un jeu interactif. */
  game?: {
    title?: string;
    hook?: string;
    duration_min?: number | null;
    steps_count?: number | null;
    skills?: string[];
    character?: { name?: string; role?: string; intro_line?: string; avatar?: string } | null;
    cover_url?: string | null;
    max_attempts?: number | null;
    opening?: string | null;
  };
};

export type ChapterUnlockCondition = "previous_chapter_completed" | "previous_quiz_score";

export type CourseBuilderChapter = {
  id: string;
  title: string;
  duration: string;
  type: BuilderContentType;
  summary?: string;
  content?: string;
  mediaUrl?: string;
  /** Pastille verte : contenu revu et validé manuellement */
  content_validated?: boolean;
  deleted_at?: string | null;
  access_start_date?: string | null;
  access_end_date?: string | null;
  unlock_condition?: ChapterUnlockCondition;
  game?: CourseBuilderSubchapter["game"];
  subchapters: CourseBuilderSubchapter[];
};

export type CourseBuilderSection = {
  id: string;
  title: string;
  description?: string;
  chapters: CourseBuilderChapter[];
  deleted_at?: string | null;
  /** Quand l’apprenant peut entrer dans ce module. Absent = immédiatement. */
  open_rule?: {
    mode: ModuleOpenMode;
    date?: string | null;
    amount?: number | null;
    unit?: ModuleOpenUnit | null;
  };
};

export type CourseBuilderResource = {
  id: string;
  title: string;
  type: "pdf" | "video" | "audio" | "document" | "html";
  url: string;
  /** ID en base (table resources) */
  resource_id?: string;
  /** Libellé de l'emplacement choisi dans le parcours */
  placement_label?: string;
};

export type CourseBuilderTest = {
  id: string;
  title: string;
  type: "quiz" | "evaluation" | "auto-diagnostic";
  url: string;
};

export type CourseBuilderGeneralInfo = {
  title: string;
  subtitle: string;
  description: string;
  /** Présentation longue (catalogue) générée/saisie. */
  presentation?: string;
  /** Outils utilisés (affichés en logos sur la page de présentation). */
  tools?: string[];
  /** Libellé affiché (aligné sur course_categories.name) */
  category: string;
  /** UUID course_categories — persisté en courses.category_id */
  category_id?: string | null;
  level: string;
  duration: string;
  heroImage: string;
  cover_image?: string;
  trailerUrl: string;
  badgeLabel: string;
  badgeDescription: string;
  badgeImage?: string;
  /** Modalité de certification (alignée sur la page formateur / table badges) */
  badge_evaluation_type?:
    | "qcm"
    | "case_study"
    | "audio_presentation"
    | "audio_negotiation"
    | "file_upload"
    | "video_presentation";
  badge_quiz_test_id?: string;
  badge_case_prompt?: string;
  badge_audio_presentation_scenario?: string;
  badge_audio_negotiation_scenario?: string;
  badge_file_upload_instructions?: string;
  badge_video_presentation_url?: string;
  /** Modalités d’obtention (ex. score min 80 %) — sync → `badges.modalities` */
  badge_modalities_obtention?: string;
  /** Critères riches (HTML) — sync → `badges.criteria_html` */
  badge_criteria_html?: string;
  /** Modalités multiples (clés) — sync → `badges.modalities_selected` */
  badge_modalities_keys?: ("qcm" | "case_study" | "oral_ia" | "technical_json")[];
  /** Prompt d’évaluation IA pour l’oral — sync → `badges.oral_ia_evaluation_prompt` */
  badge_oral_ia_evaluation_prompt?: string;
  /** Endpoint / preuve technique — sync → `badges.technical_json_endpoint` */
  badge_technical_json_endpoint?: string;
  /** Sujet Questions/Réponses IA (studio badge) */
  badge_ai_qa_topic?: string;
  /** Compétences visées — une ligne par entrée, sync → `badges.objectives` */
  badge_competencies_text?: string;
  /** Niveau affiché côté certification (optionnel) */
  badge_level?: string;
  /** Configuration Beyond (JSONB) des modalités choisies. */
  badge_modalities_config?: Record<string, unknown>;
  /** Preuves attendues (liste à puces). */
  badge_expected_proofs?: string;
  instructor_ids?: string[];
  /** Formation créée depuis /super : elle appartient à Byound, pas à un formateur. */
  publisher?: "byound";
  objectifs?: string[];
  prerequisites?: string[];
  target_audience?: "pro" | "apprenant" | "all";
  /** Espaces où la formation Byound est proposée. */
  visible_surfaces?: Array<"apprenant" | "entreprise" | "expert">;
  price?: number;
  assignment_type?: "no_school" | "organization";
  assigned_organization_id?: string;
  assigned_organization_slug?: string | null;
  access_start_date?: string | null;
  access_end_date?: string | null;
  linear_progression?: boolean;
  /** Si true: la formation n'apparaît pas dans le catalogue global, seulement via un parcours. */
  parcours_only?: boolean;
  /** Si `parcours_only` : parcours de destination (dans la galaxie) */
  parcours_only_path_id?: string | null;
  /** Présentiel, distanciel, mixte ou e-learning. */
  delivery_format?: string;
  /** Compétences visées, une entrée par pilule. */
  competencies?: string[];
  /** Publics visés, une entrée par pilule. */
  audiences?: string[];
  /** Modalités d'évaluation (Qualiopi). */
  evaluation_modalities?: string;
  /** Accessibilité (Qualiopi). */
  accessibility?: string;
  /** Délai d'accès annoncé à l'apprenant (Qualiopi). */
  access_delay?: string;
  /** Texte alternatif de la couverture. */
  cover_alt?: string;
};

export type CourseBuilderSnapshot = {
  general: CourseBuilderGeneralInfo;
  objectives: string[];
  skills: string[];
  sections: CourseBuilderSection[];
  resources: CourseBuilderResource[];
  tests: CourseBuilderTest[];
};



