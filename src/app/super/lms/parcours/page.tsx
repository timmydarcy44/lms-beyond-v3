import Link from "next/link";

import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type PathRow = {
  id: string;
  title?: string | null;
  status?: string | null;
  path_snapshot?: { title?: string; publisher?: string; status?: string } | null;
};

const PATH_SELECTS = [
  "id, title, status, path_snapshot",
  "id, title, path_snapshot",
  "id, path_snapshot",
];

export default async function SuperLmsParcoursPage() {
  const db = await getServiceRoleClientOrFallback();
  let paths: PathRow[] = [];
  if (db) {
    for (const select of PATH_SELECTS) {
      const { data, error } = await db.from("paths").select(select).limit(200);
      if (error) {
        const code = String((error as { code?: string }).code ?? "");
        if (code === "42703" || code === "PGRST204") continue;
        break;
      }
      paths = ((data ?? []) as PathRow[]).filter((path) => path.path_snapshot?.publisher === "byound");
      break;
    }
  }

  return (
    <div className="super-lms-light min-h-[calc(100vh-5rem)] bg-[#F5F5F7] text-slate-900">
      <div className="mx-auto max-w-5xl space-y-8 px-6 py-10">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">LMS Byound</p>
            <h1 className="mt-1 text-3xl font-bold tracking-tight">Parcours</h1>
            <p className="mt-2 max-w-xl text-sm text-slate-500">
              Assemblez les formations, les tests et les ressources dans un parcours, comme dans l’espace formateur.
            </p>
          </div>
          <Link href="/super/lms/parcours/new" className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white">
            Créer un parcours
          </Link>
        </header>

        {paths.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
            <p className="text-lg font-semibold">Aucun parcours Byound</p>
            <p className="mt-2 text-sm text-slate-500">Créez un parcours et placez-y les formations.</p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {paths.map((path) => (
              <li key={path.id}>
                <Link
                  href={`/super/lms/parcours/${path.id}/edit`}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-5 py-4 hover:border-slate-300"
                >
                  <span className="font-semibold">{path.path_snapshot?.title || path.title || "Sans titre"}</span>
                  <span className="text-xs font-medium uppercase tracking-[0.14em] text-slate-400">
                    {(path.status || path.path_snapshot?.status) === "published" ? "Publié" : "Brouillon"}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
