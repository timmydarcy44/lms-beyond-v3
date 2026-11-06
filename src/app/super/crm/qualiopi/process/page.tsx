import { QualiopiProcessDocsPanel } from "@/components/super-admin/qualiopi-process-docs-panel";
import { QUALIOPI_PAGE_BG } from "@/components/super-admin/qualiopi/qualiopi-audit-styles";
import { cn } from "@/lib/utils";

export default function QualiopiProcessPage() {
  return (
    <div className={cn(QUALIOPI_PAGE_BG, "space-y-8 px-3 py-6 sm:px-6 sm:py-8")}>
      <QualiopiProcessDocsPanel />
    </div>
  );
}
