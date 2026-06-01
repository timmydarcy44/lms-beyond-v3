import Papa from "papaparse";
import * as XLSX from "xlsx";
import {
  detectColumns,
  mapColumns,
  type ColumnMapping,
  type ParsedEmployeeRow,
} from "@/lib/onboarding/column-mapping";

export async function parseEmployeeFile(
  file: File,
  mappingOverride?: ColumnMapping,
): Promise<{ rows: ParsedEmployeeRow[]; headers: string[]; mapping: ColumnMapping }> {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  let raw: Record<string, unknown>[] = [];
  let headers: string[] = [];

  if (ext === "csv") {
    const text = await file.text();
    const parsed = Papa.parse<Record<string, unknown>>(text, {
      header: true,
      skipEmptyLines: true,
    });
    if (parsed.errors.length > 0) {
      throw new Error(parsed.errors[0]?.message ?? "CSV invalide");
    }
    raw = parsed.data ?? [];
    headers = parsed.meta.fields ?? Object.keys(raw[0] ?? {});
  } else if (ext === "xlsx" || ext === "xls") {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: "array" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);
    headers = raw.length > 0 ? Object.keys(raw[0]) : [];
  } else {
    throw new Error("Format non supporté. Utilisez CSV ou XLSX.");
  }

  const mapping = mappingOverride && Object.keys(mappingOverride).length > 0
    ? mappingOverride
    : detectColumns(headers);

  const rows = mapColumns(raw, mapping);
  return { rows, headers, mapping };
}

export function previewStats(rows: ParsedEmployeeRow[]) {
  const valid = rows.filter((r) => !r._skipReason && (r.email || r.first_name !== "—"));
  const departments = [
    ...new Set(valid.map((r) => r.department?.trim()).filter(Boolean) as string[]),
  ];
  const sansEmail = valid.filter((r) => !r.email).length;
  return {
    total: valid.length,
    departments,
    sansEmail,
    skipped: rows.filter((r) => r._skipReason).length,
  };
}
