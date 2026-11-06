"use client";

import { DashboardReclamationForm } from "@/components/qualiopi/dashboard-reclamation-form";
import {
  SALARIE_PAGE_KICKER,
  SALARIE_PAGE_LEAD,
  SALARIE_PAGE_SHELL,
  SALARIE_PAGE_TITLE,
} from "@/lib/salarie/connect-nav";

export default function SalarieReclamationPage() {
  return (
    <div className={SALARIE_PAGE_SHELL}>
      <p className={SALARIE_PAGE_KICKER}>Qualité</p>
      <h1 className={SALARIE_PAGE_TITLE}>Réclamation</h1>
      <p className={SALARIE_PAGE_LEAD}>Signalement formation / parcours — registre qualité Byound.</p>
      <div className="mt-6 max-w-xl">
        <DashboardReclamationForm audience="salarie" tone="dark" />
      </div>
    </div>
  );
}
