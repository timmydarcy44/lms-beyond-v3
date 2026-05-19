import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getApprenantDashboardData, getLearnerPathDetail } from "@/lib/queries/apprenant";
import { cn } from "@/lib/utils";
import { edgeOnlinePublicHref } from "@/lib/edge-online-public-path";
import { getEdgeOnlineHrefPrefixServer } from "@/lib/edge-online-public-path.server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function stepKindLabel(kind: string) {
  const k = kind.toLowerCase();
  if (k === "course") return "Micro-formation";
  if (k === "test") return "Test";
  if (k === "resource") return "Ressource";
  return "Contenu";
}

export default async function EdgeOnlineParcoursDetailPage(props: { params: Promise<{ slug: string }> }) {
  const { slug } = await props.params;

  const prefix = await getEdgeOnlineHrefPrefixServer();
  const eo = (path: string) => edgeOnlinePublicHref(path, prefix);

  const data = await getApprenantDashboardData("edgelab");
  const card = data.parcours.find((p: any) => String(p.slug) === slug);
  if (!card) notFound();

  const pathId = String(card.id);
  const pathContent = await getLearnerPathDetail(pathId);
  const steps = Array.isArray((pathContent as any)?.steps) ? (((pathContent as any)?.steps as any[]) ?? []) : [];

  const title = String(card.title ?? "Parcours");
  const image = card.image ? String(card.image) : null;
  const subtitle = String(card.description ?? "").trim();

  return (
    <div className="pb-10">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/70 backdrop-blur-xl">
        {image ? (
          <div className="absolute inset-0 opacity-70">
            <Image src={image} alt="" fill className="object-cover" sizes="100vw" priority />
          </div>
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/75 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70" />
        <div className="relative px-6 py-12 sm:px-10">
          <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-white/55">Programme</div>
          <h1 className="mt-4 max-w-3xl text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-[3rem] lg:leading-[1.05]">
            {title}
          </h1>
          {subtitle ? <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/55">{subtitle}</p> : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="#contenu"
              className="inline-flex h-11 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-semibold text-white transition hover:bg-blue-500"
            >
              Commencer
            </Link>
            <Link
              href={eo("/parcours")}
              className="inline-flex h-11 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] px-6 text-sm font-semibold text-white transition hover:bg-white/[0.12]"
            >
              Tous les parcours
            </Link>
          </div>
        </div>
      </section>

      <section id="contenu" className="mt-10">
        <div className="mb-4 flex items-end justify-between gap-4">
          <h2 className="text-xl font-semibold tracking-tight text-white">Structure du programme</h2>
          <div className="text-sm font-semibold text-white/50">{steps.length} étape{steps.length !== 1 ? "s" : ""}</div>
        </div>

        <div className="space-y-3">
          {steps.map((s: any, idx: number) => {
            const kind = String(s?.content_kind ?? s?.contentKind ?? s?.kind ?? "").trim().toLowerCase();
            const contentId = String(s?.content_id ?? s?.contentId ?? "").trim();
            const stepTitle = String(s?.title ?? s?.name ?? "").trim();
            const meta = String(s?.meta ?? s?.description ?? "").trim();
            const href =
              kind === "course" && contentId
                ? eo(`/formations/${encodeURIComponent(contentId)}`)
                : "#";
            return (
              <div
                key={`${kind}-${contentId}-${idx}`}
                className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:bg-white/[0.05]"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-white/40">
                      Étape {idx + 1} · {stepKindLabel(kind)}
                    </div>
                    <div className="mt-2 text-base font-semibold tracking-tight text-white">
                      {stepTitle || "Contenu"}
                    </div>
                    {meta ? <div className="mt-2 text-sm leading-relaxed text-white/45">{meta}</div> : null}
                  </div>
                  <Link
                    href={href}
                    className={cn(
                      "shrink-0 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition",
                      href === "#"
                        ? "cursor-not-allowed border-white/10 bg-white/[0.03] text-white/30"
                        : "border-white/18 bg-white/[0.06] text-white/80 hover:bg-white/[0.12] hover:text-white",
                    )}
                    aria-disabled={href === "#"}
                    tabIndex={href === "#" ? -1 : 0}
                  >
                    Ouvrir
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

