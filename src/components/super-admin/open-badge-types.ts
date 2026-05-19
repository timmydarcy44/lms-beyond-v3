export type BadgeEvalType =
  | "qcm"
  | "case_study"
  | "audio_presentation"
  | "audio_negotiation"
  | "file_upload"
  | "video_presentation";

/** Modalités sélectionnables (multi) dans le formulaire badge. */
export type BadgeModalityKey = "qcm" | "case_study" | "oral_ia" | "technical_json";

export type OpenBadgeSavePayload = {
  name: string;
  description: string;
  imageUrl?: string;
  /** Critères de succès (HTML Tiptap) */
  criteriaHtml: string;
  /** Modalités cochées (QCM, étude de cas, oral IA, technique JSON) */
  modalitiesKeys: BadgeModalityKey[];
  /** Résumé textuel pour affichage / sync `badges.modalities` */
  modalitiesObtention: string;
  /** Lignes de compétences (dérivées ou saisie legacy) — sync objectives */
  competenciesText: string;
  /** Type d’évaluation principal pour la colonne `evaluation_type` (rétrocompat) */
  evaluationType: BadgeEvalType;
  quizTestId?: string;
  casePrompt?: string;
  /** Scénario oral pour l’apprenant */
  oralScenario?: string;
  /** Prompt caché pour l’IA qui note la retranscription orale */
  oralIaEvaluationPrompt?: string;
  technicalJsonEndpoint?: string;
  fileUploadInstructions?: string;
  audioPresentationScenario?: string;
  audioNegotiationScenario?: string;
  videoPresentationUrl?: string;
  /** Sujet Questions/Réponses IA (studio) */
  aiQaTopic?: string;
};
