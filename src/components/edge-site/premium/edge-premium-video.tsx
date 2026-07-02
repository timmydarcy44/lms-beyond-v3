import Image from "next/image";
import { Play } from "lucide-react";
import { EDGE_PREMIUM_IMAGES } from "@/lib/edge-site/premium-constants";

export function EdgePremiumVideo() {
  return (
    <section className="bg-edge-cream py-14 sm:py-16">
      <div className="mx-auto max-w-[1180px] px-5 sm:px-8">
        <div className="group relative overflow-hidden rounded-[24px] sm:rounded-[28px]">
          <div className="relative aspect-video h-[200px] sm:h-[320px] lg:h-[380px] lg:aspect-auto">
            <Image
              src={EDGE_PREMIUM_IMAGES.video}
              alt="EDGE en action — apprentissage et performance"
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-[1.015]"
              sizes="(max-width: 1180px) 95vw, 1180px"
            />
            <div className="absolute inset-0 bg-edge-black-deep/58" aria-hidden />
          </div>

          <div className="absolute inset-0 flex flex-col justify-between p-6 sm:p-10 lg:p-11">
            <div className="max-w-sm">
              <p className="text-[10px] font-medium uppercase tracking-[0.25em] text-edge-accent">
                EDGE EN ACTION
              </p>
              <h2 className="mt-3 text-[clamp(1.25rem,2.5vw,1.875rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-white">
                Une plateforme.
                <br />
                Des parcours.
                <br />
                Un impact.
              </h2>
            </div>

            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <button
                type="button"
                className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-edge-black-deep shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-[0_0_40px_rgba(99,91,255,0.35)] sm:h-[72px] sm:w-[72px]"
                aria-label="Lire la vidéo EDGE (1 minute 12)"
              >
                <Play className="ml-0.5 h-5 w-5 fill-edge-black-deep sm:h-6 sm:w-6" />
              </button>
            </div>

            <p className="flex items-center gap-2 text-sm text-white/55">
              <Play className="h-3.5 w-3.5" strokeWidth={1.5} />
              Voir la vidéo (1:12)
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
