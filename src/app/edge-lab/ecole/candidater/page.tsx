import type { Metadata } from "next";
import { Suspense } from "react";
import { Manrope } from "next/font/google";

import { CfaApplicationFlow } from "@/components/edge-site/cfa/cfa-application-flow";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "Candidater — Byound School",
  description:
    "Crée ton profil, passe le Byound Challenge et rejoins la prochaine promotion Byound School.",
};

export default function CfaApplyPage() {
  return (
    <div className={manrope.className}>
      <Suspense fallback={<div className="min-h-screen bg-[#070C1C]" />}>
        <CfaApplicationFlow />
      </Suspense>
    </div>
  );
}
