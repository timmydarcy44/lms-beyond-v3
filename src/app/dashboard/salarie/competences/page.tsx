"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import { ProfilEdgeHardSkillsSection } from "@/components/apprenant/profil-edge/sections/profil-edge-hard-skills-section";
import { SoftSkillsRankingList } from "@/components/apprenant/soft-skills-ranking-list";
import { SALARIE_PAGE_SHELL } from "@/lib/salarie/connect-nav";
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
    <div className={`${SALARIE_PAGE_SHELL} min-h-screen bg-[#F4F5F7] text-[#14151A]`}>
      <section className="mb-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#8B909A]">Profil</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">Mes compétences</h1>
      </section>

      <section className="mb-8 rounded-[28px] bg-white p-6 shadow-[0_12px_40px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Soft skills</h2>
          <Link href="/dashboard/salarie/test-soft-skills" className="text-sm font-semibold text-[#C9C2FF]">
            Passer le test
          </Link>
        </div>
        <div className="mt-4">
          {softSkills.length ? (
            <SoftSkillsRankingList items={softSkills} variant="light" />
          ) : (
            <p className="text-sm text-[#5C6370]">Aucun résultat de test pour le moment.</p>
          )}
        </div>
        {manual.length ? (
          <ul className="mt-4 space-y-2">
            {manual.map((skill) => (
              <li key={skill.name} className="flex items-center justify-between rounded-xl bg-[#F4F5F7] px-3 py-2 text-sm">
                <span>{skill.name}</span>
                <span className="text-[#8B909A]">{skill.level} · déclarée</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_180px_auto]">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Ajouter une soft skill"
            className="rounded-2xl border border-black/10 bg-[#F4F5F7] px-4 py-3 text-sm outline-none"
          />
          <select
            value={level}
            onChange={(event) => setLevel(event.target.value)}
            className="rounded-2xl border border-black/10 bg-white px-4 py-3 text-sm outline-none"
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
