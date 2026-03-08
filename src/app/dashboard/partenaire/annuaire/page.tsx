"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { PartenaireLayout } from "@/components/partenaire/partenaire-layout";
import { partenaireClub, partenaireProfile } from "@/lib/mocks/partenaire-data";
import { cn } from "@/lib/utils";
import { partners } from "@/lib/mocks/partenaire-annuaire";

const sectorOptions = [
  { value: "", label: "— Tous les secteurs —" },
  { value: "plombier", label: "🔧 Un plombier / artisan" },
  { value: "banquier", label: "🏦 Un banquier / conseiller financier" },
  { value: "assureur", label: "🛡️ Un assureur" },
  { value: "avocat", label: "⚖️ Un avocat / juriste" },
  { value: "expert", label: "💼 Un expert-comptable" },
  { value: "sante", label: "🏥 Un médecin / kiné / santé" },
  { value: "garagiste", label: "🚗 Un garagiste / auto" },
  { value: "restaurant", label: "🍽️ Un restaurant / traiteur" },
  { value: "btp", label: "🏗️ Un entrepreneur / BTP" },
  { value: "digital", label: "💻 Une agence digitale / web" },
  { value: "fournisseur", label: "📦 Un fournisseur / grossiste" },
  { value: "event", label: "🎯 Un prestataire événementiel" },
  { value: "photo", label: "📸 Un photographe / vidéaste" },
  { value: "hotel", label: "🏨 Un hôtel / hébergement" },
];

const sectorMap: Record<string, string[]> = {
  plombier: ["BTP / Construction"],
  banquier: ["Banque / Finance"],
  assureur: ["Assurance"],
  avocat: ["Juridique"],
  expert: ["RH / Conseil"],
  sante: ["Santé / Kiné", "Bien-être / Santé"],
  garagiste: ["Automobile"],
  restaurant: ["Restauration"],
  btp: ["BTP / Construction"],
  digital: ["Agence digitale", "Communication"],
  fournisseur: ["Transport / Maritime"],
  event: ["Communication"],
  photo: ["Communication"],
  hotel: ["Hôtellerie"],
};

const packStyles: Record<string, string> = {
  Bronze: "bg-amber-500/20 text-amber-200",
  Argent: "bg-slate-500/20 text-slate-200",
  Or: "bg-yellow-500/20 text-yellow-200",
  "Sur mesure": "bg-purple-500/20 text-purple-200",
};

export default function PartenaireAnnuairePage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sectorFilter, setSectorFilter] = useState("");
  const [packFilter, setPackFilter] = useState("");

  const slugify = (value: string) =>
    value
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[éèê]/g, "e")
      .replace(/[àâ]/g, "a")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const filteredPartners = useMemo(() => {
    const searchValue = search.trim().toLowerCase();
    const sectorTargets = sectorFilter ? sectorMap[sectorFilter] ?? [] : null;

    return partners.filter((partner) => {
      const matchesSearch =
        !searchValue ||
        partner.nom.toLowerCase().includes(searchValue) ||
        partner.secteur.toLowerCase().includes(searchValue);
      const matchesSector =
        !sectorTargets || sectorTargets.some((sector) => partner.secteur.toLowerCase().includes(sector.toLowerCase()));
      const matchesPack = !packFilter || partner.pack === packFilter;
      return matchesSearch && matchesSector && matchesPack;
    });
  }, [packFilter, search, sectorFilter]);

  return (
    <PartenaireLayout
      activeItem="Annuaire partenaires"
      club={{ name: partenaireClub.name, initials: partenaireClub.initials, logoUrl: partenaireClub.logoUrl }}
      partner={{ name: partenaireProfile.name, initials: partenaireProfile.initials }}
    >
      <div className="mb-6">
        <div className="text-2xl font-black text-white">Annuaire des partenaires</div>
        <div className="text-sm text-white/60">
          Les entreprises partenaires de {partenaireClub.name} — Saison 2025/2026
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl bg-[#111827] p-4">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher un partenaire..."
          className="flex-1 rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white"
        />
        <select
          value={sectorFilter}
          onChange={(event) => setSectorFilter(event.target.value)}
          className="rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white"
        >
          {sectorOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <select
          value={packFilter}
          onChange={(event) => setPackFilter(event.target.value)}
          className="rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white"
        >
          <option value="">— Tous les packs —</option>
          <option value="Bronze">Bronze</option>
          <option value="Argent">Argent</option>
          <option value="Or">Or</option>
          <option value="Sur mesure">Sur mesure</option>
        </select>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {filteredPartners.map((partner) => (
          <button
            key={partner.nom}
            onClick={() => router.push(`/dashboard/partenaire/annuaire/${slugify(partner.nom)}?tab=contact`)}
            className="group cursor-pointer rounded-2xl border border-white/10 bg-[#111827] p-5 text-left transition-all hover:border-[#C8102E]/50"
            type="button"
          >
            <div className="flex items-start justify-between">
              <div className={cn("flex h-12 w-12 items-center justify-center rounded-xl text-sm text-white", partner.color)}>
                {partner.nom
                  .split(" ")
                  .slice(0, 2)
                  .map((word) => word[0])
                  .join("")
                  .toUpperCase()}
              </div>
              <span className={cn("rounded-full px-2 py-0.5 text-xs", packStyles[partner.pack])}>
                {partner.pack}
              </span>
            </div>
            <div className="mt-3 text-base font-bold text-white">{partner.nom}</div>
            <div className="text-sm text-white/50">{partner.secteur}</div>
            <div className="my-3 border-t border-white/5" />
            <div className="space-y-1 text-xs text-white/70">
              <div>👤 {partner.contact}</div>
              <div>📧 {partner.email}</div>
              <div>📞 {partner.tel}</div>
            </div>
            <div className="mt-3">
              <span className="rounded-full bg-white/10 px-2 py-0.5 text-xs text-white/60">{partner.secteur}</span>
            </div>
            <div className="mt-4">
              <span className="block w-full rounded-full bg-[#C8102E]/20 px-4 py-1.5 text-center text-sm text-[#C8102E] transition-all group-hover:bg-[#C8102E] group-hover:text-white">
                🤝 Proposer un deal
              </span>
            </div>
          </button>
        ))}
      </div>
    </PartenaireLayout>
  );
}
