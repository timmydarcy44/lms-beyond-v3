import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import RessourcesPageClient from "../page-client";
import { loadJessicaRessourcesCatalog } from "@/lib/jessica-contentin/load-jessica-ressources-catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ressources en Neuroéducation : Fiches et outils à télécharger",
  description: "Fiches, guides et outils psychopédagogiques à télécharger — gratuits ou premium.",
};

export default async function RessourcesTelechargerPage() {
  const { serializedItems, userFirstName } = await loadJessicaRessourcesCatalog();

  return (
    <>
      <section className="mx-auto max-w-7xl px-6 pb-4 pt-10">
        <Button asChild variant="outline" className="rounded-full border-[#C6A664]/50 text-[#2F2A25]">
          <Link href="/jessica-contentin/ressources">← Tous les outils</Link>
        </Button>
      </section>
      <Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center bg-[#F8F5F0]">
            <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#C6A664]" />
          </div>
        }
      >
        <RessourcesPageClient
          initialItems={serializedItems as never}
          userFirstName={userFirstName}
          viewMode="downloads-only"
        />
      </Suspense>
    </>
  );
}
