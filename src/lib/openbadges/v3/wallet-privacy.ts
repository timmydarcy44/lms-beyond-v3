export type WalletEvidenceChoice = {
  index: number;
  name: string;
  public: boolean;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
}

export function walletEvidenceChoices(raw: unknown): WalletEvidenceChoice[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item, index) => {
    const record = asRecord(item);
    if (!record) return [];
    const name = String(record.name ?? record.narrative ?? "").trim();
    if (!name) return [];
    return [{ index, name, public: record.public === true || record.public === "true" }];
  });
}

export function setEvidenceVisibility(raw: unknown, index: number, visible: boolean): unknown[] | null {
  if (!Array.isArray(raw) || !Number.isInteger(index) || index < 0 || index >= raw.length) return null;
  const current = asRecord(raw[index]);
  if (!current || !String(current.name ?? current.narrative ?? "").trim()) return null;
  return raw.map((item, itemIndex) => {
    if (itemIndex !== index) return item;
    const record = asRecord(item);
    return record ? { ...record, public: visible } : item;
  });
}
