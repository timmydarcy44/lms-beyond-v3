"use client";

import Image from "next/image";
import Link from "next/link";
import { Calendar, MapPin, Ticket, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { MosHeader } from "@/components/mos/mos-header";
import { MosFooter } from "@/components/mos/mos-footer";
import { MosButton } from "@/components/mos/mos-button";
import type { CalendarMatch } from "@/components/mos/constants";

function teamInitials(name: string, fallback?: string) {
  if (fallback) return fallback;
  return name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

function ClubCrest({ name, isMos }: { name: string; isMos?: boolean }) {
  if (isMos) {
    return (
      <div className="relative h-24 w-20 sm:h-32 sm:w-28 lg:h-40 lg:w-32">
        <Image src="/mos/logo.png" alt={name} fill className="object-contain drop-shadow-[0_8px_24px_rgba(200,16,46,0.45)]" unoptimized />
      </div>
    );
  }

  const initials = teamInitials(name);
  return (
    <div className="flex h-24 w-24 items-center justify-center border-2 border-white/20 bg-[#1a1a1a] sm:h-32 sm:w-32 lg:h-36 lg:w-36">
      <span className="text-center text-lg font-black uppercase tracking-tight text-white/90 sm:text-2xl">{initials}</span>
    </div>
  );
}

function MatchPoster({ match }: { match: CalendarMatch }) {
  const homeMos = match.home.name.includes("MOS");
  const awayMos = match.away.name.includes("MOS");

  return (
    <div className="relative aspect-[1920/600] min-h-[220px] w-full overflow-hidden bg-[#0a0a0a] sm:min-h-[280px] lg:min-h-[360px]">
      {/* Red dramatic lighting — flat panels, no gradient */}
      <div className="absolute inset-y-0 left-0 w-[38%] bg-[#C8102E]/20" aria-hidden />
      <div className="absolute inset-y-0 right-0 w-[38%] bg-[#C8102E]/15" aria-hidden />
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#C8102E]" aria-hidden />
      <div className="absolute left-0 top-0 h-full w-1 bg-[#C8102E]/60" aria-hidden />
      <div className="absolute right-0 top-0 h-full w-1 bg-[#C8102E]/40" aria-hidden />

      <div className="relative mx-auto flex h-full max-w-[1400px] flex-col items-center justify-center px-5 py-8 sm:px-10">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-[0.35em] text-[#C8102E] sm:mb-6">
          {match.competition} · {match.category} {match.categoryLabel}
        </p>

        <div className="grid w-full max-w-4xl grid-cols-[1fr_auto_1fr] items-center gap-4 sm:gap-8">
          <div className="flex flex-col items-center gap-3 sm:items-end sm:pr-4">
            <ClubCrest name={match.home.name} isMos={homeMos} />
            <p className="max-w-[140px] text-center text-xs font-bold uppercase tracking-[0.12em] text-white sm:text-right sm:text-sm">
              {match.home.name}
            </p>
            {match.home.score != null ? (
              <span className="text-4xl font-black tabular-nums text-white sm:text-5xl">{match.home.score}</span>
            ) : null}
          </div>

          <div className="flex flex-col items-center">
            <span className="text-[clamp(2.5rem,8vw,5rem)] font-black leading-none tracking-[-0.04em] text-white">VS</span>
            <span
              className={cn(
                "mt-2 rounded px-2 py-0.5 text-[9px] font-bold uppercase tracking-[0.2em]",
                match.status === "EN DIRECT"
                  ? "bg-[#C8102E] text-white"
                  : match.status === "TERMINÉ"
                    ? "bg-white/10 text-white/70"
                    : "border border-[#C8102E] text-[#C8102E]",
              )}
            >
              {match.status}
            </span>
          </div>

          <div className="flex flex-col items-center gap-3 sm:items-start sm:pl-4">
            <ClubCrest name={match.away.name} isMos={awayMos} />
            <p className="max-w-[140px] text-center text-xs font-bold uppercase tracking-[0.12em] text-white sm:text-left sm:text-sm">
              {match.away.name}
            </p>
            {match.away.score != null ? (
              <span className="text-4xl font-black tabular-nums text-white sm:text-5xl">{match.away.score}</span>
            ) : null}
          </div>
        </div>

        <p className="mt-6 text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-white/80 sm:mt-8 sm:text-xs">
          {match.dateLabel} · {match.kickoff} · {match.venue}
        </p>
      </div>
    </div>
  );
}

type Props = {
  match: CalendarMatch;
};

export function MosMatchPage({ match }: Props) {
  const isUpcoming = match.status === "À VENIR" || match.status === "EN DIRECT";
  const price = match.ticketPrice ?? 8;

  return (
    <>
      <MosHeader />

      <main className="mt-24 bg-white">
        <div className="border-b border-[#E5E5E5] px-5 py-3 lg:px-10">
          <div className="mx-auto flex max-w-[1400px] items-center gap-2 text-xs text-[#757575]">
            <Link href="/mos" className="hover:text-[#111111]">
              MOS Caen
            </Link>
            <span>/</span>
            <Link href="/mos#calendrier" className="hover:text-[#111111]">
              Calendrier
            </Link>
            <span>/</span>
            <span className="text-[#111111]">Match center</span>
          </div>
        </div>

        <MatchPoster match={match} />

        <div className="mx-auto grid max-w-[1400px] gap-12 px-5 py-12 lg:grid-cols-[1fr_380px] lg:gap-16 lg:px-10 lg:py-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C8102E]">Présentation</p>
            <h1 className="mt-4 text-[clamp(1.75rem,4vw,2.5rem)] font-black uppercase leading-tight tracking-[-0.02em] text-[#111111]">
              {match.home.name} — {match.away.name}
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-[#666666]">{match.presentation}</p>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              <div className="border border-[#E5E5E5] p-5">
                <Calendar className="h-5 w-5 text-[#C8102E]" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#111111]/50">Date</p>
                <p className="mt-1 text-sm font-bold text-[#111111]">{match.dateLabel}</p>
                <p className="text-sm text-[#757575]">{match.kickoff}</p>
              </div>
              <div className="border border-[#E5E5E5] p-5">
                <MapPin className="h-5 w-5 text-[#C8102E]" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#111111]/50">Lieu</p>
                <p className="mt-1 text-sm font-bold text-[#111111]">{match.venue}</p>
                <p className="text-sm text-[#757575]">{match.competition}</p>
              </div>
              <div className="border border-[#E5E5E5] p-5">
                <Users className="h-5 w-5 text-[#C8102E]" />
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.12em] text-[#111111]/50">Catégorie</p>
                <p className="mt-1 text-sm font-bold text-[#111111]">
                  {match.category} · {match.categoryLabel}
                </p>
                <p className="text-sm text-[#757575]">{match.status}</p>
              </div>
            </div>
          </div>

          <aside className="h-fit border border-[#111111] bg-[#111111] p-8 text-white lg:sticky lg:top-28">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-[#C8102E]" />
              <p className="text-xs font-bold uppercase tracking-[0.2em]">Billetterie</p>
            </div>

            {isUpcoming ? (
              <>
                <p className="mt-6 text-3xl font-black">{price} €</p>
                <p className="mt-1 text-sm text-white/60">Tarif supporter · Tribune principale</p>
                <ul className="mt-6 space-y-2 text-sm text-white/70">
                  <li>— Billetterie en ligne sécurisée</li>
                  <li>— Retrait au guichet 1h avant le coup d&apos;envoi</li>
                  <li>— Tarif réduit -18 ans : {(price * 0.5).toFixed(0)} €</li>
                </ul>
                <button
                  type="button"
                  className="mt-8 w-full bg-[#C8102E] py-4 text-sm font-bold uppercase tracking-[0.15em] text-white transition hover:bg-[#a00d25]"
                >
                  Acheter ma place
                </button>
                <p className="mt-4 text-center text-[10px] uppercase tracking-[0.12em] text-white/40">
                  Places limitées · Match à guichet fermé possible
                </p>
              </>
            ) : (
              <>
                <p className="mt-6 text-2xl font-black uppercase">Match terminé</p>
                <p className="mt-2 text-sm text-white/60">
                  Score final : {match.home.score} — {match.away.score}
                </p>
                <Link
                  href="#actualites"
                  className="mt-8 flex w-full items-center justify-center bg-white py-4 text-sm font-bold uppercase tracking-[0.15em] text-[#111111] transition hover:bg-[#F5F5F5]"
                >
                  Voir le compte-rendu
                </Link>
              </>
            )}
          </aside>
        </div>

        <section className="border-t border-[#E5E5E5] bg-[#F5F5F5] px-5 py-12 lg:px-10">
          <div className="mx-auto max-w-[1400px]">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#C8102E]">Infos pratiques</p>
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { label: "Ouverture des portes", value: "14h00" },
                { label: "Coup d'envoi", value: match.kickoff },
                { label: "Parking", value: "Gratuit sur site" },
                { label: "Buvezza", value: "Ouverte dès 13h30" },
              ].map((item) => (
                <div key={item.label}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#757575]">{item.label}</p>
                  <p className="mt-1 text-lg font-bold text-[#111111]">{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <MosButton href="/mos#calendrier">Retour au calendrier</MosButton>
            </div>
          </div>
        </section>
      </main>

      <MosFooter />
    </>
  );
}
