"use client";

import type { DiscriminationFinding } from "@/lib/entreprise/offer-discrimination";

export function OfferDiscriminationNote({
  status,
  findings,
  onApply,
}: {
  status: "idle" | "checking" | "clean" | "review";
  findings: DiscriminationFinding[];
  onApply: (finding: DiscriminationFinding) => void;
}) {
  if (status === "idle") return null;
  if (status === "checking" && findings.length === 0) {
    return <p className="mt-4 text-sm text-[#6B6F7A]">Vérification de l'annonce…</p>;
  }
  if (status === "clean") {
    return (
      <div className="mt-4 rounded-[20px] bg-[#E3F6EC] px-4 py-3 text-sm font-semibold text-[#126B3B]">
        Annonce non discriminante. Aucune mention d'âge, de sexe ou de situation personnelle détectée.
      </div>
    );
  }
  return (
    <div className="mt-4 space-y-3">
      <p className="flex items-center gap-2 text-sm font-extrabold text-[#07080B]">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#FDECEC] text-xs text-[#1A0C04]" aria-hidden>✓</span>
        À vérifier
      </p>
      <p className="text-sm text-[#3A3D45]">La publication reste possible.</p>
      {findings.map((finding) => (
        <div key={finding.id} className="rounded-[20px] bg-[#FDECEC] px-4 py-3 text-sm text-[#1A0C04]">
          <p className="font-extrabold">{finding.reason === "âge" || finding.reason === "origine" ? `Mention d'${finding.reason}` : `Mention de ${finding.reason}`}</p>
          <p className="mt-1">« {finding.passage} »</p>
          <p className="mt-2 whitespace-pre-wrap">{finding.rewrite}</p>
          <button
            type="button"
            onClick={() => onApply(finding)}
            className="mt-3 h-10 rounded-full bg-[#07080B] px-4 text-sm font-semibold text-white"
          >
            Utiliser cette reformulation
          </button>
        </div>
      ))}
    </div>
  );
}
