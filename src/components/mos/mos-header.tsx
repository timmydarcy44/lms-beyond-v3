"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Mail, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BOUTIQUE_LINK,
  CONTACT_LINK,
  NAV_LEFT,
  NAV_RIGHT,
  PARTNER_CTA,
  TEAMS_MEGA_MENU,
} from "@/components/mos/constants";
import { MosLogo } from "@/components/mos/mos-logo";
import { MosTeamsMegaMenu } from "@/components/mos/mos-teams-mega-menu";

const MOBILE_LINKS = [...NAV_LEFT, ...NAV_RIGHT, BOUTIQUE_LINK, CONTACT_LINK];
const TEAMS_LABEL = "Nos Équipes";

const navItemClass =
  "inline-flex h-10 items-center whitespace-nowrap text-[9px] font-semibold uppercase leading-none tracking-[0.1em] transition-colors duration-300 lg:text-[10px] lg:tracking-[0.12em]";

export function MosHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [teamsOpen, setTeamsOpen] = useState(false);
  const [mobileTeamsOpen, setMobileTeamsOpen] = useState(false);
  const teamsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (teamsRef.current && !teamsRef.current.contains(e.target as Node)) {
        setTeamsOpen(false);
      }
    };
    if (teamsOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [teamsOpen]);

  const linkClass = (active = false) =>
    cn(
      navItemClass,
      active
        ? scrolled
          ? "text-[#C8102E]"
          : "text-white"
        : scrolled
          ? "text-[#111111]/60 hover:text-[#C8102E]"
          : "text-white/75 hover:text-white",
    );

  const btnClass = (outlined = false) =>
    cn(
      "inline-flex h-10 items-center whitespace-nowrap rounded-full px-2.5 text-[9px] font-semibold uppercase leading-none tracking-[0.08em] transition-all duration-300 lg:px-3 lg:text-[10px]",
      outlined
        ? scrolled
          ? "border border-[#111111]/15 text-[#111111] hover:border-[#C8102E] hover:text-[#C8102E]"
          : "border border-white/40 text-white hover:bg-white/10"
        : scrolled
          ? "border border-[#C8102E] text-[#C8102E] hover:bg-[#C8102E] hover:text-white"
          : "border border-white/35 text-white hover:bg-white/10",
    );

  const iconBtnClass = () =>
    cn(
      "inline-flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 lg:h-10 lg:w-10",
      scrolled
        ? "text-[#111111]/60 hover:bg-[#111111]/5 hover:text-[#C8102E]"
        : "text-white/75 hover:bg-white/10 hover:text-white",
    );

  const closeTeams = () => setTeamsOpen(false);

  return (
    <>
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled || teamsOpen ? "bg-white shadow-[0_4px_30px_rgba(0,0,0,0.08)]" : "bg-transparent",
        )}
      >
        <div className="relative">
          <div className="mx-auto grid h-24 max-w-[1400px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 sm:px-5 lg:px-8">
            <nav className="hidden min-w-0 items-center gap-2 overflow-visible lg:flex xl:gap-3" aria-label="Navigation gauche">
              {NAV_LEFT.map((item) =>
                item.label === TEAMS_LABEL ? (
                  <div key={item.label} ref={teamsRef} className="relative flex items-center">
                    <button
                      type="button"
                      className={cn(linkClass(teamsOpen), "gap-1")}
                      aria-expanded={teamsOpen}
                      aria-haspopup="true"
                      onClick={() => setTeamsOpen((o) => !o)}
                      onMouseEnter={() => setTeamsOpen(true)}
                    >
                      {item.label}
                      <ChevronDown className={cn("h-3 w-3 shrink-0 transition-transform", teamsOpen && "rotate-180")} />
                    </button>
                  </div>
                ) : (
                  <Link key={item.href + item.label} href={item.href} className={linkClass()}>
                    {item.label}
                  </Link>
                ),
              )}
            </nav>

            <Link href="/mos" className="flex shrink-0 justify-center overflow-visible bg-transparent">
              <MosLogo size="header" />
            </Link>

            <nav
              className="hidden min-w-0 items-center justify-end gap-1.5 overflow-hidden lg:flex xl:gap-2.5"
              aria-label="Navigation droite"
            >
              {NAV_RIGHT.map((item) => (
                <Link key={item.href + item.label} href={item.href} className={linkClass()}>
                  {item.label}
                </Link>
              ))}
              <Link href={CONTACT_LINK.href} className={iconBtnClass()} aria-label={CONTACT_LINK.label}>
                <Mail className="h-4 w-4" strokeWidth={2} />
              </Link>
              <Link href={PARTNER_CTA.href} className={btnClass()}>
                {PARTNER_CTA.label}
              </Link>
              <Link href={BOUTIQUE_LINK.href} className={btnClass(true)}>
                {BOUTIQUE_LINK.label}
              </Link>
            </nav>

            <button
              type="button"
              className={cn(
                "col-start-3 justify-self-end rounded-full p-2 transition-colors lg:hidden",
                scrolled ? "text-[#111111]" : "text-white",
              )}
              aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          <AnimatePresence>
            {teamsOpen ? (
              <div onMouseLeave={() => setTeamsOpen(false)}>
                <MosTeamsMegaMenu onNavigate={closeTeams} />
              </div>
            ) : null}
          </AnimatePresence>
        </div>
      </motion.header>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 overflow-y-auto bg-[#111111]/95 backdrop-blur-sm lg:hidden"
          >
            <nav className="flex min-h-full flex-col items-center justify-center gap-4 px-6 py-24">
              {MOBILE_LINKS.map((item, i) =>
                item.label === TEAMS_LABEL ? (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="w-full max-w-sm text-center"
                  >
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 text-lg font-semibold uppercase tracking-[0.2em] text-white"
                      onClick={() => setMobileTeamsOpen((o) => !o)}
                    >
                      {item.label}
                      <ChevronDown className={cn("h-5 w-5 transition-transform", mobileTeamsOpen && "rotate-180")} />
                    </button>
                    {mobileTeamsOpen ? (
                      <div className="mt-4 space-y-6 rounded-2xl bg-white/5 p-5 text-left">
                        {TEAMS_MEGA_MENU.columns.map((col) => (
                          <div key={col.title}>
                            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/50">{col.title}</p>
                            <ul className="mt-2 space-y-2">
                              {col.teams.map((team) => (
                                <li key={team.label}>
                                  <Link
                                    href={team.href}
                                    className="text-sm text-white/80 hover:text-white"
                                    onClick={() => setMobileOpen(false)}
                                  >
                                    {team.label}
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </motion.div>
                ) : (
                  <motion.div
                    key={item.href + item.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "text-lg font-semibold uppercase tracking-[0.2em] text-white",
                        item.label === "Boutique" && "rounded-full border border-white/30 px-6 py-2",
                      )}
                      onClick={() => setMobileOpen(false)}
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ),
              )}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: MOBILE_LINKS.length * 0.05 }}
              >
                <Link
                  href={PARTNER_CTA.href}
                  className="rounded-full bg-[#C8102E] px-8 py-3 text-sm font-semibold uppercase tracking-[0.18em] text-white"
                  onClick={() => setMobileOpen(false)}
                >
                  {PARTNER_CTA.label}
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
