import Link from "next/link";
import { GraduationCap, MonitorPlay, Plus } from "lucide-react";

export default function EcoleFormationsOverviewPage() {
  return (
    <div className="mx-auto max-w-[1100px] space-y-8 px-4 py-8 sm:px-6">
      <header className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Formations</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">Vue d&apos;ensemble</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            Deux univers distincts : les cursus présentiels / hybrides, et le catalogue digital EDGE Online.
          </p>
        </div>
        <Link
          href="/dashboard/ecole/formations/cursus?action=create"
          className="inline-flex items-center gap-2 rounded-xl bg-[#3D7BFF] px-4 py-2 text-sm font-semibold text-white"
        >
          <Plus className="h-4 w-4" />
          Créer un cursus
        </Link>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <Link
          href="/dashboard/ecole/formations/cursus"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#3D7BFF]/30"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#3D7BFF]/10 text-[#3D7BFF]">
            <GraduationCap className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-slate-900">Cursus</h2>
          <p className="mt-2 text-sm text-slate-500">
            Programmes présentiels / hybrides (ex. NTC 2027-2028), modules, volumes horaires et lien planning.
          </p>
        </Link>
        <Link
          href="/dashboard/ecole/formations/online"
          className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:border-[#3D7BFF]/30"
        >
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-violet-600">
            <MonitorPlay className="h-5 w-5" />
          </span>
          <h2 className="mt-4 text-lg font-bold text-slate-900">EDGE Online</h2>
          <p className="mt-2 text-sm text-slate-500">
            Formations numériques consommables en ligne — e-learning, vidéos, parcours autonomes.
          </p>
        </Link>
      </div>
    </div>
  );
}
