import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Play } from "lucide-react";

import { getSession } from "@/lib/auth/session";
import { getEdgeOnlineCourseDetailBySlug } from "@/lib/queries/edge-online-course-detail";
import { listSalarieAssignedFormations } from "@/lib/salarie/assigned-formations";
import { SALARIE_PAGE_SHELL } from "@/lib/salarie/connect-nav";

export const dynamic = "force-dynamic";

export default async function SalarieFormationPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const key = decodeURIComponent(String(slug ?? "")).trim();
  const session = await getSession();
  if (!session?.id) {
    redirect(`/login?next=${encodeURIComponent(`/dashboard/salarie/formations/${key}`)}`);
  }

  const assigned = await listSalarieAssignedFormations(session.id, session.email);
  const row = assigned.find((item) => item.slug === key || item.id === key);
  if (!row) notFound();

  const data = await getEdgeOnlineCourseDetailBySlug(row.slug || key);
  if (!data) notFound();

  const modules = (data.detail.modules ?? []).filter((module) => (module.lessons?.length ?? 0) > 0);
  const lessons = modules.flatMap((module) => module.lessons ?? []);
  const base = `/dashboard/salarie/formations/${encodeURIComponent(data.card.slug || key)}`;
  const first = lessons[0];
  const playHref = first ? `${base}/play/${encodeURIComponent(first.id)}` : null;
  const presentation = (row.presentation || data.detail.description || "").trim();
  const sequenceLabel = lessons.length > 1 ? `${lessons.length} séquences` : lessons.length === 1 ? "1 séquence" : "Aucune séquence";

  return (
    <div className={`${SALARIE_PAGE_SHELL} text-white`}>
      <Link href="/dashboard/salarie/formations" className="text-sm font-semibold text-white/45">
        Mes formations
      </Link>

      <article className="mt-5 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04]">
        <div className="aspect-[16/7] bg-[#12141a]">
          {row.coverImage ? <img src={row.coverImage} alt="" className="h-full w-full object-cover" /> : null}
        </div>
        <div className="px-6 py-7 sm:px-8">
          <p className="text-[13px] text-white/45">{sequenceLabel}</p>
          <h1 className="mt-2 text-[clamp(1.8rem,3vw,2.6rem)] font-extrabold tracking-[-0.03em]">{data.detail.title}</h1>
          {presentation ? <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-white/60">{presentation}</p> : null}
          {playHref ? (
            <Link
              href={playHref}
              className="mt-6 inline-flex h-11 items-center gap-2 rounded-[10px] bg-[#3D7BFF] px-5 text-[13px] font-bold text-white"
            >
              <Play className="h-4 w-4" fill="currentColor" />
              Lancer la séquence
            </Link>
          ) : (
            <p className="mt-6 text-sm text-white/45">Cette formation n&apos;a pas encore de séquence.</p>
          )}
        </div>
      </article>

      {modules.length > 0 ? (
        <section className="mt-6 rounded-3xl border border-white/10 bg-[#17171F] px-6 py-6 sm:px-8">
          <h2 className="text-[15px] font-extrabold tracking-[-0.02em]">Contenu</h2>
          <div className="mt-4 space-y-6">
            {modules.map((module) => (
              <div key={module.id}>
                <p className="text-sm font-semibold text-white/45">{module.title}</p>
                <ol className="mt-2">
                  {(module.lessons ?? []).map((lesson, index) => (
                    <li key={lesson.id} className="border-t border-white/[0.06] first:border-t-0">
                      <Link href={`${base}/play/${encodeURIComponent(lesson.id)}`} className="flex items-center gap-3 py-3">
                        <span className="w-6 text-sm text-white/35">{index + 1}</span>
                        <span className="text-sm font-semibold">{lesson.title}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
