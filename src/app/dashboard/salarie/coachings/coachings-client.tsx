"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { usePersonalizedActionPlanFromSnapshot } from "@/components/learner/learner-snapshot-provider";
import {
  collectSpecialites,
  filterPractitionersByQuery,
  type SalariePractitioner,
} from "@/lib/learner/practitioners";
import {
  SALARIE_CARD,
  SALARIE_PAGE_KICKER,
  SALARIE_PAGE_LEAD,
  SALARIE_PAGE_SHELL,
  SALARIE_PAGE_TITLE,
} from "@/lib/salarie/connect-nav";

export default function SalarieCoachingsPageClient() {
  const { loading: planLoading, plan } = usePersonalizedActionPlanFromSnapshot("salarie");
  const [practitioners, setPractitioners] = useState<SalariePractitioner[]>([]);
  const [practitionersLoading, setPractitionersLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selectedSpecialite, setSelectedSpecialite] = useState("");
  const [nextAppointment, setNextAppointment] = useState<{
    practitionerName: string;
    title: string;
    dateLabel: string;
    time: string;
    place: string;
  } | null>(null);

  const loadPractitioners = useCallback(async () => {
    setPractitionersLoading(true);
    try {
      const res = await fetch("/api/dashboard/salarie/practitioners", { credentials: "include" });
      const json = (await res.json()) as {
        praticiens?: SalariePractitioner[];
        nextAppointment?: {
          practitionerName: string;
          title: string;
          dateLabel: string;
          time: string;
          place: string;
        } | null;
      };
      setPractitioners(json.praticiens ?? []);
      setNextAppointment(json.nextAppointment ?? null);
    } catch {
      setPractitioners([]);
    } finally {
      setPractitionersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadPractitioners();
  }, [loadPractitioners]);

  const allSpecialites = useMemo(() => collectSpecialites(practitioners), [practitioners]);

  const filtered = useMemo(() => {
    const q = selectedSpecialite || query;
    return filterPractitionersByQuery(practitioners, q);
  }, [practitioners, query, selectedSpecialite]);

  const recommended = plan?.coachings ?? [];

  return (
    <div className={SALARIE_PAGE_SHELL}>
      <section className="mb-8 overflow-hidden rounded-[36px] bg-[#0C0D12] px-6 py-7 sm:px-8">
        <p className="text-sm text-white/45">Prochain rendez-vous</p>
        {nextAppointment ? (
          <div className="mt-4 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-3xl font-extrabold tracking-tight text-white">{nextAppointment.practitionerName}</p>
              <p className="mt-1 text-white/70">{nextAppointment.title}</p>
              <p className="mt-3 text-sm text-white/55">
                {nextAppointment.dateLabel} · {nextAppointment.time} · {nextAppointment.place}
              </p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-2xl font-bold text-white">Aucun rendez-vous planifié</p>
        )}
      </section>

      <section className="mb-8 space-y-2">
        <p className={SALARIE_PAGE_KICKER}>Accompagnement</p>
        <h1 className={SALARIE_PAGE_TITLE}>Praticiens</h1>
        <p className={SALARIE_PAGE_LEAD}>
          Plusieurs sujets, plusieurs praticiens. Choisissez la personne qui correspond à ce que vous voulez travailler.
        </p>
      </section>

      <section className="mb-8 space-y-3">
        <label htmlFor="coach-search" className="sr-only">
          Rechercher par spécialité
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
          <input
            id="coach-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedSpecialite("");
            }}
            placeholder="Rechercher une spécialité (ex. Leadership, Gestion des émotions…)"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/35 outline-none focus:border-violet-400/40"
          />
        </div>
        {allSpecialites.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            <select
              value={selectedSpecialite}
              onChange={(e) => {
                setSelectedSpecialite(e.target.value);
                setQuery("");
              }}
              className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-white/80 outline-none"
            >
              <option value="">Toutes les spécialités</option>
              {allSpecialites.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            {allSpecialites.slice(0, 8).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSelectedSpecialite(s);
                  setQuery("");
                }}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  selectedSpecialite === s
                    ? "border-violet-400/50 bg-violet-500/20 text-violet-100"
                    : "border-white/10 text-white/60 hover:border-white/20"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      {!planLoading && recommended.length > 0 ? (
        <section className="mb-10 space-y-4">
          <h2 className="text-lg font-semibold text-white">Recommandés pour vous</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {recommended.map((coach) => (
              <div key={coach.id} className={`${SALARIE_CARD} ring-1 ring-violet-400/20`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-violet-300/80">
                  {coach.reason}
                </p>
                <p className="mt-2 text-lg font-bold text-white">{coach.name}</p>
                <p className="text-sm text-white/55">{coach.title}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {coach.specialites.map((s) => (
                    <span
                      key={s}
                      className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-xs text-white/70"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  className="mt-4 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
                >
                  Demander une session
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">
          {query || selectedSpecialite
            ? `${filtered.length} praticien${filtered.length > 1 ? "s" : ""} trouvé${filtered.length > 1 ? "s" : ""}`
            : "Nos praticiens"}
        </h2>
        {practitionersLoading ? (
          <p className="text-sm text-white/50">Chargement des praticiens…</p>
        ) : filtered.length === 0 ? (
          <div className={SALARIE_CARD}>
            <p className="text-sm text-white/60">Aucun praticien ne correspond à votre recherche.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {filtered.map((praticien) => (
              <article key={praticien.id} className="flex gap-4 rounded-[26px] border border-white/[0.08] bg-[#12141A] p-5">
                {praticien.photoUrl ? (
                  <img src={praticien.photoUrl} alt="" className="h-16 w-16 shrink-0 rounded-2xl object-cover" />
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-[#1E2130] text-lg font-bold text-white">
                    {praticien.name.charAt(0)}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-lg font-bold text-white">{praticien.name}</p>
                      <p className="text-sm text-white/55">{praticien.title}</p>
                    </div>
                    <p className="shrink-0 text-sm font-semibold text-white">Sur devis</p>
                  </div>
                  {praticien.bio ? <p className="mt-2 line-clamp-2 text-sm text-white/45">{praticien.bio}</p> : null}
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {praticien.specialites.map((s) => (
                      <span key={s} className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-white/60">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <p className="mt-8 text-xs text-white/35">
        Besoin d&apos;un accompagnement spécifique ?{" "}
        <Link href="/dashboard/salarie/parcours" className="underline hover:text-white/60">
          Consultez votre parcours personnalisé
        </Link>
      </p>
    </div>
  );
}
