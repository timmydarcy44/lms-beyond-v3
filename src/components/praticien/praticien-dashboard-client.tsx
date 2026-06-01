"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  ExternalLink,
  Loader2,
  Save,
  Star,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { BCT_DUREES, BCT_SPECIALITES } from "@/lib/marketplace/praticien-constants";

type Praticien = {
  id: string;
  prenom: string;
  nom: string;
  photo_url: string | null;
  titre: string | null;
  biographie: string | null;
  specialites: string[] | null;
  tarif_session: number;
  duree_session: number;
  bct_certified: boolean;
  stripe_onboarding_complete: boolean;
  note_moyenne: number | null;
  nombre_avis: number;
};

type SessionRow = {
  id: string;
  date_session: string;
  heure_debut: string;
  duree_minutes: number;
  consentement_donnees: boolean;
  profiles?: { first_name?: string; full_name?: string } | null;
};

type Creneau = {
  id: string;
  date: string;
  heure_debut: string;
  heure_fin: string;
  disponible: boolean;
};

type DashboardPayload = {
  praticien?: Praticien;
  stats?: {
    sessionsMois: number;
    aVenir: number;
    revenusMois: string;
    noteMoyenne: number | null;
    nombreAvis: number;
  };
  prochainesSessions?: SessionRow[];
  sessionsPassees?: Array<{
    id: string;
    date_session: string;
    heure_debut: string;
    montantLabel: string;
  }>;
  creneaux?: Creneau[];
  error?: string;
};

function initials(prenom: string, nom: string) {
  return `${prenom.charAt(0)}${nom.charAt(0)}`.toUpperCase();
}

function formatDateFr(date: string) {
  return new Date(date).toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function PraticienDashboardClient() {
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardPayload | null>(null);

  const [loadingStripe, setLoadingStripe] = useState(false);
  const [stripeError, setStripeError] = useState<string | null>(null);

  const [calendarMonth, setCalendarMonth] = useState(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [slotStart, setSlotStart] = useState("09:00");
  const [slotEnd, setSlotEnd] = useState("10:00");
  const [addingSlot, setAddingSlot] = useState(false);

  const [savingProfile, setSavingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    photo_url: "",
    titre: "",
    biographie: "",
    specialites: [] as string[],
    tarif_euros: "80",
    duree_session: 60,
  });

  const loadDashboard = useCallback(async (monthDate?: Date) => {
    const d = monthDate ?? calendarMonth;
    const q = new URLSearchParams({
      year: String(d.getFullYear()),
      month: String(d.getMonth()),
    });
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/marketplace/praticien/dashboard?${q}`);
      const json = (await res.json()) as DashboardPayload;
      if (!res.ok) throw new Error(json.error ?? "Chargement impossible");
      setData(json);
      if (json.praticien) {
        setProfileForm({
          photo_url: json.praticien.photo_url ?? "",
          titre: json.praticien.titre ?? "",
          biographie: json.praticien.biographie ?? "",
          specialites: json.praticien.specialites ?? [],
          tarif_euros: String((json.praticien.tarif_session ?? 8000) / 100),
          duree_session: json.praticien.duree_session ?? 60,
        });
      }
    } catch (e) {
      setLoadError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, [calendarMonth]);

  useEffect(() => {
    void loadDashboard();
  }, [loadDashboard]);

  const praticien = data?.praticien;

  const startStripe = async () => {
    setStripeError(null);
    setLoadingStripe(true);
    try {
      const res = await fetch("/api/marketplace/praticien/stripe-onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          praticien?.id ? { praticien_id: praticien.id } : {},
        ),
        credentials: "same-origin",
      });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) {
        throw new Error(json.error ?? `Erreur Stripe (${res.status})`);
      }
      window.location.href = json.url;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Stripe indisponible";
      setStripeError(msg);
      toast.error(msg);
    } finally {
      setLoadingStripe(false);
    }
  };

  const openStripeDashboard = async () => {
    try {
      const res = await fetch("/api/marketplace/praticien/stripe-login", { method: "POST" });
      const json = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !json.url) throw new Error(json.error ?? "Lien Stripe indisponible");
      window.location.href = json.url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const calendarDays = useMemo(() => {
    const y = calendarMonth.getFullYear();
    const m = calendarMonth.getMonth();
    const first = new Date(y, m, 1);
    const last = new Date(y, m + 1, 0);
    const startPad = (first.getDay() + 6) % 7;
    const days: Array<{ date: string | null; label: number }> = [];
    for (let i = 0; i < startPad; i++) days.push({ date: null, label: 0 });
    for (let d = 1; d <= last.getDate(); d++) {
      const date = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      days.push({ date, label: d });
    }
    return days;
  }, [calendarMonth]);

  const creneauxByDate = useMemo(() => {
    const map = new Map<string, Creneau[]>();
    for (const c of data?.creneaux ?? []) {
      const list = map.get(c.date) ?? [];
      list.push(c);
      map.set(c.date, list);
    }
    return map;
  }, [data?.creneaux]);

  const daysWithSlots = useMemo(
    () => new Set((data?.creneaux ?? []).map((c) => c.date)),
    [data?.creneaux],
  );

  const addCreneau = async () => {
    if (!selectedDay) return;
    setAddingSlot(true);
    try {
      const res = await fetch("/api/marketplace/praticien/creneaux", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDay,
          heure_debut: slotStart,
          heure_fin: slotEnd,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Ajout impossible");
      toast.success("Créneau ajouté");
      await loadDashboard(calendarMonth);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setAddingSlot(false);
    }
  };

  const removeCreneau = async (id: string) => {
    try {
      const res = await fetch(`/api/marketplace/praticien/creneaux?id=${id}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Suppression impossible");
      toast.success("Créneau supprimé");
      await loadDashboard(calendarMonth);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const tarifCents = Math.round(Number(profileForm.tarif_euros) * 100);
      const res = await fetch("/api/marketplace/praticien/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photo_url: profileForm.photo_url || null,
          titre: profileForm.titre,
          biographie: profileForm.biographie,
          specialites: profileForm.specialites,
          tarif_session: tarifCents,
          duree_session: profileForm.duree_session,
        }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Sauvegarde impossible");
      toast.success("Profil mis à jour");
      await loadDashboard(calendarMonth);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleSpecialite = (s: string) => {
    setProfileForm((prev) => ({
      ...prev,
      specialites: prev.specialites.includes(s)
        ? prev.specialites.filter((x) => x !== s)
        : [...prev.specialites, s],
    }));
  };

  const viewProfilBeyond = async (sessionId: string) => {
    try {
      const res = await fetch(`/api/marketplace/sessions/${sessionId}/profil-beyond`);
      const json = await res.json();
      if (!res.ok) throw new Error((json as { error?: string }).error ?? "Accès refusé");
      toast.message("Profil Beyond chargé — consultez la console ou préparez la session.");
      console.info("[profil-beyond]", json);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Profil non disponible");
    }
  };

  if (loading && !data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
      </div>
    );
  }

  if (loadError && !praticien) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-6 text-center text-white">
        <p className="text-lg font-semibold text-red-400">{loadError}</p>
        <Button className="mt-4" onClick={() => void loadDashboard()}>
          Réessayer
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-4 py-8 pb-24 sm:px-6">
        {/* HEADER */}
        <header className="flex flex-col gap-6 border-b border-white/10 pb-8 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex gap-4">
            {profileForm.photo_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileForm.photo_url}
                alt=""
                className="h-20 w-20 rounded-2xl object-cover ring-2 ring-violet-500/40"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-violet-600/30 text-2xl font-bold text-violet-200">
                {praticien ? initials(praticien.prenom, praticien.nom) : "?"}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                {praticien?.prenom} {praticien?.nom}
              </h1>
              <p className="mt-1 text-sm text-slate-400">{praticien?.titre ?? "Psychopédagogue BCT"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {praticien?.bct_certified && (
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                    BCT Certifié
                  </span>
                )}
                {praticien?.stripe_onboarding_complete ? (
                  <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold text-emerald-300">
                    Paiements actifs
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-500/20 px-3 py-1 text-xs font-semibold text-amber-200">
                    Configuration requise
                  </span>
                )}
              </div>
            </div>
          </div>

          {!praticien?.stripe_onboarding_complete && (
            <div className="w-full rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 sm:max-w-xs">
              <p className="text-sm text-amber-100">Activez Stripe pour recevoir 85 % de chaque session.</p>
              {stripeError && (
                <p className="mt-2 rounded-lg bg-red-500/20 px-2 py-1 text-xs text-red-200">{stripeError}</p>
              )}
              <Button
                type="button"
                className="mt-3 w-full bg-violet-600 hover:bg-violet-500"
                disabled={loadingStripe}
                onClick={() => void startStripe()}
              >
                {loadingStripe ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Redirection Stripe…
                  </>
                ) : (
                  <>
                    <CreditCard className="mr-2 h-4 w-4" />
                    Configurer Stripe Connect
                  </>
                )}
              </Button>
            </div>
          )}
        </header>

        {/* KPIs */}
        <section className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
          {[
            { label: "Sessions ce mois", value: data?.stats?.sessionsMois ?? 0 },
            { label: "À venir", value: data?.stats?.aVenir ?? 0 },
            { label: "Revenus nets", value: data?.stats?.revenusMois ?? "0 €" },
            {
              label: "Note moyenne",
              value:
                data?.stats?.noteMoyenne != null
                  ? `${data.stats.noteMoyenne.toFixed(1)} (${data.stats.nombreAvis})`
                  : "—",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur"
            >
              <p className="text-xs text-slate-400">{kpi.label}</p>
              <p className="mt-2 text-xl font-bold sm:text-2xl">{kpi.value}</p>
            </div>
          ))}
        </section>

        {/* SESSIONS */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <User className="h-5 w-5 text-violet-400" />
            Prochaines sessions
          </h2>
          <ul className="mt-4 space-y-3">
            {(data?.prochainesSessions ?? []).map((s) => {
              const name =
                s.profiles?.first_name || s.profiles?.full_name?.split(" ")[0] || "Collaborateur";
              return (
                <li
                  key={s.id}
                  className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:flex sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="font-medium">
                      {formatDateFr(s.date_session)} · {String(s.heure_debut).slice(0, 5)}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">
                      {name} · {s.duree_minutes} min
                    </p>
                    {s.consentement_donnees && (
                      <span className="mt-2 inline-block rounded-full bg-violet-500/20 px-2 py-0.5 text-xs text-violet-200">
                        Profil Beyond partagé
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 sm:mt-0">
                    {s.consentement_donnees && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="border-white/20 bg-transparent"
                        onClick={() => void viewProfilBeyond(s.id)}
                      >
                        Voir le profil
                      </Button>
                    )}
                    <Button type="button" size="sm" variant="secondary">
                      Préparer la session
                    </Button>
                  </div>
                </li>
              );
            })}
            {(data?.prochainesSessions ?? []).length === 0 && (
              <p className="text-sm text-slate-500">Aucune session planifiée.</p>
            )}
          </ul>
        </section>

        {/* CALENDRIER */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Calendar className="h-5 w-5 text-violet-400" />
            Disponibilités
          </h2>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div className="mb-4 flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  const d = new Date(calendarMonth);
                  d.setMonth(d.getMonth() - 1);
                  setCalendarMonth(d);
                  void loadDashboard(d);
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <span className="font-medium capitalize">
                {calendarMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  const d = new Date(calendarMonth);
                  d.setMonth(d.getMonth() + 1);
                  setCalendarMonth(d);
                  void loadDashboard(d);
                }}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs text-slate-500">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1">
              {calendarDays.map((cell, i) =>
                cell.date ? (
                  <button
                    key={cell.date}
                    type="button"
                    onClick={() => setSelectedDay(cell.date)}
                    className={`aspect-square rounded-lg text-sm transition ${
                      selectedDay === cell.date
                        ? "bg-violet-600 text-white"
                        : daysWithSlots.has(cell.date)
                          ? "bg-violet-500/25 text-violet-100"
                          : "bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    {cell.label}
                  </button>
                ) : (
                  <div key={`pad-${i}`} />
                ),
              )}
            </div>

            {selectedDay && (
              <div className="mt-6 border-t border-white/10 pt-4">
                <p className="font-medium">{formatDateFr(selectedDay)}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(creneauxByDate.get(selectedDay) ?? []).map((c) => (
                    <span
                      key={c.id}
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-sm"
                    >
                      {String(c.heure_debut).slice(0, 5)}
                      {c.disponible && (
                        <button
                          type="button"
                          className="text-red-400 hover:text-red-300"
                          onClick={() => void removeCreneau(c.id)}
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap items-end gap-2">
                  <div>
                    <Label className="text-xs">Début</Label>
                    <Input
                      type="time"
                      value={slotStart}
                      onChange={(e) => setSlotStart(e.target.value)}
                      className="mt-1 w-28 border-white/15 bg-slate-900"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Fin</Label>
                    <Input
                      type="time"
                      value={slotEnd}
                      onChange={(e) => setSlotEnd(e.target.value)}
                      className="mt-1 w-28 border-white/15 bg-slate-900"
                    />
                  </div>
                  <Button
                    type="button"
                    disabled={addingSlot}
                    onClick={() => void addCreneau()}
                    className="bg-violet-600"
                  >
                    {addingSlot ? "Ajout…" : "Ajouter un créneau"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* PROFIL PUBLIC */}
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Mon profil public</h2>
          <div className="mt-4 space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <div>
              <Label>URL photo de profil</Label>
              <Input
                value={profileForm.photo_url}
                onChange={(e) => setProfileForm((p) => ({ ...p, photo_url: e.target.value }))}
                placeholder="https://…"
                className="mt-1 border-white/15 bg-slate-900"
              />
            </div>
            <div>
              <Label>Titre professionnel</Label>
              <Input
                value={profileForm.titre}
                onChange={(e) => setProfileForm((p) => ({ ...p, titre: e.target.value }))}
                className="mt-1 border-white/15 bg-slate-900"
              />
            </div>
            <div>
              <Label>Biographie</Label>
              <Textarea
                rows={4}
                value={profileForm.biographie}
                onChange={(e) => setProfileForm((p) => ({ ...p, biographie: e.target.value }))}
                className="mt-1 border-white/15 bg-slate-900"
              />
            </div>
            <div>
              <Label>Spécialités</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {BCT_SPECIALITES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => toggleSpecialite(s)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                      profileForm.specialites.includes(s)
                        ? "bg-violet-600 text-white"
                        : "bg-white/10 text-slate-300 hover:bg-white/15"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Tarif session (€)</Label>
                <Input
                  type="number"
                  min={60}
                  max={120}
                  value={profileForm.tarif_euros}
                  onChange={(e) => setProfileForm((p) => ({ ...p, tarif_euros: e.target.value }))}
                  className="mt-1 border-white/15 bg-slate-900"
                />
              </div>
              <div>
                <Label>Durée (minutes)</Label>
                <div className="mt-2 flex gap-2">
                  {BCT_DUREES.map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setProfileForm((p) => ({ ...p, duree_session: d }))}
                      className={`rounded-lg px-4 py-2 text-sm ${
                        profileForm.duree_session === d
                          ? "bg-violet-600"
                          : "bg-white/10"
                      }`}
                    >
                      {d} min
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {praticien && (
                <Button type="button" variant="outline" className="border-white/20" asChild>
                  <Link href={`/dashboard/entreprise/marketplace/${praticien.id}`} target="_blank">
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Aperçu profil public
                  </Link>
                </Button>
              )}
              <Button
                type="button"
                className="bg-violet-600"
                disabled={savingProfile}
                onClick={() => void saveProfile()}
              >
                {savingProfile ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Save className="mr-2 h-4 w-4" />
                )}
                Sauvegarder
              </Button>
            </div>
          </div>
        </section>

        {/* REVENUS */}
        <section className="mt-10">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Star className="h-5 w-5 text-amber-400" />
            Revenus
          </h2>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
            <p className="text-sm text-slate-400">
              Prochain reversement Stripe estimé : vendredi (versement hebdomadaire automatique).
            </p>
            {praticien?.stripe_onboarding_complete && (
              <Button
                type="button"
                variant="link"
                className="mt-2 h-auto p-0 text-violet-400"
                onClick={() => void openStripeDashboard()}
              >
                Voir mon tableau de bord Stripe →
              </Button>
            )}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Heure</th>
                    <th className="py-2">Net reçu</th>
                  </tr>
                </thead>
                <tbody>
                  {(data?.sessionsPassees ?? []).map((s) => (
                    <tr key={s.id} className="border-b border-white/5">
                      <td className="py-2 pr-4">{formatDateFr(s.date_session)}</td>
                      <td className="py-2 pr-4">{String(s.heure_debut).slice(0, 5)}</td>
                      <td className="py-2 font-medium">{s.montantLabel}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {(data?.sessionsPassees ?? []).length === 0 && (
                <p className="py-4 text-sm text-slate-500">Aucune session payée passée.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
