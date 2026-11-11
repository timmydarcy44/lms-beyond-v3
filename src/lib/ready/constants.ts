/** Durées Byound Ready — configurables. */
export const READY_LINK_MAX_DAYS = 60;
export const READY_AFTER_SUBMITTED_DAYS = 15;
export const READY_DEPOSIT_BEFORE_SESSION_DAYS = 15;
export const READY_DEPOSIT_AFTER_SEND_DAYS = 15;

export const READY_OTP_TTL_MS = 10 * 60 * 1000;
export const READY_OTP_MAX_ATTEMPTS = 5;
export const READY_OTP_BLOCK_MS = 15 * 60 * 1000;
export const READY_OTP_MAX_SENDS_PER_HOUR = 3;
export const READY_OTP_SEND_WINDOW_MS = 60 * 60 * 1000;

export const READY_SESSION_MAX_MS = 2 * 60 * 60 * 1000;
export const READY_SESSION_COOKIE = "ready_session";

export const READY_TOKEN_BYTES = 32;

export type ReadyLinkStatus =
  | "active"
  | "blocked"
  | "submitted"
  | "expired"
  | "revoked";

export type ReadyPaymentMode = "subrogation" | "remboursement";

export type ReadyEventType =
  | "created"
  | "resent"
  | "otp_sent"
  | "otp_success"
  | "otp_failure"
  | "opened"
  | "updated"
  | "deposited"
  | "revoked"
  | "expired"
  | "purged";
