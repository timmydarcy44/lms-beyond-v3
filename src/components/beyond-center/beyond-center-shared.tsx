"use client";

import Link from "next/link";
import { motion, useScroll, useTransform, type Variants } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";

export function cn(...parts: (string | false | undefined)[]) {
  return parts.filter(Boolean).join(" ");
}

export const ASSET_HOME_DASHBOARD =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/Home/Home%20dashboard.png";

export const ASSET_NEVO_LOGO =
  "https://zmcefidiiqqppowymoqb.supabase.co/storage/v1/object/public/Home/nevo..png";

const NOISE_DATA_URI =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.82' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.55'/%3E%3C/svg%3E\")";

export function DarkAmbientBackground({ className }: { className?: string }) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden bg-[#030712]", className)}>
      <div className="absolute -left-[25%] -top-[35%] h-[75vmin] w-[75vmin] rounded-full bg-violet-600/[0.22] blur-[100px]" />
      <div className="absolute -bottom-[30%] -right-[20%] h-[70vmin] w-[70vmin] rounded-full bg-cyan-400/[0.14] blur-[110px]" />
      <div className="absolute left-[20%] top-[40%] h-[45vmin] w-[55vmin] -translate-y-1/2 rounded-full bg-blue-600/[0.12] blur-[90px]" />
      <div className="absolute right-0 top-0 h-[50vmin] w-[50vmin] rounded-full bg-amber-200/[0.06] blur-[100px]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_120%,rgba(2,6,23,0.92),transparent_55%)]" />
      <div
        className="absolute inset-0 opacity-[0.18] mix-blend-overlay"
        style={{ backgroundImage: NOISE_DATA_URI }}
        aria-hidden
      />
    </div>
  );
}

export const sectionReveal: Variants = {
  hidden: { opacity: 0, y: 36 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] },
  },
};

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
  },
};

export const heroStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

export function GlassDark({
  children,
  className,
  hoverLift = true,
}: {
  children: React.ReactNode;
  className?: string;
  hoverLift?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.25rem] border border-white/[0.14] bg-white/[0.07] shadow-[0_8px_40px_rgba(0,0,0,0.35)] backdrop-blur-[20px] transition-all duration-500 ease-out",
        hoverLift && "hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.1] hover:shadow-[0_24px_60px_rgba(59,130,246,0.12)]",
        className,
      )}
      style={{ WebkitBackdropFilter: "blur(20px)" }}
    >
      {children}
    </div>
  );
}

export function GlassLight({
  children,
  className,
  hoverLift = true,
}: {
  children: React.ReactNode;
  className?: string;
  hoverLift?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-[1.25rem] border border-slate-200/70 bg-white/75 shadow-[0_8px_40px_rgba(15,23,42,0.06)] backdrop-blur-[20px] transition-all duration-500 ease-out",
        hoverLift && "hover:-translate-y-1 hover:border-slate-300/90 hover:bg-white/90 hover:shadow-[0_24px_56px_rgba(99,102,241,0.08)]",
        className,
      )}
      style={{ WebkitBackdropFilter: "blur(20px)" }}
    >
      {children}
    </div>
  );
}

export function Section({
  id,
  children,
  className,
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.section
      id={id}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-70px" }}
      variants={sectionReveal}
      className={className}
    >
      {children}
    </motion.section>
  );
}

const dashboardShell = {
  dark:
    "border-white/[0.12] bg-slate-950/40 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.65),0_0_80px_-20px_rgba(139,92,246,0.35)]",
  light:
    "border-slate-200/80 bg-white/90 shadow-[0_32px_64px_-24px_rgba(15,23,42,0.12),0_0_60px_-20px_rgba(139,92,246,0.12)]",
} as const;

/** Dashboard statique : glow, ombre, léger décalage visuel (sans animation JS sur l’image). */
export function DashboardShowcaseStatic({
  className,
  priority,
  variant = "dark",
}: {
  className?: string;
  priority?: boolean;
  variant?: "dark" | "light";
}) {
  const shell = dashboardShell[variant];

  return (
    <div className={cn("relative", className)}>
      <div
        className={cn(
          "pointer-events-none absolute -inset-8 rounded-[2rem] opacity-90 blur-3xl",
          variant === "dark"
            ? "bg-gradient-to-tr from-violet-600/35 via-cyan-500/15 to-transparent"
            : "bg-gradient-to-tr from-violet-400/25 via-cyan-300/10 to-transparent",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-[80px]",
          variant === "dark" ? "bg-violet-500/25" : "bg-violet-400/20",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "relative -translate-y-1 overflow-hidden rounded-[1.35rem] border backdrop-blur-sm",
          shell,
          variant === "dark" ? "-rotate-[1.25deg]" : "-rotate-[1deg]",
        )}
        style={{ WebkitBackdropFilter: "blur(12px)" }}
      >
        <Image
          src={ASSET_HOME_DASHBOARD}
          alt="Interface Beyond Center — tableau de bord"
          width={1440}
          height={900}
          className="h-auto w-full"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 720px"
          priority={priority}
        />
      </div>
    </div>
  );
}

/**
 * Dashboard avec léger mouvement au scroll (conteneur uniquement).
 * `imageMotion="static"` : aucune animation sur l’image (recommandé hero).
 */
export function DashboardShowcase({
  className,
  priority,
  variant = "dark",
  imageMotion = "static",
}: {
  className?: string;
  priority?: boolean;
  variant?: "dark" | "light";
  imageMotion?: "static" | "parallax";
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const parallaxY = useTransform(scrollYProgress, [0, 0.5, 1], [12, 0, -18]);
  const shell = dashboardShell[variant];

  const frame = (
    <div
      className={cn(
        "relative -translate-y-1 overflow-hidden rounded-[1.35rem] border backdrop-blur-sm",
        shell,
        variant === "dark" ? "-rotate-[1.25deg]" : "-rotate-[1deg]",
      )}
      style={{ WebkitBackdropFilter: "blur(12px)" }}
    >
      <Image
        src={ASSET_HOME_DASHBOARD}
        alt="Interface Beyond Center — tableau de bord"
        width={1440}
        height={900}
        className="h-auto w-full"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 90vw, 720px"
        priority={priority}
      />
    </div>
  );

  return (
    <div ref={ref} className={cn("relative", className)}>
      <div
        className={cn(
          "pointer-events-none absolute -inset-8 rounded-[2rem] opacity-90 blur-3xl",
          variant === "dark"
            ? "bg-gradient-to-tr from-violet-600/35 via-cyan-500/15 to-transparent"
            : "bg-gradient-to-tr from-violet-400/25 via-cyan-300/10 to-transparent",
        )}
        aria-hidden
      />
      <div
        className={cn(
          "pointer-events-none absolute left-1/2 top-1/2 h-[70%] w-[85%] -translate-x-1/2 -translate-y-1/2 rounded-full opacity-60 blur-[80px]",
          variant === "dark" ? "bg-violet-500/25" : "bg-violet-400/20",
        )}
        aria-hidden
      />
      {imageMotion === "parallax" ? <motion.div style={{ y: parallaxY }}>{frame}</motion.div> : frame}
    </div>
  );
}

export const PILOTE_MAIL =
  "mailto:contact@beyondcenter.fr?subject=Beyond%20Center%20%E2%80%93%20Pilote";

export function BeyondCenterMarketingFooter() {
  return (
    <footer className="border-t border-white/[0.08] bg-[#020617] py-10 text-slate-500">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 text-[12px] md:flex-row md:px-8">
        <Link href="/" className="font-semibold text-slate-300 transition-colors hover:text-white">
          Beyond Center
        </Link>
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2">
          <Link href="/approche" className="transition-colors hover:text-slate-300">
            Approche
          </Link>
          <Link href="/solution" className="transition-colors hover:text-slate-300">
            Solution
          </Link>
          <Link href="/plateforme" className="transition-colors hover:text-slate-300">
            Plateforme
          </Link>
          <Link href="/beyond-center/ressources" className="transition-colors hover:text-slate-300">
            Ressources
          </Link>
          <Link href="/pilote" className="transition-colors hover:text-slate-300">
            Pilote
          </Link>
        </nav>
        <span className="text-center md:text-right">Performance cognitive · Humain + tech</span>
      </div>
    </footer>
  );
}
