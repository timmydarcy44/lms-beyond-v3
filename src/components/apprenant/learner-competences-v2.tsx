"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { useEdgeSkillsCenter } from "@/hooks/use-edge-skills-center";
import { skillsFromMatching } from "@/lib/apprenant/learner-home-v2-data";
import { listSkillProofs, resolveSkillUxStatus } from "@/lib/hard-skills/hard-skills-portfolio";
import { encodeSkillParam } from "@/lib/apprenant/edge-skills-center";

const C = {
  card: "#0F1428",
  border: "#1C2443",
  secondary: "#9AA3BD",
  tertiary: "#6C7593",
  violet: "#6E5BFF",
  green: "#6BE39B",
  amber: "#F2CF6B",
  blue: "#8DB8FF",
};

type Filter = "all" | "objective";

export function LearnerCompetencesV2() {
  const {
    loading,
    error,
    records,
    meta,
    capital,
    matching,
    careerTitle,
    objectiveLabel,
    visibleBadges,
  } = useEdgeSkillsCenter();
  const [filter, setFilter] = useState<Filter>("all");

  const objectiveSkills = useMemo(() => skillsFromMatching(matching), [matching]);
  const reinforceSet = useMemo(
    () => new Set(objectiveSkills.toStrengthen.map((s) => s.name.toLowerCase())),
    [objectiveSkills],
  );

  const rows = useMemo(() => {
    const fromRecords = records.map((r) => {
      const ux = resolveSkillUxStatus(meta[r.name]);
      const proofs = listSkillProofs(meta[r.name]);
      const proved =
        ux === "proved" || ux === "evaluated" || ux === "validated" || proofs.length > 0;
      const toStrengthen = reinforceSet.has(r.name.toLowerCase());
      let status: "proved" | "declared" | "reinforce" = "declared";
      if (toStrengthen) status = "reinforce";
      else if (proved) status = "proved";
      return {
        name: r.name,
        proofs: proofs.length,
        status,
        lastProofs: proofs,
      };
    });

    // Inclure compétences objectif absentes du portfolio
    for (const s of objectiveSkills.toStrengthen) {
      if (!fromRecords.some((r) => r.name.toLowerCase() === s.name.toLowerCase())) {
        fromRecords.push({ name: s.name, proofs: 0, status: "reinforce", lastProofs: [] });
      }
    }

    if (filter === "objective") {
      const objNames = new Set(
        [...objectiveSkills.acquired, ...objectiveSkills.toStrengthen].map((s) =>
          s.name.toLowerCase(),
        ),
      );
      return fromRecords.filter((r) => objNames.has(r.name.toLowerCase()));
    }
    return fromRecords;
  }, [records, meta, reinforceSet, objectiveSkills, filter]);

  const provedCount = rows.filter((r) => r.status === "proved").length;
  const declaredCount = rows.filter((r) => r.status === "declared").length;
  const reinforceCount = rows.filter((r) => r.status === "reinforce").length;

  const recentProofs = useMemo(() => {
    const all: Array<{ skill: string; title: string; createdAt: string }> = [];
    for (const r of records) {
      for (const p of listSkillProofs(meta[r.name])) {
        all.push({ skill: r.name, title: p.title || "Preuve", createdAt: p.createdAt });
      }
    }
    return all
      .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      .slice(0, 3);
  }, [records, meta]);

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center gap-2 text-[#9AA3BD]">
        <Loader2 className="h-5 w-5 animate-spin" /> Chargement…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 pb-16 pt-2 text-[#F2F4FA] sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-[34px] font-extrabold tracking-tight sm:text-[40px]">
            Mes compétences
          </h1>
          <p className="mt-1 text-sm" style={{ color: C.secondary }}>
            Ce que tu sais faire, et ce que tu peux prouver
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href="/dashboard/apprenant/skills/preuves"
            className="rounded-full border px-4 py-2 text-sm font-semibold"
            style={{ borderColor: C.border, color: C.secondary }}
          >
            ＋ Déposer une preuve
          </Link>
          <Link
            href="/dashboard/apprenant/skills/develop"
            className="rounded-full bg-white px-4 py-2 text-sm font-bold text-[#0A0F1E]"
          >
            ＋ Déclarer une compétence
          </Link>
        </div>
      </header>

      {error ? <p className="text-sm text-[#FF8A9B]">{error}</p> : null}

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            n: provedCount,
            label: "Prouvées",
            hint: "avec une preuve ou un badge",
            color: C.green,
          },
          {
            n: declaredCount,
            label: "Déclarées",
            hint: "à appuyer par une preuve",
            color: C.blue,
          },
          {
            n: reinforceCount,
            label: "À renforcer",
            hint: "pour ton objectif",
            color: C.amber,
          },
          {
            n: capital.badges,
            label: "Open Badges",
            hint: capital.badges ? "dans ton wallet" : "le premier arrive bientôt",
            color: C.violet,
          },
        ].map((c) => (
          <article
            key={c.label}
            className="rounded-3xl border p-4"
            style={{ background: C.card, borderColor: C.border }}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: c.color }} />
              <span className="text-3xl font-extrabold tabular-nums">{c.n}</span>
            </div>
            <p className="mt-1 font-bold">{c.label}</p>
            <p className="text-xs" style={{ color: C.tertiary }}>
              {c.hint}
            </p>
          </article>
        ))}
      </section>

      <div className="grid gap-4 lg:grid-cols-[1.45fr_1fr]">
        <article className="rounded-3xl border p-5" style={{ background: C.card, borderColor: C.border }}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-extrabold">Mon capital de compétences</h2>
            <div className="flex rounded-full border p-0.5" style={{ borderColor: C.border }}>
              {(
                [
                  ["all", "Toutes"],
                  ["objective", "Pour mon objectif"],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setFilter(id)}
                  className="rounded-full px-3 py-1 text-xs font-semibold"
                  style={{
                    background: filter === id ? "#fff" : "transparent",
                    color: filter === id ? "#0A0F1E" : C.secondary,
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          {(careerTitle || objectiveLabel) && filter === "objective" ? (
            <p className="mt-2 text-xs" style={{ color: C.tertiary }}>
              Objectif : {careerTitle || objectiveLabel}
            </p>
          ) : null}

          {rows.length === 0 ? (
            <p className="mt-6 text-sm" style={{ color: C.secondary }}>
              Aucune compétence pour l’instant. Déclare-en une pour démarrer.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {rows.map((r) => (
                <li key={r.name}>
                  <Link
                    href={`/dashboard/apprenant/skills/c/${encodeSkillParam(r.name)}`}
                    className="flex items-center gap-3 rounded-2xl border px-3 py-3 transition hover:brightness-110"
                    style={{ borderColor: C.border, background: "#151C3A" }}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{
                        background:
                          r.status === "proved"
                            ? C.green
                            : r.status === "reinforce"
                              ? C.amber
                              : C.blue,
                      }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold">{r.name}</p>
                      <p className="text-xs" style={{ color: C.tertiary }}>
                        {r.proofs > 0
                          ? `${r.proofs} preuve${r.proofs > 1 ? "s" : ""}`
                          : "aucune preuve"}
                      </p>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
                      style={{
                        background: "#1A2340",
                        color:
                          r.status === "proved"
                            ? C.green
                            : r.status === "reinforce"
                              ? C.amber
                              : C.blue,
                      }}
                    >
                      {r.status === "proved"
                        ? "Prouvée"
                        : r.status === "reinforce"
                          ? "À renforcer"
                          : "Déclarée"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </article>

        <div className="space-y-4">
          <article className="rounded-3xl border p-5" style={{ background: C.card, borderColor: C.border }}>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold">Mes Open Badges</h3>
              <Link href="/dashboard/apprenant/badges" className="text-sm font-semibold text-[#A99BFF]">
                Mon wallet →
              </Link>
            </div>
            {visibleBadges.length ? (
              <ul className="mt-3 space-y-2">
                {visibleBadges.slice(0, 3).map((b) => (
                  <li key={b.id} className="text-sm font-semibold">
                    <Link href={b.presentationHref}>{b.name}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div
                className="mt-4 rounded-2xl border border-dashed p-4 text-sm"
                style={{ borderColor: "#2A3358", color: C.secondary }}
              >
                {objectiveSkills.toStrengthen[0]?.name
                  ? `${objectiveSkills.toStrengthen[0].name} · en préparation`
                  : "Ton premier badge se prépare dans le Training center."}
              </div>
            )}
          </article>

          <article className="rounded-3xl border p-5" style={{ background: C.card, borderColor: C.border }}>
            <div className="flex items-center justify-between">
              <h3 className="font-extrabold">Dernières preuves</h3>
              <Link
                href="/dashboard/apprenant/skills/preuves"
                className="text-sm font-semibold text-[#A99BFF]"
              >
                Tout voir →
              </Link>
            </div>
            {recentProofs.length === 0 ? (
              <p className="mt-3 text-sm" style={{ color: C.secondary }}>
                Aucune preuve déposée pour l’instant.
              </p>
            ) : (
              <ul className="mt-3 space-y-3">
                {recentProofs.map((p, i) => (
                  <li key={i} className="text-sm">
                    <p className="font-semibold">{p.title}</p>
                    <p className="text-xs" style={{ color: C.tertiary }}>
                      {p.skill}
                      {p.createdAt ? ` · ${String(p.createdAt).slice(0, 10)}` : ""}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>
      </div>
    </div>
  );
}
