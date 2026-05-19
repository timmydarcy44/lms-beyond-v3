import { EdgeButton } from "@/components/edge-site/edge-button";
import { ImagePlaceholder } from "@/components/edge-site/image-placeholder";
import { EdgeHeroFaqBar } from "@/components/edge-lab/edge-hero-faq-bar";
import { EDGE_HERO_IMAGE_URL, EDGE_HREFS } from "@/lib/edge-site/constants";

export function HeroSection() {
  return (
    <section className="relative flex min-h-[min(100svh,920px)] flex-col overflow-hidden">
      <ImagePlaceholder
        src={EDGE_HERO_IMAGE_URL}
        alt="Apprenante EDGE en formation, concentrée sur son ordinateur dans un espace de coworking"
        className="absolute inset-0 h-full w-full"
        fallbackClassName="bg-edge-photo"
        priority
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-edge-black/50" aria-hidden />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="flex flex-1 flex-col items-center justify-center px-5 py-16 text-center sm:px-10 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-edge-red/20 bg-edge-red/[0.08] px-4 py-1.5 text-[10px] font-normal uppercase tracking-[0.2em] text-white/70">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-edge-red" aria-hidden />
              Normandie · Cohorte Sept 2025 ouverte
            </p>
            <h1 className="mt-8 text-[clamp(2.5rem,5vw,3.5rem)] font-medium leading-[1.05] tracking-[-0.02em] text-white">
              Forme-toi comme les meilleurs <span className="text-edge-red">performent.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-[440px] text-[15px] leading-[1.7] text-white/45">
              Parcours certifiants, livrables terrain et Open Badge IMS Global. Une école normande qui forme aux
              métiers de demain.
            </p>
            <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <EdgeButton href={EDGE_HREFS.parcours} ariaLabel="Découvrir les parcours">
                Découvrir les parcours
              </EdgeButton>
              <EdgeButton variant="secondary-dark" href={EDGE_HREFS.orientation} ariaLabel="Faire le test">
                Faire le test
              </EdgeButton>
            </div>
          </div>
        </div>

        <EdgeHeroFaqBar variant="hero" />
      </div>
    </section>
  );
}
