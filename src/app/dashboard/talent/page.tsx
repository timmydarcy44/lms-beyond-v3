"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSupabase } from "@/components/providers/supabase-provider";
import { TalentDashboardShell } from "@/components/beyond-connect/talent-dashboard-shell";

type TalentProfile = {
  first_name?: string | null;
  score_red?: number | null;
  score_yellow?: number | null;
  score_green?: number | null;
  score_blue?: number | null;
};

export default function TalentDashboardPage() {
  const supabase = useSupabase();
  const [profile, setProfile] = useState<TalentProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        if (!supabase) return;
        const { data: userData } = await supabase.auth.getUser();
        if (!userData?.user?.id) return;
        const { data } = await supabase
          .from("talent_profiles")
          .select("first_name, score_red, score_yellow, score_green, score_blue")
          .eq("id", userData.user.id)
          .maybeSingle();
        console.log("Données reçues sur le Dashboard:", data);
        setProfile(data || null);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [supabase]);

  useEffect(() => {
    if (!loading) {
      setShowSkeleton(false);
      return;
    }
    const timeout = setTimeout(() => setShowSkeleton(true), 2000);
    return () => clearTimeout(timeout);
  }, [loading]);

  const discScores = useMemo(
    () => ({
      red: profile?.score_red || 0,
      yellow: profile?.score_yellow || 0,
      green: profile?.score_green || 0,
      blue: profile?.score_blue || 0,
    }),
    [profile]
  );

  const discPercentages = useMemo(() => {
    const toPercent = (value: number) => Math.round((value / 12) * 100);
    return {
      red: toPercent(discScores.red),
      yellow: toPercent(discScores.yellow),
      green: toPercent(discScores.green),
      blue: toPercent(discScores.blue),
    };
  }, [discScores]);

  const dominant = useMemo(() => {
    const entries = [
      { key: "Rouge", value: discScores.red },
      { key: "Jaune", value: discScores.yellow },
      { key: "Vert", value: discScores.green },
      { key: "Bleu", value: discScores.blue },
    ];
    const top = entries.sort((a, b) => b.value - a.value)[0];
    if (!top || top.value === 0) return null;
    return top.key;
  }, [discScores]);

  const hasDiscScores = useMemo(
    () => discScores.red + discScores.yellow + discScores.green + discScores.blue > 0,
    [discScores]
  );

  const hasDiscColumns = useMemo(
    () =>
      profile?.score_red !== null ||
      profile?.score_yellow !== null ||
      profile?.score_green !== null ||
      profile?.score_blue !== null,
    [profile]
  );

  const aiAnalysis = useMemo(() => {
    const map: Record<string, string> = {
      Rouge: "Vous privilegiez l'action, la vitesse de decision et l'impact direct sur les resultats.",
      Jaune: "Vous aimez convaincre, federer et insuffler de l'energie positive dans vos projets.",
      Vert: "Vous recherchez la stabilite, la fiabilite et un cadre clair pour performer durablement.",
      Bleu: "Vous excellez dans l'analyse, la structure et la rigueur dans l'execution.",
      Equilibre: "Votre profil est equilibre et adaptable a plusieurs environnements.",
    };
    if (!dominant) return "";
    return map[dominant] || map.Equilibre;
  }, [dominant]);

  const analysisBlocks = useMemo(() => {
    const map: Record<string, { strengths: string[]; improvements: string[] }> = {
      Rouge: {
        strengths: ["Leadership naturel", "Decisions rapides", "Orientation resultats"],
        improvements: ["Prise de recul", "Ecoute active", "Delegation"],
      },
      Jaune: {
        strengths: ["Communication positive", "Influence", "Energie collective"],
        improvements: ["Priorisation", "Suivi detaille", "Patience"],
      },
      Vert: {
        strengths: ["Fiabilite", "Esprit d'equipe", "Stabilite"],
        improvements: ["Prise d'initiative", "Gestion du changement", "Assertivite"],
      },
      Bleu: {
        strengths: ["Analyse", "Organisation", "Rigueur"],
        improvements: ["Prise de risque", "Rapidite de decision", "Flexibilite"],
      },
      Equilibre: {
        strengths: ["Adaptabilite", "Polyvalence", "Equilibre global"],
        improvements: ["Specialisation", "Positionnement clair", "Mise en avant d'un atout"],
      },
    };
    if (!dominant) return map.Equilibre;
    return map[dominant] || map.Equilibre;
  }, [dominant]);

  const badgeByDominant = useMemo(() => {
    if (!dominant) return [];
    const map: Record<string, string[]> = {
      Rouge: ["Leadership", "Decision", "Performance"],
      Jaune: ["Communication", "Influence", "Energie"],
      Vert: ["Fiabilite", "Cooperation", "Stabilite"],
      Bleu: ["Analyse", "Organisation", "Rigueur"],
    };
    return map[dominant] || [];
  }, [dominant]);

  if (loading && !showSkeleton) {
    return (
      <TalentDashboardShell>
        <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">Chargement...</div>
      </TalentDashboardShell>
    );
  }

  return (
    <TalentDashboardShell>
      <div className="space-y-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <h1 className="text-xl font-semibold text-black">Création de mon profil</h1>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-black/60">
                  Votre ADN Professionnel
                </h2>
                <p className="mt-1 text-xs text-black/50">Scores sur 100</p>
              </div>
              <button
                type="button"
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-black/70"
              >
                Telecharger mon rapport complet PDF
              </button>
            </div>
            <div className="mt-4 rounded-2xl bg-slate-50 p-4">
              {hasDiscScores ? (
                <div className="grid gap-3 md:grid-cols-4">
                  {([
                    { label: "Rouge", value: discPercentages.red, color: "bg-red-500" },
                    { label: "Jaune", value: discPercentages.yellow, color: "bg-yellow-400" },
                    { label: "Vert", value: discPercentages.green, color: "bg-green-500" },
                    { label: "Bleu", value: discPercentages.blue, color: "bg-blue-600" },
                  ] as const).map((item) => (
                    <div key={item.label} className="flex flex-col items-center gap-2">
                      <div className="text-xs font-semibold text-black/60">{item.value}%</div>
                      <div className="relative flex h-36 w-10 items-end rounded-full bg-slate-100">
                        <div
                          className={`w-full rounded-t-full ${item.color}`}
                          style={{
                            height: `${Math.max(8, (item.value / 100) * 144)}px`,
                          }}
                        />
                        <div className="absolute inset-x-0 bottom-0 text-[10px] text-black/30">0</div>
                        <div className="absolute inset-x-0 top-0 text-[10px] text-black/30">100</div>
                      </div>
                      <p className="text-[11px] font-semibold text-black/70">{item.label}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-slate-200 bg-white p-6 text-center text-sm text-black/50">
                  {hasDiscColumns ? "Test non effectué" : "Données manquantes en base"}
                </div>
              )}
            </div>
            {hasDiscScores ? (
              <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
                  Analyse de votre style
                </p>
                <p className="mt-2 text-sm text-black/70">{aiAnalysis}</p>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Forces</p>
                    <ul className="mt-2 space-y-1 text-sm text-black/70">
                      {analysisBlocks.strengths.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
                      Axes d'amelioration
                    </p>
                    <ul className="mt-2 space-y-1 text-sm text-black/70">
                      {analysisBlocks.improvements.map((item) => (
                        <li key={item}>• {item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Statistiques rapides</p>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-lg font-semibold text-black">128</p>
                  <p className="text-[11px] text-black/50">Vues du profil</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-lg font-semibold text-black">18</p>
                  <p className="text-[11px] text-black/50">Matchs suggeres</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-lg font-semibold text-black">4</p>
                  <p className="text-[11px] text-black/50">Candidatures actives</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Open Badges</p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {(badgeByDominant.length ? badgeByDominant : ["Leadership", "Communication", "Organisation", "Rigueur"]).map(
                  (badge, index) => (
                    <div
                      key={badge}
                      className={`flex h-14 w-full items-center justify-center rounded-xl text-[10px] font-semibold ${
                        index < 2 && badgeByDominant.length
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-100 text-black/40"
                      }`}
                    >
                      {badge}
                    </div>
                  )
                )}
              </div>
            </div>

            {dominant ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Le conseil Beyond AI</p>
                <p className="mt-2 text-sm text-black/70">
                  Votre profil {dominant} est tres recherche en ce moment, postulez aux offres de Business Developer !
                </p>
              </div>
            ) : null}

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
                Validez de nouvelles soft skills
              </p>
              <p className="mt-2 text-sm text-black/70">
                Accedez a des modules courts pour booster votre profil et obtenir de nouveaux badges.
              </p>
              <Link
                href="/beyond-no-school"
                className="mt-3 inline-flex rounded-lg bg-black px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
              >
                Aller sur Beyond No School
              </Link>
            </div>
          </div>
        </div>
      </div>
    </TalentDashboardShell>
  );
}
