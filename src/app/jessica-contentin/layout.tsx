import type { Metadata } from "next";
import { JessicaContentinHeader } from "@/components/jessica-contentin/header";
import { JessicaContentinFooter } from "@/components/jessica-contentin/footer";

export const metadata: Metadata = {
  title: "Jessica CONTENTIN - Psychopédagogue certifiée en neuroéducation",
  description:
    "Psychopédagogue certifiée en neuroéducation. Accompagnement personnalisé pour enfants, adolescents et adultes. Gestion des émotions, confiance en soi, troubles DYS, TDA-H.",
};

export function JessicaContentinLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <JessicaContentinHeader />
      <main className="pt-0">{children}</main>
      <JessicaContentinFooter />
    </div>
  );
}

export default JessicaContentinLayout;

