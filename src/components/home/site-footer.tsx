import Link from "next/link";
import { EdgePremiumLogo } from "@/components/edge-site/premium/edge-premium-logo";

export function HomeFooter({
  columns,
  legal,
}: {
  columns: { title: string; links: { label: string; href: string }[] }[];
  legal: { label: string; href: string }[];
}) {
  return (
    <footer className="bg-[#070C1C] px-6 py-16 text-white">
      <div className="mx-auto grid max-w-[1240px] gap-12 lg:grid-cols-[1.1fr_2fr]">
        <div>
          <EdgePremiumLogo />
          <p className="mt-5 max-w-xs text-base text-[#B5BAC6]">
            Développez les compétences qui font la différence.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {columns.map((column) => (
            <div key={column.title}>
              <p className="text-sm font-extrabold">{column.title}</p>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-sm text-[#B5BAC6] no-underline hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="mx-auto mt-12 flex max-w-[1240px] flex-col gap-4 border-t border-white/8 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-[#B5BAC6]">© 2026 Byound. Tous droits réservés.</p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2" aria-label="Mentions">
          {legal.map((link) => (
            <Link key={link.label} href={link.href} className="text-sm text-[#B5BAC6] no-underline hover:text-white">
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
