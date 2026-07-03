"use client";

import { useMemo, useRef, useState } from "react";
import { Award, BookOpen, ChevronDown, Layers, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";
import { EdgePremiumButton } from "@/components/edge-site/premium/edge-premium-button";
import {
  EDGE_CATALOG_STATS,
  EDGE_TRAINING_DOMAINS,
  formatTrainingFormats,
  getBadgeById,
  getLevelLabel,
  getModulesByDomain,
  type TrainingDomain,
  type TrainingModule,
} from "@/lib/edge-site/training-catalog";

const FORMAT_OPTIONS = [
  { id: "all", label: "Tous les formats" },
  { id: "presentiel", label: "Présentiel" },
  { id: "distanciel", label: "Distanciel" },
  { id: "blended", label: "Blended" },
] as const;

function DomainCard({
  domain,
  moduleCount,
  onSelect,
}: {
  domain: TrainingDomain;
  moduleCount: number;
  onSelect: (id: string) => void;
}) {
  const badge = getBadgeById(domain.badgeId);

  return (
    <article className="group flex h-full flex-col rounded-[24px] border border-[#050505]/8 bg-white p-7 shadow-sm transition hover:border-edge-accent/30 hover:shadow-[0_12px_40px_rgba(99,91,255,0.08)] sm:p-8">
      <div className="flex items-start justify-between gap-4">
        <span className="inline-flex rounded-full border border-edge-accent/25 bg-edge-accent/8 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-edge-accent">
          {domain.themeLabel}
        </span>
        <span className="shrink-0 text-sm font-medium text-[#050505]/40">{moduleCount} modules</span>
      </div>
      <h3 className="mt-6 text-xl font-semibold tracking-[-0.02em] text-[#050505]">{domain.title}</h3>
      <p className="mt-3 flex-1 text-sm leading-relaxed text-[#050505]/60">{domain.summary}</p>
      {badge ? (
        <p className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-[#050505]/45">
          <Award className="h-3.5 w-3.5 text-edge-accent" aria-hidden />
          Badge : {badge.name}
        </p>
      ) : null}
      <button
        type="button"
        className="mt-7 inline-flex w-full items-center justify-center rounded-2xl border border-[#050505]/10 bg-[#F7F7F5] px-5 py-3 text-sm font-medium text-[#050505] transition-colors hover:border-edge-accent/30 hover:bg-edge-accent/8 hover:text-edge-accent"
        onClick={() => onSelect(domain.id)}
      >
        Voir les formations
      </button>
    </article>
  );
}

function ModuleCard({ module }: { module: TrainingModule }) {
  const [open, setOpen] = useState(false);
  const badge = getBadgeById(module.badgeId);

  return (
    <article className="overflow-hidden rounded-[20px] border border-[#050505]/8 bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 px-6 py-5 text-left sm:px-7 sm:py-6"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-edge-accent/10 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-edge-accent">
              {module.code}
            </span>
            <span className="rounded-full border border-[#050505]/10 px-2.5 py-0.5 text-[11px] font-medium text-[#050505]/55">
              Niveau {module.level} · {getLevelLabel(module.level)}
            </span>
          </div>
          <h4 className="mt-3 text-base font-semibold text-[#050505] sm:text-lg">{module.title}</h4>
          <p className="mt-2 text-sm text-[#050505]/50">{formatTrainingFormats(module.formats)}</p>
        </div>
        <ChevronDown
          className={cn("mt-1 h-5 w-5 shrink-0 text-[#050505]/35 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </button>
      {open ? (
        <div className="border-t border-[#050505]/6 px-6 pb-6 pt-4 sm:px-7 sm:pb-7">
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#050505]/40">
                Objectifs pédagogiques
              </p>
              <ul className="mt-3 space-y-2">
                {module.objectives.map((obj) => (
                  <li key={obj} className="flex gap-2 text-sm leading-relaxed text-[#050505]/70">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-edge-accent" aria-hidden />
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#050505]/40">
                Livrables attendus
              </p>
              <ul className="mt-3 space-y-2">
                {module.deliverables.map((item) => (
                  <li key={item} className="flex gap-2 text-sm leading-relaxed text-[#050505]/70">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-[#050505]/30" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {badge ? (
            <p className="mt-5 inline-flex items-center gap-2 rounded-xl border border-edge-accent/20 bg-edge-accent/8 px-3 py-2 text-xs font-medium text-edge-accent">
              <Award className="h-3.5 w-3.5" aria-hidden />
              Open Badge : {badge.name}
            </p>
          ) : null}
        </div>
      ) : null}
    </article>
  );
}

export function EdgeBusinessFormerEquipesPage() {
  const { links } = useEdgePremiumConfig();
  const modulesRef = useRef<HTMLElement>(null);
  const [activeDomainId, setActiveDomainId] = useState<string | null>(null);
  const [domainFilter, setDomainFilter] = useState<string>("all");
  const [formatFilter, setFormatFilter] = useState<(typeof FORMAT_OPTIONS)[number]["id"]>("all");

  const moduleCountByDomain = useMemo(() => {
    const map = new Map<string, number>();
    for (const domain of EDGE_TRAINING_DOMAINS) {
      map.set(domain.id, getModulesByDomain(domain.id).length);
    }
    return map;
  }, []);

  const visibleDomains = useMemo(() => {
    if (domainFilter === "all") return EDGE_TRAINING_DOMAINS;
    return EDGE_TRAINING_DOMAINS.filter((d) => d.id === domainFilter);
  }, [domainFilter]);

  const activeModules = useMemo(() => {
    if (!activeDomainId) return [];
    let modules = getModulesByDomain(activeDomainId);
    if (formatFilter !== "all") {
      modules = modules.filter((m) => m.formats.includes(formatFilter));
    }
    return modules;
  }, [activeDomainId, formatFilter]);

  const activeDomain = activeDomainId ? EDGE_TRAINING_DOMAINS.find((d) => d.id === activeDomainId) : null;

  const scrollToCatalogue = () => {
    document.getElementById("catalogue")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const selectDomain = (id: string) => {
    setActiveDomainId(id);
    setDomainFilter(id);
    requestAnimationFrame(() => {
      modulesRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="bg-[#F7F7F5] text-[#050505]">
      <section className="relative overflow-hidden bg-[#050505] px-5 pb-14 pt-28 sm:px-8 sm:pt-32 lg:px-10">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_0%,rgba(99,91,255,0.25),transparent_55%)]"
          aria-hidden
        />
        <div className="relative mx-auto max-w-5xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-edge-accent-light">Former</p>
          <h1 className="mt-4 max-w-4xl text-[clamp(2.1rem,4.5vw,3.5rem)] font-semibold leading-[1.08] tracking-[-0.035em] text-white">
            Formez vos équipes sur les compétences qui font la différence.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
            Des parcours concrets, animés par des spécialistes, pour développer les compétences clés de vos
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

      <section className="border-b border-[#050505]/8 bg-white px-5 py-10 sm:px-8 lg:px-10">
        <div className="mx-auto grid max-w-6xl gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Layers, value: EDGE_CATALOG_STATS.domains, label: "thématiques métiers" },
            { icon: BookOpen, value: EDGE_CATALOG_STATS.modules, label: "modules de formation" },
            { icon: Sparkles, value: EDGE_CATALOG_STATS.parcours, label: "parcours métiers" },
            { icon: Award, value: EDGE_CATALOG_STATS.levels, label: "niveaux de progression" },
          ].map(({ icon: Icon, value, label }) => (
            <div key={label} className="rounded-[20px] border border-[#050505]/8 bg-[#F7F7F5] px-6 py-5">
              <Icon className="h-5 w-5 text-edge-accent" aria-hidden />
              <p className="mt-4 text-3xl font-semibold tracking-[-0.03em]">{value}</p>
              <p className="mt-1 text-sm text-[#050505]/50">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-edge-accent">Formats & déploiement</p>
          <h2 className="mt-4 max-w-3xl text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            Intra, inter-entreprises, sur mesure — présentiel, distanciel ou blended.
          </h2>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-[#050505]/60">
            Choisissez le format adapté à vos enjeux. Chaque module est certifiable avec Open Badges et une progression
            structurée du niveau 1 au niveau 5.
          </p>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {[
              { title: "Intra & inter", text: "Déployez en interne ou rejoignez des sessions mutualisées." },
              { title: "Sur mesure", text: "Co-construisez des parcours alignés sur vos métiers." },
              { title: "Multi-format", text: "Présentiel, distanciel et blended pour une montée fluide." },
            ].map((item) => (
              <div key={item.title} className="rounded-[20px] border border-[#050505]/8 bg-white p-6 shadow-sm">
                <h3 className="text-base font-semibold">{item.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#050505]/55">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="catalogue" className="border-t border-[#050505]/8 bg-white px-5 py-16 sm:px-8 lg:px-10 lg:py-24">
        <div className="mx-auto max-w-6xl">
          <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-edge-accent">Catalogue</p>
          <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            12 domaines, {EDGE_CATALOG_STATS.modules} modules, certifications Open Badge.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#050505]/55 sm:text-base">
            Filtrez par domaine et explorez les modules avec leurs objectifs, livrables et formats disponibles.
          </p>

          <div className="mt-10 flex flex-wrap gap-2">
            <button
              type="button"
              className={cn(
                "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                domainFilter === "all"
                  ? "bg-edge-accent text-white"
                  : "border border-[#050505]/10 bg-[#F7F7F5] text-[#050505]/65 hover:border-edge-accent/25",
              )}
              onClick={() => {
                setDomainFilter("all");
                setActiveDomainId(null);
              }}
            >
              Tous les domaines
            </button>
            {EDGE_TRAINING_DOMAINS.map((domain) => (
              <button
                key={domain.id}
                type="button"
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  domainFilter === domain.id
                    ? "bg-edge-accent text-white"
                    : "border border-[#050505]/10 bg-[#F7F7F5] text-[#050505]/65 hover:border-edge-accent/25",
                )}
                onClick={() => selectDomain(domain.id)}
              >
                {domain.title}
              </button>
            ))}
          </div>

          <div className="mt-10 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {visibleDomains.map((domain) => (
              <DomainCard
                key={domain.id}
                domain={domain}
                moduleCount={moduleCountByDomain.get(domain.id) ?? 0}
                onSelect={selectDomain}
              />
            ))}
          </div>
        </div>
      </section>

      {activeDomain && activeModules.length > 0 ? (
        <section ref={modulesRef} className="border-t border-[#050505]/8 bg-[#F7F7F5] px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
          <div className="mx-auto max-w-4xl">
            <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-edge-accent">Modules</p>
            <h2 className="mt-4 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">{activeDomain.title}</h2>
            <p className="mt-3 text-sm text-[#050505]/55">{activeDomain.summary}</p>

            <div className="mt-8 flex flex-wrap gap-2">
              {FORMAT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  className={cn(
                    "rounded-full px-3.5 py-1.5 text-xs font-medium transition-colors",
                    formatFilter === opt.id
                      ? "bg-edge-accent text-white"
                      : "border border-[#050505]/10 bg-white text-[#050505]/55 hover:border-edge-accent/25",
                  )}
                  onClick={() => setFormatFilter(opt.id)}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            <div className="mt-8 space-y-4">
              {activeModules.map((module) => (
                <ModuleCard key={module.id} module={module} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <section className="border-t border-[#050505]/8 bg-white px-5 py-16 sm:px-8 lg:px-10 lg:py-20">
        <div className="mx-auto flex max-w-4xl flex-col items-start gap-6 rounded-[28px] border border-edge-accent/15 bg-[linear-gradient(135deg,rgba(99,91,255,0.06),white)] p-8 sm:p-10">
          <h2 className="text-2xl font-semibold tracking-[-0.03em] sm:text-3xl">
            Prêt à structurer votre plan de formation ?
          </h2>
          <p className="max-w-2xl text-sm leading-relaxed text-[#050505]/60 sm:text-base">
            Nos conseillers vous aident à sélectionner les domaines, formats et parcours adaptés à vos équipes.
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
