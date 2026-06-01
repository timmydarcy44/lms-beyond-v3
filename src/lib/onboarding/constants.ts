export const WON_DEAL_STAGES = new Set(["gagne", "proposition_signee", "reussi"]);

export const ONBOARDING_STEPS = [
  "invite_sent",
  "account_activated",
  "teams_created",
  "employees_imported",
  "employees_invited",
  "first_diagnostic_done",
  "active",
] as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export const MAX_IMPORT_FILE_BYTES = 5 * 1024 * 1024;
export const IMPORT_BATCH_SIZE = 50;
