"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, KanbanSquare } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

type ProfileRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  role_type: string | null;
  phone?: string | null;
  class_name?: string | null;
  class?: string | null;
  promo?: string | null;
  soft_skills_scores?: Record<string, number> | null;
};

type SchoolDashboardProps = {
  apprenants: ProfileRow[] | null;
  entreprises: ProfileRow[] | null;
  effectifTotal: number;
  alternancesSignees: number;
  apprenantsEnRecherche: number;
  offersCount: number;
  latestOffers: Array<{
    id: string;
    title?: string | null;
    created_at?: string | null;
    status?: string | null;
    city?: string | null;
  }>;
  latestConnected: Array<{
    id: string;
    first_name?: string | null;
    last_name?: string | null;
    updated_at?: string | null;
    role_type?: string | null;
  }>;
  recentActivities: Array<{
    id: string;
    job_id?: string | null;
    talent_id?: string | null;
    created_at?: string | null;
    status?: string | null;
  }>;
  fullName: string;
};

const getTopSkills = (s?: string[] | null) => s?.slice(0, 5) || [];

const slugify = (value: string) =>
  value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export function SchoolDashboard({
  apprenants,
  entreprises,
  effectifTotal,
  alternancesSignees,
  apprenantsEnRecherche,
  offersCount,
  latestOffers,
  latestConnected,
  recentActivities,
  fullName,
}: SchoolDashboardProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "students" | "companies" | "prospection">("overview");
  const [inviteOpen, setInviteOpen] = useState(false);
  const [loadingSlug, setLoadingSlug] = useState<string | null>(null);
  const [studentsRows, setStudentsRows] = useState<ProfileRow[] | null>(apprenants);
  const [companiesRows, setCompaniesRows] = useState<ProfileRow[] | null>(entreprises);
  const [offerDialogOpen, setOfferDialogOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<ProfileRow | null>(null);
  const [selectedOffers, setSelectedOffers] = useState<string[]>([]);

  const discColors: Record<string, string> = {
    Rouge: "bg-red-500",
    Jaune: "bg-yellow-400",
    Vert: "bg-[#8E8E93]",
    Bleu: "bg-blue-600",
  };

  const normalizeScore = (value: number) => (value <= 10 ? value * 10 : value);

  const getDominantDisc = (scores?: Record<string, number> | null) => {
    if (!scores) return null;
    const options = [
      { key: "Rouge", value: scores.Rouge ?? scores.red ?? scores.rouge ?? 0 },
      { key: "Jaune", value: scores.Jaune ?? scores.yellow ?? scores.jaune ?? 0 },
      { key: "Vert", value: scores.Vert ?? scores.green ?? scores.vert ?? 0 },
      { key: "Bleu", value: scores.Bleu ?? scores.blue ?? scores.bleu ?? 0 },
    ].map((item) => ({ ...item, value: normalizeScore(item.value) }));
    const top = options.sort((a, b) => b.value - a.value)[0];
    if (!top || top.value < 60) return null;
    return top.key;
  };

  const getMatchingScore = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i += 1) {
      hash = (hash * 31 + id.charCodeAt(i)) % 1000;
    }
    return 70 + (hash % 26);
  };

  const getProfileClass = (row: ProfileRow) =>
    row.class_name || row.class || row.promo || "-";

  useEffect(() => {
    setStudentsRows(apprenants);
  }, [apprenants]);

  useEffect(() => {
    setCompaniesRows(entreprises);
  }, [entreprises]);

  const renderCompaniesTable = (rows: ProfileRow[] | null, emptyLabel: string, basePath: string) => {
    if (!rows || rows.length === 0) {
      return <p className="text-sm text-black/60">{emptyLabel}</p>;
    }
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-[0.2em] text-black/50">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Score de Matching</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const dominantDisc = getDominantDisc(row.soft_skills_scores);
              return (
                <tr key={row.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-semibold text-black">
                    <div className="flex items-center gap-2">
                      <span>{(row.first_name || "") + " " + (row.last_name || "")}</span>
                      {dominantDisc ? (
                        <span className={`h-2 w-2 rounded-full ${discColors[dominantDisc]}`} />
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-[#F5F5F7] px-3 py-1 text-xs font-semibold text-[#1D1D1F]">
                      {getMatchingScore(row.id)}%
                    </span>
                  </td>
                  <td className="px-4 py-3 text-black/70">{row.email || "-"}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700">
                      En recherche
                    </span>
                  </td>
                  <td className="px-4 py-3 text-black/40">{row.id}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`${basePath}/${slugify(`${row.first_name || "entreprise"}-${row.last_name || "profil"}`)}`}
                      onClick={() =>
                        setLoadingSlug(`${row.first_name || "entreprise"}-${row.last_name || "profil"}`)
                      }
                      className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-black/70 hover:bg-slate-50"
                    >
                      <BarChart3 className="h-3 w-3" />
                      Voir Profil Complet
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const firstName = (fullName || "").split(" ")[0] || "votre";

  return (
    <div className="space-y-8">
      {loadingSlug ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 text-sm text-white">
          Chargement du profil...
        </div>
      ) : null}
      <header className="rounded-2xl border border-white/20 bg-white/70 p-6 shadow-xl shadow-black/5 backdrop-blur-md">
        <div className="flex flex-wrap items-center justify-between gap-6">
          <div>
            <h1 className="text-2xl font-semibold text-black">
              Bienvenue{" "}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {firstName}
              </span>{" "}
              dans votre interface de gestion
            </h1>
            <p className="mt-2 text-sm text-black/60">Pilotez vos apprenants et entreprises associées.</p>
          </div>
        </div>
      </header>

      <div className="flex flex-wrap gap-2">
        {[
          { key: "overview", label: "Vue d'ensemble" },
          { key: "students", label: "Liste des apprenants" },
          { key: "companies", label: "Entreprises partenaires" },
          { key: "prospection", label: "Prospection" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={`rounded-full px-4 py-2 text-xs font-semibold ${
              activeTab === tab.key ? "bg-black text-white" : "border border-slate-200 text-black/70"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "overview" ? (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3" id="overview">
            <div className="rounded-2xl border border-white/20 bg-white/40 p-5 shadow-xl shadow-black/5 backdrop-blur-lg">
              <p className="text-xs uppercase tracking-[0.2em] text-black/40">Effectif Total</p>
              <p className="mt-3 text-3xl font-semibold text-black">{effectifTotal || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/40 p-5 shadow-xl shadow-black/5 backdrop-blur-lg">
              <p className="text-xs uppercase tracking-[0.2em] text-black/40">Alternances Signées</p>
              <p className="mt-3 text-3xl font-semibold text-black">{alternancesSignees || 0}</p>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/40 p-5 shadow-xl shadow-black/5 backdrop-blur-lg">
              <p className="text-xs uppercase tracking-[0.2em] text-black/40">Apprenants en Recherche</p>
              <p className="mt-3 text-3xl font-semibold text-black">{apprenantsEnRecherche || 0}</p>
            </div>
          </section>

          <section className="grid gap-4 lg:grid-cols-3" id="offres">
            <div className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-xl shadow-black/5 backdrop-blur-md">
              <h3 className="text-sm font-semibold">Dernières Offres</h3>
              <div className="mt-4 space-y-3 text-sm text-black/70">
                {latestOffers.length ? (
                  latestOffers.map((offer) => (
                    <div key={offer.id} className="flex items-center justify-between">
                      <span>{offer.title || "Offre"}</span>
                      <span className="text-xs text-black/40">{offer.city || "-"}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-black/40">Aucune offre récente.</p>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-xl shadow-black/5 backdrop-blur-md">
              <h3 className="text-sm font-semibold">Derniers Connectés</h3>
              <div className="mt-4 space-y-3 text-sm text-black/70">
                {latestConnected.length ? (
                  latestConnected.map((row) => (
                    <div key={row.id} className="flex items-center justify-between">
                      <span>
                        {(row.first_name || "") + " " + (row.last_name || "")}
                      </span>
                      <span className="text-xs text-black/40">{row.role_type || "-"}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-black/40">Aucune activité récente.</p>
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-white/20 bg-white/70 p-5 shadow-xl shadow-black/5 backdrop-blur-md">
              <h3 className="text-sm font-semibold">Activités Récentes</h3>
              <div className="mt-4 space-y-3 text-sm text-black/70">
                {recentActivities.length ? (
                  recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-center justify-between">
                      <span>Nouvelle candidature</span>
                      <span className="text-xs text-black/40">
                        {activity.status || "pending"}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-black/40">Aucune activité récente.</p>
                )}
              </div>
            </div>
          </section>
          <section
            className="rounded-3xl border border-slate-200 p-6 shadow-sm"
            style={{
              background: "linear-gradient(90deg, #4F46E5, #7C3AED)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.2)",
              backgroundImage:
                "linear-gradient(90deg, #4F46E5, #7C3AED), url('data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2220%22 height=%2220%22 viewBox=%220 0 20 20%22%3E%3Crect width=%221%22 height=%221%22 fill=%22rgba(255,255,255,0.08)%22/%3E%3C/svg%3E')",
              boxShadow: "0 20px 40px rgba(79,70,229,0.35)",
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Conformite & Audit</h3>
                <p className="mt-2 text-sm text-white/80">
                  Centralisez vos preuves Qualiopi et securisez votre audit en un seul espace clair.
                </p>
              </div>
              <Link
                href="/dashboard/ecole/qualiopi"
                className="rounded-lg bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white shadow-[0_0_18px_rgba(124,58,237,0.6)]"
              >
                Gerer l'audit
              </Link>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "students" ? (
        <section className="space-y-4" id="apprenants">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Apprenants</h2>
          </div>
          {!studentsRows || studentsRows.length === 0 ? (
            <p className="text-sm text-black/60">Aucun apprenant associé pour le moment.</p>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-white/20 bg-white/70 shadow-xl shadow-black/5 backdrop-blur-md">
              <table className="w-full text-left text-sm">
                <thead className="bg-white/40 text-xs uppercase tracking-[0.2em] text-black/50 backdrop-blur-md">
                  <tr>
                    <th className="px-4 py-3">Nom</th>
                    <th className="px-4 py-3">Prenom</th>
                    <th className="px-4 py-3">Classe</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Telephone</th>
                    <th className="px-4 py-3">Profil Dominant</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {studentsRows.map((row) => {
                    const dominantDisc = getDominantDisc(row.soft_skills_scores);
                    const badgeColor = dominantDisc ? discColors[dominantDisc] : "bg-slate-300";
                    return (
                      <tr key={row.id} className="border-t border-white/10">
                        <td className="px-4 py-3 font-semibold text-black">{row.last_name || "-"}</td>
                        <td className="px-4 py-3 text-black/70">{row.first_name || "-"}</td>
                        <td className="px-4 py-3 text-black/70">{getProfileClass(row)}</td>
                        <td className="px-4 py-3 text-black/70">{row.email || "-"}</td>
                        <td className="px-4 py-3 text-black/70">{row.phone || "-"}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white ${badgeColor}`}>
                            {dominantDisc || "Non defini"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-wrap items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedStudent(row);
                                setSelectedOffers([]);
                                setOfferDialogOpen(true);
                              }}
                              className="rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-black/70 hover:bg-slate-50"
                            >
                              Envoyer une offre
                            </button>
                            <Link
                              href={`/dashboard/ecole/apprenants/${slugify(
                                `${row.first_name || "profil"}-${row.last_name || ""}`
                              )}?id=${row.id}`}
                              onClick={() => setLoadingSlug(row.id)}
                              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-1 text-xs font-semibold text-black/70 hover:bg-slate-50"
                            >
                              <BarChart3 className="h-3 w-3" />
                              Voir Profil
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}

      {activeTab === "companies" ? (
        <section className="space-y-4" id="entreprises">
          <h2 className="text-lg font-semibold">Entreprises partenaires</h2>
          {renderCompaniesTable(
            companiesRows,
            "Aucune entreprise associée pour le moment.",
            "/dashboard/ecole/entreprises"
          )}
        </section>
      ) : null}

      {activeTab === "prospection" ? (
        <section className="space-y-4" id="prospection">
          <div className="flex items-center gap-2">
            <KanbanSquare className="h-4 w-4 text-black/60" />
            <h2 className="text-lg font-semibold">Prospection</h2>
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            {[
              {
                title: "Prospects",
                items: [
                  { name: "Nordic Sports", hot: true },
                  { name: "Vente Plus", hot: false },
                ],
              },
              {
                title: "En negociation",
                items: [
                  { name: "Excellence Retail", hot: true },
                  { name: "Impact B2B", hot: false },
                ],
              },
              {
                title: "Partenaires actifs",
                items: [
                  { name: "Beyond Group", hot: false },
                  { name: "Rive Droite Conseil", hot: true },
                ],
              },
            ].map((column) => (
              <div key={column.title} className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-black/50">{column.title}</p>
                <div className="mt-4 space-y-3">
                  {column.items.map((item) => (
                    <div
                      key={item.name}
                      className="rounded-2xl border border-white/10 bg-white/70 p-3 shadow-sm backdrop-blur"
                    >
                      <p className="text-sm font-semibold text-black/70">
                        {item.name} {item.hot ? "🔥" : ""}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm" id="todo">
        <h3 className="text-sm font-semibold">Ma To-Do</h3>
        <ul className="mt-4 space-y-2 text-sm text-black/70">
          {["Relancer l'entreprise Beyond", "Planifier entretien Jean", "Valider contrat alternance"].map((item) => (
            <li key={item} className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-black/50" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        {[
          {
            title: "Créer un apprenant",
            image:
              "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80",
          },
          {
            title: "Inviter une entreprise",
            image:
              "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
          },
          {
            title: "Lancer un test DISC",
            image:
              "https://images.unsplash.com/photo-1545239351-ef35f43d514b?auto=format&fit=crop&w=1200&q=80",
          },
          {
            title: "Statistiques de placement",
            image:
              "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80",
          },
        ].map((card) => (
          <button
            key={card.title}
            type="button"
            onClick={() => setInviteOpen(true)}
            className="group relative h-48 overflow-hidden rounded-3xl border border-slate-200 shadow-sm"
          >
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
              style={{ backgroundImage: `url(${card.image})` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-4 left-4 text-left">
              <p className="text-sm font-semibold text-white">{card.title}</p>
            </div>
          </button>
        ))}
      </section>

      {inviteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Inviter un étudiant</h3>
            <p className="mt-2 text-sm text-black/70">
              Fonctionnalité d&apos;invitation par mail bientôt disponible.
            </p>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setInviteOpen(false)}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-black/70"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <Dialog open={offerDialogOpen} onOpenChange={setOfferDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogTitle className="sr-only">Envoyer des offres</DialogTitle>
          <DialogDescription className="sr-only">
            Sélection des offres à envoyer à un apprenant
          </DialogDescription>
          <DialogHeader>
            <DialogTitle>
              Envoyer des offres a {selectedStudent?.first_name || "l'apprenant"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {latestOffers.length ? (
              latestOffers.map((offer) => {
                const matchScore = getMatchingScore(`${selectedStudent?.id || ""}-${offer.id}`);
                const isChecked = selectedOffers.includes(offer.id);
                return (
                  <label
                    key={offer.id}
                    className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50/60 px-3 py-2 text-sm"
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
                      <span className="text-black/80">{offer.title || "Offre"}</span>
                    </div>
                    <span className="text-xs font-semibold text-[#0071E3]">{matchScore}%</span>
                  </label>
                );
              })
            ) : (
              <p className="text-sm text-black/50">Aucune offre disponible.</p>
            )}
          </div>
          <DialogFooter>
            <button
              type="button"
              onClick={() => setOfferDialogOpen(false)}
              className="rounded-lg bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              Envoyer
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
