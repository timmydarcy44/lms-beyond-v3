"use client";

import { PartenaireLayout } from "@/components/partenaire/partenaire-layout";
import { EsrAccountSettings } from "@/components/club/esr-account-settings";
import { partenaireClub, partenaireProfile } from "@/lib/mocks/partenaire-data";

export default function PartenaireAccountPage() {
  return (
    <PartenaireLayout
      activeItem="Mon compte"
      club={{
        name: partenaireClub.name,
        initials: partenaireClub.initials,
        logoUrl: partenaireClub.logoUrl,
      }}
      partner={{ name: partenaireProfile.name, initials: partenaireProfile.initials }}
    >
      <EsrAccountSettings />
    </PartenaireLayout>
  );
}
