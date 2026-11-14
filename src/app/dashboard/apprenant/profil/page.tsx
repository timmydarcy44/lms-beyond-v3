"use client";

import { ApprenantDashboardClient } from "@/components/apprenant/apprenant-dashboard-client";
import { AccommodationRequestCard } from "@/components/handicap/accommodation-request-card";

export default function ApprenantProfilPage() {
  return (
    <div>
      <div className="mx-auto max-w-5xl px-4 pt-6">
        <AccommodationRequestCard />
      </div>
      <ApprenantDashboardClient initialView="profil" />
    </div>
  );
}
