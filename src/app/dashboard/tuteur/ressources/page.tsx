"use client";

import { Suspense } from "react";

import { TutorResourcesPage } from "@/components/tuteur/tutor-resources";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <TutorResourcesPage />
    </Suspense>
  );
}
