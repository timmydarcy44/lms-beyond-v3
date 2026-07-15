"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Code2,
  GraduationCap,
  LayoutGrid,
  Menu,
  PenLine,
  Plug,
  Sparkles,
  Workflow,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import {
  BEYOND_AGENCY_FONT,
  BEYOND_LOGO_URL,
  CASE_STUDIES,
  CONTACT_MAIL,
  PRESTATIONS,
} from "@/lib/beyond-center/agency-constants";
import { cn } from "@/lib/utils";

const ICON_MAP = {
  code: Code2,
  sparkles: Sparkles,
  layout: LayoutGrid,
  workflow: Workflow,
  portal: LayoutGrid,
  graduation: GraduationCap,
  plug: Plug,
  pen: PenLine,
} as const;

type MegaPanel = "prestations" | "cases" | null;

export function BeyondAgencyHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mega, setMega] = useState<MegaPanel>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!mega) return;
    const onDown = (e: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(e.target as Node)) setMega(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [mega]);

  const clearClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const scheduleClose = () => {
    clearClose();
    closeTimer.current = setTimeout(() => setMega(null), 140);
  };

  const openMega = (panel: MegaPanel) => {
    clearClose();
    setMega(panel);
  };

  return (
    <div ref={headerRef} className="fixed inset-x-0 top-0 z-50 px-4 pt-4 md:px-6" style={{ fontFamily: BEYOND_AGENCY_FONT }}>
      <div
        className={cn(
          "mx-auto flex max-w-[1400px] items-center justify-between gap-4 rounded-[20px] border px-4 py-3 transition-all duration-500 md:px-6 md:py-3.5",
          scrolled
            ? "border-black/[0.08] bg-white/80 shadow-[0_8px_40px_-12px_rgba(0,0,0,0.12)]"
            : "border-white/60 bg-white/50 shadow-[0_4px_24px_-8px_rgba(0,0,0,0.06)]",
        )}
        style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
      >
        <Link href="/" className="relative z-10 flex shrink-0 items-center">
          <Image src={BEYOND_LOGO_URL} alt="Beyond" width={120} height={32} className="h-7 w-auto md:h-8" priority />
        </Link>

        <nav className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-1 lg:flex">
          <div
            className="relative"
            onMouseEnter={() => openMega("prestations")}
            onMouseLeave={scheduleClose}
          >
            <button
              type="button"
              className={cn(
                "rounded-xl px-4 py-2 text-[14px] font-medium text-neutral-600 transition-colors hover:text-black",
                mega === "prestations" && "text-black",
              )}
            >
              Nos prestations
            </button>
          </div>
          <div
            className="relative"
            onMouseEnter={() => openMega("cases")}
            onMouseLeave={scheduleClose}
          >
            <button
              type="button"
              className={cn(
                "rounded-xl px-4 py-2 text-[14px] font-medium text-neutral-600 transition-colors hover:text-black",
                mega === "cases" && "text-black",
              )}
            >
              Études de cas
            </button>
          </div>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={CONTACT_MAIL}
            className="hidden items-center gap-2 rounded-full bg-black px-5 py-2.5 text-[13px] font-medium text-white transition-all hover:bg-neutral-800 sm:inline-flex"
          >
            Parler de votre projet
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-black/10 lg:hidden"
            aria-label="Menu"
            onClick={() => setMobileOpen((v) => !v)}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mega menu desktop */}
      <AnimatePresence>
        {mega ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="mx-auto mt-3 hidden max-w-[1400px] lg:block"
            onMouseEnter={clearClose}
            onMouseLeave={scheduleClose}
          >
            <div
              className="overflow-hidden rounded-[24px] border border-black/[0.06] bg-white/90 p-8 shadow-[0_24px_80px_-24px_rgba(0,0,0,0.14)]"
              style={{ backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
            >
              {mega === "prestations" ? (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {PRESTATIONS.map((item) => {
                    const Icon = ICON_MAP[item.icon] ?? Bot;
                    return (
                      <button
                        key={item.title}
                        type="button"
                        className="group rounded-[18px] border border-transparent p-5 text-left transition-all hover:border-black/[0.06] hover:bg-neutral-50"
                        onClick={() => setMega(null)}
                      >
                        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-neutral-100 text-neutral-700 transition-colors group-hover:bg-black group-hover:text-white">
                          <Icon className="h-[18px] w-[18px]" strokeWidth={1.5} />
                        </div>
                        <p className="text-[15px] font-semibold tracking-[-0.02em] text-black">{item.title}</p>
                        <p className="mt-1.5 text-[13px] leading-relaxed text-neutral-500">{item.description}</p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {CASE_STUDIES.map((project) => (
                    <a
                      key={project.name}
                      href={project.href}
                      className="group overflow-hidden rounded-[18px] border border-black/[0.06] bg-white transition-shadow hover:shadow-[0_12px_40px_-16px_rgba(0,0,0,0.12)]"
                      onClick={() => setMega(null)}
                    >
                      <div className="relative aspect-[16/10] overflow-hidden bg-neutral-100">
                        <Image
                          src={project.image}
                          alt={project.name}
                          fill
                          sizes="320px"
                          className="object-cover transition-transform duration-700 group-hover:scale-[1.03]"
                        />
                      </div>
                      <div className="p-4">
                        <p className="text-[15px] font-semibold tracking-[-0.02em] text-black">{project.name}</p>
                        <p className="mt-1 text-[13px] text-neutral-500">{project.problem}</p>
                        <p className="mt-2 text-[11px] font-medium uppercase tracking-wider text-neutral-400">
                          {project.tech}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-auto mt-3 max-w-[1400px] rounded-[20px] border border-black/[0.06] bg-white p-5 shadow-lg lg:hidden"
          >
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Prestations</p>
            <div className="space-y-2">
              {PRESTATIONS.slice(0, 4).map((p) => (
                <p key={p.title} className="text-[14px] text-neutral-700">
                  {p.title}
                </p>
              ))}
            </div>
            <p className="mb-3 mt-6 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">Études de cas</p>
            <div className="space-y-2">
              {CASE_STUDIES.map((c) => (
                <p key={c.name} className="text-[14px] text-neutral-700">
                  {c.name}
                </p>
              ))}
            </div>
            <a
              href={CONTACT_MAIL}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-black py-3 text-[14px] font-medium text-white"
            >
              Parler de votre projet
              <ArrowRight className="h-4 w-4" />
            </a>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
