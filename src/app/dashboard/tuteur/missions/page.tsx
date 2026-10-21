"use client";

import { Suspense } from "react";

import { TutorMissionsPage } from "@/components/tuteur/tutor-records";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TutorMissionsPage />
    </Suspense>
  );
}
