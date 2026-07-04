"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { EDGE_PARTICULIER_COACHING } from "@/lib/particulier/coaching-config";
import {
  normalizeParticulierObjectiveType,
  objectiveDetailsSummary,
} from "@/lib/particulier/objective-detail-fields";
import {
  APPRENANT_CARD_BODY,
  APPRENANT_CARD_KICKER,
  CONNECT_BTN_PRIMARY,
  CONNECT_BTN_SECONDARY,
} from "@/lib/apprenant/connect-nav";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export default function ParticulierObjectifPage() {
  const supabase = createSupabaseBrowserClient();
  const [summary, setSummary] = useState<string | null>(null);
  const [typeProfil, setTypeProfil] = useState<string>("");

  useEffect(() => {
    void (async () => {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id;
      if (!uid) return;
      const { data } = await supabase
        .from("profiles")
        .select("type_profil, objective_details")
        .eq("id", uid)
        .maybeSingle();
      if (!data) return;
      const type = normalizeParticulierObjectiveType(data.type_profil);
      setTypeProfil(type);
      const details = (data.objective_details as Record<string, string>) ?? {};
      setSummary(objectiveDetailsSummary(type, details) || null);
    })();
  }, [supabase]);

  return (
    <div className="space-y-6">
      <header>
        <p className={APPRENANT_CARD_KICKER}>Mon parcours</p>
        <h1 className="mt-2 text-2xl font-bold text-white">Mon objectif</h1>
        <p className="mt-2 text-sm text-white/50">Votre projet professionnel guide vos recommandations EDGE.</p>
      </header>

      <section className={APPRENANT_CARD_BODY}>
        <p className="text-xs uppercase tracking-wider text-white/40">Objectif général</p>
        <p className="mt-2 text-lg font-semibold capitalize text-white">{typeProfil || "—"}</p>
        {summary ? (
          <>
            <p className="mt-4 text-xs uppercase tracking-wider text-white/40">Précisions</p>
            <p className="mt-2 text-sm text-white/75">{summary}</p>
          </>
        ) : (
          <p className="mt-4 text-sm text-white/55">
            Précisez votre objectif pour personnaliser votre Profil EDGE.
          </p>
        )}
        <Link href="/dashboard/apprenant/profil-comportemental" className={`${CONNECT_BTN_PRIMARY} mt-6 inline-flex`}>
          {summary ? "Voir mon Profil EDGE" : "Construire mon objectif"}
        </Link>
      </section>
    </div>
  );
}
