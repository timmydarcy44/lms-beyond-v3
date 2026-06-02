export class OnboardingStepError extends Error {
  step: string;
  detail: string;
  status?: number;
  organization_id?: string;

  constructor(params: {
    step: string;
    error: string;
    detail: string;
    status?: number;
    organization_id?: string;
  }) {
    super(params.error);
    this.name = "OnboardingStepError";
    this.step = params.step;
    this.detail = params.detail;
    this.status = params.status;
    this.organization_id = params.organization_id;
  }
}

export function isMissingColumnError(message: string | undefined): boolean {
  const m = (message ?? "").toLowerCase();
  return (
    m.includes("column") ||
    m.includes("42703") ||
    m.includes("schema cache") ||
    m.includes("does not exist")
  );
}

export function isEmailAlreadyRegisteredError(message: string | undefined): boolean {
  const m = (message ?? "").toLowerCase();
  return (
    m.includes("already been registered") ||
    m.includes("already registered") ||
    m.includes("email_exists") ||
    m.includes("user already exists") ||
    m.includes("duplicate")
  );
}
