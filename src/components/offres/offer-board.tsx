"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Building2, MapPin, Search } from "lucide-react";
import type { PublicOffer } from "@/lib/offres/public-offers";
import { publishedLabel } from "@/lib/offres/public-offers";

const FILTERS = ["Toutes", "Alternance", "CDI", "CDD", "Stage"] as const;

export function OfferBoard({ offers, query = "", city = "" }: { offers: PublicOffer[]; query?: string; city?: string }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("Toutes");
  const sectors = useMemo(() => [...new Set(offers.map((offer) => offer.sector))], [offers]);
  const [sector, setSector] = useState("");
  const visible = offers.filter((offer) => {
    const haystack = `${offer.title} ${offer.sector} ${offer.city} ${offer.skills.join(" ")} ${offer.cursus}`.toLowerCase();
    if (query.trim() && !haystack.includes(query.trim().toLowerCase())) return false;
    if (city && offer.city !== city) return false;
    if (sector && offer.sector !== sector) return false;
    if (filter === "Toutes") return true;
    return offer.contractType.toLowerCase().includes(filter.toLowerCase());
  });

  return (
    <div className="bg-[#F4F4F1] px-5 py-8 text-[#12141A] sm:px-8">
      <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div>
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((item) => {
              const count = item === "Toutes" ? offers.length : offers.filter((offer) => offer.contractType.toLowerCase().includes(item.toLowerCase())).length;
              const active = filter === item;
              return (
                <button key={item} type="button" onClick={() => setFilter(item)} className={`h-10 rounded-full px-4 text-sm font-semibold ${active ? "bg-[#12141A] text-white" : "bg-white text-[#3A3D45]"}`}>
                  {item} {count}
                </button>
              );
            })}
            {sectors.slice(0, 4).map((item) => (
              <button key={item} type="button" onClick={() => setSector((current) => current === item ? "" : item)} className={`h-10 rounded-full px-4 text-sm font-semibold ${sector === item ? "bg-[#6E5BFF] text-white" : "bg-white text-[#3A3D45]"}`}>
                {item}
              </button>
            ))}
          </div>
          <div className="mt-4 space-y-3">
            {visible.length ? visible.map((offer) => (
              <Link key={offer.slug} href={`/offres/${offer.slug}`} className="block rounded-[24px] bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#EEEBFF] text-[#6E5BFF]">
                      <Building2 className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <p className="text-xs text-[#6B6F7A]">Entreprise partenaire · {offer.sector} · {offer.sizeLabel}</p>
                      <p className="mt-1 text-lg font-extrabold tracking-[-0.03em]">{offer.title}</p>
                    </div>
                  </div>
                  <span className="text-xs text-[#8B909A]">{publishedLabel(offer.publishedAt)}</span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold">
                  {offer.contractType ? <span className="rounded-full bg-[#12141A] px-3 py-1 text-white">{offer.contractType}{offer.duration ? ` · ${offer.duration}` : ""}</span> : null}
                  {offer.startLabel ? <span className="rounded-full bg-[#F4F4F1] px-3 py-1">{offer.startLabel}</span> : null}
                  {offer.workMode ? <span className="rounded-full bg-[#F4F4F1] px-3 py-1">{offer.workMode}</span> : null}
                </div>
                {offer.cursus ? <p className="mt-3 text-sm font-semibold text-[#6E5BFF]">+ Formation incluse · {offer.cursus}</p> : null}
              </Link>
            )) : (
              <p className="rounded-[24px] bg-white p-6 text-sm text-[#6B6F7A]">Aucune offre ne correspond. Les entreprises partenaires publient ici sans que leur nom apparaisse.</p>
            )}
          </div>
        </div>
        <aside className="space-y-4">
          <div className="rounded-[28px] bg-[#6E5BFF] p-5 text-white">
            <p className="text-xl font-extrabold tracking-[-0.03em]">Postulez une fois, pour le poste et la formation</p>
            <p className="mt-3 text-sm text-white/80">Sur les offres en alternance, votre candidature est transmise à l&apos;entreprise et à Byound School.</p>
            <Link href="/ecole/candidater" className="mt-5 inline-flex h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-[#12141A]">Découvrir les cursus</Link>
          </div>
          <div className="rounded-[28px] bg-[#12141A] p-5 text-white">
            <p className="text-xl font-extrabold tracking-[-0.03em]">Vous recrutez ?</p>
            <p className="mt-3 text-sm text-white/70">Publiez votre offre sur Byound. Votre nom n&apos;apparaît pas. Les candidats postulent via Byound.</p>
            <Link href="/entreprises/connexion" className="mt-5 inline-flex h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-[#12141A]">Publier une offre</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}

export function OfferSearchBar({ offers, query = "", city = "" }: { offers: PublicOffer[]; query?: string; city?: string }) {
  const cities = [...new Set(offers.map((offer) => offer.city).filter(Boolean))];
  return (
    <form action="/offres" className="mt-8 flex max-w-3xl flex-col gap-2 rounded-full bg-white p-2 sm:flex-row">
      <label className="flex flex-1 items-center gap-2 px-4">
        <Search className="h-4 w-4 text-[#8B909A]" aria-hidden />
        <input name="q" defaultValue={query} placeholder="Métier, compétence, entreprise" className="h-11 w-full bg-transparent text-sm text-[#12141A] outline-none placeholder:text-[#8B909A]" />
      </label>
      <label className="flex items-center gap-2 border-t border-[#F0EEE8] px-4 sm:border-l sm:border-t-0">
        <MapPin className="h-4 w-4 text-[#8B909A]" aria-hidden />
        <select name="ville" defaultValue={city} className="h-11 bg-transparent text-sm outline-none">
          <option value="">Ville</option>
          {cities.map((item) => <option key={item}>{item}</option>)}
        </select>
      </label>
      <button type="submit" className="h-11 rounded-full bg-[#6E5BFF] px-5 text-sm font-semibold text-white">Rechercher</button>
    </form>
  );
}
