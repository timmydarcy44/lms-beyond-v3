import Link from "next/link";
import { EDGE_HREFS } from "@/lib/edge-site/constants";

export function EdgeFooter() {
  return (
    <footer className="border-t border-white/[0.06] bg-edge-black px-5 py-8 sm:px-10">
      <div className="mx-auto grid max-w-6xl gap-8 sm:grid-cols-2 sm:items-start">
        <div>
          <p className="text-sm font-medium tracking-[0.12em] text-white">EDGE</p>
          <p className="mt-2 max-w-xs text-[13px] leading-relaxed text-white/30">
            École de formation professionnelle certifiante · Normandie
          </p>
          <p className="mt-6 text-[11px] text-white/30">© {new Date().getFullYear()} EDGE Business School</p>
        </div>
        <nav
          className="flex flex-wrap gap-x-8 gap-y-2 text-[13px] text-white/30 sm:justify-end"
          aria-label="Pied de page"
        >
          <Link href={EDGE_HREFS.parcours} className="transition-colors hover:text-white">
            Parcours
          </Link>
          <Link href={EDGE_HREFS.edgeOnline} className="transition-colors hover:text-white">
            EDGE Online
          </Link>
          <Link href={EDGE_HREFS.entreprises} className="transition-colors hover:text-white">
            Entreprises
          </Link>
          <Link href={EDGE_HREFS.login} className="transition-colors hover:text-white">
            Connexion
          </Link>
        </nav>
      </div>
    </footer>
  );
}
