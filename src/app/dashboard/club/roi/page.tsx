"use client";

import { ClubLayout } from "@/components/club/club-layout";
import { useClubGuard } from "@/components/club/use-club-guard";

export default function ClubRoiPage() {
  const status = useClubGuard();
  if (status !== "allowed") {
    return null;
  }

  return (
    <ClubLayout activeItem="ROI & Reporting">
      <div className="rounded-2xl border border-white/10 bg-[#111] p-4 pt-6 text-white/70 lg:p-8 lg:pt-8">
        Section ROI & Reporting (à venir).
      </div>
    </ClubLayout>
  );
}
