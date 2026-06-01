import Link from "next/link";
import { Info } from "lucide-react";

export function RgpdBanner() {
  return (
    <div className="flex gap-3 rounded-2xl border border-sky-500/20 bg-sky-950/30 px-4 py-3 text-sm text-sky-100/90">
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" aria-hidden />
      <p>
        Données agrégées et anonymisées — aucune information individuelle n&apos;est accessible depuis
        cette vue. Minimum 5 diagnostics requis pour l&apos;affichage. Conforme RGPD.{" "}
        <Link href="/legal/privacy" className="underline hover:text-white">
          En savoir plus
        </Link>
      </p>
    </div>
  );
}
