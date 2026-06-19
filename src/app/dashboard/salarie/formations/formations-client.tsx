"use client";

import Link from "next/link";
import { useEffect, useMemo } from "react";
import { ExternalLink } from "lucide-react";
import {
  hasLearnerTestData,
  LearnerTestsUnlockSection,
} from "@/components/learner/learner-tests-unlock-section";
import { usePersonalizedActionPlanFromSnapshot } from "@/components/learner/learner-snapshot-provider";
import {
  formationsFromActionPlan,
  getFeaturedCatalogFormations,
  matchParcoursForKeywords,
} from "@/lib/learner/edge-catalog-preview";
import {
  SALARIE_CARD,
  SALARIE_PAGE_KICKER,
  SALARIE_PAGE_LEAD,
  SALARIE_PAGE_SHELL,
  SALARIE_PAGE_TITLE,
} from "@/lib/salarie/connect-nav";

function FormationCard({
  title,
  description,
  famille,
  duree,
  href,
  badge,
  locked,
}: {
  title: string;
  description: string;
  famille: string;
  duree: string;
  href: string;
  badge?: string;
  locked?: boolean;
}) {
  return (
    <Link href={href} className={`block ${SALARIE_CARD} hover:bg-white/[0.05]`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="font-semibold text-white">{title}</p>
        {locked ? (
          <span className="shrink-0 rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-amber-200">
            Recommandé après vos tests
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-white/45">
        {famille} · {duree}
      </p>
      <p className="mt-2 text-sm text-white/55">{description}</p>
      {badge ? <p className="mt-2 text-xs text-violet-200/60">{badge}</p> : null}
    </Link>
  );
}

export default function SalarieFormationsPageClient() {
  const { loading, plan, snapshot, refresh } = usePersonalizedActionPlanFromSnapshot("salarie");
  const hasTests = hasLearnerTestData(snapshot);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const recommended = useMemo(() => {
    if (!plan) return [];
    const fromItems = formationsFromActionPlan(plan.items);
    const fromNeeds = matchParcoursForKeywords(plan.needs);
    return [...fromItems, ...fromNeeds]
      .filter((f, i, arr) => arr.findIndex((x) => x.slug === f.slug) === i)
      .slice(0, 6);
  }, [plan]);

  const preview = useMemo(() => getFeaturedCatalogFormations(4), []);

  return (
    <div className={SALARIE_PAGE_SHELL}>
      <section className="mb-8 space-y-2">
        <p className={SALARIE_PAGE_KICKER}>Formations</p>
        <h1 className={SALARIE_PAGE_TITLE}>Mes formations</h1>
        <p className={SALARIE_PAGE_LEAD}>
          Formations EDGE Online recommandées selon vos diagnostics — ou aperçu du catalogue en
          attendant vos résultats.
        </p>
      </section>

      {loading ? (
        <p className="text-sm text-white/50">Chargement…</p>
      ) : hasTests ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white">Recommandées pour vous</h2>
          {plan ? (
            <p className="text-sm text-white/55">{plan.headline}</p>
          ) : (
            <p className="text-sm text-white/55">
              Vos diagnostics sont enregistrés — sélection des formations en cours.
            </p>
          )}
          {recommended.length > 0 ? (
            <ul className="grid gap-4 lg:grid-cols-2">
              {recommended.map((f) => (
                <li key={f.slug}>
                  <FormationCard
                    title={f.title}
                    description={f.description}
                    famille={f.famille}
                    duree={f.duree}
                    href={f.href}
                    badge={f.badge}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-white/50">
              Aucune formation catalogue identifiée pour le moment — explorez EDGE Online ci-dessous.
            </p>
          )}
        </section>
      ) : (
        <>
          <LearnerTestsUnlockSection
            title="Passez vos tests pour des recommandations ciblées"
            lead="En attendant, découvrez un aperçu du catalogue EDGE Online — les formations ci-dessous seront personnalisées après vos diagnostics."
          />
          <section className="mt-10 space-y-4">
            <h2 className="text-lg font-semibold text-white">Aperçu EDGE Online</h2>
            <ul className="grid gap-4 lg:grid-cols-2">
              {preview.map((f) => (
                <li key={f.slug}>
                  <FormationCard
                    title={f.title}
                    description={f.description}
                    famille={f.famille}
                    duree={f.duree}
                    href={f.href}
                    badge={f.badge}
                    locked
                  />
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      <div className="mt-10 rounded-2xl border border-violet-400/25 bg-violet-500/10 p-6 text-center">
        <p className="text-sm font-semibold text-white">Explorez tout le catalogue EDGE Online</p>
        <p className="mt-1 text-xs text-white/50">
          Parcours certifiants, micro-formations et badges Open Badge IMS Global.
        </p>
        <Link
          href="/edgeonline"
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-6 py-2.5 text-sm font-semibold text-gray-950 hover:bg-white/90"
        >
          Explorer EDGE Online
          <ExternalLink className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
