import Link from "next/link";
import type { Parcours } from "@/lib/parcours";
import { EDGE_HREFS } from "@/lib/edge-site/constants";

type Props = {
  parcours: Parcours;
  featured?: boolean;
};

export function ParcoursCard({ parcours, featured = false }: Props) {
  return (
    <Link
      href={EDGE_HREFS.parcoursSlug(parcours.slug)}
      className={`block p-8 transition-opacity duration-200 hover:opacity-90 ${
        featured
          ? "border-l-2 border-edge-red bg-edge-darker"
          : "border-l border-white/[0.06] bg-edge-dark"
      }`}
    >
      <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-edge-red">{parcours.familleLabel}</p>
      <h3 className="mt-3 text-lg font-medium tracking-[-0.02em] text-white">{parcours.titre}</h3>
      <p className="mt-4 text-sm text-white/45">{parcours.duree}</p>
    </Link>
  );
}
