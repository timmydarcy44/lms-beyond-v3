"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Parcours } from "@/lib/parcours";
import { EDGE_CTA_LABELS, EDGE_HREFS } from "@/lib/edge-site/constants";
import { cn } from "@/lib/utils";

type Props = {
  parcours: Parcours;
  selectedAddons: Set<string>;
  onToggleAddon: (id: string) => void;
};

export function ParcoursInvestmentSection({ parcours, selectedAddons, onToggleAddon }: Props) {
  const addonsTotal = useMemo(
    () => parcours.addons.filter((a) => selectedAddons.has(a.id)).reduce((s, a) => s + a.prix, 0),
    [parcours.addons, selectedAddons],
  );
  const total = parcours.prix + addonsTotal;
  const moduleCount = parcours.modules.length;
  const hoursLabel = parcours.duree.replace(/\s*h.*$/i, "h");

  const included = [
    `${parcours.duree} d'accompagnement — experts terrain, pas des vidéos seules`,
    `${moduleCount} modules construits autour de tes enjeux réels`,
    "Livrables opposables — badge IMS Global vérifiable",
    "Échange individuel avant toute inscription",
    "Cohorte limitée — places nommées",
  ];

  const priceIncluded = [
    `${moduleCount} modules structurés`,
    "Livrables évalués",
    "Badge Open Badge IMS Global certifié",
  ];

  return (
    <section id="tarifs" className="bg-white px-5 py-20 sm:px-10 sm:py-28">
      <div className="mx-auto max-w-3xl text-center">
        <p className="font-sf-pro-bold text-[11px] uppercase tracking-[0.2em] text-edge-red">
          Parcours sur mesure
        </p>
        <h2 className="font-sf-pro-bold mt-5 text-[clamp(2rem,5vw,2.75rem)] leading-[1.08] tracking-tight text-edge-black">
          Construis ton parcours.
          <br />
          Pas un catalogue.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[17px] leading-relaxed text-black/45">
          Chaque cohorte est limitée. Avant le premier jour, on ajuste le parcours à ton contexte. Haut de
          gamme, pas standardisé.
        </p>
      </div>

      <div className="mx-auto mt-16 max-w-4xl">
        <div className="rounded-3xl bg-[#f5f5f7] p-8 sm:p-10">
          <p className="font-sf-pro-bold text-[13px] uppercase tracking-[0.12em] text-black/40">
            Ce qui est inclus
          </p>
          <ul className="mt-6 space-y-4">
            {included.map((line) => (
              <li key={line} className="flex gap-3 text-[15px] leading-relaxed text-edge-black">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-edge-red" aria-hidden />
                {line}
              </li>
            ))}
          </ul>
        </div>

        {parcours.addons.length > 0 ? (
          <div className="mt-14">
            <p className="font-sf-pro-bold text-center text-[13px] uppercase tracking-[0.12em] text-black/40">
              Approfondissements optionnels
            </p>
            <p className="mx-auto mt-3 max-w-lg text-center text-[15px] leading-relaxed text-black/45">
              Tu choisis les modules qui comptent pour toi — on en parle ensemble à l&apos;échange de 20
              minutes.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {parcours.addons.map((addon) => {
                const selected = selectedAddons.has(addon.id);
                return (
                  <div
                    key={addon.id}
                    className={cn(
                      "rounded-2xl border p-6 text-left",
                      selected
                        ? "border-edge-red bg-edge-red/[0.04]"
                        : "border-black/[0.06] bg-[#f5f5f7]",
                    )}
                  >
                    <p className="font-sf-pro-bold text-[16px] leading-snug text-edge-black">{addon.titre}</p>
                    <p className="mt-2 text-[14px] leading-relaxed text-black/45">
                      {addon.benefit ?? addon.thematique}
                    </p>
                    <p className="mt-4 text-[13px] text-edge-red">+{addon.prix}€</p>
                    <p className="mt-1 text-[11px] text-black/30">Badge individuel inclus</p>
                    <button
                      type="button"
                      onClick={() => onToggleAddon(addon.id)}
                      className={cn(
                        "mt-4 rounded-full border px-5 py-1.5 text-[12px] font-medium transition-colors",
                        selected
                          ? "border-[0.5px] border-edge-red bg-transparent text-edge-red"
                          : "border-edge-red text-edge-red hover:bg-edge-red/[0.04]",
                      )}
                    >
                      {selected ? "✓ Ajouté" : "Ajouter"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        <div className="mt-16 text-center">
          <p className="text-[13px] uppercase tracking-[0.14em] text-black/35">L&apos;investissement</p>
          <p className="mb-2 mt-4 text-[11px] uppercase tracking-[0.2em] text-black/30">Parcours de base</p>
          <p className="text-[48px] font-medium leading-none text-edge-black">{total}€</p>
          <p className="mt-2 text-[13px] text-black/40">
            {hoursLabel} · Open Badge IMS Global · Certifié Beyond
          </p>
          <ul className="mt-4 space-y-0 text-[12px] leading-[1.8] text-black/40">
            {priceIncluded.map((item) => (
              <li key={item}>· {item}</li>
            ))}
          </ul>
          {addonsTotal > 0 ? (
            <p className="mt-2 text-[13px] text-black/35">
              dont {addonsTotal}€ d&apos;approfondissements personnalisés
            </p>
          ) : null}
          <p className="mt-2 text-[13px] text-black/35">Financement OPCO — on t&apos;accompagne dans les démarches</p>

          <Link
            href={EDGE_HREFS.postuler(parcours.slug)}
            className="font-sf-pro-bold mt-10 inline-flex min-w-[240px] items-center justify-center rounded-full bg-edge-red px-10 py-4 text-[15px] text-white transition-opacity hover:opacity-90"
          >
            {EDGE_CTA_LABELS.apply}
          </Link>
          <p className="mt-4 text-[12px] text-black/30">Candidature gratuite · réponse sous 48h · sans engagement</p>
        </div>
      </div>
    </section>
  );
}
