"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Props = {
  id?: string;
  kicker?: string;
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  innerClassName?: string;
  align?: "left" | "center";
};

export function EdgePremiumSection({
  id,
  kicker,
  title,
  subtitle,
  children,
  className,
  innerClassName,
  align = "left",
}: Props) {
  return (
    <section id={id} className={cn("scroll-mt-20", className)}>
      <div className={cn("mx-auto max-w-6xl px-5 py-20 sm:px-8 sm:py-28", innerClassName)}>
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className={cn(align === "center" && "mx-auto max-w-3xl text-center")}
        >
          {kicker ? (
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-white/35">{kicker}</p>
          ) : null}
          <h2 className={cn("mt-4 text-3xl font-medium leading-[1.12] tracking-[-0.02em] text-white sm:text-4xl md:text-[2.5rem]")}>
            {title}
          </h2>
          {subtitle ? <div className="mt-5 text-lg leading-relaxed text-white/55 md:text-xl">{subtitle}</div> : null}
        </motion.div>
        {children}
      </div>
    </section>
  );
}
