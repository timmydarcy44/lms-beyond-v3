import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { SectionSlider } from "@/components/dashboard/section-slider";
import { Button } from "@/components/ui/button";
import {
  getLearnerContentDetail,
  type LearnerCategory,
} from "@/lib/queries/apprenant";
import { LearningSessionTracker } from "@/components/learning-session-tracker";

interface AdminRessourceDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export default async function AdminRessourceDetailPage({ params }: AdminRessourceDetailPageProps) {
  const { slug } = await params;
  const category: LearnerCategory = "ressources";

  const detail = await getLearnerContentDetail(category, slug);
  if (!detail) {
    notFound();
  }

  const { card, detail: info, related = [] } = detail;
  const playHref = card.href;
  const contentType = "resource";

  return (
    <LearningSessionTracker
      contentType={contentType}
      contentId={card.id}
      showIndicator={false}
    >
      <div className="space-y-8">
        <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-[0_40px_140px_rgba(249,115,22,0.25)]">
          <div className="absolute inset-0">
            {info.backgroundImage && (
              <Image
                src={info.backgroundImage}
                alt={info.title}
                fill
                priority
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(67,20,7,0.85),_transparent_60%)]" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-orange-900/40 to-black/75" />
          </div>

          <div className="relative z-10 flex flex-col gap-10 px-6 py-12 md:px-12 md:py-16 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-6 text-white">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/90">
                Ressource
              </span>
              <div className="space-y-3">
                <h1 className="text-3xl font-semibold leading-tight md:text-5xl">{info.title}</h1>
                {info.subtitle ? (
                  <p className="text-sm text-white/75 md:text-base">{info.subtitle}</p>
                ) : null}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-white/70 md:text-sm">
                {info.meta.map((item) => (
                  <span key={item} className="rounded-full border border-white/30 px-3 py-1">
                    {item}
                  </span>
                ))}
              </div>
              {info.description && (
                <p className="max-w-2xl text-sm text-white/75 md:text-base">{info.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-3 pt-4">
                <Button asChild className="rounded-full bg-gradient-to-r from-white via-amber-100 to-orange-400 px-6 py-2 text-sm font-semibold text-black shadow-[0_16px_50px_rgba(249,115,22,0.35)] hover:from-white hover:via-white">
                  <Link href={playHref}>Accéder à la ressource</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {related.length > 0 && (
          <SectionSlider 
            title="Vous aimerez aussi" 
            cards={related.map(card => ({ 
              ...card, 
              cta: card.cta ?? undefined,
              meta: card.meta ?? undefined,
              progress: card.progress ?? undefined,
            }))} 
            accent="learner" 
          />
        )}
      </div>
    </LearningSessionTracker>
  );
}




