"use client";

import { Suspense } from "react";
import SalarieCoachingsPageClient from "../coachings/coachings-client";

export default function SalarieAccompagnementPage() {
  return (
    <Suspense fallback={<p className="p-10 text-sm text-white/50">Chargement…</p>}>
      <SalarieCoachingsPageClient />
    </Suspense>
  );
}
