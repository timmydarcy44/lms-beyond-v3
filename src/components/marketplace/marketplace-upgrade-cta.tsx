import Link from "next/link";
import { Button } from "@/components/ui/button";

export function MarketplaceUpgradeCta({ tier }: { tier: number }) {
  return (
    <div className="mx-auto max-w-lg rounded-2xl border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-8 text-center shadow-sm">
      <p className="text-3xl">🧠</p>
      <h2 className="mt-4 text-xl font-semibold text-slate-900">Marketplace BCT — Niveau 3 requis</h2>
      <p className="mt-3 text-sm text-slate-600">
        L&apos;accès aux psychopédagogues certifiés Beyond est inclus dans l&apos;offre{" "}
        <strong>EDGE for Enterprise niveau 3</strong>. Votre organisation est actuellement au niveau{" "}
        {tier}.
      </p>
      <Button asChild className="mt-6 bg-violet-700 hover:bg-violet-600">
        <Link href="/dashboard/entreprise/parametres">Découvrir l&apos;upgrade →</Link>
      </Button>
    </div>
  );
}
