"use client";

import { useState } from "react";
import Link from "next/link";
import { computeDiscMatch, type DiscScores } from "@/lib/mocks/appData";
const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
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

type SchoolApprenantsTableProps = {
  studentsRows: ProfileRow[];
  offers: OfferRow[];
};

export function SchoolApprenantsTable({ studentsRows, offers }: SchoolApprenantsTableProps) {
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ProfileRow | null>(null);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const [activeContract, setActiveContract] = useState<"all" | "alternance" | "initial">("all");

  const getOfferMatchScore = (row: ProfileRow | null, offer: OfferRow) => {
    if (!row?.disc_scores || !offer.target_disc) {
      return 0;
    }
    return computeDiscMatch(row.disc_scores, offer.target_disc);
  };

  const fallbackPhotos = [
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=200&q=80",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80",
  ];

  if (!studentsRows || studentsRows.length === 0) {
    return <p className="text-sm text-black/60">Aucun apprenant associe pour le moment.</p>;
  }

  const filteredRows = studentsRows.filter((row) => {
    const fullName = `${row.first_name || ""} ${row.last_name || ""}`.toLowerCase();
    const email = (row.email || "").toLowerCase();
    const query = searchValue.toLowerCase();
    const matchesQuery = !query || fullName.includes(query) || email.includes(query);
    const contract = (row.contract_type || "Alternance").toLowerCase();
    const matchesContract =
      activeContract === "all" ||
      (activeContract === "alternance" && contract.includes("altern")) ||
      (activeContract === "initial" && contract.includes("initial"));
    return matchesQuery && matchesContract;
  });

  return (
    <div className="space-y-4">
      <div className="sticky top-0 z-20 rounded-2xl border border-[#E5E5EA] bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Rechercher un apprenant..."
            className="flex-1 rounded-full border border-[#E5E5EA] bg-white px-4 py-2 text-sm text-[#1D1D1F] placeholder:text-[#86868B] outline-none"
          />
          <div className="inline-flex rounded-full border border-[#E5E5EA] bg-white p-1 text-xs font-semibold text-[#86868B]">
            {[
              { key: "all", label: "Tous" },
              { key: "alternance", label: "Alternance" },
              { key: "initial", label: "Contrat Initial" },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveContract(tab.key as typeof activeContract)}
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
          {filteredRows.map((row, index) => {
            return (
              <div
                key={row.id}
                className="flex items-center gap-3 rounded-2xl border border-[#E5E5EA] bg-white px-3 py-2 shadow-sm"
              >
                <div className="h-12 w-12 overflow-hidden rounded-full border border-[#E5E5EA] bg-[#F5F5F7]">
                  <img
                    src={row.avatar_url || fallbackPhotos[index % fallbackPhotos.length]}
                    alt={`${row.first_name || ""} ${row.last_name || ""}`}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="min-w-[180px] text-sm font-semibold text-[#1D1D1F]">
                  {(row.first_name || "") + " " + (row.last_name || "")}
                  <span className="ml-2 inline-flex rounded-full bg-[#F5F5F7] px-2 py-0.5 text-[10px] font-semibold text-[#1D1D1F] sm:hidden">
                    Complétion 85%
                  </span>
                </div>
                <div className="hidden w-[220px] text-xs text-[#86868B] md:block">
                  <span className="block truncate">{row.email || "-"}</span>
                </div>
                <div className="hidden w-[120px] text-xs text-[#86868B] md:block">
                  <span className="block truncate">{row.phone || "-"}</span>
                </div>
                <span className="rounded-full border border-[#E5E5EA] bg-[#F5F5F7] px-2 py-1 text-[10px] font-semibold text-[#1D1D1F]">
                  {row.contract_type || "Alternance"}
                </span>
                <Link
                  href={`/dashboard/ecole/apprenants/${slugify(
                    `${row.first_name || "profil"}-${row.last_name || ""}`
                  )}?id=${row.id}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#E5E5EA] text-[#1D1D1F] hover:bg-[#F5F5F7]"
                  aria-label="Voir Profil"
                >
                  <BarChart3 className="h-4 w-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedStudent(row);
                    setSelectedOffers([]);
                    setOfferDialogOpen(true);
                  }}
                  className="ml-auto rounded-full bg-[#1D1D1F] px-3 py-2 text-xs font-semibold text-white"
                >
                  Envoyer Offre
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
      <DialogContent className="max-w-lg rounded-[28px] bg-white text-[#1D1D1F] border border-[#E5E5EA] shadow-sm">
          <DialogTitle className="sr-only">Ajouter un apprenant</DialogTitle>
          <DialogDescription className="sr-only">
            Formulaire de création d'apprenant
          </DialogDescription>
          <DialogHeader>
            <DialogTitle>
              Envoyer des offres a {selectedStudent?.first_name || "l'apprenant"}
            </DialogTitle>
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
