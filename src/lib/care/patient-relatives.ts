import { cache } from "react";
import { getSession } from "@/lib/auth/session";
import { formatPersonName } from "@/lib/care/person-name";
import { getServiceRoleClient } from "@/lib/supabase/server";

export type PatientRelative = {
  id: string;
  firstName: string;
  lastName: string;
  birthYear: number | null;
  relation: "enfant" | "conjoint" | "autre";
};

const RELATIONS = new Set<PatientRelative["relation"]>(["enfant", "conjoint", "autre"]);

export function activeSubjectId(param: string | undefined, relatives: PatientRelative[]) {
  if (!param || param === "moi") return null;
  return relatives.some((item) => item.id === param) ? param : null;
}

export function sameSubject(subjectRelativeId: string | null, activeId: string | null) {
  return activeId ? subjectRelativeId === activeId : subjectRelativeId == null;
}

export const loadPatientRelatives = cache(async function loadPatientRelatives(): Promise<PatientRelative[]> {
  const session = await getSession();
  const db = getServiceRoleClient();
  if (!session?.id || !db) return [];
  const { data, error } = await db
    .from("care_relatives")
    .select("id, first_name, last_name, birth_year, relation")
    .eq("account_id", session.id)
    .order("created_at", { ascending: true });
  if (error || !data) return [];
  return data.flatMap((row) => {
    const relation = String(row.relation);
    if (!RELATIONS.has(relation as PatientRelative["relation"])) return [];
    const firstName = formatPersonName(String(row.first_name ?? ""));
    if (!firstName) return [];
    return [{
      id: String(row.id),
      firstName,
      lastName: formatPersonName(String(row.last_name ?? "")),
      birthYear: row.birth_year == null ? null : Number(row.birth_year),
      relation: relation as PatientRelative["relation"],
    }];
  });
});

export async function createPatientRelative(input: {
  accountId: string;
  firstName: string;
  lastName: string;
  birthYear: number | null;
  relation: string;
}) {
  const db = getServiceRoleClient();
  const firstName = formatPersonName(input.firstName);
  const lastName = formatPersonName(input.lastName);
  if (!db || !firstName) return { ok: false as const, message: "Le prénom est requis." };
  if (!RELATIONS.has(input.relation as PatientRelative["relation"])) return { ok: false as const, message: "Le lien indiqué n'est pas reconnu." };
  const year = input.birthYear;
  if (year != null && (!Number.isInteger(year) || year < 1900 || year > 2100)) {
    return { ok: false as const, message: "L'année de naissance n'est pas valide." };
  }
  const { data, error } = await db
    .from("care_relatives")
    .insert({
      account_id: input.accountId,
      first_name: firstName,
      last_name: lastName,
      birth_year: year,
      relation: input.relation,
    })
    .select("id")
    .single();
  if (error || !data) return { ok: false as const, message: "Le proche n'a pas pu être ajouté." };
  return { ok: true as const, id: String(data.id) };
}

export async function deletePatientRelative(accountId: string, id: string) {
  const db = getServiceRoleClient();
  if (!db) return false;
  const { data } = await db.from("care_relatives").delete().eq("id", id).eq("account_id", accountId).select("id");
  return Boolean(data?.length);
}
