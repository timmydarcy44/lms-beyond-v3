import Link from "next/link";
import Image from "next/image";
import { getApprenantDashboardData } from "@/lib/queries/apprenant";
import { EDGE_MARKETING_HREFS } from "@/lib/edge-lab-marketing";
import { edgeOnlinePublicHref } from "@/lib/edge-online-public-path";
import { getEdgeOnlineHrefPrefixServer } from "@/lib/edge-online-public-path.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EdgeOnlineHomePage() {
  const prefix = await getEdgeOnlineHrefPrefixServer();
  const eo = (path: string) => edgeOnlinePublicHref(path, prefix);

  const data = await getApprenantDashboardData("edgelab");
  const parcours = (data.parcours ?? []).slice(0, 6);

  return (
    <div className="pb-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/70 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_55%_at_15%_0%,rgba(59,130,246,0.12),transparent_55%),radial-gradient(ellipse_60%_50%_at_100%_30%,rgba(190,244,100,0.07),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/30" />
        <div className="relative grid gap-10 px-6 py-12 sm:px-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div className="max-w-xl">
            <div className="inline-flex rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55">
              EDGE ONLINE
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
              Développez vos compétences, à votre rythme.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/55 sm:text-lg">
              Parcours immersifs et micro-formations courtes directement issues de notre studio. Explorez par thématique ou laissez-vous guider.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={eo("/parcours")}
                className="inline-flex h-11 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-500"
              >
                Explorer les parcours
              </Link>
              <Link
                href={EDGE_MARKETING_HREFS.quiz}
                className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] px-6 text-sm font-semibold text-white transition hover:bg-white/[0.12]"
              >
                Faire le test d’orientation
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5">
            <p className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/40">Tendance</p>
            <p className="mt-3 text-lg font-semibold tracking-tight text-white">IA &amp; Automatisation</p>
            <p className="mt-2 text-sm leading-relaxed text-white/45">
              Le programme le plus demandé — pour gagner du temps, produire mieux, et structurer vos workflows.
            </p>
            <Link
              href={eo("/parcours")}
              className="mt-4 inline-flex text-sm font-semibold text-white/80 transition hover:text-white"
            >
              Découvrir les programmes →
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4 px-1">
          <h2 className="text-xl font-semibold tracking-tight text-white">Parcours recommandés</h2>
          <Link href={eo("/parcours")} className="text-sm font-semibold text-white/70 transition hover:text-white">
            Voir tout →
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {parcours.map((p: any) => (
            <Link
              key={String(p.id)}
              href={eo(`/parcours/${encodeURIComponent(String(p.slug))}`)}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-xl shadow-black/60 transition hover:border-white/20"
            >
              {p.image ? (
                <div className="absolute inset-0 opacity-90">
                  <Image
                    src={String(p.image)}
                    alt=""
                    fill
                    className="object-cover transition duration-700 group-hover:scale-[1.05]"
                    sizes="(max-width: 1280px) 100vw, 420px"
                  />
                </div>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent" />
              <div className="relative flex min-h-[220px] flex-col justify-end p-5">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
                  Programme
                </div>
                <div className="mt-2 text-lg font-semibold tracking-tight text-white">{String(p.title ?? "Parcours")}</div>
                <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition group-hover:text-white">
                  Explorer
                  <span className="transition group-hover:translate-x-0.5">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

