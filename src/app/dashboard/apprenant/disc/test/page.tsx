"use client";

import { useCallback } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { redirectAfterAssessmentTest } from "@/lib/apprenant/post-test-redirect";
import { DiscIpsativeTestRunner } from "@/components/disc/disc-ipsative-test-runner";
import { saveDiscResultats } from "@/lib/disc/disc-save";
import type { DiscIpsativeResponse } from "@/lib/disc/disc-questions";
import type { DiscRawScores } from "@/lib/disc/disc-scoring";

export default function DiscTestPage() {
  const supabase = createSupabaseBrowserClient();

  const handleComplete = useCallback(
    async ({
      responses,
      rawScores,
    }: {
      responses: DiscIpsativeResponse[];
      rawScores: DiscRawScores;
    }) => {
      if (!supabase) {
        window.alert("Configuration Supabase manquante.");
        return;
      }
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        window.alert("Session introuvable. Reconnectez-vous depuis votre espace apprenant.");
        return;
      }

      const { error } = await saveDiscResultats(supabase, userData.user.id, responses, rawScores);
      if (error) {
        console.error("[disc] disc_resultats error:", error);
        window.alert("Impossible d'enregistrer vos résultats DISC. Réessayez ou contactez le support.");
        return;
      }

      const redirectPath = await redirectAfterAssessmentTest(
        "disc",
        "/dashboard/apprenant/profil?disc=done",
      );
      window.setTimeout(() => {
        window.location.href = redirectPath;
      }, 900);
    },
    [supabase],
  );

  return <DiscIpsativeTestRunner onComplete={handleComplete} />;
}
