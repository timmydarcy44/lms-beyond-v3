"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { ProfilEdgeSectionShell } from "@/components/apprenant/profil-edge/profil-edge-section-shell";
import { buildProfilEdgeExplorations } from "@/lib/particulier/profil-edge-progress";

type Props = {
  hasDisc: boolean;
  hasSoftSkills: boolean;
  hasIdmc: boolean;
};

export function ProfilEdgeTestsSection({ hasDisc, hasSoftSkills, hasIdmc }: Props) {
  const explorations = buildProfilEdgeExplorations({ hasDisc, hasSoftSkills, hasIdmc });

  return (
    <ProfilEdgeSectionShell
      title="Tests EDGE"
      description="Les trois explorations alimentent votre Profil EDGE et débloquent le badge (10 % chacune)."
    >
      <ul className="space-y-3">
        {explorations.map((exp) => (
          <li key={exp.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 px-4 py-3">
            <span className="text-sm text-white/80">{exp.label}</span>
            {exp.done ? (
              <span className="flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 className="h-4 w-4" /> Complété
              </span>
            ) : (
              <Link href={exp.introHref} className="text-xs text-[#3D7BFF] hover:underline">
                Passer le test
              </Link>
            )}
          </li>
        ))}
      </ul>
    </ProfilEdgeSectionShell>
  );
}
