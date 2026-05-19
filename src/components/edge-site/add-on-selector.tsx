"use client";

import { useMemo, useState } from "react";
import type { ParcoursAddon } from "@/lib/parcours";

type Props = {
  addons: ParcoursAddon[];
  basePrice: number;
};

export function AddOnSelector({ addons, basePrice }: Props) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const total = useMemo(() => {
    const extra = addons.filter((a) => selected.has(a.id)).reduce((s, a) => s + a.prix, 0);
    return basePrice + extra;
  }, [addons, basePrice, selected]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {addons.map((addon) => {
          const active = selected.has(addon.id);
          return (
            <li key={addon.id} className="bg-white p-6">
              <p className="text-[10px] uppercase tracking-[0.2em] text-edge-red">{addon.thematique}</p>
              <h3 className="mt-2 text-[15px] font-medium text-edge-black">{addon.titre}</h3>
              <p className="mt-4 text-sm font-medium text-edge-black">+{addon.prix}€</p>
              <button
                type="button"
                onClick={() => toggle(addon.id)}
                className={`mt-6 w-full rounded-full border px-4 py-2 text-[13px] font-medium transition-colors duration-200 ${
                  active
                    ? "border-edge-red bg-edge-red text-white"
                    : "border-black/20 text-edge-black hover:border-edge-red hover:text-edge-red"
                }`}
                aria-pressed={active}
                aria-label={active ? `Retirer ${addon.titre}` : `Ajouter ${addon.titre}`}
              >
                {active ? "Ajouté" : "Ajouter"}
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-10 text-sm text-black/40">
        Total estimé : <span className="font-medium text-edge-black">{total}€</span>
      </p>
    </div>
  );
}
