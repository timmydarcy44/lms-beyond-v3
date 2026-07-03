"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import {
  Award,
  BookOpen,
  ChevronRight,
  Quote,
  Search,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import { edgeMarketingHref } from "@/lib/edge-site/edge-marketing-path";
import {
  EDGE_CATALOG_STATS,
  EDGE_TRAINING_DOMAINS,
  formatTrainingFormats,
  getBadgeById,
  getLevelLabel,
  getModulesByDomain,
  searchTrainingCatalog,
  type TrainingDomain,
  type TrainingModule,
} from "@/lib/edge-site/training-catalog";
import {
  EDGE_IMPACT_STATS,
  EDGE_LIFESTYLE_IMAGES,
  EDGE_SPECIALISTS,
  EDGE_TESTIMONIALS,
  EDGE_TRUSTED_LOGOS,
} from "@/lib/edge-site/training-catalog-human";

const SEARCH_SUGGESTIONS = ["Management", "IA", "Soft skills", "Communication", "Vente", "Leadership"];

function formationHref(moduleId: string) {
  return edgeMarketingHref(`/business/former-vos-equipes/${moduleId}`);
}

function SpecialistCard({
  name,
  specialty,
  photoUrl,
  companiesCount,
  rating,
  badges,
}: (typeof EDGE_SPECIALISTS)[0]) {
  return (
    <article className="group relative overflow-hidden rounded-[28px] bg-[#050505] shadow-lg">
      <div className="relative aspect-[3/4] w-full">
        <Image src={photoUrl} alt={name} fill className="object-cover transition duration-500 group-hover:scale-105" unoptimized />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
          <p className="text-lg font-semibold">{name}</p>
          <p className="mt-1 text-sm text-white/70">{specialty}</p>
          <div className="mt-3 flex items-center gap-3 text-xs text-white/55">
            <span>{companiesCount} entreprises</span>
            <span className="inline-flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn("h-3 w-3", i < Math.floor(rating) ? "fill-amber-400 text-amber-400" : "text-white/30")}
                />
              ))}
            </span>
          </div>
          {badges?.length ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {badges.map((b) => (
                <span key={b} className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium backdrop-blur-sm">
                  {b}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}

function ModuleSearchCard({ module }: { module: TrainingModule }) {
  const domain = EDGE_TRAINING_DOMAINS.find((d) => d.id === module.domainId);
  const badge = getBadgeById(module.badgeId);

  return (
    <Link
      href={formationHref(module.id)}
      className="group flex flex-col overflow-hidden rounded-[24px] border border-[#050505]/8 bg-white shadow-sm transition hover:border-edge-accent/30 hover:shadow-[0_12px_40px_rgba(99,91,255,0.1)]"
    >
      <div className="relative h-40 overflow-hidden">
        <Image
          src={EDGE_LIFESTYLE_IMAGES[module.level % 3].url}
          alt=""
          fill
          className="object-cover transition duration-500 group-hover:scale-105"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/60 to-transparent" />
        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-edge-accent">
          {module.code}
        </span>
      </div>
      <div className="flex flex-1 flex-col p-6">
        <p className="text-xs font-medium text-[#050505]/45">{domain?.title}</p>
        <h3 className="mt-2 text-base font-semibold leading-snug group-hover:text-edge-accent">{module.title}</h3>
        <p className="mt-2 text-xs text-[#050505]/50">
          Niveau {module.level} · {getLevelLabel(module.level)} · {formatTrainingFormats(module.formats)}
        </p>
        {badge ? (
          <p className="mt-3 inline-flex items-center gap-1 text-xs text-edge-accent">
            <Award className="h-3.5 w-3.5" /> {badge.name}
          </p>
        ) : null}
        <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-edge-accent">
          Voir la formation <ChevronRight className="h-4 w-4" />
        </span>
      </div>
    </Link>
  );
}

function DomainCard({
  domain,
  moduleCount,
}: {
  domain: TrainingDomain;
  moduleCount: number;
}) {
  const modules = getModulesByDomain(domain.id);
  const preview = modules.slice(0, 2);
  const badge = getBadgeById(domain.badgeId);

  return (
    <article className="overflow-hidden rounded-[24px] border border-[#050505]/8 bg-white shadow-sm">
      <div className="relative h-44">
        <Image
          src={EDGE_LIFESTYLE_IMAGES[domain.id.length % 3].url}
          alt=""
          fill
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#050505]/70 via-[#050505]/20 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-white/60">{domain.themeLabel}</p>
          <h3 className="mt-1 text-xl font-semibold">{domain.title}</h3>
        </div>
      </div>
      <div className="p-6">
        <p className="text-sm leading-relaxed text-[#050505]/60">{domain.summary}</p>
        <p className="mt-3 text-xs text-[#050505]/40">{moduleCount} modules · {badge?.name}</p>
        <div className="mt-4 space-y-2">
          {preview.map((mod) => (
            <Link
              key={mod.id}
              href={formationHref(mod.id)}
              className="flex items-center justify-between rounded-xl border border-[#050505]/8 px-3 py-2.5 text-sm transition hover:border-edge-accent/25 hover:bg-edge-accent/5"
            >
              <span className="line-clamp-1 font-medium">{mod.title}</span>
              <ChevronRight className="h-4 w-4 shrink-0 text-[#050505]/30" />
            </Link>
          ))}
        </div>
        <Link
          href={formationHref(preview[0]?.id ?? modules[0]?.id ?? "")}
          className="mt-4 inline-flex text-sm font-medium text-edge-accent hover:underline"
        >
          Explorer le domaine →
        </Link>
      </div>
    </article>
  );
}

export function EdgeBusinessFormerEquipesPage() {
  const { links } = useEdgePremiumConfig();
  const catalogueRef = useRef<HTMLElement>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [domainFilter, setDomainFilter] = useState<string>("all");

  const searchResults = useMemo(() => searchTrainingCatalog(searchQuery), [searchQuery]);

  const visibleDomains = useMemo(() => {
    const base = searchQuery.trim() ? searchResults.domains : EDGE_TRAINING_DOMAINS;
    if (domainFilter === "all") return base;
    return base.filter((d) => d.id === domainFilter);
  }, [searchQuery, searchResults.domains, domainFilter]);

  const visibleModules = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return searchResults.modules.slice(0, 12);
  }, [searchQuery, searchResults.modules]);

  const scrollToCatalogue = () => {
    catalogueRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="bg-[#F7F7F5] text-[#050505]">
      {/* HERO — conservé */}
      <section className="relative overflow-hidden bg-[#050505] px-5 pb-14 pt-28 sm:px-8 sm:pt-32 lg:px-10">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(99,91,255,0.25),transparent_55%)]" />
        <div className="relative mx-auto max-w-5xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-edge-accent-light">Former</p>
          <h1 className="mt-4 max-w-4xl text-[clamp(2.1rem,4.5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-white">
            Formez vos équipes sur les compétences qui font la différence.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
            Des parcours concrets, animés par des spécialistes identifiés, pour développer les compétences clés de vos
            collaborateurs.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <EdgePremiumButton variant="white" shape="revolut" onClick={scrollToCatalogue}>
              Découvrir le catalogue
            </EdgePremiumButton>
            <EdgePremiumButton href={links.conseiller} variant="outline-white" shape="revolut">
              Parler à un conseiller
            </EdgePremiumButton>
          </div>
        </div>
      </section>

      {/* RECHERCHE */}
      <section className="border-b border-[#050505]/8 bg-white px-5 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-3xl">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#050505]/35" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une formation : Management, IA, Soft skills…"
              className="w-full rounded-2xl border border-[#050505]/10 bg-[#F7F7F5] py-4 pl-12 pr-4 text-base outline-none transition focus:border-edge-accent/40 focus:ring-2 focus:ring-edge-accent/10"
            />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {SEARCH_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSearchQuery(s)}
                className="rounded-full border border-[#050505]/10 px-3 py-1.5 text-xs font-medium text-[#050505]/55 hover:border-edge-accent/25 hover:text-edge-accent"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* CHIFFRES IMPACT */}
      <section className="px-5 py-14 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { value: EDGE_IMPACT_STATS.collaboratorsTrained, label: "collaborateurs formés", icon: Users },
            { value: EDGE_IMPACT_STATS.certifications, label: "certifications délivrées", icon: Award },
            { value: EDGE_IMPACT_STATS.satisfaction, label: "de satisfaction", icon: Sparkles },
            { value: EDGE_IMPACT_STATS.completionRate, label: "taux de complétion", icon: BookOpen },
          ].map(({ value, label, icon: Icon }) => (
            <div key={label} className="rounded-[24px] border border-[#050505]/8 bg-white p-6 text-center shadow-sm">
              <Icon className="mx-auto h-6 w-6 text-edge-accent" />
              <p className="mt-4 text-3xl font-semibold tracking-tight">{value}</p>
              <p className="mt-1 text-sm text-[#050505]/50">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SPÉCIALISTES */}
      <section className="border-t border-[#050505]/8 bg-white px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-edge-accent">Le réseau EDGE</p>
          <h2 className="mt-4 max-w-3xl text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            Des spécialistes qui accompagnent déjà les entreprises.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#050505]/55 sm:text-base">
            Formateurs experts, certifiés, évalués par les entreprises. Pas des généralistes — des praticiens reconnus
            sur leur domaine.
          </p>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {EDGE_SPECIALISTS.map((s) => (
              <SpecialistCard key={s.id} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* LOGOS */}
      <section className="border-t border-[#050505]/8 bg-[#F7F7F5] px-5 py-12 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#050505]/40">
            Ils nous font confiance
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {EDGE_TRUSTED_LOGOS.map((logo) => (
              <div
                key={logo.name}
                className="flex h-14 min-w-[120px] items-center justify-center rounded-2xl border border-[#050505]/8 bg-white px-5 shadow-sm"
              >
                <span className="text-sm font-bold tracking-wide text-[#050505]/70">{logo.initials}</span>
                <span className="sr-only">{logo.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TÉMOIGNAGES */}
      <section className="border-t border-[#050505]/8 bg-white px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">Ce qu&apos;en disent nos clients</h2>
          <div className="mt-10 grid gap-6 lg:grid-cols-3">
            {EDGE_TESTIMONIALS.map((t) => (
              <blockquote
                key={t.id}
                className="flex flex-col rounded-[24px] border border-[#050505]/8 bg-[#FAFAF8] p-7"
              >
                <Quote className="h-8 w-8 text-edge-accent/40" />
                <p className="mt-4 flex-1 text-sm leading-relaxed text-[#050505]/70">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-6 flex items-center gap-3">
                  <div className="relative h-11 w-11 overflow-hidden rounded-full">
                    <Image src={t.photoUrl} alt={t.author} fill className="object-cover" unoptimized />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.author}</p>
                    <p className="text-xs text-[#050505]/45">
                      {t.role} · {t.company}
                    </p>
                  </div>
                </div>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* MOSAÏQUE VIE */}
      <section className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:h-72">
        {EDGE_LIFESTYLE_IMAGES.map((img) => (
          <div key={img.url} className="relative min-h-[160px] lg:min-h-0">
            <Image src={img.url} alt={img.alt} fill className="object-cover" unoptimized />
          </div>
        ))}
      </section>

      {/* CATALOGUE */}
      <section ref={catalogueRef} id="catalogue" className="border-t border-[#050505]/8 px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-edge-accent">Catalogue</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            {EDGE_CATALOG_STATS.domains} domaines · {EDGE_CATALOG_STATS.modules} formations certifiantes
          </h2>

          {visibleModules.length > 0 ? (
            <div className="mt-10">
              <p className="text-sm text-[#050505]/50">{visibleModules.length} résultat(s) pour « {searchQuery} »</p>
              <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {visibleModules.map((mod) => (
                  <ModuleSearchCard key={mod.id} module={mod} />
                ))}
              </div>
            </div>
          ) : (
            <>
              <div className="mt-8 flex flex-wrap gap-2">
                <button
                  type="button"
                  className={cn(
                    "rounded-full px-4 py-2 text-sm font-medium transition",
                    domainFilter === "all" ? "bg-edge-accent text-white" : "border border-[#050505]/10 bg-white",
                  )}
                  onClick={() => setDomainFilter("all")}
                >
                  Tous
                </button>
                {EDGE_TRAINING_DOMAINS.map((d) => (
                  <button
                    key={d.id}
                    type="button"
                    className={cn(
                      "rounded-full px-4 py-2 text-sm font-medium transition",
                      domainFilter === d.id ? "bg-edge-accent text-white" : "border border-[#050505]/10 bg-white",
                    )}
                    onClick={() => setDomainFilter(d.id)}
                  >
                    {d.title}
                  </button>
                ))}
              </div>
              <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {visibleDomains.map((domain) => (
                  <DomainCard
                    key={domain.id}
                    domain={domain}
                    moduleCount={getModulesByDomain(domain.id).length}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </section>

      <section className="border-t border-[#050505]/8 bg-white px-5 py-16 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-4xl flex-col items-start gap-6 rounded-[28px] border border-edge-accent/15 bg-[linear-gradient(135deg,rgba(99,91,255,0.06),white)] p-8 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-[-0.03em]">Besoin d&apos;un parcours sur mesure ?</h2>
          <p className="max-w-2xl text-sm leading-relaxed text-[#050505]/60 sm:text-base">
            Nos conseillers co-construisent avec vous les parcours intra, inter-entreprises et blended adaptés à vos
            enjeux métiers.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row">
            <EdgePremiumButton href={links.demo} showArrow shape="revolut">
              Demander une démo
            </EdgePremiumButton>
            <EdgePremiumButton href={links.conseiller} variant="secondary-light" shape="revolut">
              Parler à un conseiller
            </EdgePremiumButton>
          </div>
        </div>
      </section>
    </div>
  );
}
