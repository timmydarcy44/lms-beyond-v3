import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, ExternalLink } from "lucide-react";

import {
  APPRENANT_CARD_BODY,
  APPRENANT_PAGE_KICKER,
  APPRENANT_PAGE_LEAD,
  APPRENANT_PAGE_SHELL,
  APPRENANT_PAGE_TITLE,
} from "@/lib/apprenant/connect-nav";
import { getSession } from "@/lib/auth/session";
import { EDGE_ONLINE_APP_SURFACE_PATH } from "@/lib/galaxy-branding";
import { getApprenantDashboardData } from "@/lib/queries/apprenant";

export const dynamic = "force-dynamic";

export default async function ApprenantMesFormationsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard/apprenant/formations");

  const data = await getApprenantDashboardData();
  const formations = data?.formations ?? [];

  return (
    <div className={APPRENANT_PAGE_SHELL}>
      <section className="mb-8 space-y-2">
        <p className={APPRENANT_PAGE_KICKER}>Formations</p>
        <h1 className={APPRENANT_PAGE_TITLE}>Mes formations</h1>
        <p className={APPRENANT_PAGE_LEAD}>
          Formations qui vous sont assignées par votre organisation, plus l’accès au catalogue EDGE
          Online.
        </p>
      </section>

      {formations.length === 0 ? (
        <div className={`${APPRENANT_CARD_BODY} items-center text-center`}>
          <BookOpen className="h-8 w-8 text-white/35" />
          <p className="mt-2 text-sm font-semibold text-white">Aucune formation assignée</p>
          <p className="mt-1 max-w-md text-sm text-white/45">
            Dès qu’une formation de votre organisation vous est assignée, elle apparaîtra ici.
          </p>
          <Link
            href={EDGE_ONLINE_APP_SURFACE_PATH}
            className="mt-4 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
          >
            Catalogue EDGE Online
            <ExternalLink className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {formations.map((f) => {
            const href =
              f.href?.startsWith("http") || f.href?.startsWith("/")
                ? f.href
                : `${EDGE_ONLINE_APP_SURFACE_PATH}/formations/${f.slug || f.id}`;
            return (
              <Link key={f.id} href={href} className={`${APPRENANT_CARD_BODY} hover:border-sky-400/30`}>
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#60a5fa]">
                  Formation
                </p>
                <h2 className="text-[15px] font-extrabold tracking-[-0.02em] text-white">{f.title}</h2>
                {f.meta || f.presentation ? (
                  <p className="line-clamp-3 text-[13px] text-white/40">{f.meta || f.presentation}</p>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
