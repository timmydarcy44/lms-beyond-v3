"use client";

import Link from "next/link";
import { Instagram, Linkedin, Youtube } from "lucide-react";
import { EdgePremiumLogo } from "@/components/edge-site/premium/edge-premium-logo";
import { useEdgePremiumConfig } from "@/components/edge-site/premium/edge-premium-config-context";

const SOCIAL = [
  { label: "LinkedIn", href: "#", icon: Linkedin },
  { label: "Instagram", href: "#", icon: Instagram },
  { label: "YouTube", href: "#", icon: Youtube },
] as const;

export function EdgePremiumFooter() {
  const { routes } = useEdgePremiumConfig();
  const R = routes;

  const footerColumns = [
    {
      title: "Apprenants",
      links: [
        { label: "Formations", href: R.formations },
        { label: "Alternance", href: R.alternance },
        { label: "Admissions", href: R.admissions },
        { label: "Vie étudiante", href: R.vieEtudiante },
        { label: "Financement", href: R.financement },
      ],
    },
    {
      title: "Business",
      links: [
        { label: "Solutions", href: R.businessSolutions },
        { label: "Cas clients", href: R.businessCasClients },
        { label: "Ressources", href: R.ressources },
        { label: "Tarifs", href: R.tarifs },
        { label: "Démo", href: R.businessDemo },
      ],
    },
    {
      title: "Ressources",
      links: [
        { label: "Blog", href: R.blog },
        { label: "Guides", href: R.guides },
        { label: "Webinaires", href: R.webinaires },
        { label: "Formateurs / Experts", href: R.formateursExperts },
      ],
    },
    {
      title: "À propos",
      links: [
        { label: "Notre mission", href: R.notreMission },
        { label: "Qui sommes-nous ?", href: R.aPropos },
        { label: "Contact", href: R.contact },
        { label: "Découvrir EDGE", href: R.decouvrir },
      ],
    },
  ] as const;

  return (
    <footer id="contact" className="border-t border-white/[0.06] bg-edge-black-deep px-5 py-16 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 lg:grid-cols-[1.2fr_2fr] lg:gap-16">
          <div>
            <EdgePremiumLogo />
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-white/40">
              Développons les compétences qui feront la différence demain.
            </p>
            <div className="mt-8 flex gap-3">
              {SOCIAL.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-white/50 transition-all hover:border-edge-accent/40 hover:text-white"
                  aria-label={item.label}
                >
                  <item.icon className="h-4 w-4" strokeWidth={1.5} />
                </Link>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
            {footerColumns.map((col) => (
              <div key={col.title}>
                <p className="text-sm font-medium text-white">{col.title}</p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link
                        href={link.href}
                        className="text-sm text-white/40 transition-colors hover:text-white/70"
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

        <div className="mt-16 flex flex-col gap-4 border-t border-white/[0.06] pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/30">© {new Date().getFullYear()} EDGE. Tous droits réservés.</p>
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-white/30" aria-label="Mentions légales">
            <Link href="#" className="transition-colors hover:text-white/50">
              Mentions légales
            </Link>
            <Link href="#" className="transition-colors hover:text-white/50">
              Politique de confidentialité
            </Link>
            <Link href="#" className="transition-colors hover:text-white/50">
              CGU
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
