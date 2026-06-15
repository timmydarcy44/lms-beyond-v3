import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { BeyondMegaNav } from "@/components/marketing/beyond-mega-nav";
import {
  BeyondAccompagnementSection,
  BeyondAISection,
  BeyondIndexPromoSection,
  BeyondLeversSection,
  BeyondOpenBadgesSection,
  BeyondPremiumFooter,
  BeyondWalletSection,
} from "@/components/marketing/beyond-premium-cards";
import {
  beyondBtnPrimaryOnDark,
  beyondBtnSecondaryDark,
  beyondDisplay,
  beyondHeading,
  beyondSubtitleClass,
} from "@/components/marketing/beyond-design-system";
import { beyondLandingImages } from "@/lib/marketing/beyond-landing-images";

const demoMail = "mailto:contact@beyondcenter.fr?subject=D%C3%A9mo%20Beyond";

export function BeyondSaasLanding() {
  return (
    <div className="min-h-screen antialiased selection:bg-cyan-500/15 selection:text-[#0F172A]">
      <BeyondMegaNav variant="transparent" />

      {/* HERO */}
      <section className="relative flex min-h-[100svh] flex-col justify-end overflow-hidden bg-[#071A2F]">
        <Image
          src={beyondLandingImages.strategicMeeting}
          alt="Comité de direction avec Beyond Index projeté"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#071A2F] via-[#071A2F]/65 to-[#071A2F]/25" />

        <div className="relative mx-auto w-full max-w-6xl px-5 pb-14 pt-32 md:px-8 md:pb-20 lg:pb-24">
          <h1 className={`max-w-4xl ${beyondHeading} text-white`}>
            Les organisations les plus performantes ne pilotent plus uniquement les postes.
          </h1>
          <p className="mt-4 max-w-2xl text-[clamp(1.35rem,2.8vw,2.25rem)] font-semibold tracking-tight text-white/80">
            Elles pilotent les compétences.
          </p>
          <p className={`mt-6 max-w-lg text-base md:text-lg ${beyondSubtitleClass("dark")}`}>
            Beyond aide les organisations à identifier, développer et reconnaître les compétences
            grâce à la donnée, l&apos;IA et les Open Badges.
          </p>
          <div className="mt-10 flex flex-wrap items-center gap-4">
            <a href={demoMail} className={beyondBtnPrimaryOnDark}>
              Demander une démo
            </a>
            <Link href="/beyond-index" className={`${beyondBtnSecondaryDark} gap-2`}>
              Faire le Beyond Index
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <BeyondLeversSection />
      <BeyondIndexPromoSection />
      <BeyondAISection />
      <BeyondOpenBadgesSection />
      <BeyondWalletSection />
      <BeyondAccompagnementSection />

      {/* CTA FINAL — hero AI, pas comité */}
      <section className="relative min-h-[55vh] overflow-hidden bg-[#071A2F] md:min-h-[60vh]">
        <Image
          src={beyondLandingImages.heroAi}
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-center opacity-25"
        />
        <div className="absolute inset-0 bg-[#071A2F]/88" />
        <div className="relative flex min-h-[55vh] flex-col items-center justify-center px-5 py-28 text-center md:min-h-[60vh]">
          <h2 className={`max-w-2xl ${beyondDisplay} text-white`}>
            Prêt à piloter les compétences autrement ?
          </h2>
          <a href={demoMail} className={`mt-10 ${beyondBtnPrimaryOnDark}`}>
            Demander une démo
          </a>
        </div>
      </section>

      <BeyondPremiumFooter />
    </div>
  );
}
