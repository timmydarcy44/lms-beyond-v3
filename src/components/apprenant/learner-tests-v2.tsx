"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Loader2, Lock } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import {
  buildDiscObservation,
  buildIdmcObservation,
  buildSoftSkillsObservation,
} from "@/lib/apprenant/assessment-observations";
import { formatDiscProfileSentence } from "@/lib/disc/disc-profile-label";
import { normalizeDiscScores, resolveDiscProfile } from "@/lib/disc/disc-scoring";
import { AXES_LABELS, type AxisKey } from "@/lib/idmc/idmc-display";
import type { DiscScores } from "@/components/apprenant/apprenant-assessment-results";

const C = {
  card: "#0F1428",
  border: "#1C2443",
  secondary: "#9AA3BD",
  tertiary: "#6C7593",
  violet: "#6E5BFF",
  blue: "#8DB8FF",
  turquoise: "#5EDCC3",
};

type TestCard = {
  id: string;
  name: string;
  sub: string | null;
  done: boolean;
  headline: string;
  explanation: string;
  pills: string[];
  pillColor: string;
  detailHref: string;
  date: string | null;
};

function monthsSince(iso: string | null) {
  if (!iso) return null;
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return null;
  return (Date.now() - t) / (1000 * 60 * 60 * 24 * 30);
}

function toTutoiement(text: string) {
  return text
    .replace(/\bVotre\b/g, "Ton")
    .replace(/\bvotre\b/g, "ton")
    .replace(/\bVous\b/g, "Tu")
    .replace(/\bvous\b/g, "tu")
    .replace(/\bvos\b/g, "tes")
    .replace(/\bVos\b/g, "Tes");
}

function stripPercents(text: string) {
  return text
    .replace(/\s*\(\s*\d+\s*%\s*\)/g, "")
    .replace(/\s+\d+\s*%/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function LearnerTestsV2() {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<TestCard[]>([]);
  const [canRetake, setCanRetake] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const sb = createSupabaseBrowserClient();
        if (!sb) throw new Error("Session indisponible");
        const { data: auth } = await sb.auth.getUser();
        const uid = auth.user?.id;
        if (!uid) throw new Error("Non connecté");

        const [disc, idmc, soft] = await Promise.all([
          sb.from("disc_resultats").select("scores, updated_at").eq("profile_id", uid).maybeSingle(),
          sb.from("idmc_resultats").select("scores, updated_at").eq("profile_id", uid).maybeSingle(),
          sb
            .from("soft_skills_resultats")
            .select("scores, taken_at")
            .eq("learner_id", uid)
            .order("taken_at", { ascending: false })
            .limit(1)
            .maybeSingle(),
        ]);

        const next: TestCard[] = [];

        // DISC
        if (disc.data?.scores) {
          const scores = normalizeDiscScores(disc.data.scores as DiscScores);
          const { dominant } = resolveDiscProfile(scores);
          const labels: Record<string, string> = {
            D: "Décision",
            I: "Influence",
            S: "Stabilité",
            C: "Conformité",
          };
          const sorted = (Object.entries(scores) as Array<[keyof DiscScores, number]>).sort(
            (a, b) => b[1] - a[1],
          );
          next.push({
            id: "disc",
            name: "Profil comportemental",
            sub: "DISC",
            done: true,
            headline: formatDiscProfileSentence(scores)
              .replace(/^Votre profil comportemental est principalement /i, "")
              .replace(/\.$/, ""),
            explanation: toTutoiement(buildDiscObservation(scores)),
            pills: sorted.slice(0, 3).map(([k]) => labels[k] || k),
            pillColor: C.blue,
            detailHref: "/dashboard/apprenant/profil-comportemental",
            date: disc.data.updated_at ? String(disc.data.updated_at).slice(0, 10) : null,
          });
        } else {
          next.push({
            id: "disc",
            name: "Profil comportemental",
            sub: "DISC",
            done: false,
            headline: "Pas encore passé",
            explanation: "Ce test révèle ta façon d’agir et de collaborer.",
            pills: [],
            pillColor: C.blue,
            detailHref: "/dashboard/apprenant/disc",
            date: null,
          });
        }

        // IDMC
        if (idmc.data?.scores) {
          const axes = idmc.data.scores as Record<AxisKey, number>;
          const ranked = (Object.entries(axes) as Array<[AxisKey, number]>).sort(
            (a, b) => b[1] - a[1],
          );
          const top = ranked[0];
          next.push({
            id: "idmc",
            name: "Ta façon d’apprendre",
            sub: "IDMC",
            done: true,
            headline: top ? String(AXES_LABELS[top[0]] || top[0]) : "Profil IDMC disponible",
            explanation: toTutoiement(stripPercents(buildIdmcObservation(axes))),
            pills: ranked.slice(0, 3).map(([k]) => AXES_LABELS[k] || k),
            pillColor: C.violet,
            detailHref: "/dashboard/apprenant/profil-comportemental",
            date: idmc.data.updated_at ? String(idmc.data.updated_at).slice(0, 10) : null,
          });
        } else {
          next.push({
            id: "idmc",
            name: "Ta façon d’apprendre",
            sub: "IDMC",
            done: false,
            headline: "Pas encore passé",
            explanation: "Ce test indique comment tu apprends le mieux.",
            pills: [],
            pillColor: C.violet,
            detailHref: "/dashboard/apprenant/idmc-intro",
            date: null,
          });
        }

        // Soft skills
        const softScores = (soft.data?.scores ?? null) as Record<string, number> | null;
        if (softScores && Object.keys(softScores).length) {
          const items = Object.entries(softScores).map(([skill, score]) => ({
            skill,
            score: Number(score) || 0,
          }));
          const top = [...items].sort((a, b) => b.score - a.score).slice(0, 3);
          next.push({
            id: "soft",
            name: "Tes soft skills",
            sub: null,
            done: true,
            headline: top[0] ? `${top[0].skill} en tête` : "Soft skills disponibles",
            explanation: toTutoiement(buildSoftSkillsObservation(items)),
            pills: top.map((t) => t.skill),
            pillColor: C.turquoise,
            detailHref: "/dashboard/apprenant/profil-comportemental",
            date: soft.data?.taken_at ? String(soft.data.taken_at).slice(0, 10) : null,
          });
        } else {
          next.push({
            id: "soft",
            name: "Tes soft skills",
            sub: null,
            done: false,
            headline: "Pas encore passé",
            explanation: "Ce test met en avant tes forces relationnelles et organisationnelles.",
            pills: [],
            pillColor: C.turquoise,
            detailHref: "/dashboard/apprenant/soft-skills",
            date: null,
          });
        }

        const dates = [
          disc.data?.updated_at ? String(disc.data.updated_at) : null,
          idmc.data?.updated_at ? String(idmc.data.updated_at) : null,
          soft.data?.taken_at ? String(soft.data.taken_at) : null,
        ].filter(Boolean) as string[];
        const oldestMonths = dates.length
          ? Math.min(...dates.map((d) => monthsSince(d) ?? 0))
          : 99;
        // Délai 6 mois par défaut si tous les tests sont faits
        const allDone = next.every((c) => c.done);
        if (!cancelled) {
          setCards(next);
          setCanRetake(!allDone || oldestMonths >= 6);
          setLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Erreur");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-[#9AA3BD]">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 pb-16 pt-2 text-[#F2F4FA] sm:px-6 lg:px-8">
      <header>
        <h1 className="text-[34px] font-extrabold tracking-tight sm:text-[40px]">Mes tests</h1>
        <p className="mt-1 text-sm" style={{ color: C.secondary }}>
          Ce qu’ils disent de toi, pour mieux choisir et mieux apprendre
        </p>
      </header>

      {error ? <p className="text-sm text-[#FF8A9B]">{error}</p> : null}

      <div
        className="flex flex-col gap-3 rounded-2xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
        style={{ background: "#151C3A", borderColor: C.border }}
      >
        <p className="flex items-start gap-2 text-sm" style={{ color: C.secondary }}>
          <Lock className="mt-0.5 h-4 w-4 shrink-0" />
          Tes résultats sont privés. Personne ne les voit, ni ton école ni une entreprise, sauf si
          tu choisis de les partager.
        </p>
        <Link
          href="/dashboard/apprenant/partage-entreprise"
          className="shrink-0 text-sm font-semibold text-[#A99BFF]"
        >
          Gérer le partage →
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => (
          <article
            key={card.id}
            className="flex flex-col rounded-3xl border p-5"
            style={{ background: C.card, borderColor: C.border }}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-sm font-bold" style={{ color: C.tertiary }}>
                  {card.name}
                </p>
                {card.sub ? (
                  <p className="text-xs" style={{ color: C.tertiary }}>
                    {card.sub}
                  </p>
                ) : null}
              </div>
              {card.date ? (
                <span className="text-xs" style={{ color: C.tertiary }}>
                  {card.date}
                </span>
              ) : null}
            </div>
            <h2 className="mt-4 text-[26px] font-extrabold leading-tight">{card.headline}</h2>
            <p className="mt-3 line-clamp-3 text-sm leading-relaxed" style={{ color: C.secondary }}>
              {card.explanation}
            </p>
            {card.pills.length ? (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {card.pills.map((p) => (
                  <span
                    key={p}
                    className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                    style={{ background: "#151C3A", color: card.pillColor }}
                  >
                    {p}
                  </span>
                ))}
              </div>
            ) : null}
            <Link
              href={card.detailHref}
              className="mt-auto pt-5 text-sm font-semibold text-[#A99BFF]"
            >
              {card.done ? "Voir le détail →" : "Passer le test →"}
            </Link>
          </article>
        ))}
      </div>

      <article
        className="flex flex-col gap-4 rounded-3xl border p-5 sm:flex-row sm:items-center sm:justify-between"
        style={{ background: C.card, borderColor: C.border }}
      >
        <div>
          <h3 className="text-lg font-extrabold">Ton profil a évolué ?</h3>
          <p className="mt-1 text-sm" style={{ color: C.secondary }}>
            {canRetake
              ? "Tu peux repasser un test pour actualiser ton profil."
              : "Tu pourras repasser un test dans 6 mois après le dernier passage."}
          </p>
        </div>
        {canRetake ? (
          <Link
            href="/dashboard/apprenant/profil-comportemental"
            className="shrink-0 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#0A0F1E]"
          >
            Repasser un test
          </Link>
        ) : (
          <span
            className="shrink-0 rounded-full border px-5 py-2.5 text-sm font-semibold"
            style={{ borderColor: C.border, color: C.tertiary }}
          >
            Disponible plus tard
          </span>
        )}
      </article>
    </div>
  );
}
