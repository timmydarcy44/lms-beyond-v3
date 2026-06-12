"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EdgeButton } from "@/components/edge-site/edge-button";
import { EntrepriseContactForm } from "@/components/edge-site/entreprise-contact-form";
import { SectionLabel } from "@/components/edge-site/section-label";

const EDGE_RED = "#E63329";

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-60px" },
  transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
};

const STATS = [
  {
    value: "70%",
    text: "des formations n'ont aucun impact mesurable après 6 mois",
    source: "McKinsey",
  },
  {
    value: "32%",
    text: "des dirigeants doutent du ROI de leurs actions de formation",
    source: "Rise Up 2025",
  },
  {
    value: "1 sur 2",
    text: "collaborateurs estiment que leur dernière formation ne les a pas rendus plus performants",
    source: null,
  },
] as const;

const APPROACH = [
  {
    image: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=900&q=80",
    title: "On mesure avant d'agir",
    text: "Diagnostic comportemental Beyond : profils DISC, cartographie des compétences, identification des freins réels à la performance.",
  },
  {
    image: "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?w=900&q=80",
    title: "On forme autrement",
    text: "Pas de diaporama. Des ateliers, des mises en situation, des débats. Une pédagogie conçue pour que le cerveau retienne et applique.",
  },
  {
    image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=900&q=80",
    title: "On prouve l'impact",
    text: "Reporting RH, évolution des scores comportementaux, certification Open Badge. Vous voyez ce qui change.",
  },
] as const;

const OFFERS = [
  {
    name: "Intervention Flash",
    duration: "1 journée / équipe commerciale",
    includes: "Diagnostic + atelier + restitution",
    price: "À partir de 1 500€ HT",
    featured: false,
    cta: "Demander un devis",
  },
  {
    name: "Parcours Performance",
    duration: "3 mois / accompagnement complet",
    includes: "Diagnostic + 4 sessions + reporting Beyond",
    price: "À partir de 4 500€ HT",
    featured: true,
    cta: "Demander un devis",
  },
  {
    name: "Programme Sur-Mesure",
    duration: "Durée et format définis ensemble",
    includes: "Multi-équipes, déploiement national",
    price: "Sur devis",
    featured: false,
    cta: "Nous contacter",
  },
] as const;

const TESTIMONIALS = [
  {
    photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80",
    name: "Marc Delaunay",
    role: "Directeur Commercial",
    company: "Groupe Normandie Auto",
    quote: "En trois mois, notre taux de transformation a bondi de 18 points. On ne forme plus pour cocher une case.",
  },
  {
    photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
    name: "Sophie Lemaire",
    role: "DRH",
    company: "Nutriset",
    quote: "Le diagnostic Beyond a révélé des freins qu'aucun audit interne n'avait identifiés. Le ROI est visible.",
  },
  {
    photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
    name: "Thomas Girard",
    role: "CEO",
    company: "Cabinet Dupont & Associés",
    quote: "EDGE ne vend pas des heures de formation. Ils livrent de la performance mesurable. C'est rare.",
  },
] as const;

function FadeSection({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <motion.div {...fadeUp} className={className}>
      {children}
    </motion.div>
  );
}

export function EntreprisesPageContent() {
  return (
    <>
      {/* 1. HERO */}
      <section className="relative flex min-h-[min(100svh,900px)] items-end overflow-hidden bg-edge-black">
        <Image
          src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=1920&q=80"
          alt="Équipe commerciale en réunion"
          fill
          className="object-cover"
          sizes="100vw"
          priority
        />
        <div className="absolute inset-0 bg-black/60" aria-hidden />

        <div className="relative z-10 mx-auto w-full max-w-6xl px-5 pb-16 pt-32 sm:px-8 sm:pb-24 sm:pt-40">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-4xl"
          >
            <h1 className="text-[clamp(2.25rem,6vw,4.5rem)] font-bold leading-[1.02] tracking-[-0.03em] text-white">
              Vos équipes ont le potentiel.
              <br />
              Donnez-leur la méthode.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-white/65 sm:text-lg sm:leading-relaxed">
              Diagnostic comportemental, parcours sur-mesure et pilotage de la performance. Pour les entreprises qui ne
              veulent pas faire semblant de former.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
              <EdgeButton
                href="#contact"
                className="!border-[#E63329] !bg-[#E63329] px-8 py-3.5 text-sm font-semibold"
                ariaLabel="Demander un devis"
              >
                Demander un devis
              </EdgeButton>
              <EdgeButton
                href="#approche"
                variant="secondary-dark"
                className="px-8 py-3.5 text-sm font-semibold"
                ariaLabel="Découvrir l'approche"
              >
                Découvrir l&apos;approche
              </EdgeButton>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. PROBLÈME */}
      <section className="bg-white px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <FadeSection>
            <SectionLabel>LE CONSTAT</SectionLabel>
            <h2 className="mt-4 max-w-3xl text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.08] tracking-[-0.03em] text-edge-black">
              La formation classique ne transforme pas.
              <br />
              Elle occupe.
            </h2>
          </FadeSection>

          <div className="mt-16 grid gap-12 md:grid-cols-3 md:gap-8">
            {STATS.map((stat, i) => (
              <motion.div
                key={stat.value}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
              >
                <p className="text-[clamp(2.5rem,5vw,3.5rem)] font-bold tracking-[-0.04em]" style={{ color: EDGE_RED }}>
                  {stat.value}
                </p>
                <p className="mt-3 text-base leading-relaxed text-edge-black/70">{stat.text}</p>
                {stat.source ? (
                  <p className="mt-2 text-xs uppercase tracking-wider text-black/35">Source : {stat.source}</p>
                ) : null}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. APPROCHE */}
      <section id="approche" className="scroll-mt-20 bg-edge-black px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <FadeSection>
            <SectionLabel tone="accent">NOTRE APPROCHE</SectionLabel>
            <h2 className="mt-4 max-w-2xl text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.08] tracking-[-0.03em] text-white">
              Trois étapes. Un impact mesurable.
            </h2>
          </FadeSection>

          <div className="mt-16 grid gap-6 lg:grid-cols-3 lg:gap-5">
            {APPROACH.map((card, i) => (
              <motion.article
                key={card.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="group overflow-hidden rounded-2xl bg-[#141414]"
              >
                <div className="relative aspect-[4/3] overflow-hidden">
                  <Image
                    src={card.image}
                    alt=""
                    fill
                    className="object-cover transition duration-700 group-hover:scale-105"
                    sizes="(max-width: 1024px) 100vw, 33vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                </div>
                <div className="p-6 sm:p-7">
                  <h3 className="text-xl font-bold tracking-tight text-white">{card.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-white/55">{card.text}</p>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* 4. BEYOND INDEX */}
      <section id="beyond-index" className="scroll-mt-20 bg-[#F5F5F5] px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <FadeSection>
            <span
              className="inline-flex rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-white"
              style={{ backgroundColor: EDGE_RED }}
            >
              POWERED BY BEYOND
            </span>
            <h2 className="mt-5 text-[clamp(1.75rem,3.5vw,2.75rem)] font-bold leading-[1.1] tracking-[-0.03em] text-edge-black">
              L&apos;Index de Maturité Compétences™
            </h2>
            <p className="mt-5 text-base leading-relaxed text-edge-black/65 sm:text-lg">
              Avant toute intervention, vos équipes passent le Beyond Index : un diagnostic en 12 minutes qui cartographie
              les profils comportementaux, les gaps de compétences et les leviers de performance collectifs. Gratuit.
              Sans engagement.
            </p>
            <EdgeButton
              href="/beyond-index"
              className="mt-8 !border-[#E63329] !bg-[#E63329] px-8 py-3.5 text-sm font-semibold"
              ariaLabel="Faire passer le diagnostic à mon équipe"
            >
              Faire passer le diagnostic à mon équipe
            </EdgeButton>
          </FadeSection>

          <motion.div
            {...fadeUp}
            transition={{ ...fadeUp.transition, delay: 0.12 }}
            className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-edge-black shadow-[0_32px_80px_-24px_rgba(0,0,0,0.35)]"
          >
            <Image
              src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=80"
              alt="Dashboard Beyond Index — aperçu"
              fill
              className="object-cover object-top"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            <div className="absolute inset-0 bg-gradient-to-tr from-black/40 to-transparent" />
          </motion.div>
        </div>
      </section>

      {/* 5. OFFRES */}
      <section id="offres" className="scroll-mt-20 bg-white px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <FadeSection className="text-center">
            <SectionLabel className="mx-auto">NOS FORMULES</SectionLabel>
            <h2 className="mt-4 text-[clamp(1.75rem,4vw,3rem)] font-bold leading-[1.08] tracking-[-0.03em] text-edge-black">
              Une offre adaptée à votre réalité.
            </h2>
          </FadeSection>

          <div className="mt-16 grid gap-6 lg:grid-cols-3 lg:gap-5">
            {OFFERS.map((offer, i) => (
              <motion.article
                key={offer.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className={cn(
                  "flex flex-col rounded-2xl border bg-white p-8 transition-shadow",
                  offer.featured
                    ? "border-[#E63329] shadow-[0_0_0_1px_#E63329,0_24px_60px_-20px_rgba(230,51,41,0.25)]"
                    : "border-black/10 hover:shadow-[0_20px_50px_-24px_rgba(0,0,0,0.12)]",
                )}
              >
                {offer.featured ? (
                  <span
                    className="mb-4 inline-flex w-fit rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white"
                    style={{ backgroundColor: EDGE_RED }}
                  >
                    Recommandé
                  </span>
                ) : (
                  <span className="mb-4 h-6" aria-hidden />
                )}
                <h3 className="text-xl font-bold tracking-tight text-edge-black">{offer.name}</h3>
                <p className="mt-2 text-sm text-edge-black/50">{offer.duration}</p>
                <p className="mt-4 flex-1 text-sm leading-relaxed text-edge-black/70">{offer.includes}</p>
                <p className="mt-6 text-2xl font-bold tracking-tight text-edge-black">{offer.price}</p>
                <Link
                  href="#contact"
                  className={cn(
                    "mt-6 inline-flex items-center justify-center rounded-full px-6 py-3 text-sm font-semibold transition-opacity hover:opacity-90",
                    offer.featured
                      ? "text-white"
                      : "border border-edge-black/15 text-edge-black hover:border-edge-black/30",
                  )}
                  style={offer.featured ? { backgroundColor: EDGE_RED } : undefined}
                >
                  {offer.cta}
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* 6. TÉMOIGNAGES */}
      <section className="bg-edge-black px-5 py-20 sm:px-8 sm:py-28">
        <div className="mx-auto max-w-6xl">
          <FadeSection>
            <SectionLabel tone="accent">ILS ONT CHOISI EDGE</SectionLabel>
          </FadeSection>

          <div className="mt-12 flex gap-5 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:grid lg:grid-cols-3 lg:overflow-visible">
            {TESTIMONIALS.map((t, i) => (
              <motion.blockquote
                key={t.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="min-w-[280px] flex-shrink-0 rounded-2xl border border-white/10 bg-[#141414] p-7 lg:min-w-0"
              >
                <p className="text-base font-medium leading-relaxed text-white/85">&ldquo;{t.quote}&rdquo;</p>
                <footer className="mt-6 flex items-center gap-4">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full">
                    <Image src={t.photo} alt="" fill className="object-cover" sizes="48px" />
                  </div>
                  <div>
                    <cite className="not-italic text-sm font-bold text-white">{t.name}</cite>
                    <p className="text-xs text-white/45">
                      {t.role} · {t.company}
                    </p>
                  </div>
                </footer>
              </motion.blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* 7. CTA FINAL */}
      <section id="contact" className="scroll-mt-20 px-5 py-20 sm:px-8 sm:py-28" style={{ backgroundColor: EDGE_RED }}>
        <div className="mx-auto max-w-2xl">
          <FadeSection className="text-center">
            <h2 className="text-[clamp(1.75rem,4vw,2.75rem)] font-bold leading-[1.08] tracking-[-0.03em] text-white">
              Prêt à former autrement ?
            </h2>
            <p className="mt-4 text-base leading-relaxed text-white/85 sm:text-lg">
              Prenez 15 minutes pour nous expliquer votre contexte. On vous propose une approche sur-mesure sous 48h.
            </p>
          </FadeSection>

          <EntrepriseContactForm variant="onRed" />
        </div>
      </section>
    </>
  );
}
