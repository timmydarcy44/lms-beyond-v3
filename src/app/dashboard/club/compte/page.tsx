"use client";

import { ClubLayout } from "@/components/club/club-layout";
import { EsrAccountSettings } from "@/components/club/esr-account-settings";

export default function ClubAccountPage() {
  return (
    <ClubLayout activeItem="Mon compte">
      <EsrAccountSettings />
    </ClubLayout>
  );
}
