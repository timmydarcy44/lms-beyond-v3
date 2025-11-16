import { Suspense } from "react";
import Link from "next/link";

function BeyondLinkContent({ searchParams }: { searchParams: { assessment?: string } }) {
  const assessmentId = searchParams.assessment;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-16 text-slate-100">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">Beyond Link</h1>
        <p className="text-sm text-slate-300">
          Preview en construction. Vous pourrez bientôt partager un lien direct vers le classement de vos soft skills.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-700/60 bg-slate-900/60 p-6 shadow-xl shadow-black/30">
        <p className="text-sm text-slate-300">
          {assessmentId
            ? `Résumé prévu pour l'analyse ${assessmentId}.`
            : "Pour l’instant, aucun diagnostic n’est associé à ce lien."}
        </p>
        <p className="mt-4 text-sm text-slate-400">
          Cette page affichera prochainement :
        </p>
        <ul className="mt-2 space-y-2 text-sm text-slate-300">
          <li>• Classement soft skills détaillé</li>
          <li>• Points forts & axes d’amélioration</li>
          <li>• Suggestions Beyond Care & partages externes</li>
        </ul>
      </div>

      <div className="text-center">
        <Link
          href="/dashboard/catalogue"
          className="inline-flex items-center gap-2 rounded-full border border-slate-700/60 bg-slate-900/60 px-5 py-2 text-sm font-semibold text-slate-100 transition hover:border-slate-600 hover:bg-slate-800"
        >
          Retour au catalogue
        </Link>
      </div>
    </div>
  );
}

export default function BeyondLinkPage({ searchParams }: { searchParams: { assessment?: string } }) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#020202] to-[#050505]">
      <Suspense fallback={<div className="px-6 py-16 text-center text-slate-200">Chargement…</div>}>
        <BeyondLinkContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}



