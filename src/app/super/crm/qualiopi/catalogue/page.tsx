import { QualiopiCataloguePanel } from "@/components/super-admin/qualiopi-catalogue-panel";
import { cn } from "@/lib/utils";

export default function QualiopiCataloguePage() {
  return (
    <div className={cn("min-h-full bg-[#0A0F1E] px-3 py-6 text-[#F2F4FA] sm:px-6 sm:py-8")}>
      <QualiopiCataloguePanel />
    </div>
  );
}
