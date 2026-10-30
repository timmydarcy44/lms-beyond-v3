import { Suspense } from "react";
import { requireCarePage } from "@/lib/expert/care-page";
import { CarePrestationsBoard } from "@/components/expert/care-prestations-board";

export const dynamic = "force-dynamic";

export default async function ExpertPrestationsPage() {
  await requireCarePage();
  return (
    <Suspense>
      <CarePrestationsBoard />
    </Suspense>
  );
}
