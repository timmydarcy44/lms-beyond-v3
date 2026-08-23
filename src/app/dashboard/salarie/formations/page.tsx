import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";

import {
  SALARIE_CARD,
  SALARIE_PAGE_KICKER,
  SALARIE_PAGE_LEAD,
  SALARIE_PAGE_SHELL,
  SALARIE_PAGE_TITLE,
} from "@/lib/salarie/connect-nav";
import {
  edgebsDemoAssignedFormationsFallback,
  listSalarieAssignedFormations,
} from "@/lib/salarie/assigned-formations";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function SalarieFormationsPage() {
  const session = await getSession();
  if (!session?.id) {
    redirect("/login?next=/dashboard/salarie/formations");
  }

  const email = session.email ?? null;
  let formations = await listSalarieAssignedFormations(session.id);
  if (formations.length === 0) {
    formations = edgebsDemoAssignedFormationsFallback(email);
  }

  return (
    <div className={SALARIE_PAGE_SHELL}>
      <section className="mb-8 space-y-2">
        <p className={SALARIE_PAGE_KICKER}>Formations</p>
        <h1 className={SALARIE_PAGE_TITLE}>Mes formations</h1>
        <p className={SALARIE_PAGE_LEAD}>
          Formations qui vous sont assignées par votre entreprise.
        </p>
      </section>

      {formations.length === 0 ? (
        <div className={`${SALARIE_CARD} flex flex-col items-center text-center`}>
          <BookOpen className="h-8 w-8 text-white/35" />
          <p className="mt-2 text-sm font-semibold text-white">Aucune formation assignée</p>
          <p className="mt-1 max-w-md text-sm text-white/45">
            Dès qu’une formation vous est assignée par votre RH, elle apparaîtra ici.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {formations.map((f) => (
            <Link key={f.id} href={f.href} className={`${SALARIE_CARD} hover:bg-white/[0.05]`}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-violet-300/80">
                Formation
              </p>
              <h2 className="mt-1 text-[15px] font-extrabold tracking-[-0.02em] text-white">
                {f.title}
              </h2>
              {f.meta || f.presentation ? (
                <p className="mt-2 line-clamp-3 text-[13px] text-white/45">
                  {f.meta || f.presentation}
                </p>
              ) : null}
              {f.progress > 0 ? (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[11px] text-white/45">
                    <span>Progression</span>
                    <span className="font-semibold text-white/70">{f.progress}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{ width: `${Math.min(100, f.progress)}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
