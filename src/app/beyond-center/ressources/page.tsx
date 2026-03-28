import type { Metadata } from "next";
import { BeyondCenterRessourcesPage } from "@/components/beyond-center/beyond-center-marketing-inner";

export const metadata: Metadata = {
  title: "Ressources | Beyond Center",
  description:
    "Articles, études, insights et cas clients Beyond Center — performance cognitive et développement des équipes.",
};

export default function BeyondCenterRessourcesRoute() {
  return <BeyondCenterRessourcesPage />;
}
