export type EmployeeField =
  | "last_name"
  | "first_name"
  | "email"
  | "department"
  | "job_title"
  | "contract"
  | "manager";

export type ColumnMapping = Partial<Record<EmployeeField, string>>;

export const COLUMN_MAPPINGS: Record<EmployeeField, string[]> = {
  last_name: ["nom", "name", "lastname", "last_name", "famille"],
  first_name: ["prenom", "prénom", "firstname", "first_name", "givenname"],
  email: ["email", "mail", "courriel", "e-mail"],
  department: [
    "departement",
    "département",
    "department",
    "dept",
    "service",
    "division",
    "pole",
    "pôle",
    "equipe",
    "équipe",
  ],
  job_title: ["poste", "fonction", "titre", "job", "title", "role", "intitule", "intitulé"],
  contract: ["contrat", "contract", "type_contrat", "cdi", "cdd"],
  manager: ["manager", "responsable", "n+1", "superviseur"],
};

function normalizeHeader(header: string): string {
  return header
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

export function detectColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  for (const header of headers) {
    const normalized = normalizeHeader(header);
    if (!normalized) continue;
    for (const [field, aliases] of Object.entries(COLUMN_MAPPINGS) as [EmployeeField, string[]][]) {
      if (mapping[field]) continue;
      if (aliases.some((alias) => normalized.includes(alias) || normalized === alias)) {
        mapping[field] = header;
        break;
      }
    }
  }
  return mapping;
}

export type ParsedEmployeeRow = {
  last_name: string;
  first_name: string;
  email: string | null;
  department: string | null;
  job_title: string | null;
  contract: string | null;
  manager: string | null;
  _row: number;
  _skipReason?: string;
};

export function mapColumns(
  rows: Record<string, unknown>[],
  mapping: ColumnMapping,
): ParsedEmployeeRow[] {
  const out: ParsedEmployeeRow[] = [];
  rows.forEach((row, index) => {
    const pick = (field: EmployeeField) => {
      const col = mapping[field];
      if (!col) return "";
      const v = row[col];
      return v != null ? String(v).trim() : "";
    };
    const last_name = pick("last_name");
    const first_name = pick("first_name");
    const emailRaw = pick("email");
    const email = emailRaw && emailRaw.includes("@") ? emailRaw.toLowerCase() : null;

    if (!last_name && !first_name && !email) {
      out.push({
        last_name: "",
        first_name: "",
        email: null,
        department: null,
        job_title: null,
        contract: null,
        manager: null,
        _row: index + 2,
        _skipReason: "Ligne vide",
      });
      return;
    }

    out.push({
      last_name: last_name || "—",
      first_name: first_name || "—",
      email,
      department: pick("department") || null,
      job_title: pick("job_title") || null,
      contract: pick("contract") || null,
      manager: pick("manager") || null,
      _row: index + 2,
    });
  });
  return out;
}
