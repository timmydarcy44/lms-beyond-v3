import type { ReactNode } from "react";
import Link from "next/link";
import { Manrope } from "next/font/google";

const manrope = Manrope({ subsets: ["latin"], display: "swap" });

const NAV = [
  { href: "#verification", label: "Vérifier un badge" },
  { href: "https://www.byound.fr/business/open-badges", label: "Nos badges" },
  { href: "https://www.byound.fr/business", label: "Byound Business" },
];

export function BadgePublicShell({ children }: { children: ReactNode }) {
  return (
    <div lang="fr" className={`${manrope.className} relative min-h-screen bg-[#050608] text-[#F2F2F4]`}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[480px] bg-[radial-gradient(ellipse_at_top,rgba(110,91,255,0.38),transparent_62%)]" />
      <header className="relative mx-auto flex max-w-6xl items-center justify-between gap-6 px-5 py-6 sm:px-8">
        <Link href="https://www.byound.fr" className="text-lg font-bold tracking-[-0.04em]">
          Byound
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-x-5 gap-y-2 text-sm text-[rgba(242,242,244,0.6)]">
          {NAV.map((item) => (
            <a key={item.href} href={item.href} className="hover:text-[#F2F2F4]">
              {item.label}
            </a>
          ))}
        </nav>
      </header>
      <div className="relative">{children}</div>
    </div>
  );
}
