import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { HANDICAP_FORMATIONS_CATALOG } from "@/components/handicap/handicap-formations-catalog";

export const dynamic = "force-dynamic";

export default function HandicapFormationsPage() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] px-4 py-8 text-[#1E293B] md:px-8">
      <div className="mx-auto w-full max-w-[1100px] space-y-8">
        <header>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#D65151]">Espace Handicap</p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-900 md:text-3xl">Formations dédiées</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Parcours et certifications pour référents handicap, coordinateurs et équipes pédagogiques. Sélectionnez une
            formation pour consulter le programme et les modalités.
          </p>
        </header>

        <ul className="grid gap-6 sm:grid-cols-2">
          {HANDICAP_FORMATIONS_CATALOG.map((f) => {
            const isSoon = f.badge === "Bientôt";
            const article = (
              <article
                className={`flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition ${
                  isSoon ? "opacity-80" : "group-hover:border-[#D65151]/40 group-hover:shadow-md"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FCECEC] text-[#D65151]">
                    <GraduationCap className="h-5 w-5" aria-hidden />
                  </div>
                  {f.badge ? (
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                        isSoon ? "bg-slate-100 text-slate-500" : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {f.badge}
                    </span>
                  ) : null}
                </div>
                <h2 className="mt-4 text-lg font-semibold text-slate-900">{f.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-600">{f.subtitle}</p>
                <p className="mt-4 text-xs font-medium text-slate-500">{f.durationLabel}</p>
                {!isSoon ? (
                  <p className="mt-3 text-sm font-semibold text-[#D65151] group-hover:underline">Voir la présentation →</p>
                ) : (
                  <p className="mt-3 text-sm text-slate-400">Ouverture prochaine</p>
                )}
              </article>
            );

            return (
              <li key={f.slug}>
                {isSoon ? (
                  <div className="block">{article}</div>
                ) : (
                  <Link href={`/dashboard/ecole/handicap/formations/${f.slug}`} className="group block">
                    {article}
                  </Link>
                )}
              </li>
            );
          })}
        </ul>

        <p className="text-center text-sm text-slate-500">
          <Link href="/dashboard/ecole/handicap" className="font-medium text-[#D65151] hover:underline">
            Retour à la galerie handicap
          </Link>
        </p>
      </div>
    </div>
  );
}
