"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { ENTREPRISE_H1_CLASS } from "@/lib/entreprise/styles";
import { formatGap, formatScoreOn15 } from "@/lib/entreprise/metier-skill-gaps";
import { cn } from "@/lib/utils";

type NeedRow = {
  id: string;
  skill: string;
  metier_id: string;
  metier_title: string;
  department: string | null;
  target: number;
  avg_observed: number;
  avg_gap: number;
  evaluated_count: number;
  under_target_count: number;
  under_target_pct: number;
  scope_label: string;
  scope: string;
  representative: boolean;
  priority_score: number;
};

const SKILL_IMAGES = [
  "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1200&q=80",
  "/edge-lab/cover_management.png",
  "https://images.unsplash.com/photo-1600880292089-90a7e086ee0c?auto=format&fit=crop&w=1200&q=80",
  "/edge-lab/cover_analyse_comportementale.png",
  "/edge-lab/programme-ia.png",
] as const;

function skillImage(skill: string, index: number) {
  const hash = skill.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  return SKILL_IMAGES[(hash + index) % SKILL_IMAGES.length]!;
}

function scopeBadge(scope: string) {
  if (scope === "collectif_prioritaire") return "bg-red-500/90 text-white";
  if (scope === "collectif") return "bg-amber-500/90 text-white";
  if (scope === "intermediaire") return "bg-sky-500/90 text-white";
  return "bg-emerald-500/90 text-white";
}

type MobilityMatch = {
  id: string;
  name: string;
  metier_title: string;
  matched_skills: number;
  total_skills: number;
  match_ratio: number;
  avg_observed: number;
};

export default function BesoinsCompetencesMetierPage() {
  const params = useParams<{ metierId: string }>();
  const metierId = decodeURIComponent(String(params.metierId ?? ""));

  const [needs, setNeeds] = useState<NeedRow[]>([]);
  const [mobility, setMobility] = useState<MobilityMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/dashboard/entreprise/besoins-competences");
        const text = await res.text();
        const json = text ? JSON.parse(text) : {};
        if (!res.ok) throw new Error(json.error || "Chargement impossible");
        const all = (json.needs_with_actions ?? []) as NeedRow[];
        const filtered = all.filter(
          (n) => n.metier_id === metierId || n.metier_title === metierId,
        );
        const mobilityMap = (json.metier_mobility ?? {}) as Record<string, MobilityMatch[]>;
        const key =
          Object.keys(mobilityMap).find((k) => k === metierId) ??
          filtered[0]?.metier_id ??
          metierId;
        if (!cancelled) {
          setNeeds(filtered.sort((a, b) => a.avg_gap - b.avg_gap));
          setMobility(mobilityMap[key] ?? []);
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [metierId]);

  const meta = useMemo(() => needs[0] ?? null, [needs]);

  return (
    <div className="flex min-h-screen bg-[#f5f5f7] text-gray-900">
      <EnterpriseSidebar />
      <main className="min-h-screen flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <Link
          href="/dashboard/entreprise/besoins-competences"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-gray-950"
        >
          <ArrowLeft className="h-4 w-4" /> Tous les métiers
        </Link>

        {loading ? (
          <p className="mt-8 text-sm text-gray-500">Chargement…</p>
        ) : error ? (
          <p className="mt-8 text-sm text-red-600">{error}</p>
        ) : !meta ? (
          <p className="mt-8 text-sm text-gray-500">Aucun besoin pour ce métier.</p>
        ) : (
          <>
            <div className="mt-6 mb-8">
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 sm:text-left">
                Métier / poste
                {meta.department ? ` · ${meta.department}` : ""}
              </p>
              <h1 className={cn(ENTREPRISE_H1_CLASS, "mt-2")}>{meta.metier_title}</h1>
              <p className="mt-2 text-center text-sm text-gray-500 sm:text-left">
                {needs.length} Soft Skill{needs.length > 1 ? "s" : ""} sous la cible attendue
                pour ce poste
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {needs.map((need, index) => (
                <Link
                  key={need.id}
                  href={`/dashboard/entreprise/besoins-competences/${encodeURIComponent(need.id)}`}
                  className="group relative block aspect-[5/4] overflow-hidden rounded-[24px] shadow-[0_10px_28px_rgba(0,0,0,0.1)] transition duration-400 ease-out hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.16)]"
                >
                  <Image
                    src={skillImage(need.skill, index)}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 33vw"
                    className="object-cover transition duration-500 ease-out group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-black/10" />
                  <div className="absolute inset-x-0 top-0 flex justify-between p-3.5">
                    <span
                      className={cn(
                        "rounded-full px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm",
                        scopeBadge(need.scope),
                      )}
                    >
                      {need.scope_label}
                    </span>
                    <span className="rounded-full bg-black/35 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
                      {need.under_target_pct} % sous cible
                    </span>
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <h2 className="text-[18px] font-semibold leading-tight tracking-tight text-white [font-family:-apple-system,'SF_Pro_Display',BlinkMacSystemFont,sans-serif]">
                      {need.skill}
                    </h2>
                    <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[12px] font-medium text-white/90">
                      <span>Cible {formatScoreOn15(need.target)}</span>
                      <span>Moy. {formatScoreOn15(need.avg_observed)}</span>
                      <span>Écart {formatGap(need.avg_gap)}</span>
                    </div>
                    <p className="mt-3 text-[13px] font-semibold text-white">
                      Actions recommandées →
                    </p>
                  </div>
                </Link>
              ))}
            </div>

            <section className="mt-10">
              <h2 className="mb-1 text-[13px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Mobilité interne (fit métier)
              </h2>
              <p className="mb-4 text-sm text-gray-500">
                Profils d’autres postes alignés sur au moins 70 % des Soft Skills cibles de ce
                métier (minimum 2 compétences) — pas sur une seule skill.
              </p>
              <div className="space-y-2">
                {mobility.length === 0 ? (
                  <p className="rounded-[20px] bg-white px-4 py-4 text-sm text-gray-500 shadow-[0_6px_18px_rgba(0,0,0,0.05)]">
                    Aucun profil multi-compétences compatible pour l’instant.
                  </p>
                ) : (
                  mobility.map((m) => (
                    <Link
                      key={m.id}
                      href={`/dashboard/entreprise/salaries/${m.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-white px-4 py-3.5 shadow-[0_6px_18px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{m.name}</p>
                        <p className="text-xs text-gray-500">
                          Aujourd’hui : {m.metier_title} · {m.matched_skills}/{m.total_skills}{" "}
                          compétences alignées
                        </p>
                      </div>
                      <span className="text-sm font-semibold text-emerald-700">
                        {Math.round(m.match_ratio * 100)} % fit · moy.{" "}
                        {formatScoreOn15(m.avg_observed)}
                      </span>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
