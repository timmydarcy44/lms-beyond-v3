"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { APPRENANT_CARD_BODY, APPRENANT_CARD_KICKER } from "@/lib/apprenant/connect-nav";
import { PROFIL_EDGE_SECTION_BASE } from "@/lib/particulier/profil-edge-maturity";

type Props = {
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function ProfilEdgeSectionShell({ title, description, children }: Props) {
  return (
    <div className="space-y-6">
      <Link
        href={PROFIL_EDGE_SECTION_BASE}
        className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour au Profil EDGE
      </Link>
      <header>
        <p className={APPRENANT_CARD_KICKER}>Profil EDGE</p>
        <h1 className="mt-2 text-2xl font-bold text-white">{title}</h1>
        {description ? <p className="mt-2 text-sm text-white/50">{description}</p> : null}
      </header>
      <div className={APPRENANT_CARD_BODY}>{children}</div>
    </div>
  );
}
