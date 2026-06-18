"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { usePersonalizedActionPlanFromSnapshot } from "@/components/learner/learner-snapshot-provider";
import { SALARIE_PRACTITIONERS_LIST } from "@/lib/learner/personalized-action-plan";
import {
  SALARIE_CARD,
  SALARIE_PAGE_KICKER,
  SALARIE_PAGE_LEAD,
  SALARIE_PAGE_SHELL,
  SALARIE_PAGE_TITLE,
} from "@/lib/salarie/connect-nav";

export default function SalarieCoachingsPageClient() {
  const searchParams = useSearchParams();
  const focus = searchParams.get("focus");
  const { loading, plan } = usePersonalizedActionPlanFromSnapshot("salarie");

  const recommended = plan?.coachings ?? [];

  return (
    <div className={SALARIE_PAGE_SHELL}>
      <section className="mb-8 space-y-2">
        <p className={SALARIE_PAGE_KICKER}>Accompagnement</p>
        <h1 className={SALARIE_PAGE_TITLE}>Mes coachings</h1>
        <p className={SALARIE_PAGE_LEAD}>
          Praticiens certifiés EDGE, recommandés en fonction de vos tests et de vos besoins
          identifiés.
        </p>
      </section>

      {loading ? (
        <p className="text-sm text-white/50">Chargement des recommandations…</p>
      ) : recommended.length > 0 ? (
        <section className="mb-10 space-y-4">
          <h2 className="text-lg font-semibold text-white">Recommandés pour vous</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {recommended.map((coach) => (
              <div key={coach.id} className={SALARIE_CARD}>
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
        <h2 className="text-lg font-semibold text-white">Nos praticiens</h2>
        <div className="grid gap-4 lg:grid-cols-3">
          {SALARIE_PRACTITIONERS_LIST.filter((p) =>
            focus
              ? p.specialites.some((s) => s.toLowerCase().includes(focus.toLowerCase())) ||
                p.name.toLowerCase().includes(focus.toLowerCase())
              : true,
          ).map((praticien) => (
            <article key={praticien.id} className={SALARIE_CARD}>
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/30 to-indigo-500/20 text-lg font-bold text-white">
                {praticien.name.charAt(0)}
              </div>
              <p className="mt-4 text-lg font-bold text-white">{praticien.name}</p>
              <p className="text-sm text-white/55">{praticien.title}</p>
              <p className="mt-2 text-sm text-white/45">{praticien.bio}</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {praticien.specialites.map((s) => (
                  <span
                    key={s}
                    className="rounded-full border border-white/10 px-2 py-0.5 text-[11px] text-white/60"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </div>
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
