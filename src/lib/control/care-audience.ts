import { CARE_DEMO_ANAIS_ID, isCareDemoEmail, isCareDemoExpertId } from "@/lib/care/demo-profiles";

const CARE_ROLES = new Set([
  "care_patient",
  "patient",
  "praticien",
  "praticien_bct",
]);

export type CareAudiencePerson = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  roleType?: string | null;
};

/** Prospect, patient ou coach Care — pas un acheteur de formation à l’unité. */
export function isCareAudience(person: CareAudiencePerson) {
  const id = String(person.id ?? "").trim();
  const role = String(person.role ?? "").trim().toLowerCase();
  const roleType = String(person.roleType ?? "").trim().toLowerCase();
  const email = String(person.email ?? "").trim().toLowerCase();
  const name = String(person.name ?? "").trim().toLowerCase();

  if (id && (id === CARE_DEMO_ANAIS_ID || isCareDemoExpertId(id))) return true;
  if (isCareDemoEmail(email)) return true;
  if (CARE_ROLES.has(role) || CARE_ROLES.has(roleType) || roleType === "care") return true;
  if (email.includes(".care.") || email.includes("care.demo")) return true;
  const local = email.split("@")[0] ?? "";
  const domain = email.split("@")[1] ?? "";
  if (/^anais([._-]|$)/i.test(local) && /byound\.fr$/.test(domain)) return true;
  if (/ana[iï]s/.test(name) && (/care/.test(email) || /demo/.test(email) || /bouquerel/.test(name))) {
    return true;
  }
  return false;
}
