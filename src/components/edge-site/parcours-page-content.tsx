import Link from "next/link";
import { BadgeDisplay } from "@/components/edge-site/badge-display";
import { CTAStickyBottom } from "@/components/edge-site/cta-sticky-bottom";
import { EdgeButton } from "@/components/edge-site/edge-button";
import { ImagePlaceholder } from "@/components/edge-site/image-placeholder";
import { TestimonialBlock } from "@/components/edge-site/testimonial-block";
import { EDGE_CTA_LABELS, EDGE_HREFS } from "@/lib/edge-site/constants";
import type { Parcours } from "@/lib/parcours";
import { parcoursImageSrc, TEMOIGNAGES } from "@/lib/parcours";
import { EDGE_HERO_IMAGE_URL } from "@/lib/edge-site/constants";

type Props = { parcours: Parcours };

export function ParcoursPageContent({ parcours }: Props) {
  const temoignages = TEMOIGNAGES.filter((t) =>
    t.parcours.toLowerCase().includes(parcours.titre.toLowerCase().slice(0, 10)),
  ).slice(0, 2);
  const list = temoignages.length > 0 ? temoignages : TEMOIGNAGES.slice(0, 2);

  return (
    <>
      <section className="bg-edge-black">
        <div className="mx-auto grid max-w-6xl lg:grid-cols-2">
          <div className="px-5 py-12 sm:px-10 sm:py-16">
            <nav className="text-[11px] text-white/30" aria-label="Fil d'Ariane">
              <Link href={EDGE_HREFS.parcours} className="hover:text-white/60">
                Parcours
              </Link>
              <span className="mx-2">›</span>
              <span>{parcours.familleLabel}</span>
              <span className="mx-2">›</span>
              <span className="text-white/60">{parcours.titre}</span>
            </nav>
            <h1 className="mt-10 text-[clamp(2rem,4vw,2.75rem)] font-medium leading-[1.05] tracking-[-0.02em] text-white">
              {parcours.titre}
            </h1>
            <p className="mt-4 text-[15px] text-white/45">{parcours.cible}</p>
            <dl className="mt-8 flex flex-wrap gap-8 text-sm">
              <div>
                <dt className="text-white/25">Durée</dt>
                <dd className="mt-1 font-medium text-white">{parcours.duree}</dd>
              </div>
              <div>
                <dt className="text-white/25">Badge</dt>
                <dd className="mt-1 font-medium text-white">{parcours.badge}</dd>
              </div>
            </dl>
            <div className="mt-10 flex flex-wrap items-center gap-3">
              <EdgeButton href={EDGE_HREFS.postuler(parcours.slug)} ariaLabel={EDGE_CTA_LABELS.apply}>
                {EDGE_CTA_LABELS.apply}
              </EdgeButton>
              <EdgeButton variant="secondary-dark" href="#programme" ariaLabel="Voir le programme">
                Voir le programme
              </EdgeButton>
              <Link
                href={EDGE_HREFS.parcoursTarifs(parcours.slug)}
                className="text-[13px] text-white/45 transition-colors hover:text-white"
              >
                Voir les tarifs →
              </Link>
            </div>
          </div>
          <div className="relative min-h-[320px] lg:min-h-full">
            <ImagePlaceholder
              src={parcoursImageSrc(parcours, EDGE_HERO_IMAGE_URL)}
              alt={`Apprenants en formation — parcours ${parcours.titre}`}
              className="absolute inset-0 h-full w-full"
              fallbackClassName="bg-edge-photo"
              sizes="50vw"
            />
          </div>
        </div>
      </section>

      <section id="programme" className="bg-white px-5 py-20 sm:px-10 sm:py-[80px]" aria-labelledby="modules-title">
        <div className="mx-auto max-w-3xl">
          <h2 id="modules-title" className="text-[clamp(1.75rem,3vw,2rem)] font-medium tracking-[-0.01em] text-edge-black">
            Ce que tu vas apprendre
          </h2>
          <ol className="mt-12 divide-y divide-black/[0.06] border-y border-black/[0.06]">
            {parcours.modules.map((m, i) => (
              <li key={m.code} className="py-8">
                <p className="text-[11px] font-medium text-edge-red">{String(i + 1).padStart(2, "0")}</p>
                <h3 className="mt-2 text-[15px] font-medium text-edge-black">{m.titre}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-black/40">{m.description}</p>
              </li>
            ))}
          </ol>
          <p className="mt-10 text-[13px] text-black/40">
            Ce parcours est-il fait pour toi ?{" "}
            <Link href={EDGE_HREFS.orientation} className="font-medium text-edge-red transition-opacity hover:opacity-80">
              → Faire le test
            </Link>
          </p>
        </div>
      </section>

      <section className="bg-edge-grey px-5 py-20 sm:px-10 sm:py-[80px]" aria-labelledby="addons-title">
        <div className="mx-auto max-w-6xl">
          <h2 id="addons-title" className="text-[clamp(1.75rem,3vw,2rem)] font-medium tracking-[-0.01em] text-edge-black">
            Personnalise ton parcours
          </h2>
          <p className="mt-4 text-[15px] text-black/40">
            Modules optionnels pour adapter le parcours à votre contexte.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {parcours.addons.map((a) => (
              <li key={a.id} className="border border-black/[0.06] bg-white p-5">
                <p className="text-[10px] uppercase tracking-[0.2em] text-edge-red">{a.thematique}</p>
                <p className="mt-2 text-[15px] font-medium text-edge-black">{a.titre}</p>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <EdgeButton
              variant="outline-red"
              href={EDGE_HREFS.parcoursTarifs(parcours.slug)}
              ariaLabel="Voir les tarifs du parcours"
            >
              Voir les tarifs et options
            </EdgeButton>
          </div>
        </div>
      </section>

      <section className="bg-edge-black px-5 py-20 sm:px-10 sm:py-[80px]" aria-labelledby="livrables-title">
        <div className="mx-auto max-w-3xl">
          <h2 id="livrables-title" className="text-[clamp(1.75rem,3vw,2rem)] font-medium tracking-[-0.01em] text-white">
            Ce que tu vas produire
          </h2>
          <ul className="mt-12 space-y-6">
            {parcours.livrables.map((l) => (
              <li key={l} className="border-l-2 border-edge-red pl-6 text-[15px] text-white/80">
                {l}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="bg-white px-5 py-20 text-center sm:px-10 sm:py-[80px]" aria-labelledby="badge-section-title">
        <div className="mx-auto max-w-2xl">
          <h2 id="badge-section-title" className="text-[clamp(1.75rem,3vw,2rem)] font-medium tracking-[-0.01em] text-edge-black">
            Ton Open Badge IMS Global
          </h2>
          <p className="mt-6 text-[15px] leading-[1.7] text-black/40">
            Certification numérique vérifiable, hébergée selon le standard IMS Global. Partageable sur LinkedIn et
            contrôlable par tout recruteur ou DRH en un clic.
          </p>
          <div className="mt-12">
            <BadgeDisplay />
          </div>
          <p className="mt-8 text-[13px] text-black/40">
            Vérifiable par tout recruteur ou DRH en un clic sur LinkedIn
          </p>
        </div>
      </section>

      {parcours.speedMeeting ? (
        <section className="bg-edge-black px-5 py-20 sm:px-10 sm:py-[80px]" aria-labelledby="speed-title">
          <div className="mx-auto max-w-3xl">
            <h2 id="speed-title" className="text-[clamp(1.75rem,3vw,2rem)] font-medium tracking-[-0.01em] text-white">
              Le Speed Meeting Entreprises
            </h2>
            <p className="mt-6 text-[15px] leading-[1.7] text-white/45">
              En fin de parcours, sessions courtes avec recruteurs et managers partenaires. Votre badge et vos
              livrables sont vérifiés avant les entretiens.
            </p>
            <ul className="mt-10 flex flex-wrap gap-4 text-[13px] text-white/30">
              {["Partenaire A", "Partenaire B", "Partenaire C", "Partenaire D"].map((name) => (
                <li key={name} className="border border-white/10 px-4 py-2">
                  {name}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      <section className="bg-edge-grey px-5 py-20 sm:px-10 sm:py-[80px]" aria-labelledby="parcours-temoignages">
        <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-2">
          <h2 id="parcours-temoignages" className="sr-only">
            Témoignages
          </h2>
          {list.map((t) => (
            <TestimonialBlock key={t.id} {...t} variant="light" />
          ))}
        </div>
      </section>

      <CTAStickyBottom titre={parcours.titre} parcoursSlug={parcours.slug} />
      <div className="h-16 bg-edge-grey" aria-hidden />
    </>
  );
}
