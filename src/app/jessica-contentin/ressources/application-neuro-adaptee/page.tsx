import type { Metadata } from "next";
import { JessicaNevoPresentation } from "@/components/jessica-contentin/jessica-nevo-presentation";

export const metadata: Metadata = {
  title: "Application NEVO — Performance cognitive & neuroéducation",
  description:
    "NEVO transforme vos contenus pédagogiques en fiches, schémas, audio, quiz et outils neuro-adaptés. Application recommandée par Jessica Contentin, psychopédagogue.",
};

export default function ApplicationNeuroAdapteePage() {
  return (
    <div className="min-h-screen bg-[#FFFCF9]">
      <JessicaNevoPresentation />
    </div>
  );
}
