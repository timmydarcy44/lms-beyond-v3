import type { Metadata } from "next";
import { BeyondCenterPilotePage } from "@/components/beyond-center/beyond-center-marketing-inner";

export const metadata: Metadata = {
  title: "Lancer un pilote | Beyond Center",
  description:
    "Contenu, déroulé et résultats attendus d'un pilote Beyond Center — testez la démarche dans votre organisation.",
};

export default function PilotePage() {
  return <BeyondCenterPilotePage />;
}
