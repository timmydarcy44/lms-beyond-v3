"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PersonalizedActionPlanSection } from "@/components/learner/personalized-action-plan-section";
import { usePersonalizedActionPlanFromSnapshot } from "@/components/learner/learner-snapshot-provider";
import {
  SALARIE_CARD,
  SALARIE_PAGE_KICKER,
  SALARIE_PAGE_LEAD,
  SALARIE_PAGE_SHELL,
  SALARIE_PAGE_TITLE,
} from "@/lib/salarie/connect-nav";

export default function SalarieFormationsPageClient() {
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus");
  const { loading, plan, parcoursHref } = usePersonalizedActionPlanFromSnapshot("salarie");

  const formations =
    plan?.items.filter((i) => i.kind === "formation" || i.kind === "micro_formation") ?? [];
  const filtered = focus
    ? formations.filter(
        (f) =>
          f.title.toLowerCase().includes(focus.toLowerCase()) ||
          f.reason.toLowerCase().includes(focus.toLowerCase()),
      )
    : formations;

  return (
    <div className={SALARIE_PAGE_SHELL}>
      <section className="mb-8 space-y-2">
        <p className={SALARIE_PAGE_KICKER}>Formations</p>
        <h1 className={SALARIE_PAGE_TITLE}>Mes formations</h1>
        <p className={SALARIE_PAGE_LEAD}>
          Formations et micro-formations recommandées selon vos résultats DISC, IDMC et Soft Skills.
        </p>
      </section>

      <PersonalizedActionPlanSection
        loading={loading}
        plan={plan}
        parcoursHref={parcoursHref}
        className="mb-10"
      />

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-white">
          {focus ? `Formations — ${focus}` : "Catalogue recommandé"}
        </h2>
        {filtered.length === 0 ? (
          <div className={SALARIE_CARD}>
            <p className="text-sm text-white/60">
              Passez vos tests pour recevoir des formations ciblées, ou consultez le catalogue EDGE
              Online.
            </p>
            <Link
              href="/edgeonline"
              className="mt-4 inline-block text-sm font-semibold text-violet-300 hover:text-violet-200"
            >
              Explorer EDGE Online →
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {filtered.map((item) => (
              <li key={item.id}>
                <Link href={item.href} className={`block ${SALARIE_CARD} hover:bg-white/[0.05]`}>
                  <p className="font-semibold text-white">{item.title}</p>
                  <p className="mt-1 text-xs text-violet-200/70">{item.reason}</p>
                  <p className="mt-2 text-sm text-white/55">{item.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
