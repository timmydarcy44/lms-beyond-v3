import type { CareDocumentKind } from "@/lib/care/patient-document-model";
import { patientTokens } from "@/app/dashboard/patient/_ui/tokens";
import { FileText, FlaskConical, Paperclip, Receipt } from "lucide-react";

const KIND_STYLE: Record<CareDocumentKind, { bg: string; fg: string }> = {
  report: patientTokens.kinds.report,
  test_result: patientTokens.kinds.test,
  invoice: patientTokens.kinds.invoice,
  other: patientTokens.kinds.other,
};

export function DocumentKindMark({ kind }: { kind: CareDocumentKind }) {
  const style = KIND_STYLE[kind];
  const Icon = kind === "test_result" ? FlaskConical : kind === "invoice" ? Receipt : kind === "other" ? Paperclip : FileText;
  return (
    <span className="patient-doc-icon" style={{ background: style.bg, color: style.fg }} aria-hidden>
      <Icon size={18} />
    </span>
  );
}
