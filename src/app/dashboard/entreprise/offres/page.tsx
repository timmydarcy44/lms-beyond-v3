import { Suspense } from "react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { OffresBoard, OffresSkeleton } from "@/components/enterprise/offres-board";

export default function EntrepriseOffresPage() {
  return (
    <div className="min-h-screen bg-[#F4F4F1] text-[#07080B]">
      <EnterpriseSidebar />
      <Suspense fallback={<OffresSkeleton />}>
        <OffresBoard />
      </Suspense>
    </div>
  );
}
