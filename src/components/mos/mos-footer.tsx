"use client";

import Link from "next/link";
import { FOOTER_LINKS, SOCIALS } from "@/components/mos/constants";
import { MosLogo } from "@/components/mos/mos-logo";
import { Reveal } from "@/components/mos/motion";

export function MosFooter() {
  return (
    <footer id="contact" className="scroll-mt-24 bg-[#111111] px-5 py-20 sm:px-10 sm:py-24">
      <div className="mx-auto max-w-[1400px]">
        <Reveal>
          <div className="flex flex-col gap-12 border-b border-white/10 pb-16 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <MosLogo size="lg" />
              <p className="mt-6 max-w-xs text-sm leading-relaxed text-white/45">
                Maladrerie OmniSports Caen
                <br />
                Football · Formation · Passion
                <br />
                Depuis 1965
              </p>
            </div>

            <div className="grid grid-cols-2 gap-10 sm:grid-cols-4 lg:gap-16">
              {Object.entries(FOOTER_LINKS).map(([title, links]) => (
                <div key={title}>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#C8102E]">{title}</p>
                  <ul className="mt-5 space-y-3">
                    {links.map((link) => (
                      <li key={link.label}>
                        <Link
                          href={link.href}
                          className="text-sm text-white/55 transition-colors hover:text-white"
                        >
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <div className="mt-12 flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/30">© {new Date().getFullYear()} MOS Caen. Tous droits réservés.</p>
          <div className="flex flex-wrap gap-6">
            {SOCIALS.map((social) => (
              <Link
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-semibold uppercase tracking-[0.15em] text-white/45 transition-colors hover:text-[#C8102E]"
              >
                {social.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
