import type { Metadata } from "next";
import { Suspense } from "react";
import { DocPageClient } from "@/app/doc/doc-page-client";

export const metadata: Metadata = {
  title: "Devis Byound",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: { index: false, follow: false, noimageindex: true },
  },
};

export default function PublicDocPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-[#0A0B12] text-[#9AA0B5]">
          Chargement…
        </main>
      }
    >
      <DocPageClient />
    </Suspense>
  );
}
