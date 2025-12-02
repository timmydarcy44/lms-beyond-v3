import { Metadata } from "next";
import { ConfidenceTestPlayer } from "@/components/jessica-contentin/confidence-test-player";
import { getSession } from "@/lib/auth/session";
import { getUserName } from "@/lib/utils/user-name";

export const metadata: Metadata = {
  title: "Test de Confiance en soi – Jessica Contentin",
  description: "Évaluez votre estime de soi, votre auto-efficacité, votre assertivité et vos compétences sociales grâce à un test professionnel et bienveillant.",
  keywords: "test confiance en soi, estime de soi, auto-efficacité, assertivité, compétences sociales, Jessica Contentin, psychopédagogue, TDAH, HPI",
  openGraph: {
    title: "Test de Confiance en soi – Jessica Contentin",
    description: "Évaluez votre estime de soi, votre auto-efficacité, votre assertivité et vos compétences sociales grâce à un test professionnel et bienveillant.",
    type: "website",
  },
};

export default async function ConfidenceTestPage() {
  const session = await getSession();
  const firstName = session ? getUserName(session.fullName || session.email || null) : null;
  
  return <ConfidenceTestPlayer initialFirstName={firstName || undefined} />;
}

