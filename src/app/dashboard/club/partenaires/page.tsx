"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { ClubLayout } from "@/components/club/club-layout";
import { useClubGuard } from "@/components/club/use-club-guard";
import { cn } from "@/lib/utils";
import { getMyClub, getClubPartners } from "@/lib/supabase/club-queries";

const filters = ["Tous", "Signés", "Prospects", "En négociation", "À renouveler"];

const statusStyles: Record<string, string> = {
  "Signé": "bg-[#C8102E]/20 text-[#C8102E] border border-[#C8102E]/30",
  "Prospect": "bg-white/10 text-white/60",
  "En négociation": "bg-white/20 text-white border border-white/30",
  "À renouveler": "bg-red-500/20 text-red-300 border border-red-400/30 animate-pulse",
};

export default function ClubPartnersPage() {
  const status = useClubGuard();
  const [loading, setLoading] = useState(true);
  const [partnersData, setPartnersData] = useState<any[]>([]);
  const [activeFilter, setActiveFilter] = useState("Tous");
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");

  const partners = useMemo(() => {
    if (activeFilter === "Tous") return partnersData;
    if (activeFilter === "Signés") return partnersData.filter((p) => p.statut === "Signé");
    if (activeFilter === "Prospects") return partnersData.filter((p) => p.statut === "Prospect");
    if (activeFilter === "En négociation")
      return partnersData.filter((p) => p.statut === "En négociation");
    if (activeFilter === "À renouveler")
      return partnersData.filter((p) => p.statut === "À renouveler");
    return partnersData;
  }, [activeFilter, partnersData]);

  useEffect(() => {
    const load = async () => {
      const clubData = await getMyClub();
      if (!clubData) {
        setLoading(false);
        return;
      }
      const partnersList = await getClubPartners(clubData.id);
      setPartnersData(partnersList);
      setLoading(false);
    };
    load();
  }, []);

  if (status !== "allowed") {
    return null;
  }

  return (
    <ClubLayout activeItem="Partenaires">
      {loading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="text-white/50">Chargement...</div>
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-lg font-semibold text-white lg:text-2xl">Partenaires</h1>
        <button
          className="rounded-full px-5 py-2 text-sm font-semibold text-white"
          style={{ backgroundColor: "var(--club-primary)" }}
        >
          + Ajouter un partenaire
        </button>
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2">
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={cn(
                "rounded-full border px-4 py-1.5 text-xs font-semibold transition",
                activeFilter === filter
                  ? "border-transparent text-white"
                  : "border-white/10 text-white/60 hover:text-white"
              )}
              style={
                activeFilter === filter
                  ? { backgroundColor: "var(--club-primary)" }
                  : undefined
              }
            >
              {filter}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 text-sm text-white/70">
          <button
            className={cn(
              "rounded-full px-3 py-1.5",
              viewMode === "cards" ? "bg-white/10 text-white" : "hover:bg-white/5"
            )}
            onClick={() => setViewMode("cards")}
          >
            Cards
          </button>
          <button
            className={cn(
              "rounded-full px-3 py-1.5",
              viewMode === "list" ? "bg-white/10 text-white" : "hover:bg-white/5"
            )}
            onClick={() => setViewMode("list")}
          >
            Liste
          </button>
        </div>
      </div>

      {!loading ? (
        viewMode === "cards" ? (
          <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {partners.map((partner) => (
              <div
                key={partner.slug || partner.id}
                className="rounded-2xl border border-white/20 bg-white/10 p-5 shadow-lg backdrop-blur-md transition-all duration-200 hover:border-[#C8102E]/40 hover:bg-white/20"
              >
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white"
                    style={{ backgroundColor: partner.logo_couleur || "#1B2A4A" }}
                  >
                    {partner.logo_initiales || partner.nom?.slice(0, 2)?.toUpperCase()}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{partner.nom}</div>
                    <span className="mt-1 inline-flex rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-white/70">
                      {partner.secteur}
                    </span>
                  </div>
                </div>
                <div className="mt-3 text-lg font-black text-[#C8102E]">
                  {partner.valeur.toLocaleString("fr-FR")}€
                </div>
                <div className="mt-3 text-sm text-white/60">
                  {partner.contact_prenom} {partner.contact_nom}
                </div>
                <div className="text-xs text-white/50">{partner.contact_email}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={cn(
                      "rounded-full px-3 py-1 text-xs",
                      statusStyles[partner.statut] || "bg-white/10 text-white/60"
                    )}
                  >
                    {partner.statut}
                  </span>
                </div>
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/dashboard/club/partenaires/${partner.slug || partner.id}`}
                    className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs text-white hover:bg-white/20"
                  >
                    Voir
                  </Link>
                  <a
                    href={`mailto:${partner.contact_email || ""}`}
                    className="rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-xs text-white hover:bg-white/20"
                  >
                    Contacter
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-[#111]">
            <table className="w-full text-left text-sm text-white/70">
              <thead className="border-b border-white/10 text-xs uppercase text-white/50">
                <tr>
                  <th className="px-4 py-3">Logo</th>
                  <th className="px-4 py-3">Entreprise</th>
                  <th className="px-4 py-3">Secteur</th>
                  <th className="px-4 py-3">Valeur</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3">Renouvellement</th>
                  <th className="px-4 py-3">Contact</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {partners.map((partner) => (
                  <tr key={partner.slug || partner.id} className="border-b border-white/5">
                    <td className="px-4 py-3">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                        style={{ backgroundColor: partner.logo_couleur || "#1B2A4A" }}
                      >
                        {partner.logo_initiales || partner.nom?.slice(0, 2)?.toUpperCase()}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white">{partner.nom}</td>
                    <td className="px-4 py-3">{partner.secteur}</td>
                    <td className="px-4 py-3" style={{ color: "var(--club-primary)" }}>
                      {partner.valeur.toLocaleString("fr-FR")}€
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "rounded-full px-3 py-1 text-xs",
                          statusStyles[partner.statut] || "bg-white/10 text-white/60"
                        )}
                      >
                        {partner.statut}
                      </span>
                    </td>
                    <td className="px-4 py-3">{partner.renouvellement}</td>
                    <td className="px-4 py-3">
                      {partner.contact_prenom} {partner.contact_nom}
                    </td>
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/club/partenaires/${partner.slug || partner.id}`}
                        className="rounded-full bg-white/10 px-3 py-1 text-xs text-white"
                      >
                        Voir
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      ) : null}
    </ClubLayout>
  );
}
