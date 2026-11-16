import { Suspense } from "react";
import { QualiopiProceduresV2Panel } from "@/components/super-admin/qualiopi-procedures-v2-panel";
import { QUALIOPI_PAGE_BG } from "@/components/super-admin/qualiopi/qualiopi-audit-styles";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default function QualiopiProcessPage() {
  return (
    <div className={cn(QUALIOPI_PAGE_BG, "min-h-[calc(100vh-5rem)] space-y-8 px-3 py-6 sm:px-6 sm:py-8")}>
      <Suspense
        fallback={
          <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)_300px]">
            <div className="h-[420px] animate-pulse rounded-[24px] bg-[#111831]" />
            <div className="h-[420px] animate-pulse rounded-[24px] bg-[#111831]" />
            <div className="h-[420px] animate-pulse rounded-[24px] bg-[#111831]" />
          </div>
        }
      >
        <QualiopiProceduresV2Panel />
      </Suspense>
    </div>
  );
}
