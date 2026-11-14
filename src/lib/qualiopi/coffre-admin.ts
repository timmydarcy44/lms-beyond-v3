import type { QualiopiDocument } from "@/lib/crm/qualiopi-shared";
import { QUALIOPI_CORE_DOCS } from "@/lib/crm/qualiopi-shared";

export type CoffreAdminSlot = {
  kind: (typeof QUALIOPI_CORE_DOCS)[number]["kind"];
  title: string;
  deposited: boolean;
  document: QualiopiDocument | null;
};

export type CoffreAdminStatus = {
  slots: CoffreAdminSlot[];
  deposited: number;
  expected: number;
};

/** Source unique coffre admin (templates session_id null / falsy). */
export function getCoffreAdminStatus(documents: QualiopiDocument[]): CoffreAdminStatus {
  const templates = documents.filter((d) => !d.session_id);
  const byKind = new Map<string, QualiopiDocument>();
  for (const doc of templates) {
    const kind = String(doc.kind);
    const prev = byKind.get(kind);
    const hasFile = Boolean(doc.file_url) || Boolean((doc as { storage_path?: string }).storage_path);
    const prevHas =
      prev &&
      (Boolean(prev.file_url) || Boolean((prev as { storage_path?: string }).storage_path));
    if (!prev || (hasFile && !prevHas)) byKind.set(kind, doc);
  }

  const slots: CoffreAdminSlot[] = QUALIOPI_CORE_DOCS.map((template) => {
    const document = byKind.get(template.kind) ?? null;
    const deposited = Boolean(
      document &&
        (Boolean(document.file_url) ||
          Boolean((document as { storage_path?: string | null }).storage_path)),
    );
    return {
      kind: template.kind,
      title: template.title,
      deposited,
      document,
    };
  });

  return {
    slots,
    deposited: slots.filter((s) => s.deposited).length,
    expected: QUALIOPI_CORE_DOCS.length,
  };
}
