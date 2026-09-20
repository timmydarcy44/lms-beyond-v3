"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, FileUp, Loader2, Search } from "lucide-react";

import {
  SkillsEmptyHint,
  SkillsSectionKicker,
} from "@/components/apprenant/skills/skills-ui";
import { useEdgeSkillsCenter } from "@/hooks/use-edge-skills-center";
import {
  PROOF_METHODS,
  encodeSkillParam,
} from "@/lib/apprenant/edge-skills-center";
import {
  APPRENANT_PAGE_SHELL,
  CONNECT_BTN_PRIMARY,
  CONNECT_BTN_SECONDARY,
} from "@/lib/apprenant/connect-nav";
import { searchCatalogEntries, listCatalogEntries } from "@/lib/hard-skills/hard-skills-portfolio";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

export default function ProveInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselect = searchParams.get("skill")?.trim() || "";
  const { records, attachProofNote, loading, upsertSkill } = useEdgeSkillsCenter();

  const [step, setStep] = useState<Step>(preselect ? 2 : 1);
  const [query, setQuery] = useState("");
  const [skill, setSkill] = useState(preselect);
  const [methodId, setMethodId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [fileName, setFileName] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const skillOptions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromPortfolio = records.map((r) => r.name);
    if (!q) {
      if (fromPortfolio.length) return fromPortfolio.slice(0, 20);
      return listCatalogEntries()
        .map((e) => e.name)
        .slice(0, 20);
    }
    const catalog = searchCatalogEntries(query).map((e) => e.name);
    return [...new Set([...fromPortfolio, ...catalog])]
      .filter((n) => n.toLowerCase().includes(q))
      .slice(0, 20);
  }, [records, query]);

  const method = PROOF_METHODS.find((m) => m.id === methodId) ?? null;
  const needsUpload =
    methodId === "document" ||
    methodId === "video" ||
    methodId === "realization" ||
    methodId === "certification";

  const submit = async () => {
    if (!skill || !methodId) return;
    setSaving(true);
    setError(null);
    try {
      const existing = records.find((r) => r.name.toLowerCase() === skill.toLowerCase());
      if (!existing) {
        await upsertSkill(skill, "Intermédiaire", { source: "manual" });
      }
      const summary = [method?.label, fileName ? `Fichier : ${fileName}` : null, note.trim() || null]
        .filter(Boolean)
        .join(" · ");
      const proofType =
        methodId === "video"
          ? "other"
          : methodId === "realization"
            ? "portfolio"
            : note.trim().startsWith("http")
              ? "link"
              : "document";
      await attachProofNote(skill, summary || method?.label || "Preuve déposée", proofType);
      setDone(true);
      setStep(3);
    } catch {
      setError("Impossible d’enregistrer la preuve.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`${APPRENANT_PAGE_SHELL} max-w-2xl pb-24`}>
      <button
        type="button"
        onClick={() =>
          step === 1
            ? router.push("/dashboard/apprenant/skills")
            : setStep((s) => (s > 1 ? ((s - 1) as Step) : s))
        }
        className="inline-flex items-center gap-2 text-[13px] text-white/40 transition hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour
      </button>

      <header className="mt-6 space-y-2">
        <SkillsSectionKicker>Prouver</SkillsSectionKicker>
        <h1 className="text-[28px] font-bold tracking-[-0.03em] text-white sm:text-[32px]">
          {step === 1 && "Quelle compétence prouver ?"}
          {step === 2 && "Comment souhaitez-vous la prouver ?"}
          {step === 3 && "Preuve enregistrée"}
        </h1>
        <p className="text-[13px] text-white/35">Étape {Math.min(step, 2)} / 2</p>
      </header>

      {loading ? (
        <div className="mt-10 flex items-center gap-2 text-white/40">
          <Loader2 className="h-4 w-4 animate-spin" />
          Chargement…
        </div>
      ) : null}

      {step === 1 && (
        <div className="mt-8 space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/35" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher une compétence…"
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-4 text-[14px] text-white outline-none placeholder:text-white/25 focus:border-[#3D7BFF]/40"
              autoFocus
            />
          </div>
          <ul className="divide-y divide-white/[0.05] overflow-hidden rounded-2xl border border-white/[0.06]">
            {skillOptions.map((name) => (
              <li key={name}>
                <button
                  type="button"
                  onClick={() => {
                    setSkill(name);
                    setStep(2);
                  }}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition hover:bg-white/[0.04]"
                >
                  <span className="text-[14px] font-medium text-white">{name}</span>
                  <ArrowRight className="h-4 w-4 text-white/25" />
                </button>
              </li>
            ))}
            {skillOptions.length === 0 && (
              <li className="px-4 py-6">
                <SkillsEmptyHint>Aucune compétence trouvée.</SkillsEmptyHint>
              </li>
            )}
          </ul>
        </div>
      )}

      {step === 2 && (
        <div className="mt-8 space-y-6">
          <p className="text-[18px] font-semibold text-white">{skill}</p>

          <div className="grid gap-2">
            {PROOF_METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethodId(m.id)}
                className={cn(
                  "rounded-xl border px-4 py-3.5 text-left transition",
                  methodId === m.id
                    ? "border-[#3D7BFF]/45 bg-[#3D7BFF]/10"
                    : "border-white/[0.07] bg-white/[0.02] hover:border-white/15",
                )}
              >
                <span className="block text-[14px] font-medium text-white">{m.label}</span>
                <span className="mt-0.5 block text-[12px] text-white/35">{m.hint}</span>
              </button>
            ))}
          </div>

          {methodId && (
            <div className="space-y-4 border-t border-white/[0.06] pt-6">
              {needsUpload && (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-white/[0.02] px-4 py-8 transition hover:border-[#3D7BFF]/35">
                  <FileUp className="h-5 w-5 text-[#7BA7FF]" />
                  <span className="text-[13px] text-white/60">
                    {fileName || "PDF, image, document ou vidéo"}
                  </span>
                  <input
                    type="file"
                    accept=".pdf,image/*,.doc,.docx,.ppt,.pptx,video/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      setFileName(f?.name ?? null);
                    }}
                  />
                </label>
              )}
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                placeholder="Lien, description ou référence de la preuve…"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-[14px] text-white outline-none placeholder:text-white/25 focus:border-[#3D7BFF]/40"
              />
              {error && <p className="text-[13px] text-rose-300">{error}</p>}
              <button
                type="button"
                disabled={
                  saving ||
                  (!note.trim() &&
                    !fileName &&
                    methodId !== "edge_eval" &&
                    methodId !== "roleplay" &&
                    methodId !== "ask_validation")
                }
                onClick={() => void submit()}
                className={cn(CONNECT_BTN_PRIMARY, "disabled:opacity-40")}
              >
                {saving ? "Enregistrement…" : "Attacher la preuve"}
              </button>
            </div>
          )}
        </div>
      )}

      {step === 3 && done && (
        <div className="mt-10 space-y-6">
          <p className="text-[16px] leading-relaxed text-white/70">
            Votre preuve est rattachée à <span className="font-semibold text-white">{skill}</span>.
            Elle alimente automatiquement la synthèse de votre Profil.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              href={`/dashboard/apprenant/skills/c/${encodeSkillParam(skill)}`}
              className={CONNECT_BTN_PRIMARY}
            >
              Voir la fiche compétence
            </Link>
            <Link href="/dashboard/apprenant/skills/preuves" className={CONNECT_BTN_SECONDARY}>
              Mes preuves
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
