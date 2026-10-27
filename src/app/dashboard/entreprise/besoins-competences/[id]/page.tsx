"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import EnterpriseSidebar from "@/components/EnterpriseSidebar";
import { ENTREPRISE_H1_CLASS } from "@/lib/entreprise/styles";
import { formatGap, formatScoreOn15 } from "@/lib/entreprise/metier-skill-gaps";
import { gapSeverityLabel, type GapSeverity } from "@/lib/entreprise/skills-gap-config";
import { cn } from "@/lib/utils";

type Action = {
  type: string;
  label: string;
  href: string;
  price_note?: string;
  matches_count?: number;
};

type NeedDetail = {
  id: string;
  skill: string;
  metier_title: string;
  department: string | null;
  target: number;
  avg_observed: number;
  avg_gap: number;
  evaluated_count: number;
  under_target_count: number;
  under_target_pct: number;
  scope_label: string;
  representative: boolean;
  insufficient_reason: string | null;
  explanation: string;
  employees: Array<{
    id: string;
    name: string;
    observed: number;
    gap: number;
    severity: GapSeverity;
  }>;
  actions: Action[];
};

const ACTION_VISUALS: Record<
  string,
  { image: string; description: string; imagePosition?: string }
> = {
  edge_online: {
    image: "/edge-lab/objective-online-devices.png",
    description: "Parcours digital à la carte",
    imagePosition: "center",
  },
  coaching: {
    image:
      "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=1200&q=80",
    description: "Accompagnement 1:1",
    imagePosition: "top",
  },
  create_parcours: {
    image: "/edge-lab/cover_management.png",
    description: "Parcours de montée en compétences",
    imagePosition: "center",
  },
  create_internal_formation: {
    image: "/edge-lab/cover_analyse_comportementale.png",
    description: "Formation interne sur mesure",
    imagePosition: "center",
  },
  request_edge_training: {
    image: "/edge-lab/programme-ia.png",
    description: "Atelier présentiel / blended",
    imagePosition: "center",
  },
  recruit: {
    image:
      "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1200&q=80",
    description: "Recruter la compétence manquante",
    imagePosition: "center",
  },
};

const FALLBACK_VISUAL = {
  image:
    "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80",
  description: "Action RH",
  imagePosition: "center",
};

function actionSubtitle(action: Action) {
  if (action.price_note) return action.price_note;
  return ACTION_VISUALS[action.type]?.description ?? FALLBACK_VISUAL.description;
}

export default function BesoinCompetencesDetailPage() {
  const params = useParams<{ id: string }>();
  const needId = decodeURIComponent(String(params.id ?? ""));

  const [need, setNeed] = useState<NeedDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!needId) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/dashboard/entreprise/besoins-competences/${encodeURIComponent(needId)}`,
        );
        const text = await res.text();
        const json = text ? JSON.parse(text) : {};
        if (!res.ok) throw new Error(json.error || "Chargement impossible");
        if (!cancelled) setNeed(json.need as NeedDetail);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [needId]);

  return (
    <div className="flex min-h-screen bg-[#f5f5f7] text-gray-900">
      <EnterpriseSidebar />
      <main className="min-h-screen flex-1 px-4 py-8 sm:px-6 lg:px-10 lg:pl-[280px]">
        <Link
          href={
            need
              ? `/dashboard/entreprise/besoins-competences/metier/${encodeURIComponent(need.metier_id)}`
              : "/dashboard/entreprise/besoins-competences"
          }
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-gray-950"
        >
          <ArrowLeft className="h-4 w-4" />{" "}
          {need ? need.metier_title : "Besoins en compétences"}
        </Link>

        {loading ? (
          <p className="mt-8 text-sm text-gray-500">Chargement…</p>
        ) : error ? (
          <p className="mt-8 text-sm text-red-600">{error}</p>
        ) : need ? (
          <>
            <div className="mt-6 mb-8">
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 sm:text-left">
                {need.metier_title}
                {need.department ? ` · ${need.department}` : ""} · Soft Skill à renforcer
              </p>
              <h1 className={cn(ENTREPRISE_H1_CLASS, "mt-2")}>{need.skill}</h1>
              <p className="mt-2 text-center text-sm text-gray-500 sm:text-left">
                Écart vs cible attendue pour le poste « {need.metier_title} » · {need.scope_label}
              </p>
            </div>

            <section className="overflow-hidden rounded-[28px] bg-white shadow-[0_10px_30px_rgba(0,0,0,0.06)]">
              <div className="grid gap-0 lg:grid-cols-[1.1fr_0.9fr]">
                <div className="relative min-h-[220px] lg:min-h-[280px]">
                  <Image
                    src="/edge-lab/cover_analyse_comportementale.png"
                    alt=""
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    priority
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/25 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-6">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">
                      Skills Gap · /15
                    </p>
                    <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/95">
                      {need.explanation}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 p-5 sm:p-6">
                  {[
                    { label: "Cible", value: formatScoreOn15(need.target) },
                    { label: "Moyenne", value: formatScoreOn15(need.avg_observed) },
                    { label: "Écart", value: formatGap(need.avg_gap) },
                    {
                      label: "Sous cible",
                      value: `${need.under_target_count}/${need.evaluated_count}`,
                    },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="rounded-[20px] bg-[#f5f5f7] px-4 py-4"
                    >
                      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gray-400">
                        {item.label}
                      </p>
                      <p className="mt-2 text-2xl font-semibold tracking-tight text-gray-950 [font-family:-apple-system,'SF_Pro_Display',BlinkMacSystemFont,sans-serif]">
                        {item.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              {!need.representative && need.insufficient_reason ? (
                <p className="border-t border-gray-100 px-6 py-3 text-xs text-amber-700">
                  {need.insufficient_reason}
                </p>
              ) : null}
            </section>

            <section className="mt-10">
              <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Actions recommandées
              </h2>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {need.actions.map((action) => {
                  const visual = ACTION_VISUALS[action.type] ?? FALLBACK_VISUAL;
                  return (
                    <Link
                      key={`${action.type}-${action.href}`}
                      href={action.href}
                      className="group relative block aspect-[5/4] overflow-hidden rounded-[24px] shadow-[0_10px_28px_rgba(0,0,0,0.1)] transition duration-400 ease-out hover:-translate-y-0.5 hover:shadow-[0_16px_36px_rgba(0,0,0,0.16)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500"
                    >
                      <Image
                        src={visual.image}
                        alt=""
                        fill
                        sizes="(max-width: 768px) 50vw, 33vw"
                        className="object-cover transition duration-500 ease-out group-hover:scale-[1.05]"
                        style={{ objectPosition: visual.imagePosition ?? "center" }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />
                      <div className="absolute inset-x-0 bottom-0 p-3.5 sm:p-4">
                        <h3 className="text-[15px] font-semibold leading-tight tracking-tight text-white [font-family:-apple-system,'SF_Pro_Display',BlinkMacSystemFont,sans-serif]">
                          {action.label}
                        </h3>
                        <p className="mt-1 line-clamp-1 text-[11px] text-white/70">
                          {actionSubtitle(action)}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>

            <section className="mt-10">
              <h2 className="mb-4 text-[13px] font-semibold uppercase tracking-[0.18em] text-gray-400">
                Collaborateurs sous cible
              </h2>
              <div className="space-y-2">
                {need.employees.length === 0 ? (
                  <p className="text-sm text-gray-500">Aucun collaborateur sous la cible.</p>
                ) : (
                  need.employees.map((emp) => (
                    <Link
                      key={emp.id}
                      href={`/dashboard/entreprise/salaries/${emp.id}`}
                      className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] bg-white px-4 py-3.5 shadow-[0_6px_18px_rgba(0,0,0,0.05)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_24px_rgba(0,0,0,0.08)]"
                    >
                      <div>
                        <p className="font-semibold text-gray-900">{emp.name}</p>
                        <p className="text-xs text-gray-500">
                          {gapSeverityLabel(emp.severity)}
                        </p>
                      </div>
                      <div className="flex gap-4 text-sm font-semibold">
                        <span>{formatScoreOn15(emp.observed)}</span>
                        <span className="text-red-600">{formatGap(emp.gap)}</span>
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}
