import { createHash, randomBytes } from "crypto";

export const ATTENDANCE_STATUSES = [
  "present",
  "absent",
  "late",
  "early_leave",
  "partial",
  "incomplete",
  "not_signed",
] as const;

export type AttendanceStatus = (typeof ATTENDANCE_STATUSES)[number];

export const ATTENDANCE_STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: "Présent",
  absent: "Absent",
  late: "Retard",
  early_leave: "Départ anticipé",
  partial: "Présence partielle",
  incomplete: "Émargement incomplet",
  not_signed: "Non émargé",
};

export const QR_TTL_MINUTES = 15;
export const SESSION_CODE_TTL_MINUTES = 10;
export const CHECKIN_WINDOW_BEFORE_MIN = 15;
export const CHECKIN_WINDOW_AFTER_MIN = 15;
export const CHECKOUT_WINDOW_BEFORE_MIN = 10;
export const CHECKOUT_WINDOW_AFTER_MIN = 10;

export const ATTENDANCE_METHODS = ["qr", "session_code", "sms_code", "nfc", "manual"] as const;
export type AttendanceMethod = (typeof ATTENDANCE_METHODS)[number];

export function generateAttendanceToken(): string {
  return randomBytes(24).toString("hex");
}

export function hashAttendanceToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Code numérique 6 chiffres pour affichage / SMS. */
export function generateSessionCode(): string {
  const n = randomBytes(3).readUIntBE(0, 3) % 1_000_000;
  return String(n).padStart(6, "0");
}

export function hashSessionCode(code: string): string {
  return createHash("sha256").update(String(code).trim()).digest("hex");
}

export function deriveAttendanceStatus(params: {
  checkinAt: string | null;
  checkoutAt: string | null;
  slotStartsAt: string;
  slotEndsAt: string;
  closed: boolean;
}): AttendanceStatus {
  const { checkinAt, checkoutAt, slotStartsAt, slotEndsAt, closed } = params;
  if (!checkinAt && !checkoutAt) {
    return closed ? "absent" : "not_signed";
  }
  if (checkinAt && !checkoutAt) {
    return closed ? "incomplete" : "incomplete";
  }
  if (!checkinAt && checkoutAt) {
    return "incomplete";
  }

  const start = new Date(slotStartsAt).getTime();
  const end = new Date(slotEndsAt).getTime();
  const cin = new Date(checkinAt!).getTime();
  const cout = new Date(checkoutAt!).getTime();

  const lateMs = cin - start;
  const earlyMs = end - cout;
  const late = lateMs > 5 * 60_000;
  const early = earlyMs > 5 * 60_000;

  if (late && early) return "partial";
  if (late) return "late";
  if (early) return "early_leave";
  return "present";
}

export function minutesBetween(aIso: string, bIso: string): number {
  return Math.round((new Date(bIso).getTime() - new Date(aIso).getTime()) / 60_000);
}

export function defaultCheckinWindow(slotStartsAt: string) {
  const start = new Date(slotStartsAt);
  const opens = new Date(start.getTime() - CHECKIN_WINDOW_BEFORE_MIN * 60_000);
  const closes = new Date(start.getTime() + CHECKIN_WINDOW_AFTER_MIN * 60_000);
  return { opens, closes };
}

export function defaultCheckoutWindow(slotEndsAt: string) {
  const end = new Date(slotEndsAt);
  const opens = new Date(end.getTime() - CHECKOUT_WINDOW_BEFORE_MIN * 60_000);
  const closes = new Date(end.getTime() + CHECKOUT_WINDOW_AFTER_MIN * 60_000);
  return { opens, closes };
}
