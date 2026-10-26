import Link from "next/link";
import { Building2, Dumbbell, GraduationCap, Store } from "lucide-react";
import type { PublicOffer } from "@/lib/offres/public-offers";
import { listPublicOffers, publishedLabel } from "@/lib/offres/public-offers";
import { getServiceRoleClient } from "@/lib/supabase/server";

const TONES = [
  "bg-[#1F8A4C]",
  "bg-[#2F6FE4]",
  "bg-[#6E5BFF]",
];

function SectorMark({ sector, className }: { sector: string; className?: string }) {
  const key = sector.toLowerCase();
  const Icon = key.includes("sport") ? Dumbbell : key.includes("commerce") || key.includes("détail") ? Store : key.includes("enseignement") ? GraduationCap : Building2;
  return (
    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/20 ${className ?? ""}`}>
      <Icon className="h-4 w-4" aria-hidden />
    </span>
  );
}

export async function AlternantsRecruitingSection({ cursus }: { cursus?: string }) {
  const db = getServiceRoleClient();
  const offers = db ? await listPublicOffers(db) : [];
  return <AlternantsRecruiting offers={offers} cursus={cursus} />;
}

export function AlternantsRecruiting({ offers, cursus }: { offers: PublicOffer[]; cursus?: string }) {
  const hint = (cursus ?? "").trim().toLowerCase();
  const picked = (hint ? offers.filter((offer) => offer.cursus.toLowerCase().includes(hint) || offer.title.toLowerCase().includes(hint)) : offers).slice(0, 3);
  const shown = picked.length ? picked : offers.slice(0, 3);
  return (
    <section className="bg-[#F4F4F1] px-5 py-16 text-[#12141A] sm:px-8">
      <div className="mx-auto max-w-6xl">
        <p className="text-sm font-semibold text-[#6E5BFF]">Alternance</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="max-w-xl text-4xl font-extrabold tracking-[-0.04em] sm:text-5xl">Ces entreprises recrutent nos alternants</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#5C616B]">
              Postulez à l&apos;offre et au cursus en même temps. Une seule candidature, deux réponses.
            </p>
          </div>
          <Link href="/offres" className="inline-flex h-12 items-center rounded-full bg-[#12141A] px-5 text-sm font-semibold text-white">
            Voir toutes les offres
          </Link>
        </div>
        {shown.length ? (
          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {shown.map((offer, index) => (
              <Link key={offer.slug} href={`/offres/${offer.slug}`} className={`flex min-h-56 flex-col rounded-[28px] p-6 text-white ${TONES[index % TONES.length]}`}>
                <div className="flex items-center gap-3 text-sm font-semibold">
                  <SectorMark sector={offer.sector} />
                  <span>Entreprise partenaire</span>
                </div>
                <p className="mt-6 text-2xl font-extrabold tracking-[-0.03em]">{offer.title}</p>
                <p className="mt-2 text-sm text-white/80">
                  {[offer.city, offer.contractType, offer.duration].filter(Boolean).join(" · ")}
                </p>
                <span className="mt-auto inline-flex w-fit rounded-full bg-black/15 px-3 py-1 text-xs font-semibold">
                  {offer.cursus ? `+ ${offer.cursus}` : offer.sector}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="mt-8 text-sm text-[#5C616B]">Les offres anonymes des entreprises partenaires apparaîtront ici.</p>
        )}
        {shown.length ? (
          <p className="mt-6 text-sm text-[#8B909A]">
            Secteurs qui recrutent : {[...new Set(shown.map((offer) => offer.sector))].join(" · ")}
          </p>
        ) : null}
      </div>
    </section>
  );
}

export function OfferDetail({ offer }: { offer: PublicOffer }) {
  const pills = [offer.contractType && offer.duration ? `${offer.contractType} · ${offer.duration}` : offer.contractType, offer.startLabel && `Début ${offer.startLabel}`, offer.city && offer.workMode ? `${offer.city} · ${offer.workMode.toLowerCase()}` : offer.city || offer.workMode, offer.hours].filter(Boolean);
  return (
    <article>
      <header className="bg-[#070C1C] px-5 pb-16 pt-10 text-white sm:px-8">
        <div className="mx-auto max-w-6xl">
          <Link href="/offres" className="text-sm text-white/60">‹ Toutes les offres</Link>
          <div className="mt-6 flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10">
              <Store className="h-5 w-5" aria-hidden />
            </span>
            <div>
              <p className="font-semibold">Entreprise partenaire · {offer.sector}</p>
              <p className="text-sm text-white/55">{offer.sizeLabel}{offer.publishedAt ? ` · publiée ${publishedLabel(offer.publishedAt)}` : ""}</p>
            </div>
          </div>
          <div className="mt-8 flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-3xl">
              <h1 className="text-4xl font-extrabold tracking-[-0.045em] sm:text-6xl">{offer.title}</h1>
              <div className="mt-5 flex flex-wrap gap-2">
                {pills.map((pill) => (
                  <span key={pill} className="rounded-full border border-white/15 px-3 py-1.5 text-sm text-white/85">{pill}</span>
                ))}
              </div>
              {offer.payLabel ? <p className="mt-3 text-sm text-white/70">{offer.payLabel}</p> : null}
            </div>
            <div className="text-right">
              <Link href={`/ecole/candidater?offre=${offer.slug}`} className="inline-flex h-12 items-center rounded-full bg-white px-5 text-sm font-semibold text-[#12141A]">
                Postuler à l&apos;offre et au cursus
              </Link>
              <p className="mt-2 text-xs text-white/45">Une seule candidature · réponse sous 10 jours</p>
            </div>
          </div>
        </div>
      </header>
      <div className="bg-[#F4F4F1] px-5 py-10 sm:px-8">
        <div className="mx-auto grid max-w-6xl gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <section className="rounded-[28px] bg-white p-6">
              <h2 className="text-lg font-extrabold">Le poste</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-[#3A3D45]">{offer.description || "Le descriptif sera précisé par l'entreprise."}</p>
            </section>
            {offer.missions.length ? (
              <section className="rounded-[28px] bg-white p-6">
                <h2 className="text-lg font-extrabold">Vos missions</h2>
                <ul className="mt-4 space-y-2 text-sm text-[#3A3D45]">
                  {offer.missions.map((mission) => (
                    <li key={mission} className="flex gap-2"><span className="text-[#6E5BFF]">✓</span>{mission}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {offer.softSkills.length || offer.skills.length ? (
              <section className="rounded-[28px] bg-white p-6">
                <h2 className="text-lg font-extrabold">Ce qui compte pour nous</h2>
                <ul className="mt-4 space-y-2 text-sm text-[#3A3D45]">
                  {[...offer.softSkills, ...offer.skills].slice(0, 8).map((skill) => (
                    <li key={skill} className="flex gap-2"><span className="text-[#14A37F]">◆</span>{skill}</li>
                  ))}
                </ul>
              </section>
            ) : null}
            {offer.steps.length ? (
              <section className="rounded-[28px] bg-white p-6">
                <h2 className="text-lg font-extrabold">Comment se passe le recrutement</h2>
                <ol className="mt-4 space-y-3">
                  {offer.steps.map((step, index) => (
                    <li key={step.title} className="flex items-center justify-between gap-3 text-sm">
                      <span className="flex items-center gap-3 font-semibold"><span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#12141A] text-xs text-white">{index + 1}</span>{step.title}</span>
                      <span className="text-[#6B6F7A]">{step.detail}</span>
                    </li>
                  ))}
                </ol>
              </section>
            ) : null}
          </div>
          <aside className="space-y-4">
            <dl className="rounded-[28px] bg-white p-5 text-sm">
              {[
                ["Contrat", [offer.contractType, offer.duration].filter(Boolean).join(" · ")],
                ["Début", offer.startLabel],
                ["Lieu", [offer.city, offer.workMode].filter(Boolean).join(" · ")],
                ["Temps de travail", offer.hours],
                ["Rémunération", offer.payLabel],
                ["Avantages", offer.benefits.join(", ")],
              ].filter(([, value]) => value).map(([label, value]) => (
                <div key={label} className="flex items-start justify-between gap-4 border-b border-[#F0EEE8] py-3 last:border-0">
                  <dt className="text-[#6B6F7A]">{label}</dt>
                  <dd className="text-right font-semibold">{value}</dd>
                </div>
              ))}
            </dl>
            {offer.cursus ? (
              <div className="rounded-[28px] bg-[#6E5BFF] p-5 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-white/70">Formation incluse</p>
                <p className="mt-3 text-2xl font-extrabold tracking-[-0.03em]">{offer.cursus}</p>
                <p className="mt-2 text-sm text-white/80">La candidature est transmise à l&apos;entreprise et à Byound School.</p>
                <Link href="/ecole/candidater" className="mt-4 inline-flex text-sm font-semibold">Voir le cursus ›</Link>
              </div>
            ) : null}
          </aside>
        </div>
      </div>
    </article>
  );
}
