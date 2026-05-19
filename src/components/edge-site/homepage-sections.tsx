import Link from "next/link";
import { EdgeButton } from "@/components/edge-site/edge-button";
import { ImagePlaceholder } from "@/components/edge-site/image-placeholder";
import { SectionLabel } from "@/components/edge-site/section-label";
import { TestimonialBlock } from "@/components/edge-site/testimonial-block";
import { EDGE_CTA_LABELS, EDGE_HREFS } from "@/lib/edge-site/constants";
import { EdgeExpertsSection } from "@/components/edge-site/edge-experts-section";
import { getParcours, parcoursImageSrc, TEMOIGNAGES } from "@/lib/parcours";
import { EDGE_HERO_IMAGE_URL } from "@/lib/edge-site/constants";

/** Section 2 — Nos experts (carrousel type Masterclass) */
export function ValidateursSection() {
  return <EdgeExpertsSection />;
}

/** Section 3 — Commercial IA */
export function ParcoursPhareDarkSection() {
  const p = getParcours("commercial-ia")!;

  return (
    <section className="grid min-h-[400px] bg-edge-black lg:grid-cols-2" aria-labelledby="phare-commercial">
      <div className="flex flex-col justify-center bg-edge-dark px-8 py-16 sm:px-12 lg:px-16">
        <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-edge-red">{p.familleLabel}</p>
        <h2 id="phare-commercial" className="mt-4 text-[clamp(1.75rem,3vw,2.25rem)] font-medium leading-[1.1] tracking-[-0.01em] text-white">
          {p.titreMarketing ?? p.titre}
        </h2>
        <p className="mt-6 max-w-md text-[15px] leading-[1.7] text-white/45">{p.description}</p>
        <p className="mt-8 text-[12px] text-white/40">45h · Open Badge IMS Global</p>
        <div className="mt-8">
          <EdgeButton href={EDGE_HREFS.parcoursSlug(p.slug)} ariaLabel="Rejoindre la cohorte Commercial IA">
            {EDGE_CTA_LABELS.cohort} →
          </EdgeButton>
        </div>
      </div>
      <div className="relative min-h-[280px] border-l border-edge-black bg-[#0f0f0e] lg:min-h-[400px]">
        <ImagePlaceholder
          src={parcoursImageSrc(p, EDGE_HERO_IMAGE_URL)}
          alt="Apprenants EDGE en formation Commercial IA, collaboration autour d'un ordinateur portable"
          className="absolute inset-0 h-full w-full"
          fallbackClassName="bg-edge-photo"
          sizes="50vw"
        />
      </div>
    </section>
  );
}

/** Section 4 — Product Builder */
export function ParcoursPhareLightSection() {
  const p = getParcours("product-builder")!;

  return (
    <section className="grid min-h-[400px] bg-white lg:grid-cols-2" aria-labelledby="phare-product">
      <div className="relative order-2 min-h-[280px] bg-edge-grey lg:order-1 lg:min-h-[400px]">
        <ImagePlaceholder
          alt="Cohorte EDGE lors d'un speed meeting avec recruteurs"
          className="absolute inset-0 h-full w-full"
          fallbackClassName="bg-edge-photo-light"
          sizes="50vw"
        />
      </div>
      <div className="order-1 flex flex-col justify-center px-8 py-16 sm:px-12 lg:order-2 lg:px-16">
        <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-edge-red">{p.familleLabel}</p>
        <h2 id="phare-product" className="mt-4 text-[clamp(1.75rem,3vw,2.25rem)] font-medium leading-[1.1] tracking-[-0.01em] text-edge-black">
          {p.titreMarketing ?? p.titre}
        </h2>
        <p className="mt-6 max-w-md text-[15px] leading-[1.7] text-black/40">{p.description}</p>
        <p className="mt-8 text-[12px] text-black/40">50h · Open Badge IMS Global</p>
        <div className="mt-8">
          <EdgeButton href={EDGE_HREFS.parcoursSlug(p.slug)} ariaLabel="Rejoindre la cohorte Product Builder">
            {EDGE_CTA_LABELS.cohort} →
          </EdgeButton>
        </div>
      </div>
    </section>
  );
}

/** Section 5 — EDGE Online teaser */
export function EdgeOnlineTeaserSection() {
  return (
    <section className="bg-edge-grey px-5 py-20 text-center sm:px-10 sm:py-[80px]" aria-labelledby="online-teaser">
      <p className="text-[10px] font-normal uppercase tracking-[0.2em] text-edge-red">EDGE Online</p>
      <h2 id="online-teaser" className="mx-auto mt-4 max-w-lg text-[clamp(1.75rem,3vw,2.25rem)] font-medium tracking-[-0.01em] text-edge-black">
        Apprendre vite. Appliquer immédiatement.
      </h2>
      <p className="mx-auto mt-6 max-w-[400px] text-[15px] leading-[1.7] text-black/40">
        Micro-formations par thématique. Accès libre ou programme certifiant avec accompagnement.
      </p>
      <div className="mt-8">
        <EdgeButton href={EDGE_HREFS.edgeOnline} ariaLabel="Essayer 7 jours gratuit">
          Essayer 7 jours gratuit
        </EdgeButton>
      </div>
    </section>
  );
}

/** Section 6 — témoignages */
export function TestimonialsHomeSection() {
  return (
    <section className="bg-edge-black px-5 py-20 sm:px-10 sm:py-[80px]" aria-labelledby="temoignages-home">
      <SectionLabel tone="muted-dark" className="mx-auto block text-center">
        Ce qu&apos;ils en disent
      </SectionLabel>
      <div className="mx-auto mt-16 grid max-w-6xl gap-8 md:grid-cols-3 md:gap-8">
        {TEMOIGNAGES.map((t) => (
          <TestimonialBlock key={t.id} {...t} />
        ))}
      </div>
    </section>
  );
}

/** Section 7 — CTA final */
export function FinalCTASection() {
  return (
    <section className="bg-edge-red px-5 py-20 text-center sm:px-10 sm:py-[80px]" aria-labelledby="cta-final">
      <h2 id="cta-final" className="text-[clamp(1.75rem,3vw,2.25rem)] font-medium tracking-[-0.01em] text-white">
        Prêt à performer comme les meilleurs ?
      </h2>
      <p className="mx-auto mt-4 max-w-md text-[15px] text-white/70">
        Rejoignez la prochaine cohorte en Normandie ou explorez EDGE Online dès aujourd&apos;hui.
      </p>
      <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
        <EdgeButton variant="inverted" href={EDGE_HREFS.candidater} ariaLabel={EDGE_CTA_LABELS.cohort}>
          {EDGE_CTA_LABELS.cohort}
        </EdgeButton>
        <EdgeButton variant="secondary-dark" href={EDGE_HREFS.edgeOnline} ariaLabel="Essayer EDGE Online">
          Essayer EDGE Online
        </EdgeButton>
      </div>
    </section>
  );
}
