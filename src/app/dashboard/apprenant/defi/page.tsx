"use client";

import { Suspense } from "react";
import { EdgeChallengeRunner } from "@/components/apprenant/profil-edge/edge-challenge-runner";

export default function EdgeChallengePage() {
  return (
    <Suspense fallback={<p className="text-sm text-white/50">Préparation de votre Défi EDGE…</p>}>
      <EdgeChallengeRunner />
    </Suspense>
  );
}
