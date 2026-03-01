"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Linkedin } from "lucide-react";
import { motion } from "framer-motion";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { SOFT_SKILLS } from "@/lib/soft-skills";

type ResultPayload = {
  exists: boolean;
  result: {
    total_score?: number | null;
    scores?: Record<string, number> | null;
  } | null;
};

export default function SoftSkillsResultsPage() {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const aiFetchedRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/soft-skills/results");
        if (response.ok) {
          const data = (await response.json()) as ResultPayload;
          if (data?.exists && data?.result?.scores) {
            setScores(data.result.scores);
            return;
          }
        }
      } catch {
        // ignore API errors and fallback to localStorage
      }

      const devResults = localStorage.getItem("softSkillsDevResults");
      if (devResults) {
        try {
          const parsed = JSON.parse(devResults) as { scores?: Record<string, number> };
          if (parsed?.scores) {
            setScores(parsed.scores);
            return;
          }
        } catch {
          // ignore parse errors
        }
      }

      sessionStorage.setItem("softSkillsError", "Aucun résultat soft skills trouvé.");
      router.replace("/soft-skills");
    };
    load();
  }, []);

  useEffect(() => {
    const fetchAi = async () => {
      if (!Object.keys(scores).length || aiFetchedRef.current) return;
      aiFetchedRef.current = true;
      setAiLoading(true);
      try {
        const response = await fetch("/api/soft-skills/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ scores }),
        });
        if (!response.ok) return;
        const data = (await response.json()) as { analysis?: string };
        if (data?.analysis) {
          setAiAnalysis(data.analysis);
        }
      } catch {
        // ignore AI errors
      } finally {
        setAiLoading(false);
      }
    };
    fetchAi();
  }, [scores]);

  const ranking = useMemo(() => {
    const entries = Object.entries(scores).map(([label, value]) => ({ label, value }));
    return entries.sort((a, b) => b.value - a.value);
  }, [scores]);

  const topTwo = useMemo(() => ranking.slice(0, 2), [ranking]);
  const topOne = topTwo[0]?.label ?? "ta force principale";
  const topTwoLabel = topTwo[1]?.label ?? "ta force secondaire";
  const lowest = ranking.length ? ranking[ranking.length - 1] : null;
  const totalScore = useMemo(() => Object.values(scores).reduce((sum, value) => sum + value, 0), [scores]);
  const shareText = useMemo(() => {
    return `Je viens de cartographier mes Soft Skills sur Beyond Connect. Mes forces dominantes : ${topOne} et ${topTwoLabel}. Prêt pour de nouveaux défis ! 🚀 #SoftSkills #BeyondConnect`;
  }, [topOne, topTwoLabel]);

  const radarData = useMemo(() => {
    if (!ranking.length) {
      return SOFT_SKILLS.slice(0, 6).map((skill) => ({
        subject: skill.titre,
        score: scores[skill.titre] ?? 0,
      }));
    }
    return ranking.slice(0, 6).map((item) => ({ subject: item.label, score: item.value }));
  }, [ranking, scores]);

  const manifesto = useMemo(() => {
    const topLabels = topTwo.map((item) => item.label.toLowerCase());
    const hasCreativity =
      topLabels.some((label) => label.includes("créativité")) ||
      topLabels.some((label) => label.includes("ouverture"));
    const hasLeadership =
      topLabels.some((label) => label.includes("leadership")) ||
      topLabels.some((label) => label.includes("décision"));

    if (hasCreativity) {
      return {
        title: "Explorateur",
        text:
          "Tu possèdes un profil d'Explorateur, capable de voir des opportunités là où d'autres voient des impasses. " +
          "Ta curiosité nourrit l'innovation et t'aide à transformer les idées en pistes concrètes.",
      };
    }

    if (hasLeadership) {
      return {
        title: "Bâtisseur",
        text:
          "Ton profil révèle un Tempérament de Bâtisseur, orienté vers l'action et l'impact collectif. " +
          "Tu mobilises l'énergie du groupe et avances avec clarté vers des objectifs ambitieux.",
      };
    }

    return {
      title: "Équilibré",
      text:
        "Ton profil montre une intelligence relationnelle solide et une capacité d'adaptation précieuse. " +
        "Tu sais écouter, ajuster et progresser avec constance dans des environnements exigeants.",
    };
  }, [topTwo]);

  const aiArchetype = useMemo(() => {
    if (!aiAnalysis) return null;
    const match = aiAnalysis.match(/Archétype[^:]*:\s*(.+)/i);
    return match?.[1]?.trim() || null;
  }, [aiAnalysis]);

  const handleLinkedInShare = async () => {
    try {
      await navigator.clipboard.writeText(shareText);
    } catch {
      // ignore clipboard errors
    }
    const shareUrl = "https://beyond-connect.fr";
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
      "_blank",
    );
  };

  return (
    <div className="min-h-screen bg-black font-['Inter'] text-white">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap");
      `}</style>
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center px-6 py-20">
        <div className="w-full space-y-10">
          <div className="text-center">
            <h1 className="text-6xl font-semibold tracking-tight">
              <span className="bg-gradient-to-r from-white via-[#E5E7EB] to-[#9CA3AF] bg-clip-text text-transparent">
                Voici ton empreinte.
              </span>
            </h1>
            <p className="mt-4 text-[15px] text-[#9CA3AF]">Ton potentiel n&apos;est plus invisible.</p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="mx-auto h-[420px] w-full max-w-4xl"
          >
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.12)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#E5E7EB", fontSize: 12 }} />
                <Radar dataKey="score" stroke="#FF9900" fill="rgba(255,153,0,0.2)" />
                <Tooltip
                  contentStyle={{ background: "#0F0F0F", border: "1px solid rgba(255,255,255,0.1)", color: "#fff" }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>

          <div className="flex items-center justify-center">
            <button
              onClick={handleLinkedInShare}
              className="inline-flex w-full max-w-md items-center justify-center gap-2 rounded-full border border-white/20 px-6 py-3 text-[13px] font-semibold text-white hover:border-[#FF9900] hover:text-[#FF9900]"
            >
              <Linkedin className="h-4 w-4" />
              Diffuser mon profil sur LinkedIn
            </button>
          </div>

          <section className="space-y-4">
            <h3 className="text-[16px] font-semibold text-white">Ton ADN en détails</h3>
            <div className="space-y-3">
              {ranking.map((skill, index) => (
                <div key={skill.label} className="flex items-center gap-4 text-[12px]">
                  <span className="w-40 text-[#9CA3AF]">{skill.label}</span>
                  <div className="flex-1">
                    <div className="h-1 rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(skill.value / 15) * 100}%` }}
                        transition={{ duration: 0.8, delay: index * 0.03 }}
                        className="h-full rounded-full bg-[#FF9900]"
                      />
                    </div>
                  </div>
                  <span className="w-12 text-right text-white">{skill.value}/15</span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-[20px] border border-white/10 bg-[#1C1C1E] p-6">
            <div className="text-[12px] uppercase tracking-[0.2em] text-[#9CA3AF]">L'Analyse de Beyond</div>
            {aiLoading ? (
              <div className="mt-4 text-[15px] text-white/60">
                <span className="inline-flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
                  L&apos;IA analyse votre empreinte cognitive...
                </span>
              </div>
            ) : (
              <motion.p
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="mt-4 text-[16px] leading-relaxed"
              >
                {aiArchetype ? (
                  <span className="bg-gradient-to-r from-white via-[#E5E7EB] to-[#9CA3AF] bg-clip-text text-transparent font-semibold">
                    {aiArchetype}
                  </span>
                ) : (
                  <span className="text-white">{manifesto.title}</span>
                )}
                <span className="text-white/60"> — {aiAnalysis || manifesto.text}</span>
              </motion.p>
            )}
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-[20px] border border-white/10 bg-[#1C1C1E] p-6">
              <div className="text-[12px] uppercase tracking-[0.2em] text-[#9CA3AF]">Top 1</div>
              <div className="mt-3 text-[16px] font-semibold text-white">
                Ta plus grande force : {topOne}
              </div>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-[#1C1C1E] p-6">
              <div className="text-[12px] uppercase tracking-[0.2em] text-[#9CA3AF]">Conseil</div>
              <div className="mt-3 text-[14px] text-white">
                {lowest
                  ? `À renforcer : ${lowest.label}. Planifie un objectif simple cette semaine pour progresser.`
                  : "Poursuis sur ta dynamique actuelle pour renforcer tes acquis."}
              </div>
            </div>
            <div className="rounded-[20px] border border-white/10 bg-[#1C1C1E] p-6">
              <div className="text-[12px] uppercase tracking-[0.2em] text-[#9CA3AF]">Score certifié</div>
              <div className="mt-3 text-[20px] font-semibold text-white">{totalScore}/300</div>
            </div>
          </div>

          <div className="text-center">
            <Link href="/dashboard/apprenant" className="text-[12px] text-[#6B7280] hover:text-white">
              Retour au dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
