"use client";

import { Suspense } from "react";
import { EdgeMissionRunner } from "@/components/apprenant/profil-edge/edge-mission-runner";

export default function EdgeMissionPage() {
  return (
    <Suspense fallback={<p className="text-sm text-white/50">Préparation de votre Mission EDGE…</p>}>
      <EdgeMissionRunner />
    </Suspense>
  );
}
