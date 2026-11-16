import { Suspense } from "react";
import { LmsSuiviV2Panel } from "@/components/super-admin/lms-suivi-v2-panel";
import { loadLearnerSuivi, type SuiviPeriod } from "@/lib/lms/learner-suivi-data";

export const dynamic = "force-dynamic";

function SuiviSkeleton() {
  return (
    <div className="space-y-6 px-4 py-8 sm:px-8" style={{ fontFamily: "Manrope, system-ui, sans-serif" }}>
      <div className="h-8 w-24 animate-pulse rounded bg-[#111831]" />
      <div className="h-10 w-80 animate-pulse rounded bg-[#111831]" />
      <div className="h-28 animate-pulse rounded-[24px] bg-[#111831]" />
      <div className="h-96 animate-pulse rounded-[24px] bg-[#111831]" />
    </div>
  );
}

async function SuiviContent({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const period = (String(params.period ?? "30d") as SuiviPeriod) || "30d";
  const includeHidden = String(params.team ?? "") === "1";

  const { rows, kpis, courses, companies } = await loadLearnerSuivi({
    period: ["7d", "30d", "90d", "all"].includes(period) ? period : "30d",
    includeHidden,
  });

  return (
    <main className="px-4 py-8 sm:px-8">
      <LmsSuiviV2Panel initialRows={rows} kpis={kpis} courses={courses} companies={companies} />
    </main>
  );
}

export default function SuperLearnerSuiviPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <Suspense fallback={<SuiviSkeleton />}>
      <SuiviContent searchParams={searchParams} />
    </Suspense>
  );
}
