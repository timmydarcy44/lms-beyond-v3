import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Tarifs | Beyond Center",
  description:
    "Choisissez le mode qui correspond à votre organisation — plateforme SaaS autonome ou accompagnement mission & suivi.",
};

export default function TarifLayout({ children }: { children: ReactNode }) {
  return children;
}
