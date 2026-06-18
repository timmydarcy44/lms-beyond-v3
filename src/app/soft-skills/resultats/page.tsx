"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Linkedin } from "lucide-react";
import { motion } from "framer-motion";
import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { SOFT_SKILLS } from "@/lib/soft-skills";
import { EDGE_COLORS, EDGE_GRADIENTS } from "@/lib/edge/edge-brand";
import { SimpleMarkdownAnalysis } from "@/lib/markdown/render-simple-markdown";
import { APPRENANT_CARD_BODY } from "@/lib/apprenant/connect-nav";

type ResultPayload = {
  exists: boolean;
  result: {
    total_score?: number | null;
    scores?: Record<string, number> | null;
  } | null;
};

const RADAR_BLUE = EDGE_COLORS.blueAccent;
const RADAR_FILL = "rgba(61,123,255,0.22)";

export default function SoftSkillsResultsPage() {
  const router = useRouter();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const aiFetchedRef = useRef(false);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch("/api/soft-skills/results", { credentials: "include" });
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
      router.replace("/dashboard/apprenant/soft-skills-intro");
    };
    load();
  }, [router]);

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
          "Ton profil révèle un tempérament de Bâtisseur, orienté vers l'action et l'impact collectif. " +
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
    <div
      className="min-h-screen text-white"
      style={{ background: EDGE_GRADIENTS.dashboardPageBg }}
    >
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center px-4 py-12 sm:px-6 sm:py-16">
        <div className="w-full max-w-full space-y-8 sm:space-y-10">
          <div className="text-center">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#60a5fa]">
              Résultats soft skills
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Voici ton empreinte
            </h1>
            <p className="mt-3 text-sm text-white/55 sm:text-base">
              Ton potentiel relationnel, cartographié et certifié.
            </p>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className={`relative mx-auto w-full max-w-4xl overflow-hidden rounded-[24px] p-6 sm:p-8 ${APPRENANT_CARD_BODY}`}
            style={{ background: EDGE_GRADIENTS.hero }}
          >
            <div
              className="pointer-events-none absolute inset-0"
              style={{ background: EDGE_GRADIENTS.heroHalo }}
              aria-hidden
            />
            <div className="relative mx-auto h-[260px] w-full sm:h-[340px] lg:h-[380px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={radarData}>
                  <PolarGrid stroke="rgba(255,255,255,0.15)" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: "#E5E7EB", fontSize: 10 }} />
                  <Radar dataKey="score" stroke={RADAR_BLUE} fill={RADAR_FILL} />
                  <Tooltip
                    contentStyle={{
                      background: "#0f1a3d",
                      border: "1px solid rgba(61,123,255,0.35)",
                      borderRadius: 12,
                      color: "#fff",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          <div className="flex items-center justify-center">
            <button
              type="button"
              onClick={handleLinkedInShare}
              className="inline-flex w-full max-w-md items-center justify-center gap-2 rounded-full border border-[rgba(61,123,255,0.35)] bg-[rgba(61,123,255,0.08)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[rgba(61,123,255,0.14)]"
            >
              <Linkedin className="h-4 w-4" />
              Diffuser mon profil sur LinkedIn
            </button>
          </div>

          <section className={`space-y-4 ${APPRENANT_CARD_BODY}`}>
            <h3 className="text-sm font-semibold text-white">Ton ADN en détails</h3>
            <div className="space-y-3">
              {ranking.map((skill, index) => (
                <div
                  key={skill.label}
                  className="flex flex-col gap-2 text-xs sm:flex-row sm:items-center sm:gap-4 sm:text-sm"
                >
                  <span className="min-w-0 shrink-0 text-white/55 sm:w-44">{skill.label}</span>
                  <div className="min-w-0 flex-1">
                    <div className="h-1.5 rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(skill.value / 15) * 100}%` }}
                        transition={{ duration: 0.8, delay: index * 0.03 }}
                        className="h-full rounded-full"
                        style={{ background: EDGE_GRADIENTS.progress }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-right font-medium text-white sm:w-12">
                    {skill.value}/15
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className={APPRENANT_CARD_BODY}>
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#60a5fa]">
              L&apos;analyse de Beyond
            </div>
            {aiLoading ? (
              <div className="mt-4 text-sm text-white/60">
                <span className="inline-flex items-center gap-2">
                  <span
                    className="h-4 w-4 animate-spin rounded-full border-2 border-white/20"
                    style={{ borderTopColor: EDGE_COLORS.blueAccent }}
                  />
                  L&apos;IA analyse votre empreinte cognitive…
                </span>
              </div>
            ) : aiAnalysis ? (
              <div className="mt-4">
                <SimpleMarkdownAnalysis content={aiAnalysis} />
              </div>
            ) : (
              <div className="mt-4 space-y-2">
                <p className="text-sm font-semibold text-white">{manifesto.title}</p>
                <p className="text-sm leading-relaxed text-white/70">{manifesto.text}</p>
              </div>
            )}
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className={APPRENANT_CARD_BODY}>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#60a5fa]">
                Top 1
              </div>
              <div className="mt-3 text-sm font-semibold text-white">
                Ta plus grande force : {topOne}
              </div>
            </div>
            <div className={APPRENANT_CARD_BODY}>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#60a5fa]">
                Conseil
              </div>
              <div className="mt-3 text-sm text-white/80">
                {lowest
                  ? `À renforcer : ${lowest.label}. Planifie un objectif simple cette semaine pour progresser.`
                  : "Poursuis sur ta dynamique actuelle pour renforcer tes acquis."}
              </div>
            </div>
            <div className={APPRENANT_CARD_BODY}>
              <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#60a5fa]">
                Score certifié
              </div>
              <div className="mt-3 text-xl font-semibold text-white">{totalScore}/300</div>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/dashboard/apprenant"
              className="text-xs uppercase tracking-[0.2em] text-white/45 hover:text-white/70"
            >
              Retour au dashboard
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
