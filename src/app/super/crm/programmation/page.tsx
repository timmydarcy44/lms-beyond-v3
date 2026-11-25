import { Suspense } from "react";
import { FormationProgrammationBoard } from "@/components/super-admin/formation-programmation-board";

export default function ProgrammationPage() {
  return (
    <div className="min-h-screen bg-[#0A0C1B] px-3 py-6 sm:px-6 sm:py-8">
      <Suspense fallback={<p className="text-sm text-[#A3A8C7]">Chargement…</p>}>
        <FormationProgrammationBoard />
      </Suspense>
    </div>
  );
}
