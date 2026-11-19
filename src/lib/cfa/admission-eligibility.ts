import {
  DIPLOMAS_MEETING_BAC,
  type ParcoursDiploma,
} from "@/lib/cfa/admission-challenge";

export type EligibilityInput = {
  birthDate?: string | null;
  age?: number | null;
  parcoursDiploma?: string | null;
  /** RQTH known from accessibility space — never expose reason to jury. */
  hasRqth?: boolean | null;
  maxAgeWithoutRqth?: number;
};

export type EligibilityResult = {
  ok: boolean;
  label: "Éligibilité : OK" | "Éligibilité : à vérifier";
};

function ageFromBirthDate(birthDate: string | null | undefined, from = new Date()): number | null {
  if (!birthDate || !/^\d{4}-\d{2}-\d{2}/.test(birthDate)) return null;
  const date = new Date(birthDate);
  if (Number.isNaN(date.getTime())) return null;
  let age = from.getFullYear() - date.getFullYear();
  const month = from.getMonth() - date.getMonth();
  if (month < 0 || (month === 0 && from.getDate() < date.getDate())) age -= 1;
  if (age < 0 || age > 120) return null;
  return age;
}

export function computeAdmissionEligibility(input: EligibilityInput): EligibilityResult {
  const maxAge = input.maxAgeWithoutRqth ?? 29;
  const age = ageFromBirthDate(input.birthDate) ?? (typeof input.age === "number" ? input.age : null);
  const diploma = (input.parcoursDiploma || "") as ParcoursDiploma | "";
  const diplomaOk = !diploma || DIPLOMAS_MEETING_BAC.includes(diploma as ParcoursDiploma);
  const ageOk =
    age == null || age <= maxAge || input.hasRqth === true;

  const ok = diplomaOk && ageOk;
  return {
    ok,
    label: ok ? "Éligibilité : OK" : "Éligibilité : à vérifier",
  };
}
