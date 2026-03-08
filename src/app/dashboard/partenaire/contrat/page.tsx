"use client";

import { PartenaireLayout } from "@/components/partenaire/partenaire-layout";
import {
  partenaireClub,
  partenaireProfile,
  partenairePrestations,
} from "@/lib/mocks/partenaire-data";
import { cn } from "@/lib/utils";

const statusClass = "bg-emerald-500/20 text-emerald-300";

export default function PartenaireContratPage() {
  const tva = partenaireProfile.contractAmountHt * 0.2;
  const ttc = partenaireProfile.contractAmountHt * 1.2;

  return (
    <PartenaireLayout
      activeItem="Mon contrat"
      club={{ name: partenaireClub.name, initials: partenaireClub.initials, logoUrl: partenaireClub.logoUrl }}
      partner={{ name: partenaireProfile.name, initials: partenaireProfile.initials }}
    >
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#1B2A4A]/60 p-6">
            <div className="text-lg font-semibold text-white">Détails du contrat</div>
            <div className="mt-4 grid gap-3 text-sm text-white/70">
              <div>Type : Sponsoring</div>
              <div>Pack : {partenaireProfile.pack}</div>
              <div>Période : 01/09/2025 → 31/08/2026</div>
              <div>Montant HT : {partenaireProfile.contractAmountHt.toLocaleString("fr-FR")}€</div>
              <div>TVA : {tva.toLocaleString("fr-FR")}€</div>
              <div>Montant TTC : {ttc.toLocaleString("fr-FR")}€</div>
              <div>Modalité : Virement</div>
              <div>
                Statut paiement : <span className={cn("rounded-full px-2 py-0.5 text-xs", statusClass)}>À jour</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#1B2A4A]/60 p-6">
            <div className="text-lg font-semibold text-white">Mes prestations</div>
            <div className="mt-4 space-y-3">
              {partenairePrestations.map((item) => (
                <div key={item.id} className="flex items-center justify-between rounded-xl bg-white/5 p-4">
                  <div className="text-white">{item.title}</div>
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-xs",
                      item.status === "Actif"
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-orange-500/20 text-orange-200"
                    )}
                  >
                    {item.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-white/10 bg-[#1B2A4A]/60 p-6">
            <div className="text-lg font-semibold text-white">Documents</div>
            <div className="mt-4 space-y-3 text-sm text-white/70">
              <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                <span>Contrat signé (PDF)</span>
                <button className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                  Télécharger
                </button>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                <span>Facture échéance #1</span>
                <button className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                  Télécharger
                </button>
              </div>
              <div className="flex items-center justify-between rounded-xl bg-white/5 p-3">
                <span>Convention de mécénat</span>
                <button className="rounded-full bg-white/10 px-3 py-1 text-xs text-white">
                  Télécharger
                </button>
              </div>
            </div>
            <a
              href={`mailto:contact@beyond.fr?subject=Demande%20d%27avenant%20-%20${encodeURIComponent(
                partenaireProfile.name
              )}`}
              className="mt-4 inline-flex rounded-full bg-white/10 px-4 py-2 text-xs text-white"
            >
              Demander un avenant
            </a>
          </div>
        </div>
      </div>
    </PartenaireLayout>
  );
}
