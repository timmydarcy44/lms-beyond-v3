export type BillingMode = "mock" | "stripe";

const normalizeMode = (value: string | undefined | null): BillingMode | null => {
  if (!value) return null;
  const trimmed = value.trim().toLowerCase();
  if (trimmed === "mock") return "mock";
  if (trimmed === "stripe") return "stripe";
  return null;
};

export const getBillingMode = (): BillingMode => {
  const explicit = normalizeMode(process.env.BNS_BILLING_MODE);
  if (explicit) {
    return explicit;
  }
  if (process.env.NODE_ENV === "production") {
    return "stripe";
  }
  return "mock";
};

export const isMockBilling = (): boolean => getBillingMode() === "mock";

