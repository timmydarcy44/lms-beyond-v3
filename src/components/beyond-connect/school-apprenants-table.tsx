"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { computeDiscMatch, type DiscScores } from "@/lib/mocks/appData";
import { BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone?: string | null;
  school_class?: string | null;
  class_name?: string | null;
  class?: string | null;
  promo?: string | null;
  contract_type?: string | null;
  soft_skills_scores?: Record<string, number> | null;
  disc_profile?: string | null;
  disc_scores?: DiscScores | null;
  open_badges?: string[] | null;
  tutor_feedback?: string | null;
  live_status?: "live" | "en_poste" | "test" | null;
  avatar_url?: string | null;
  handicap_alert?: { label: string } | null;
};

type OfferRow = {
  id: string;
  title?: string | null;
  target_disc?: DiscScores;
};

type SchoolClassOption = { id: string; name: string | null };

type SchoolApprenantsTableProps = {
  studentsRows: ProfileRow[];
  offers: OfferRow[];
  classOptions?: SchoolClassOption[];
};

function rowInitials(first?: string | null, last?: string | null) {
  const a = (first?.trim()?.[0] ?? "").toUpperCase();
  const b = (last?.trim()?.[0] ?? "").toUpperCase();
  const out = a + b;
  return out || "?";
}

function cursusLabel(row: ProfileRow) {
  const raw = (row.school_class || row.class_name || row.class || row.promo || "").trim();
  return raw || "Non renseigné";
}

function isAlternanceRow(row: ProfileRow) {
  return (row.contract_type || "").toLowerCase().includes("altern");
}

export function SchoolApprenantsTable({ studentsRows, offers, classOptions = [] }: SchoolApprenantsTableProps) {
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ProfileRow | null>(null);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [activeContract, setActiveContract] = useState<"all" | "alternance" | "not_alternance">("all");
  const [activeCursus, setActiveCursus] = useState<string>("all");
  const [sortKey, setSortKey] = useState<"name_asc" | "cursus_asc" | "alternance_first">("name_asc");

  const getOfferMatchScore = (row: ProfileRow | null, offer: OfferRow) => {
    if (!row?.disc_scores || !offer.target_disc) {
      return 0;
    }
    return computeDiscMatch(row.disc_scores, offer.target_disc);
  };

  const cursusOptions = useMemo(() => {
    const set = new Set<string>();
    for (const c of classOptions) {
      const n = (c.name ?? "").trim();
      if (n) set.add(n);
    }
    for (const r of studentsRows) {
      const label = cursusLabel(r);
      if (label && label !== "Non renseigné") set.add(label);
    }
    return ["all", ...Array.from(set).sort((a, b) => a.localeCompare(b, "fr"))];
  }, [classOptions, studentsRows]);

  if (!studentsRows || studentsRows.length === 0) {
    return <p className="text-sm text-black/60">Aucun apprenant associe pour le moment.</p>;
  }

  const filteredRows = studentsRows.filter((row) => {
    const fullName = `${row.first_name || ""} ${row.last_name || ""}`.toLowerCase();
    const email = (row.email || "").toLowerCase();
    const query = searchValue.toLowerCase();
    const matchesQuery = !query || fullName.includes(query) || email.includes(query);

    const alt = isAlternanceRow(row);
    const matchesContract =
      activeContract === "all" ||
      (activeContract === "alternance" && alt) ||
      (activeContract === "not_alternance" && !alt);

    const cur = cursusLabel(row);
    const matchesCursus = activeCursus === "all" || cur === activeCursus;

    return matchesQuery && matchesContract && matchesCursus;
  });

  const displayRows = [...filteredRows].sort((a, b) => {
    if (sortKey === "cursus_asc") {
      return cursusLabel(a).localeCompare(cursusLabel(b), "fr");
    }
    if (sortKey === "alternance_first") {
      const da = isAlternanceRow(a) ? 0 : 1;
      const db = isAlternanceRow(b) ? 0 : 1;
      if (da !== db) return da - db;
    }
    const na = `${a.last_name || ""} ${a.first_name || ""}`.trim().toLowerCase();
    const nb = `${b.last_name || ""} ${b.first_name || ""}`.trim().toLowerCase();
    return na.localeCompare(nb, "fr");
  });

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 rounded-2xl border border-[#E5E5EA] bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Rechercher un apprenant..."
            className="min-w-[200px] flex-1 rounded-full border border-[#E5E5EA] bg-white px-4 py-2 text-sm text-[#1D1D1F] placeholder:text-[#86868B] outline-none"
          />
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-semibold text-[#86868B]">Cursus</label>
            <select
              value={activeCursus}
              onChange={(e) => setActiveCursus(e.target.value)}
              className="rounded-full border border-[#E5E5EA] bg-white px-3 py-2 text-xs font-medium text-[#1D1D1F]"
            >
              <option value="all">Tous les cursus</option>
              {cursusOptions
                .filter((c) => c !== "all")
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs font-semibold text-[#86868B]">Tri</label>
            <select
              value={sortKey}
              onChange={(e) => setSortKey(e.target.value as typeof sortKey)}
              className="rounded-full border border-[#E5E5EA] bg-white px-3 py-2 text-xs font-medium text-[#1D1D1F]"
            >
              <option value="name_asc">Nom (A → Z)</option>
              <option value="cursus_asc">Cursus (A → Z)</option>
              <option value="alternance_first">Alternance en premier</option>
            </select>
          </div>
          <div className="inline-flex rounded-full border border-[#E5E5EA] bg-white p-1 text-xs font-semibold text-[#86868B]">
            {[
              { key: "all" as const, label: "Tous" },
              { key: "alternance" as const, label: "En alternance" },
              { key: "not_alternance" as const, label: "Hors alternance" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveContract(tab.key)}
                className={`rounded-full px-3 py-1 ${
                  activeContract === tab.key ? "bg-[#1D1D1F] text-white" : "text-[#86868B]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[640px] space-y-2 sm:min-w-0">
          {displayRows.map((row) => {
            return (
              <div
                key={row.id}
                className="flex items-center gap-3 rounded-2xl border border-[#E5E5EA] bg-white px-3 py-2 shadow-sm"
              >
                <Link
                  href={`/dashboard/ecole/apprenants/${row.id}`}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-xl py-1 pr-2 transition hover:bg-[#F5F5F7]/80"
                >
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full border border-[#E5E5EA] bg-[#E8E8ED]">
                    {row.avatar_url ? (
                      <img
                        src={row.avatar_url}
                        alt={`${row.first_name || ""} ${row.last_name || ""}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center text-sm font-semibold text-[#1D1D1F]"
                        aria-hidden
                      >
                        {rowInitials(row.first_name, row.last_name)}
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[#1D1D1F]">
                      {(row.first_name || "") + " " + (row.last_name || "")}
                      <span className="ml-2 inline-flex rounded-full bg-[#F5F5F7] px-2 py-0.5 text-[10px] font-semibold text-[#1D1D1F] sm:hidden">
                        Voir fiche
                      </span>
                    </div>
                    <div className="mt-0.5 text-[11px] text-[#86868B]">{cursusLabel(row)}</div>
                    <div className="hidden text-xs text-[#86868B] md:block">
                      <span className="block truncate">{row.email || "-"}</span>
                    </div>
                  </div>
                  <div className="hidden w-[120px] shrink-0 text-xs text-[#86868B] md:block">
                    <span className="block truncate">{row.phone || "-"}</span>
                  </div>
                  <span className="shrink-0 rounded-full border border-[#E5E5EA] bg-[#F5F5F7] px-2 py-1 text-[10px] font-semibold text-[#1D1D1F]">
                    {row.contract_type || "—"}
                  </span>
                  <span className="hidden shrink-0 text-[#86868B] md:inline-flex" aria-hidden>
                    <BarChart3 className="h-4 w-4" />
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent(row);
                    setSelectedOffers([]);
                    setOfferDialogOpen(true);
                  }}
                  className="shrink-0 rounded-full bg-[#1D1D1F] px-3 py-2 text-xs font-semibold text-white"
                >
                  Envoyer Offre
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
        <DialogContent className="max-w-lg rounded-[28px] border border-[#E5E5EA] bg-white text-[#1D1D1F] shadow-sm">
          <DialogTitle className="sr-only">Ajouter un apprenant</DialogTitle>
          <DialogDescription className="sr-only">Formulaire de création d'apprenant</DialogDescription>
          <DialogHeader>
            <DialogTitle>Envoyer des offres a {selectedStudent?.first_name || "l'apprenant"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {offers.length ? (
              offers.map((offer) => {
                const matchScore = getOfferMatchScore(selectedStudent || null, offer);
                const isChecked = selectedOffers.includes(offer.id);
                return (
                  <label
                    key={offer.id}
                    className="flex items-center justify-between rounded-xl border border-[#E5E5EA] bg-white px-3 py-2 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(event) => {
                          if (event.target.checked) {
                            setSelectedOffers((prev) => [...prev, offer.id]);
                          } else {
                            setSelectedOffers((prev) => prev.filter((id) => id !== offer.id));
                          }
                        }}
                      />
                      <span className="text-[#1D1D1F]">{offer.title || "Offre"}</span>
                    </div>
                    <span className="text-xs font-semibold text-[#0071E3]">{matchScore}%</span>
                  </label>
                );
              })
            ) : (
              <p className="text-sm text-[#86868B]">Aucune offre disponible.</p>
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setOfferDialogOpen(false)}
              className="rounded-lg border border-[#E5E5EA] bg-[#1D1D1F] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              Envoyer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
