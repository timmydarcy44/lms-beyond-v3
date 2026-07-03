"use client";

import SidebarExpert from "@/components/SidebarExpert";
import { useExpertAccess } from "@/components/expert/expert-access-provider";
import { FileText, Upload } from "lucide-react";

export default function ExpertDocumentsPage() {
  const { isApproved } = useExpertAccess();

  return (
    <div className="min-h-screen bg-[#F7F7F5] text-[#050505]">
      <SidebarExpert restricted={!isApproved} />
      <main className="min-h-screen pl-[260px]">
        <div className="mx-auto max-w-4xl px-6 py-10 pb-24">
          <header className="mb-8">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#635BFF]">Documents</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight">CV & justificatifs</h1>
            <p className="mt-2 text-sm text-[#050505]/55">
              Centralisez vos documents pour accélérer la validation de votre dossier.
            </p>
          </header>

          <section className="rounded-[28px] border border-dashed border-[#050505]/12 bg-white p-10 text-center shadow-sm">
            <Upload className="mx-auto h-10 w-10 text-[#635BFF]" aria-hidden />
            <p className="mt-4 text-sm font-medium">Ajout de documents bientôt disponible</p>
            <p className="mt-2 text-sm text-[#050505]/50">
              En attendant, complétez votre profil et contactez EDGE pour transmettre votre CV.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-[#050505]/8 bg-[#F7F7F5] px-4 py-3 text-sm text-[#050505]/60">
              <FileText className="h-4 w-4 text-[#635BFF]" aria-hidden />
              CV, certifications, attestations
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
