import { parseFollowUp, validateCareClient, type CareFollowUp } from "@/lib/expert/care-client-fields";

export const CARE_CLIENT_CSV_TEMPLATE =
  "prenom,nom,email,telephone,adresse,code_postal,ville,suivi,prenom_enfant,nom_enfant,prenom_second_enfant,nom_second_enfant,notes\n";

const HEADER_FIELDS: Record<string, string> = {
  prenom: "first_name",
  first_name: "first_name",
  nom: "last_name",
  last_name: "last_name",
  email: "email",
  adresse_e_mail: "email",
  e_mail: "email",
  mail: "email",
  telephone: "phone",
  tel: "phone",
  phone: "phone",
  numero_de_telephone: "phone",
  adresse: "address_line",
  adresse_postale: "address_line",
  address_line: "address_line",
  code_postal: "postal_code",
  cp: "postal_code",
  postal_code: "postal_code",
  ville: "city",
  city: "city",
  suivi: "follow_up",
  follow_up: "follow_up",
  prenom_enfant: "child_one_first_name",
  prenom_de_l_enfant: "child_one_first_name",
  child_one_first_name: "child_one_first_name",
  nom_enfant: "child_one_last_name",
  nom_de_l_enfant: "child_one_last_name",
  child_one_last_name: "child_one_last_name",
  prenom_second_enfant: "child_two_first_name",
  prenom_enfant_2: "child_two_first_name",
  child_two_first_name: "child_two_first_name",
  nom_second_enfant: "child_two_last_name",
  nom_enfant_2: "child_two_last_name",
  child_two_last_name: "child_two_last_name",
  notes: "notes",
  note: "notes",
};

export type CareClientCsvRow = {
  line: number;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address_line: string;
  postal_code: string;
  city: string;
  follow_up: CareFollowUp;
  child_one_first_name: string;
  child_one_last_name: string;
  child_two_first_name: string;
  child_two_last_name: string;
  notes: string;
};

export type CareClientCsvSkip = { line: number; email: string; reason: string };

function headerKey(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

function followUpFromCsv(value: string): CareFollowUp {
  const key = headerKey(value);
  if (!key || key === "self" || key.includes("client")) return "self";
  if (key === "two_children" || key.includes("deux_enfant")) return "two_children";
  if (key === "one_child" || key === "enfant" || key.includes("un_enfant")) return "one_child";
  return parseFollowUp(value);
}

function splitCsvLine(line: string, delimiter: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (quoted) {
      if (char === '"') {
        if (line[index + 1] === '"') {
          current += '"';
          index += 1;
        } else quoted = false;
      } else current += char;
    } else if (char === '"') quoted = true;
    else if (char === delimiter) {
      cells.push(current.trim());
      current = "";
    } else current += char;
  }
  cells.push(current.trim());
  return cells;
}

function delimiterOf(headerLine: string) {
  const semicolons = (headerLine.match(/;/g) ?? []).length;
  const commas = (headerLine.match(/,/g) ?? []).length;
  return semicolons > commas ? ";" : ",";
}

export function parseCareClientCsv(csv: string): { rows: CareClientCsvRow[]; skipped: CareClientCsvSkip[]; error: string | null } {
  const text = csv.replace(/^\uFEFF/, "").replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim();
  if (!text) return { rows: [], skipped: [], error: "Le fichier est vide." };
  const lines = text.split("\n").filter((line) => line.trim());
  const delimiter = delimiterOf(lines[0] ?? "");
  const headers = splitCsvLine(lines[0] ?? "", delimiter).map((cell) => HEADER_FIELDS[headerKey(cell)] ?? "");
  if (!headers.includes("first_name") || !headers.includes("email")) {
    return { rows: [], skipped: [], error: "La première ligne doit nommer les colonnes, en commençant par prenom et email." };
  }
  const rows: CareClientCsvRow[] = [];
  const skipped: CareClientCsvSkip[] = [];
  const seen = new Set<string>();
  for (let index = 1; index < lines.length && rows.length + skipped.length < 500; index += 1) {
    const cells = splitCsvLine(lines[index], delimiter);
    const record: Record<string, string> = {};
    headers.forEach((field, cellIndex) => {
      if (field) record[field] = cells[cellIndex] ?? "";
    });
    const followUp = followUpFromCsv(record.follow_up ?? "");
    const row: CareClientCsvRow = {
      line: index + 1,
      first_name: record.first_name ?? "",
      last_name: record.last_name ?? "",
      email: (record.email ?? "").trim().toLowerCase(),
      phone: record.phone ?? "",
      address_line: record.address_line ?? "",
      postal_code: record.postal_code ?? "",
      city: record.city ?? "",
      follow_up: followUp,
      child_one_first_name: followUp === "self" ? "" : record.child_one_first_name ?? "",
      child_one_last_name: followUp === "self" ? "" : record.child_one_last_name ?? "",
      child_two_first_name: followUp === "two_children" ? record.child_two_first_name ?? "" : "",
      child_two_last_name: followUp === "two_children" ? record.child_two_last_name ?? "" : "",
      notes: record.notes ?? "",
    };
    const invalid = validateCareClient(row);
    if (invalid) {
      skipped.push({ line: row.line, email: row.email, reason: invalid });
      continue;
    }
    if (seen.has(row.email)) {
      skipped.push({ line: row.line, email: row.email, reason: "Doublon dans le fichier." });
      continue;
    }
    seen.add(row.email);
    rows.push(row);
  }
  if (lines.length > 501) skipped.push({ line: 502, email: "", reason: "Seules les 500 premières lignes sont lues." });
  return { rows, skipped, error: null };
}
