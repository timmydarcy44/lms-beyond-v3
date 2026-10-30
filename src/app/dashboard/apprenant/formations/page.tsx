import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";

import {
  APPRENANT_CARD_BODY,
  APPRENANT_PAGE_KICKER,
  APPRENANT_PAGE_LEAD,
  APPRENANT_PAGE_SHELL,
  APPRENANT_PAGE_TITLE,
} from "@/lib/apprenant/connect-nav";
import { isJadeDemoEmail } from "@/lib/demo/jade-account";
import { JADE_COURSES } from "@/lib/demo/jade-dashboard-mocks";
import { getSession } from "@/lib/auth/session";
import { getApprenantDashboardData } from "@/lib/queries/apprenant";

export const dynamic = "force-dynamic";

export default async function ApprenantMesFormationsPage() {
  const session = await getSession();
  if (!session) redirect("/login?next=/dashboard/apprenant/formations");

  const data = await getApprenantDashboardData();
  const realFormations = data?.formations ?? [];
  const jade = isJadeDemoEmail(session.email);
  const formations =
    realFormations.length > 0
      ? realFormations
      : jade
        ? JADE_COURSES.map((course, index) => ({
            id: `jade-course-${index}`,
            title: course.title,
            href: course.href,
            cover_url: course.cover,
            image: course.cover,
            cover_image: course.cover,
            progress: course.percent,
            meta: null,
            presentation: null,
          }))
        : [];

  return (
    <div className={APPRENANT_PAGE_SHELL}>
      <section className="mb-8 space-y-2">
        <p className={APPRENANT_PAGE_KICKER}>Formations</p>
        <h1 className={APPRENANT_PAGE_TITLE}>Mes formations</h1>
        <p className={APPRENANT_PAGE_LEAD}>
          Formations qui vous sont assignées par votre organisation.
        </p>
      </section>

      {formations.length === 0 ? (
        <div className={`${APPRENANT_CARD_BODY} items-center text-center`}>
          <BookOpen className="h-8 w-8 text-white/35" />
          <p className="mt-2 text-sm font-semibold text-white">Aucune formation assignée</p>
          <p className="mt-1 max-w-md text-sm text-white/45">
            Dès qu’une formation de votre organisation vous est assignée, elle apparaîtra ici.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {formations.map((f) => {
            const href =
              f.href?.startsWith("http") || f.href?.startsWith("/")
                ? f.href
                : `/dashboard/apprenant/formations/${"slug" in f ? f.slug || f.id : f.id}`;
            const cover = f.cover_url || f.cover_image || f.image || null;
            const percent = Math.max(0, Math.min(100, Math.round(Number(f.progress ?? 0)) || 0));
            return (
              <Link key={f.id} href={href} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] hover:border-sky-400/30">
                <div className="relative aspect-[16/10] bg-[#12141a]">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-white/30">
                      <BookOpen className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div className="space-y-3 p-4">
                  <h2 className="text-[15px] font-extrabold tracking-[-0.02em] text-white">{f.title}</h2>
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-white/70">
                      <span>Complétion</span>
                      <span>{percent} %</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full bg-[#6E5BFF]" style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
