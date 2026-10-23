type LooseDb = {
  from: (table: string) => any;
};

export function splitPersonName(fullName: string): { first: string; last: string } {
  const cleaned = fullName.replace(/@.*/, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: "Formateur", last: "Byound" };
  if (parts.length === 1) return { first: parts[0], last: parts[0] };
  return { first: parts[0], last: parts.slice(1).join(" ") };
}

function sameName(row: { first_name?: string | null; last_name?: string | null }, first: string, last: string) {
  return (
    String(row.first_name ?? "").trim().toLocaleLowerCase("fr") === first.toLocaleLowerCase("fr") &&
    String(row.last_name ?? "").trim().toLocaleLowerCase("fr") === last.toLocaleLowerCase("fr")
  );
}

async function findOrCreateValidator(db: LooseDb, fullName: string): Promise<string | null> {
  const { first, last } = splitPersonName(fullName);
  const { data: rows } = await db.from("validators").select("id, first_name, last_name");
  const found = ((rows ?? []) as Array<{ id?: string; first_name?: string | null; last_name?: string | null }>).find((row) =>
    sameName(row, first, last),
  );
  if (found?.id) return String(found.id);

  const { data, error } = await db
    .from("validators")
    .insert({ first_name: first, last_name: last, description: "Formateur" })
    .select("id")
    .maybeSingle();
  if (error || !data?.id) return null;
  return String(data.id);
}

/** Retourne un id de `validators`. Un id de profil est converti, ou créé s'il manque. */
export async function resolveValidatorId(db: LooseDb, rawId: string, fallbackName?: string): Promise<string | null> {
  const id = String(rawId ?? "").trim();
  if (!id) return null;

  const { data: validator } = await db.from("validators").select("id").eq("id", id).maybeSingle();
  if (validator?.id) return String(validator.id);

  let name = String(fallbackName ?? "").trim();
  if (!name) {
    const { data: profile } = await db.from("profiles").select("full_name, email").eq("id", id).maybeSingle();
    if (!profile) return null;
    name = String(profile.full_name ?? "").trim() || String(profile.email ?? "").trim();
  }
  if (!name) return null;
  return findOrCreateValidator(db, name);
}
