"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { usePersonalizedActionPlanFromSnapshot } from "@/components/learner/learner-snapshot-provider";
import {
  collectSpecialites,
  filterPractitionersByQuery,
  SALARIE_PRACTITIONERS_FALLBACK,
  type SalariePractitioner,
} from "@/lib/learner/practitioners";
import { SALARIE_PAGE_SHELL } from "@/lib/salarie/connect-nav";

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
  const [booking, setBooking] = useState<SalariePractitioner | null>(null);
  const [bookingState, setBookingState] = useState<"choice" | "done">("choice");
  const [bookingMessage, setBookingMessage] = useState<string | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingPending, setBookingPending] = useState(false);

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

  const requestAppointment = async (payer: "employee" | "employer") => {
    if (!booking || bookingPending) return;
    setBookingPending(true);
    setBookingError(null);
    try {
      const res = await fetch("/api/dashboard/salarie/accompagnement", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payer,
          practitionerName: booking.name,
          practitionerTitle: booking.title,
        }),
      });
      const json = (await res.json().catch(() => null)) as { message?: string; error?: string } | null;
      if (!res.ok) throw new Error(json?.error || "Demande impossible");
      setBookingMessage(json?.message ?? "Demande enregistrée.");
      setBookingState("done");
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : "Demande impossible");
    } finally {
      setBookingPending(false);
    }
  };
  const portraitFallbacks = SALARIE_PRACTITIONERS_FALLBACK.map((item) => item.photoUrl).filter(
    (url): url is string => Boolean(url),
  );

  return (
    <div className={`${SALARIE_PAGE_SHELL} min-h-screen bg-[#F4F5F7] text-[#14151A]`}>
      <section className="mb-8 overflow-hidden rounded-[36px] bg-white px-6 py-7 shadow-[0_12px_40px_rgba(15,23,42,0.06)] sm:px-8">
        <p className="text-sm text-[#8B909A]">Prochain rendez-vous</p>
        {nextAppointment ? (
          <div className="mt-4">
            <p className="text-3xl font-extrabold tracking-tight">{nextAppointment.practitionerName}</p>
            <p className="mt-1 text-[#3C4250]">{nextAppointment.title}</p>
            <p className="mt-3 text-sm text-[#5C6370]">
              {nextAppointment.dateLabel} · {nextAppointment.time} · {nextAppointment.place}
            </p>
          </div>
        ) : (
          <p className="mt-4 text-2xl font-bold">Aucun rendez-vous planifié</p>
        )}
      </section>

      <section className="mb-8 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B909A]">Accompagnement</p>
        <h1 className="text-3xl font-extrabold tracking-tight text-[#14151A]">Praticiens</h1>
        <p className="mt-2 max-w-3xl text-sm text-[#5C6370]">
          Plusieurs sujets, plusieurs praticiens. Choisissez la personne qui correspond à ce que vous voulez travailler.
        </p>
      </section>

      <section className="mb-8 space-y-3">
        <label htmlFor="coach-search" className="sr-only">
          Rechercher par spécialité
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#8B909A]" />
          <input
            id="coach-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedSpecialite("");
            }}
            placeholder="Rechercher une spécialité (ex. Leadership, Gestion des émotions…)"
            className="w-full rounded-full border border-black/10 bg-white py-3 pl-11 pr-4 text-sm text-[#14151A] outline-none placeholder:text-[#8B909A] focus:border-[#111]"
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
              className="rounded-full border border-black/10 bg-white px-3 py-1.5 text-xs text-[#14151A] outline-none"
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
                    ? "border-transparent bg-[#111] text-white"
                    : "border-black/10 bg-white text-[#3C4250]"
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
          <h2 className="text-lg font-semibold text-[#14151A]">Recommandés pour vous</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {recommended.map((coach) => (
              <div key={coach.id} className="rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#6E5BFF]">
                  {coach.reason}
                </p>
                <p className="mt-2 text-lg font-bold text-[#14151A]">{coach.name}</p>
                <p className="text-sm text-[#5C6370]">{coach.title}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {coach.specialites.map((s) => (
                    <span
                      key={s}
                      className="rounded-full bg-[#F4F5F7] px-2.5 py-0.5 text-xs text-[#3C4250]"
                    >
                      {s}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const match = practitioners.find((item) => item.name === coach.name) ?? {
                      id: coach.id,
                      name: coach.name,
                      title: coach.title,
                      bio: "",
                      specialites: coach.specialites,
                      photoUrl: null,
                    };
                    setBooking(match);
                    setBookingState("choice");
                    setBookingMessage(null);
                    setBookingError(null);
                  }}
                  className="mt-4 rounded-full bg-[#111] px-4 py-2 text-sm font-semibold text-white"
                >
                  Prendre rendez-vous
                </button>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-[#14151A]">
          {query || selectedSpecialite
            ? `${filtered.length} praticien${filtered.length > 1 ? "s" : ""} trouvé${filtered.length > 1 ? "s" : ""}`
            : "Nos praticiens"}
        </h2>
        {practitionersLoading ? (
          <p className="text-sm text-[#5C6370]">Chargement des praticiens…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
            <p className="text-sm text-[#5C6370]">Aucun praticien ne correspond à votre recherche.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((praticien, index) => (
              <article key={praticien.id} className="relative aspect-[3/4] overflow-hidden rounded-[28px] bg-[#1E2130]">
                <img
                  src={praticien.photoUrl || portraitFallbacks[index % portraitFallbacks.length]}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-black/10" />
                <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-5">
                  <div>
                    <p className="text-xl font-bold text-white">{praticien.name}</p>
                    <p className="mt-1 text-sm text-white/80">{praticien.title}</p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {praticien.specialites.slice(0, 3).map((s) => (
                      <span key={s} className="rounded-full bg-white/15 px-2.5 py-0.5 text-[11px] text-white">
                        {s}
                      </span>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setBooking(praticien);
                      setBookingState("choice");
                      setBookingMessage(null);
                      setBookingError(null);
                    }}
                    className="rounded-full bg-white px-4 py-2.5 text-sm font-semibold text-black"
                  >
                    Prendre rendez-vous
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <Dialog
        open={Boolean(booking)}
        onOpenChange={(open) => {
          if (!open) setBooking(null);
        }}
      >
        <DialogContent className="border-black/10 bg-white text-[#14151A] sm:max-w-md">
          {booking ? (
            <div className="space-y-4">
              <DialogTitle className="text-xl font-bold">Rendez-vous avec {booking.name}</DialogTitle>
              <p className="text-sm text-[#5C6370]">{booking.title}</p>
              {bookingState === "done" ? (
                <p className="text-sm">{bookingMessage}</p>
              ) : (
                <>
                  <p className="text-sm text-[#3C4250]">Qui règle cet accompagnement individuel ?</p>
                  <div className="grid gap-2">
                    <button
                      type="button"
                      disabled={bookingPending}
                      onClick={() => void requestAppointment("employee")}
                      className="rounded-full bg-[#111] px-4 py-3 text-sm font-semibold text-white disabled:opacity-50"
                    >
                      Je règle la séance
                    </button>
                    <button
                      type="button"
                      disabled={bookingPending}
                      onClick={() => void requestAppointment("employer")}
                      className="rounded-full border border-black/10 px-4 py-3 text-sm font-semibold disabled:opacity-50"
                    >
                      Demander une prise en charge employeur
                    </button>
                  </div>
                  {bookingError ? <p className="text-sm text-red-600">{bookingError}</p> : null}
                </>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      <p className="mt-8 text-xs text-[#8B909A]">
        Besoin d&apos;un accompagnement spécifique ?{" "}
        <Link href="/dashboard/salarie/parcours" className="underline">
          Consultez votre parcours personnalisé
        </Link>
      </p>
    </div>
  );
}
