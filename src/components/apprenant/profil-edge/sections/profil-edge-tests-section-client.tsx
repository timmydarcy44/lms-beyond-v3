"use client";

import { useEffect, useState } from "react";
import { ProfilEdgeTestsSection } from "@/components/apprenant/profil-edge/sections/profil-edge-tests-section";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function ProfilEdgeTestsSectionClient() {
  const supabase = createSupabaseBrowserClient();
  const [hasDisc, setHasDisc] = useState(false);
  const [hasSoftSkills, setHasSoftSkills] = useState(false);
  const [hasIdmc, setHasIdmc] = useState(false);

  useEffect(() => {
    void (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;
      const [discRes, idmcRes, softRes] = await Promise.all([
        supabase.from("disc_resultats").select("scores").eq("profile_id", uid).maybeSingle(),
        supabase.from("idmc_resultats").select("scores").eq("profile_id", uid).maybeSingle(),
        supabase.from("soft_skills_resultats").select("scores").eq("learner_id", uid).maybeSingle(),
      ]);
      setHasDisc(Boolean(discRes.data?.scores));
      setHasIdmc(Boolean(idmcRes.data?.scores));
      setHasSoftSkills(Boolean(softRes.data?.scores));
    })();
  }, [supabase]);

  return <ProfilEdgeTestsSection hasDisc={hasDisc} hasSoftSkills={hasSoftSkills} hasIdmc={hasIdmc} />;
}
