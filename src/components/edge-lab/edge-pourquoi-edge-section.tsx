"use client";

import { motion } from "framer-motion";

type FeatureCardProps = {
  title: string;
  description: string;
  secondaryLine?: string;
  isFeatured?: boolean;
  className?: string;
};

function FeatureCard({ title, description, secondaryLine, isFeatured, className }: FeatureCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-30px" }}
      transition={{ duration: 0.4 }}
      className={[
        "group relative overflow-hidden rounded-[32px] border p-8",
        "transition-all duration-300 ease-out will-change-transform",
        isFeatured
          ? [
              "bg-[radial-gradient(circle_at_18%_0%,rgba(255,255,255,0.12),transparent_55%),linear-gradient(120deg,rgba(59,130,246,0.20),rgba(2,6,23,0.12),rgba(190,244,100,0.16))]",
              "backdrop-blur-xl",
              "border-white/16 ring-1 ring-white/12",
              "shadow-[0_44px_120px_-74px_rgba(0,0,0,0.92)]",
              "hover:scale-[1.03] hover:border-white/22 hover:ring-white/18 hover:shadow-[0_60px_160px_-95px_rgba(0,0,0,0.96)]",
            ].join(" ")
          : [
              "bg-white/[0.06] backdrop-blur-md",
              "border-white/10",
              "shadow-[0_22px_70px_-56px_rgba(0,0,0,0.90)]",
              "hover:-translate-y-1 hover:scale-[1.02] hover:border-white/16 hover:shadow-[0_34px_100px_-70px_rgba(0,0,0,0.95)]",
            ].join(" "),
        className ?? "",
      ].join(" ")}
    >
      {isFeatured ? (
        <>
          <div
            className="pointer-events-none absolute -inset-12 opacity-90 blur-3xl"
            style={{
              background:
                "radial-gradient(circle at 14% 18%, rgba(59,130,246,0.40), transparent 54%), radial-gradient(circle at 86% 40%, rgba(190,244,100,0.28), transparent 62%)",
            }}
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:64px_64px]"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/70 to-transparent"
            aria-hidden
          />
        </>
      ) : null}

      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        aria-hidden
        style={{
          background:
            "radial-gradient(circle at 0% 0%, rgba(255,255,255,0.12), transparent 48%), radial-gradient(circle at 100% 0%, rgba(255,255,255,0.08), transparent 45%)",
        }}
      />

      <div className="relative">
        <h3 className="text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</h3>
        <p className="mt-2 text-[15px] leading-relaxed text-white/72">{description}</p>
        {secondaryLine ? (
          <p className="mt-2 text-xs font-semibold tracking-[-0.01em] text-white/60">{secondaryLine}</p>
        ) : null}
      </div>
    </motion.article>
  );
}

export function EdgePourquoiEdgeSection() {
  return (
    <section id="pourquoi-edge" className="relative scroll-mt-20 bg-[#06060a] py-18 sm:py-24">
      {/* Background full black premium */}
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_0%,rgba(59,130,246,0.22),transparent_58%),radial-gradient(circle_at_85%_18%,rgba(190,244,100,0.14),transparent_62%),radial-gradient(circle_at_55%_105%,rgba(168,85,247,0.14),transparent_56%),linear-gradient(to_bottom,#06060a,#06060a)]" />
        <div className="absolute inset-0 opacity-[0.08] [background-image:radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.48)_1px,transparent_0)] [background-size:18px_18px]" />
        <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] [background-size:56px_56px]" />
        <div className="absolute inset-x-0 top-0 h-px bg-white/[0.06]" />
      </div>

      <div className="relative mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.45 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white sm:text-4xl md:text-[2.75rem] md:leading-[1.06]">
            Chaque compétence est validée par des livrables concrets.
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-white/60 sm:text-lg">
            Chaque compétence est validée par des livrables concrets.
          </p>
        </motion.div>

        {/* Grille 2×2 desktop, featured dominant */}
        <div className="mt-12 grid gap-6 sm:mt-14 lg:grid-cols-3 lg:gap-8">
          {/* Featured en premier sur mobile, plus large sur desktop */}
          <div className="lg:col-span-2 lg:col-start-2 lg:row-start-1">
            <FeatureCard
              title="Validation concrète"
              description="Chaque compétence est prouvée."
              secondaryLine="Pas de validation au temps passé."
              isFeatured
              className="min-h-[210px] lg:min-h-[240px]"
            />
          </div>

          <div className="lg:col-start-1 lg:row-start-1">
            <FeatureCard title="Apprendre en faisant" description="Apprentissage par l’action, pas la théorie." />
          </div>

          <div className="lg:col-start-1 lg:row-start-2">
            <FeatureCard title="Progresser vite" description="Formats courts, résultats rapides." />
          </div>

          <div className="lg:col-span-2 lg:col-start-2 lg:row-start-2">
            <FeatureCard title="Appliquer immédiatement" description="Directement utilisable sur le terrain." />
          </div>
        </div>

        <p className="mt-10 text-center text-sm tracking-widest text-white/45 sm:mt-12">
          Cas réels · Simulations · Présentations · Livrables
        </p>
      </div>
    </section>
  );
}
