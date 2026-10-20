"use client";

import { Suspense } from "react";

import { TutorAlternants } from "@/components/tuteur/tutor-neo";

export default function TutorAlternantsPage() {
  return (
    <Suspense fallback={null}>
      <TutorAlternants />
    </Suspense>
  );
}
