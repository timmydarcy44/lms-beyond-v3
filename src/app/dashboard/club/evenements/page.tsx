"use client";

import { ClubLayout } from "@/components/club/club-layout";
import { useClubGuard } from "@/components/club/use-club-guard";

export default function ClubEventsPage() {
  const status = useClubGuard();
  if (status !== "allowed") {
    return null;
  }

  return (
    <ClubLayout activeItem="Événements">
      <div className="rounded-2xl border border-white/10 bg-[#111] p-8 text-white/70">
        Section Événements (à venir).
      </div>
    </ClubLayout>
  );
}
