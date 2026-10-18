"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { ProfilEdgeHardSkillsSection } from "@/components/apprenant/profil-edge/sections/profil-edge-hard-skills-section";
import { SoftSkillsRankingList } from "@/components/apprenant/soft-skills-ranking-list";
import { SALARIE_CARD, SALARIE_PAGE_KICKER, SALARIE_PAGE_SHELL, SALARIE_PAGE_TITLE } from "@/lib/salarie/connect-nav";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type ManualSoft = { name: string; level: string };

export default function SalarieCompetencesPage() {
  const supabase = createSupabaseBrowserClient();
  const [softSkills, setSoftSkills] = useState<Array<{ skill: string; score: number }>>([]);
  const [manual, setManual] = useState<ManualSoft[]>([]);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("Intermédiaire");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const [snapshot, userData] = await Promise.all([
      fetch("/api/dashboard/learner-snapshot", { credentials: "include", cache: "no-store" }).then((res) =>
        res.ok ? res.json() : null,
      ),
      supabase.auth.getUser(),
    ]);
    const radar = Array.isArray(snapshot?.softSkillsRadar) ? snapshot.softSkillsRadar : [];
    setSoftSkills(
      radar
        .map((row: { skill?: string; score?: number }) => ({
          skill: String(row.skill ?? "").trim(),
          score: Number(row.score) || 0,
        }))
        .filter((row: { skill: string }) => row.skill),
    );
    const uid = userData.data.user?.id;
    if (!uid) return;
    const { data } = await supabase.from("profiles").select("skills_metadata").eq("id", uid).maybeSingle();
    const meta = (data?.skills_metadata ?? {}) as Record<string, { level?: string; category?: string }>;
    setManual(
      Object.entries(meta)
        .filter(([, value]) => value?.category === "Soft skill")
        .map(([skill, value]) => ({ name: skill, level: value.level || "Intermédiaire" })),
    );
  }, [supabase]);

  useEffect(() => {
    void load();
  }, [load]);

  const addSoft = async () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setSaving(true);
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData.user?.id;
    if (!uid) {
      setSaving(false);
      return;
    }
    const { data } = await supabase.from("profiles").select("skills_metadata").eq("id", uid).maybeSingle();
    const meta = { ...((data?.skills_metadata ?? {}) as Record<string, unknown>) };
    meta[trimmed] = { level, category: "Soft skill", source: "manual", validated: false };
    await supabase.from("profiles").update({ skills_metadata: meta }).eq("id", uid);
    setName("");
    setSaving(false);
    await load();
  };

  return (
    <div className={SALARIE_PAGE_SHELL}>
      <section className="mb-8">
        <p className={SALARIE_PAGE_KICKER}>Profil</p>
        <h1 className={`${SALARIE_PAGE_TITLE} mt-2`}>Mes compétences</h1>
      </section>

      <section className={`${SALARIE_CARD} mb-8`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-white">Soft skills</h2>
          <Link href="/dashboard/salarie/test-soft-skills" className="text-sm font-semibold text-[#C9C2FF]">
            Passer le test
          </Link>
        </div>
        <div className="mt-4">
          {softSkills.length ? (
            <SoftSkillsRankingList items={softSkills} variant="revolut" />
          ) : (
            <p className="text-sm text-white/55">Aucun résultat de test pour le moment.</p>
          )}
        </div>
        {manual.length ? (
          <ul className="mt-4 space-y-2">
            {manual.map((skill) => (
              <li key={skill.name} className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2 text-sm text-white/80">
                <span>{skill.name}</span>
                <span className="text-white/45">{skill.level} · déclarée</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ajouter une soft skill"
            className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none"
          />
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className="rounded-2xl border border-white/10 bg-[#12141A] px-4 py-3 text-sm text-white outline-none"
          >
            <option>Débutant</option>
            <option>Intermédiaire</option>
            <option>Confirmé</option>
            <option>Expert</option>
          </select>
          <button
            type="button"
            disabled={saving}
            onClick={() => void addSoft()}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
          >
            Déclarer
          </button>
        </div>
      </section>

      <ProfilEdgeHardSkillsSection />
    </div>
  );
}
