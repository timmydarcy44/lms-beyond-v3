import type { Metadata } from "next";
import type { ReactNode } from "react";

import { SF_PRO } from "@/lib/clement-lepley/constants";

export const metadata: Metadata = {
  title: "Clément Lepley — Donner vie à votre extérieur",
  description:
    "Aménagement extérieur sur mesure : terrasses, allées, nivellement. De l'idée à la création, Clément Lepley s'occupe de tout.",
};

export default function ClementLepleyLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen bg-[#0a0a0a] text-white antialiased"
      style={{ fontFamily: SF_PRO }}
    >
      {children}
    </div>
  );
}
