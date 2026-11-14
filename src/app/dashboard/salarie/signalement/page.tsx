"use client";

import { DashboardSignalementForm } from "@/components/qualiopi/dashboard-signalement-form";
import {
  SALARIE_PAGE_KICKER,
  SALARIE_PAGE_LEAD,
  SALARIE_PAGE_SHELL,
  SALARIE_PAGE_TITLE,
} from "@/lib/salarie/connect-nav";

export default function SalarieSignalementPage() {
  return (
    <div className={SALARIE_PAGE_SHELL}>
      <p className={SALARIE_PAGE_KICKER}>Qualité</p>
      <h1 className={SALARIE_PAGE_TITLE}>Signalement sensible</h1>
      <p className={SALARIE_PAGE_LEAD}>
        Violences, harcèlement ou discriminations — traitement confidentiel, anonymat possible.
      </p>
      <div className="mt-6 max-w-xl">
        <DashboardSignalementForm audience="salarie" tone="dark" />
      </div>
    </div>
  );
}
