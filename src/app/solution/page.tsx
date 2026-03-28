import type { Metadata } from "next";
import { BeyondCenterSolutionPage } from "@/components/beyond-center/beyond-center-solution-page";

export const metadata: Metadata = {
  title: "Solution | Beyond Center",
  description:
    "Comprenez, structurez et déployez la performance des équipes. Méthode Beyond : analyse cognitive, stratégie de développement et plateforme digitale.",
};

export default function SolutionPage() {
  return <BeyondCenterSolutionPage />;
}
