import { Metadata } from "next";
import { BeyondConnectLandingPage } from "@/components/beyond-connect/beyond-connect-landing-page";

export const metadata: Metadata = {
  title: "Beyond Connect - Optimisation du recrutement | Beyond",
  description: "Trouvez votre stage, alternance, CDI ou CDD grâce à Beyond Connect. Système de matching intelligent pour optimiser vos chances de décrocher le poste idéal.",
};

export default function ConnectPage() {
  return <BeyondConnectLandingPage />;
}
