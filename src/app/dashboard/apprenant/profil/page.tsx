"use client";

import { ApprenantDashboardClient } from "@/components/apprenant/apprenant-dashboard-client";
import { ReferentContactRequestCard } from "@/components/handicap/referent-contact-request-card";

export default function ApprenantProfilPage() {
  return (
    <div>
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <ReferentContactRequestCard audience="apprenant" />
      </div>
      <ApprenantDashboardClient initialView="profil" />
    </div>
  );
}
