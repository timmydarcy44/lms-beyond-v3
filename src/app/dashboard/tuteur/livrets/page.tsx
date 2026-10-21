"use client";

import { Suspense } from "react";

import { TutorLivretsPage } from "@/components/tuteur/tutor-records";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TutorLivretsPage />
    </Suspense>
  );
}
