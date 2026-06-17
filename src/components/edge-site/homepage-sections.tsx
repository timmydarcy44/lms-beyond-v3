import Image from "next/image";
import { EdgeButton } from "@/components/edge-site/edge-button";
import { ImagePlaceholder } from "@/components/edge-site/image-placeholder";
import { SectionLabel } from "@/components/edge-site/section-label";
import { EDGE_CTA_LABELS, EDGE_HREFS, EDGE_BEYOND_LAPTOP_IMAGE_URL, EDGE_OPEN_BADGE_IMAGE_PATH } from "@/lib/edge-site/constants";
import { EdgeExpertsSection } from "@/components/edge-site/edge-experts-section";
import { getParcours, parcoursImageSrc } from "@/lib/parcours";
import { EDGE_HERO_IMAGE_URL } from "@/lib/edge-site/constants";
import { Check, X } from "lucide-react";

const EDGE_EMPLOYABILITY_SLIDES = [
  {
    src: "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/tel%20home%202.png",
    alt: "Aperçu mobile EDGE — résultats et tests",
  },
  {
    src: "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/Tel%20home.png",
    alt: "Aperçu mobile EDGE — accueil et profil public",
  },
  {
    src: "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/EDGE%20Lab/tel%20home%203%20(2).png",
    alt: "Aperçu mobile EDGE — Open Badge EDGE",
  },
] as const;

/** Section 2 — Nos experts (carrousel type Masterclass) */
export function ValidateursSection() {
  return <EdgeExpertsSection />;
}

/** Section 2b — Open Badge */
export function OpenBadgeSection() {
  return (
    <section id="open-badge" className="bg-black px-5 py-20 sm:px-10 sm:py-[80px]" aria-labelledby="open-badge-title">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1fr_320px] lg:gap-16">
        <div>
          <SectionLabel tone="accent">CERTIFICATION</SectionLabel>
          <h2
            id="open-badge-title"
            className="mt-4 max-w-2xl text-[clamp(1.75rem,3vw,2.25rem)] font-medium leading-[1.1] tracking-[-0.01em] text-white"
          >
            Un badge qui prouve ce que vous savez faire — pas juste que vous étiez là.
          </h2>
          <p className="mt-6 max-w-xl text-[15px] leading-[1.7] text-white/45">
            Chaque parcours EDGE délivre un Open Badge IMS Global : certifié cryptographiquement, vérifiable en un clic,
            portable sur LinkedIn et votre CV.
          </p>

          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 sm:p-8">
              <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-white/35">Attestation classique</p>
              <ul className="mt-6 space-y-4">
                {[
                  "Prouve que vous étiez présent",
                  "Non vérifiable par un recruteur",
                  "Aucune preuve de compétence réelle",
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-[15px] leading-snug text-white/50">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-white/25" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl border-2 border-edge-red/30 bg-edge-red/[0.06] p-6 sm:p-8">
              <p className="text-[13px] font-medium uppercase tracking-[0.12em] text-edge-red">Open Badge EDGE</p>
              <ul className="mt-6 space-y-4">
                {[
                  "Prouve ce que vous savez faire",
                  "Vérifiable en 1 clic sur LinkedIn",
                  "Pointe vers vos livrables réels",
                  "Signé cryptographiquement — infalsifiable",
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-[15px] leading-snug text-white/85">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-edge-red" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-10">
            <EdgeButton href={EDGE_HREFS.parcours} ariaLabel="Découvrir les parcours certifiants">
              Découvrir les parcours →
            </EdgeButton>
          </div>
        </div>

        <div className="relative mx-auto aspect-[3/4] w-full max-w-[320px] bg-black lg:mx-0 lg:max-w-none">
          <Image
            src={EDGE_OPEN_BADGE_IMAGE_PATH}
            alt="Open Badge EDGE — Modern Prospecting Level 1, certification IMS Global vérifiable"
            fill
            className="object-contain drop-shadow-[0_24px_60px_rgba(230,51,41,0.15)]"
            sizes="(max-width: 1024px) 320px, 360px"
            priority={false}
          />
        </div>
      </div>
    </section>
  );
}

/** Section 2c — Partenariat EDGE × Beyond */
export function EdgeBeyondPartnershipSection() {
  return (
    <section
      id="edge-beyond"
      className="relative overflow-hidden bg-white px-5 py-28 sm:px-10 sm:py-36 lg:py-48"
      aria-labelledby="edge-beyond-title"
    >
      <div className="relative mx-auto max-w-7xl">
        <div className="text-center">
          <h2
            id="edge-beyond-title"
            className="font-sf-pro-bold whitespace-nowrap text-[clamp(1.75rem,5.5vw,4.25rem)] uppercase leading-none tracking-[-0.04em] text-edge-black"
          >
            EDGE × Beyond
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-[clamp(1rem,1.8vw,1.2rem)] leading-relaxed text-black/50">
            Un partenariat au service de votre développement
          </p>
        </div>

        <div className="mt-16 grid items-center gap-16 lg:mt-20 lg:grid-cols-[1fr_1.12fr] lg:gap-20">
          <div>
            <p className="font-sf-pro-bold max-w-[14ch] text-[clamp(1.75rem,4vw,2.75rem)] uppercase leading-[0.95] tracking-[-0.03em] text-edge-black">
              Performance.
              <br />
              <span className="text-black/25">Mesurée.</span>
            </p>
            <p className="mt-4 max-w-md text-[16px] leading-[1.75] text-black/40">
              EDGE forme sur le terrain. Beyond diagnostique, mesure et prouve la montée en compétences — de
              l&apos;orientation à la certification vérifiable.
            </p>

            <div className="mt-14 space-y-10 border-t border-black/[0.08] pt-12">
              <div>
                <p className="text-[14px] font-semibold uppercase tracking-[0.16em] text-edge-black">Diagnostic Beyond</p>
                <p className="mt-3 max-w-md text-[16px] leading-relaxed text-black/45">
                  DISC, IDMC et soft skills en 12 minutes. Vos résultats alimentent un profil complet — visible par vous
                  et par vos RH.
                </p>
              </div>
              <div>
                <p className="text-[14px] font-semibold uppercase tracking-[0.16em] text-edge-black">Formation EDGE</p>
                <p className="mt-3 max-w-md text-[16px] leading-relaxed text-black/45">
                  Parcours certifiants, livrables concrets et experts terrain — le bon format au bon moment.
                </p>
              </div>
              <div>
                <p className="text-[14px] font-semibold uppercase tracking-[0.16em] text-edge-black">Preuve mesurable</p>
                <p className="mt-3 max-w-md text-[16px] leading-relaxed text-black/45">
                  Open Badge IMS Global, dashboard RH et ROI documenté — pas des heures passées, des compétences prouvées.
                </p>
              </div>
            </div>

            <div className="mt-14 flex flex-wrap gap-3">
              <EdgeButton href={EDGE_HREFS.orientation} ariaLabel="Faire le test d'orientation">
                Faire le test d&apos;orientation →
              </EdgeButton>
              <EdgeButton variant="secondary-light" href={EDGE_HREFS.entreprises} ariaLabel="Découvrir l'offre entreprise">
                Offre entreprises
              </EdgeButton>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-[760px] lg:mx-0 lg:max-w-none">
            <Image
              src={EDGE_BEYOND_LAPTOP_IMAGE_URL}
              alt="Dashboard Beyond — Mes résultats : profil DISC, bilan IDMC et soft skills"
              width={1280}
              height={800}
              className="h-auto w-full"
              sizes="(max-width: 1024px) 100vw, 760px"
            />
          </div>
        </div>
      </div>
    </section>
  );
}

/** Section 2d — Entreprises (homepage) */
export function EntreprisesHomeSection() {
  return (
    <section id="entreprises" className="bg-edge-grey px-5 py-20 sm:px-10 sm:py-[80px]" aria-labelledby="entreprises-home-title">
      <div className="mx-auto max-w-6xl text-center">
        <SectionLabel tone="muted">ENTREPRISES</SectionLabel>
        <h2
          id="entreprises-home-title"
          className="mx-auto mt-4 max-w-2xl text-[clamp(1.75rem,3vw,2.25rem)] font-medium leading-[1.1] tracking-[-0.01em] text-edge-black"
        >
          Vos équipes ont le potentiel. Donnez-leur la méthode.
        </h2>
        <p className="mx-auto mt-6 max-w-xl text-[15px] leading-[1.7] text-black/40">
          On diagnostique avant de former. On mesure après. Pas de formation générique — un système piloté par la
          donnée.
        </p>

        <div className="mx-auto mt-14 grid max-w-5xl gap-8 text-left md:grid-cols-3 md:gap-6">
          <div className="rounded-2xl border border-black/[0.06] bg-white p-6">
            <p className="text-[13px] font-medium text-edge-black">Diagnostic</p>
            <p className="mt-3 text-[14px] leading-relaxed text-black/45">
              Chaque collaborateur passe le test Beyond en 12 minutes. Profil comportemental, compétences, axes de
              progression.
            </p>
          </div>
          <div className="rounded-2xl border border-black/[0.06] bg-white p-6">
            <p className="text-[13px] font-medium text-edge-black">Formation sur-mesure</p>
            <p className="mt-3 text-[14px] leading-relaxed text-black/45">
              Parcours certifiants, interventions en présentiel, coaching individuel. Le bon format au bon moment.
            </p>
          </div>
          <div className="rounded-2xl border border-black/[0.06] bg-white p-6">
            <p className="text-[13px] font-medium text-edge-black">ROI mesurable</p>
            <p className="mt-3 text-[14px] leading-relaxed text-black/45">
              Dashboard RH en temps réel. Open Badge IMS Global à la clé. Vous prouvez l&apos;impact — pas les heures
              passées.
            </p>
          </div>
        </div>

        <div className="mt-10">
          <EdgeButton href={EDGE_HREFS.entreprises} ariaLabel="Former vos équipes">
            Former vos équipes →
          </EdgeButton>
        </div>
      </div>
    </section>
  );
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

/** Section 6 — Employabilité (profil Beyond Connect gratuit) */
export function EmployabilitySection() {
  const features = [
    {
      title: "Un espace qui vous met en avant",
      description:
        "Créez votre profil professionnel : compétences, expériences, réalisations — un espace dédié pour valoriser ce que vous savez faire.",
    },
    {
      title: "Tests & diagnostics inclus",
      description:
        "DISC, bilan IDMC, tests de soft skills : comprenez votre profil comportemental et vos forces en quelques minutes, sans payer.",
    },
    {
      title: "Des preuves, pas des promesses",
      description:
        "Rattachez vos Open Badges et certifications. Chaque compétence validée renforce votre crédibilité auprès des recruteurs.",
    },
    {
      title: "Votre espace est gratuit et le restera",
      description:
        "Inscription sans engagement ni carte bancaire. Construisez votre profil, passez les tests et partagez vos résultats — sans frais, pour toujours.",
    },
  ] as const;

  return (
    <section
      id="employabilite"
      className="bg-edge-black px-5 py-20 sm:px-10 sm:py-[80px]"
      aria-labelledby="employabilite-title"
    >
      <div className="mx-auto max-w-6xl">
        <div className="grid gap-12 lg:grid-cols-[1fr_1.05fr] lg:items-start lg:gap-16">
          <div>
            <SectionLabel tone="accent">EMPLOYABILITÉ</SectionLabel>
            <h2
              id="employabilite-title"
              className="mt-4 max-w-xl text-[clamp(1.75rem,3vw,2.25rem)] font-medium leading-[1.1] tracking-[-0.01em] text-white"
            >
              Valorisez vos compétences — gratuitement, dès maintenant.
            </h2>
            <p className="mt-6 max-w-xl text-[15px] leading-[1.7] text-white/45">
              En vous inscrivant gratuitement, vous créez un espace dédié pour mettre en avant votre profil, passer vos
              tests et prouver vos compétences aux recruteurs.
            </p>

            <div className="mt-10 grid gap-4 sm:grid-cols-2">
              {features.map((item) => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.03] p-6">
                  <p className="text-[13px] font-medium text-white">{item.title}</p>
                  <p className="mt-3 text-[14px] leading-relaxed text-white/45">{item.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <EdgeButton href={EDGE_HREFS.employabilitySignup} ariaLabel="Créer mon espace gratuitement">
                Créer mon espace gratuitement
              </EdgeButton>
              <EdgeButton variant="secondary-dark" href={EDGE_HREFS.orientation} ariaLabel="Faire le test d'orientation">
                Faire le test d&apos;orientation
              </EdgeButton>
            </div>
            <p className="mt-4 text-[12px] text-white/30">Inscription gratuite · sans carte bancaire · accès immédiat aux tests</p>
          </div>

          <div className="relative">
            <div
              className="flex gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              style={{ scrollSnapType: "x mandatory" }}
              aria-label="Captures de l’espace profil et des tests"
            >
              {EDGE_EMPLOYABILITY_SLIDES.map((slide) => (
                <div
                  key={slide.src}
                  className="w-[min(78%,320px)] shrink-0"
                  style={{ scrollSnapAlign: "start" }}
                >
                  <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white/[0.02] shadow-[0_40px_120px_-60px_rgba(0,0,0,0.85)]">
                    <div className="relative aspect-[9/19.5] w-full">
                      <Image
                        src={slide.src}
                        alt={slide.alt}
                        fill
                        className="object-cover"
                        sizes="(max-width: 1024px) 80vw, 360px"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-[12px] text-white/30">
              Faites défiler horizontalement pour voir l’espace profil, les résultats et les badges.
            </p>
          </div>
        </div>
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
