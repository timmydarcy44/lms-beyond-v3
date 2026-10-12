import AbsencesPage from "@/app/dashboard/ecole/planning/absences/page";

export const dynamic = "force-dynamic";

export default function SuperEcoleAbsencesPage() {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#F5F5F7] text-slate-900">
      <AbsencesPage />
    </div>
  );
}
