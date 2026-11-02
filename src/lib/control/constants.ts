export const IMPERSONATION_COOKIE = "byound_impersonation";

export const REASON_CODES = [
  { code: "client_request", label: "Demande du client" },
  { code: "initial_setup", label: "Configuration initiale" },
  { code: "support", label: "Support" },
  { code: "demo", label: "Démo" },
] as const;

export type ReasonCode = (typeof REASON_CODES)[number]["code"];

export function reasonLabel(code: string | null | undefined) {
  return REASON_CODES.find((item) => item.code === code)?.label ?? "Support";
}
