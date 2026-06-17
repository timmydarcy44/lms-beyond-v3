"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { DiscIpsativeTestRunner } from "@/components/disc/disc-ipsative-test-runner";
import { saveDiscResultats, syncDiscProfilesLegacy } from "@/lib/disc/disc-save";
import type { DiscIpsativeResponse } from "@/lib/disc/disc-questions";
import type { DiscRawScores } from "@/lib/disc/disc-scoring";

function ParticuliersDiscTestInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createSupabaseBrowserClient();
  const [ready, setReady] = useState(false);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    const paramId = searchParams.get("profileId");
    if (paramId) {
      setProfileId(paramId);
      try {
        sessionStorage.setItem("particulierProfileId", paramId);
      } catch {
        // ignore
      }
      setReady(true);
      return;
    }
    try {
      const storedId = sessionStorage.getItem("particulierProfileId");
      if (storedId) setProfileId(storedId);
    } catch {
      // ignore
    }
    setReady(true);
  }, [searchParams]);

  const handleComplete = useCallback(
    async ({
      responses,
      rawScores,
    }: {
      responses: DiscIpsativeResponse[];
      rawScores: DiscRawScores;
    }) => {
      if (!supabase) throw new Error("Supabase non configuré.");
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError || !userData?.user?.id) {
        window.alert("Connecte-toi pour sauvegarder tes résultats.");
        return;
      }
      const userId = userData.user.id;
      const { error, payload } = await saveDiscResultats(supabase, userId, responses, rawScores);
      if (error) {
        console.error("[disc] disc_resultats error:", error);
        throw new Error(error.message || "Erreur lors de l'enregistrement.");
      }
      await syncDiscProfilesLegacy(supabase, userId, payload);
      await supabase.from("profiles").update({ role: "student" }).eq("id", userId);
      router.push("/dashboard/apprenant/profil?disc=done");
    },
    [router, supabase],
  );

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-black/60">
        Chargement…
      </div>
    );
  }

  if (!profileId) {
    return (
      <div className="min-h-screen bg-white text-black">
        <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-6 text-center font-['Inter']">
          <h1 className="text-2xl font-semibold">Session expirée, merci de recommencer votre inscription</h1>
          <a
            href="/particuliers"
            className="mt-4 rounded-full border border-black px-5 py-2 text-sm font-semibold text-black"
          >
            Retour à l&apos;inscription
          </a>
        </div>
      </div>
    );
  }

  return <DiscIpsativeTestRunner onComplete={handleComplete} />;
}

export default function ParticuliersDiscTestPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white text-black/60">
          Chargement…
        </div>
      }
    >
      <ParticuliersDiscTestInner />
    </Suspense>
  );
}
