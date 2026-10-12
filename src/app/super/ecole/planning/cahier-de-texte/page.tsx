import CahierDeTextePage from "@/app/dashboard/ecole/planning/cahier-de-texte/page";

export const dynamic = "force-dynamic";

export default function SuperEcoleCahierPage() {
  return (
    <div className="min-h-[calc(100vh-5rem)] bg-[#F5F5F7] text-slate-900">
      <CahierDeTextePage />
    </div>
  );
}
