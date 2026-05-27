"use client";

import { motion } from "framer-motion";

import { TextReveal, cinematicEase } from "@/components/beyond-studio/motion/cinematic";
import { studioLightMuted, studioLightSubtle } from "@/components/beyond-studio/theme";
import { cn } from "@/lib/utils";

const FRAGMENTED = [
  "Attention dispersée",
  "Décisions lentes",
  "Adoption fragile",
  "Collaboration tendue",
] as const;

const FLUID = [
  "Exécution accélérée",
  "Décisions fluides",
  "Adoption naturelle",
  "Collaboration augmentée",
] as const;

const IMPACTS = [
  "Ventes",
  "Collaboration",
  "Exécution",
  "Onboarding",
  "Expérience client",
  "Adoption",
  "Productivité",
] as const;

function FlowColumn({
  title,
  subtitle,
  items,
  tone,
}: {
  title: string;
  subtitle: string;
  items: readonly string[];
  tone: "fractured" | "fluid";
}) {
  const fractured = tone === "fractured";
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10%" }}
      transition={{ duration: 1, ease: cinematicEase }}
      className={cn(
        "relative flex flex-col justify-between rounded-[2rem] p-8 sm:p-10 min-h-[320px]",
        fractured
          ? "border border-[#1a1a1e]/[0.08] bg-[#ebeae6]"
          : "border border-sky-500/10 bg-gradient-to-br from-white to-[#f0f4ff] shadow-[0_24px_80px_rgba(59,99,220,0.08)]",
      )}
    >
      <div>
        <p className={cn("text-[11px] font-medium uppercase tracking-[0.28em]", studioLightMuted)}>
          {subtitle}
        </p>
        <h3 className={cn("mt-4 text-2xl font-semibold tracking-[-0.03em] sm:text-3xl", studioLightSubtle)}>
          {title}
        </h3>
      </div>
      <ul className="mt-10 space-y-3">
        {items.map((item) => (
          <li key={item} className={cn("flex items-center gap-3 text-base", studioLightMuted)}>
            <span
              className={cn(
                "h-1 w-8 rounded-full",
                fractured ? "bg-[#1a1a1e]/20" : "bg-sky-500/50",
              )}
            />
            {item}
          </li>
        ))}
      </ul>
      {fractured ? (
        <div className="pointer-events-none absolute inset-4 opacity-[0.07]">
          <div className="absolute left-[10%] top-[20%] h-16 w-24 rotate-6 rounded-lg border-2 border-[#1a1a1e]" />
          <div className="absolute right-[15%] top-[35%] h-12 w-20 -rotate-3 rounded-lg border-2 border-[#1a1a1e]" />
          <div className="absolute bottom-[25%] left-[30%] h-14 w-28 rotate-12 rounded-lg border-2 border-[#1a1a1e]" />
        </div>
      ) : (
        <div className="pointer-events-none absolute bottom-8 right-8 h-24 w-24 rounded-full bg-sky-400/10 blur-2xl" />
      )}
    </motion.div>
  );
}

export function FragmentedVsFluidSection() {
  return (
    <div className="mx-auto max-w-[1600px] px-6 py-32 sm:px-10 sm:py-44 lg:px-16">
      <TextReveal>
        <h2 className={cn("max-w-4xl text-[clamp(2rem,4.5vw,3.5rem)] font-semibold leading-[1.06] tracking-[-0.04em]", studioLightSubtle)}>
          L’expérience cognitive influence directement la croissance.
        </h2>
      </TextReveal>

      <div className="mt-16 grid gap-6 lg:grid-cols-2 lg:gap-8">
        <FlowColumn
          title="Systèmes fragmentés"
          subtitle="Friction"
          items={FRAGMENTED}
          tone="fractured"
        />
        <FlowColumn
          title="Systèmes augmentés"
          subtitle="Fluidité"
          items={FLUID}
          tone="fluid"
        />
      </div>

      <TextReveal className="mt-20">
        <p className={cn("text-sm font-medium uppercase tracking-[0.24em]", studioLightMuted)}>
          Impact mesurable sur
        </p>
        <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
          {IMPACTS.map((label, i) => (
            <motion.span
              key={label}
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.6 }}
              className={cn("text-lg tracking-tight", studioLightSubtle)}
            >
              {label}
            </motion.span>
          ))}
        </div>
      </TextReveal>
    </div>
  );
}
