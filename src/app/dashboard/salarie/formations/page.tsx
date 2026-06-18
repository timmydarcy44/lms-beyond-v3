"use client";

import { Suspense } from "react";
import SalarieFormationsPageClient from "./formations-client";

export default function SalarieFormationsPage() {
  return (
    <Suspense fallback={<p className="p-10 text-sm text-white/50">Chargement…</p>}>
      <SalarieFormationsPageClient />
    </Suspense>
  );
}
