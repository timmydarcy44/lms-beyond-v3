"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ClubLayout } from "@/components/club/club-layout";
import { useClubGuard } from "@/components/club/use-club-guard";
import { clubPartners } from "@/lib/mocks/club-partners";
import { cn } from "@/lib/utils";
import { usePartnerOffers } from "@/lib/club/partner-offers-store";

const statusStyles: Record<string, string> = {
  "Signé": "bg-emerald-500/20 text-emerald-300",
  "Prospect": "bg-gray-500/20 text-gray-300",
  "En négociation": "bg-yellow-500/20 text-yellow-300",
  "À renouveler": "bg-red-500/20 text-red-300",
};

export default function ClubPartnerDetailPage() {
  const status = useClubGuard();
  const params = useParams();
  const slug = String(params?.slug ?? "");
  const partner = clubPartners.find((item) => item.slug === slug);
  const [activeTab, setActiveTab] = useState<"fiche" | "offres">("fiche");
  const partnerOffers = usePartnerOffers(partner?.nom);

  if (status !== "allowed") {
    return null;
  }

  if (!partner) {
    return (
      <ClubLayout activeItem="Partenaires">
        <div className="rounded-2xl border border-white/10 bg-[#111] p-8 text-white/70">
          Partenaire introuvable.
        </div>
      </ClubLayout>
    );
  }

  return (
    <ClubLayout activeItem="Partenaires">
      <Link href="/dashboard/club/partenaires" className="text-sm text-white/60 hover:text-white">
        ← Retour
      </Link>

      <div className="mt-6">
        <div className="flex flex-wrap gap-2">
          {[
            { id: "fiche", label: "Fiche partenaire" },
            { id: "offres", label: "Offres" },
          ].map((tab) => (
            <button
              key={tab.id}
              className={cn(
                "rounded-full px-4 py-2 text-sm",
                activeTab === tab.id
                  ? "bg-white/15 text-white"
                  : "bg-white/5 text-white/60 hover:text-white"
              )}
              onClick={() => setActiveTab(tab.id as "fiche" | "offres")}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === "fiche" && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6">
            <div className="rounded-2xl bg-[#1a1a1a] p-6">
              <div className="flex items-center gap-4">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-semibold text-white"
                  style={{ backgroundColor: partner.logo_couleur }}
                >
                  {partner.logo_initiales}
                </div>
                <div>
                  <div className="text-3xl font-black text-white">{partner.nom}</div>
                  <span
                    className="mt-2 inline-flex rounded-full px-3 py-1 text-xs"
                    style={{ backgroundColor: "color-mix(in srgb, var(--club-primary) 20%, transparent)", color: "var(--club-primary)" }}
                  >
                    {partner.secteur}
                  </span>
                  <div className="mt-2 text-sm text-white/60">{partner.adresse}</div>
                </div>
              </div>
              <div className="mt-6 text-sm text-white/60">Prestations proposées</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {partner.prestations.map((item) => (
                  <span key={item} className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
                    {item}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-[#1a1a1a] p-6">
              <div className="text-xl font-bold text-white">Contact principal</div>
              <div className="mt-3 text-white">
                {partner.contact_prenom} {partner.contact_nom}
              </div>
              <a href={`mailto:${partner.contact_email}`} className="mt-1 block text-sm text-blue-300">
                {partner.contact_email}
              </a>
              <a href={`tel:${partner.contact_tel}`} className="mt-1 block text-sm text-white/70">
                {partner.contact_tel}
              </a>
              <button
                className="mt-4 rounded-full px-4 py-2 text-sm text-white"
                style={{ backgroundColor: "var(--club-primary)" }}
              >
                Envoyer un message
              </button>
            </div>

            <div className="rounded-2xl bg-[#1a1a1a] p-6">
              <div className="text-xl font-bold text-white">Historique</div>
              <div className="mt-4 space-y-3 text-sm text-white/70">
                <div>Signé le 15 Jan 2025 — {partner.valeur.toLocaleString("fr-FR")}€</div>
                <div>Renouvellement prévu {partner.renouvellement}</div>
                <div>Présent soirée partenaires Mars 2025</div>
                <div>Deal généré avec partenaire — Avril 2025</div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
          <div className="rounded-2xl bg-[#1a1a1a] p-6">
            <div className="text-sm text-white/60">Contrat</div>
            <div className="mt-2 text-4xl font-black" style={{ color: "var(--club-primary)" }}>
              {partner.valeur.toLocaleString("fr-FR")}€
            </div>
            <div className="mt-3">
              <span className={cn("rounded-full px-3 py-1 text-xs", statusStyles[partner.statut])}>
                {partner.statut}
              </span>
            </div>
            <div className="mt-3 text-sm text-white/60">Date signature : 15 Jan 2025</div>
            <div className="text-sm text-white/60">Renouvellement : {partner.renouvellement}</div>
            {partner.statut === "À renouveler" && (
              <button className="mt-4 rounded-full bg-red-500/20 px-4 py-2 text-sm text-red-300">
                Envoyer une relance
              </button>
            )}
            <button className="mt-3 w-full rounded-full bg-white/10 px-4 py-2 text-sm text-white">
              Modifier le contrat
            </button>
          </div>

          <div className="rounded-2xl bg-[#1a1a1a] p-6">
            <div className="text-lg font-semibold text-white">ROI estimé</div>
            <div className="mt-3 space-y-2 text-sm text-white/70">
              <div>Visibilité : 45 000 impressions/mois</div>
              <div>Deals générés : 3</div>
              <div>Valeur deals : 12 000€</div>
            </div>
            <Link
              href="/dashboard/entreprise"
              className="mt-4 block rounded-full bg-white/10 px-4 py-2 text-center text-sm text-white"
            >
              Accès Beyond Team
            </Link>
          </div>

          <div className="rounded-2xl bg-[#1a1a1a] p-6">
            <div className="text-lg font-semibold text-white">Pack souscrit</div>
            <div className="mt-2 text-sm text-white/70">Pack Or</div>
            <div className="mt-3 space-y-2 text-sm">
              {[
                "Logo maillot match",
                "Naming événement",
                "Loge VIP saison complète",
                "Mention RS (8x/mois)",
              ].map((item) => (
                <div key={item} className="text-white/70">
                  <span style={{ color: "var(--club-primary)" }}>✓</span> {item}
                </div>
              ))}
            </div>
            <button className="mt-4 w-full rounded-full bg-white/10 px-4 py-2 text-sm text-white">
              Modifier l'offre
            </button>
          </div>
          </div>
        </div>
      )}

      {activeTab === "offres" && (
        <div className="mt-6 rounded-2xl bg-[#1a1a1a] p-6">
          <div className="text-xl font-bold text-white">Offres</div>
          {partnerOffers.length === 0 ? (
            <div className="mt-3 text-sm text-white/60">
              Aucune offre sauvegardée pour ce partenaire.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {partnerOffers.map((offer) => (
                <div key={offer.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-white/5 p-4">
                  <div>
                    <div className="text-white">{offer.name}</div>
                    <div className="text-sm text-white/60">
                      Total HT : {offer.totalHt.toLocaleString("fr-FR")}€ ·{" "}
                      {new Date(offer.createdAt).toLocaleDateString("fr-FR")}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-full bg-white/10 px-4 py-2 text-xs text-white">
                      Générer PDF
                    </button>
                    <button className="rounded-full bg-white/10 px-4 py-2 text-xs text-white">
                      Envoyer par email
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </ClubLayout>
  );
}
