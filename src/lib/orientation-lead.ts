import type { FormatId, ObjectifId, ProfilId } from "@/lib/orientation-tunnel";

export const ORIENTATION_EMPLOYMENT_STATUSES = [
  { id: "en_poste", label: "En poste" },
  { id: "en_reconversion", label: "En reconversion" },
  { id: "en_etudes", label: "En études" },
  { id: "en_recherche_emploi", label: "En recherche d'emploi" },
  { id: "independant", label: "Indépendant / freelance" },
  { id: "autre", label: "Autre situation" },
] as const;

export type OrientationEmploymentStatusId = (typeof ORIENTATION_EMPLOYMENT_STATUSES)[number]["id"];

export type OrientationLeadContact = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  employmentStatus: OrientationEmploymentStatusId;
};

export type OrientationLeadPayload = OrientationLeadContact & {
  objectifs: ObjectifId[];
  profil: ProfilId | null;
  format: FormatId | null;
  result?: Record<string, unknown> | null;
};

export function isValidOrientationLeadContact(c: Partial<OrientationLeadContact>): c is OrientationLeadContact {
  const email = String(c.email ?? "").trim();
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const status = String(c.employmentStatus ?? "").trim() as OrientationEmploymentStatusId;
  return (
    Boolean(String(c.firstName ?? "").trim()) &&
    Boolean(String(c.lastName ?? "").trim()) &&
    emailOk &&
    Boolean(String(c.phone ?? "").trim()) &&
    ORIENTATION_EMPLOYMENT_STATUSES.some((s) => s.id === status)
  );
}
