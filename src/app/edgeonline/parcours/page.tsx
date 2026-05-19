import Link from "next/link";
import Image from "next/image";
import { getApprenantDashboardData } from "@/lib/queries/apprenant";
import { edgeOnlinePublicHref } from "@/lib/edge-online-public-path";
import { getEdgeOnlineHrefPrefixServer } from "@/lib/edge-online-public-path.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EdgeOnlineParcoursIndexPage() {
  const prefix = await getEdgeOnlineHrefPrefixServer();
  const eo = (path: string) => edgeOnlinePublicHref(path, prefix);

  const data = await getApprenantDashboardData("edgelab");
  const parcours = data.parcours ?? [];
  const featured = parcours.find((p: any) => Boolean(p?.image)) ?? parcours[0] ?? null;

  return (
    <div className="pb-10">
      {featured ? (
        <section className="relative mb-10 overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/70">
          {featured.image ? (
            <div className="absolute inset-0 opacity-85">
              <Image
                src={String(featured.image)}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black" />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/20" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/65" />

          <div className="relative grid gap-8 px-6 py-12 sm:px-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.26em] text-white/55 backdrop-blur">
                <span>Programme à la une</span>
              </div>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[2.75rem] lg:leading-[1.06]">
                {String(featured.title ?? "Parcours")}
              </h1>
              {featured.description ? (
                <p className="mt-4 max-w-xl text-base leading-relaxed text-white/55 sm:text-lg">
                  {String(featured.description)}
                </p>
              ) : null}

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  href={eo(`/parcours/${encodeURIComponent(String(featured.slug))}`)}
                  className="inline-flex h-11 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-500"
                >
                  Lancer le programme
                </Link>
                <Link
                  href="#catalogue"
                  className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] px-6 text-sm font-semibold text-white/85 transition hover:bg-white/[0.12] hover:text-white"
                >
                  Voir les parcours
                </Link>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/35 p-5 backdrop-blur-xl">
              <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/40">
                EDGE ONLINE
              </div>
              <div className="mt-3 text-lg font-semibold tracking-tight text-white">Parcours</div>
              <p className="mt-2 text-sm leading-relaxed text-white/45">
                Votre point de départ. Un programme vous guide étape par étape : séquences, micro-formations, validations.
              </p>
              <div className="mt-5">
                <Link
                  href={eo("/formations")}
                  className="inline-flex h-10 items-center justify-center rounded-full border border-white/18 bg-white/[0.06] px-5 text-sm font-semibold text-white/80 transition hover:bg-white/[0.12] hover:text-white"
                >
                  Voir les micro-formations →
                </Link>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <div className="mb-8">
        <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/45">Parcours</div>
        <h2 className="mt-3 text-3xl font-semibold tracking-tight text-white">Bibliothèque des programmes</h2>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/50">
          Commencez par un programme. Chaque parcours est une transformation guidée, structurée en micro-formations et validations.
        </p>
      </div>

      <div id="catalogue" className="grid gap-4 scroll-mt-24 md:grid-cols-2 xl:grid-cols-3">
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
            <div className="relative flex min-h-[240px] flex-col justify-end p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">Programme</div>
                {(p.meta || p.level) ? (
                  <div className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
                    {String(p.level ?? p.meta ?? "").trim()}
                  </div>
                ) : null}
              </div>
              <div className="mt-3 text-lg font-semibold tracking-tight text-white">{String(p.title ?? "Parcours")}</div>
              {p.description ? <div className="mt-2 line-clamp-2 text-sm text-white/45">{String(p.description)}</div> : null}
              <div className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-white/80 transition group-hover:text-white">
                Ouvrir
                <span className="transition group-hover:translate-x-0.5">→</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

