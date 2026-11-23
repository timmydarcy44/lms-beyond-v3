"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Briefcase, Check, FileUp, Link2, Loader2, Search, Sparkles, X } from "lucide-react";

import {
  DECLARE_CONTEXTS,
  DECLARE_LEVELS,
  declareContextLabel,
  declareLevelLabel,
  type DeclareContextId,
  type DeclareLevelId,
} from "@/lib/skills/declare-levels";
import { cn } from "@/lib/utils";

/* ───────── Types ───────── */

type Kind = "hard" | "soft";
type Step = 1 | 2 | 3 | 4;

type CatalogSkill = {
  id: string;
  slug?: string;
  label: string;
  description?: string | null;
  aliases?: string[];
  is_soft?: boolean;
};

type CatalogDomain = {
  id: string;
  slug?: string;
  label: string;
  position?: number;
  skills: CatalogSkill[];
};

type Catalog = {
  domains: CatalogDomain[];
  softSkills: CatalogSkill[];
  frequent?: unknown[];
};

type MatchCandidate = {
  skill_id: string;
  label: string;
  description?: string | null;
  domain_label?: string | null;
  confidence: number;
};

type MatchResponse = {
  best: MatchCandidate | null;
  alternatives: MatchCandidate[];
  keepRawSuggested: boolean;
  frequent?: unknown[];
};

type PickedSkill = { id: string; label: string };

type MatchStatus = "matched" | "pending_review" | "kept_raw";

/* ───────── Design tokens ───────── */

const C = {
  bg: "#070B18",
  card: "#0F1428",
  border: "#1C2443",
  violet: "#6E5BFF",
  blue: "#8DB8FF",
  green: "#6BE39B",
} as const;

const CONFIDENCE_THRESHOLD = 0.6;
const DEBOUNCE_MS = 400;
const SKILLS_HOME = "/dashboard/apprenant/skills";

const STEP_LABELS = ["Type", "Compétence", "Niveau", "Preuve"] as const;

/* ───────── Helpers ───────── */

function normalizeFrequent(raw: unknown[] | undefined): PickedSkill[] {
  if (!Array.isArray(raw)) return [];
  const out: PickedSkill[] = [];
  for (const item of raw) {
    if (typeof item === "string" && item.trim()) {
      out.push({ id: "", label: item.trim() });
    } else if (item && typeof item === "object") {
      const o = item as Record<string, unknown>;
      const label = typeof o.label === "string" ? o.label : typeof o.name === "string" ? o.name : "";
      const id =
        typeof o.skill_id === "string" ? o.skill_id : typeof o.id === "string" ? o.id : "";
      if (label.trim()) out.push({ id, label: label.trim() });
    }
  }
  return out.slice(0, 8);
}

async function api(
  url: string,
  init?: RequestInit,
): Promise<{ ok: boolean; status: number; data: unknown }> {
  try {
    const res = await fetch(url, {
      ...init,
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
    });
    let data: unknown = null;
    try {
      data = await res.json();
    } catch {
      data = null;
    }
    return { ok: res.ok, status: res.status, data };
  } catch {
    return { ok: false, status: 0, data: null };
  }
}

function extractId(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const d = data as Record<string, unknown>;
  if (typeof d.id === "string") return d.id;
  const inner = d.declaration ?? d.data;
  if (inner && typeof inner === "object" && typeof (inner as Record<string, unknown>).id === "string") {
    return (inner as Record<string, unknown>).id as string;
  }
  return null;
}

/* ───────── Small UI pieces ───────── */

function Bars({ count, active }: { count: number; active: boolean }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4].map((i) => (
        <span
          key={i}
          className="h-1 flex-1 rounded-full"
          style={{ background: i <= count ? (active ? C.blue : `${C.blue}99`) : C.border }}
        />
      ))}
    </div>
  );
}

function RecapRow({ label, value, sub }: { label: string; value: string | null; sub?: string }) {
  return (
    <div className="border-b py-3 last:border-b-0" style={{ borderColor: C.border }}>
      <p className="text-[11px] text-white/40">{label}</p>
      <p className={cn("mt-1 text-[14px] font-semibold", value ? "text-white" : "text-white/25")}>
        {value ?? "—"}
      </p>
      {sub ? <p className="mt-0.5 text-[12px] text-white/40">{sub}</p> : null}
    </div>
  );
}

const primaryBtn =
  "inline-flex items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-[13px] font-semibold text-[#070B18] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-40";
const ghostBtn =
  "inline-flex items-center justify-center gap-2 rounded-full border px-5 py-2.5 text-[13px] font-medium text-white transition hover:bg-white/[0.04] disabled:opacity-40";

/* ───────── Main component ───────── */

export function DeclareSkillFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselect = searchParams.get("skill")?.trim() || "";

  const [step, setStep] = useState<Step>(preselect ? 2 : 1);
  const [kind, setKind] = useState<Kind | null>(null);
  const [rawLabel, setRawLabel] = useState(preselect);
  const [skill, setSkill] = useState<PickedSkill | null>(null);
  const [matchStatus, setMatchStatus] = useState<MatchStatus | null>(null);
  const [matchConfidence, setMatchConfidence] = useState<number | null>(null);
  const [level, setLevel] = useState<DeclareLevelId | null>(null);
  const [context, setContext] = useState<DeclareContextId | null>(null);
  const [proofUrl, setProofUrl] = useState("");
  const [proofNote, setProofNote] = useState("");
  const [proofFile, setProofFile] = useState<File | null>(null);

  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [matching, setMatching] = useState(false);
  const [browserOpen, setBrowserOpen] = useState(false);

  const [draftSaved, setDraftSaved] = useState(false);
  const [softError, setSoftError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const draftIdRef = useRef<string | null>(null);
  const creatingRef = useRef<Promise<string | null> | null>(null);
  const matchSeq = useRef(0);

  // Preselect from ?skill= (kind unknown → hard by default).
  useEffect(() => {
    if (preselect && !kind) setKind("hard");
  }, [preselect, kind]);

  /* Catalog */
  useEffect(() => {
    let cancelled = false;
    void api("/api/skills/catalog").then((res) => {
      if (cancelled) return;
      if (res.ok && res.data && typeof res.data === "object") {
        const d = res.data as Partial<Catalog>;
        setCatalog({
          domains: Array.isArray(d.domains) ? d.domains : [],
          softSkills: Array.isArray(d.softSkills) ? d.softSkills : [],
          frequent: Array.isArray(d.frequent) ? d.frequent : undefined,
        });
      } else {
        setCatalog(null);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  /* Debounced matching */
  useEffect(() => {
    if (step !== 2 || !kind) return;
    const text = rawLabel.trim();
    if (text.length < 3) {
      matchSeq.current += 1;
      setMatch(null);
      setMatching(false);
      return;
    }
    const seq = ++matchSeq.current;
    setMatching(true);
    const t = window.setTimeout(() => {
      void api("/api/skills/match", {
        method: "POST",
        body: JSON.stringify({ text, kind }),
      }).then((res) => {
        if (seq !== matchSeq.current) return;
        setMatching(false);
        if (res.ok && res.data && typeof res.data === "object") {
          const d = res.data as Partial<MatchResponse>;
          setMatch({
            best: d.best ?? null,
            alternatives: Array.isArray(d.alternatives) ? d.alternatives : [],
            keepRawSuggested: Boolean(d.keepRawSuggested),
            frequent: d.frequent,
          });
        } else {
          setMatch(null);
          if (res.status !== 404) setSoftError("La reconnaissance automatique est indisponible pour l'instant.");
        }
      });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [rawLabel, kind, step]);

  /* ── Draft persistence (soft-fail) ── */

  const buildPayload = useCallback(
    (over?: Record<string, unknown>) => ({
      kind,
      raw_label: rawLabel.trim() || undefined,
      skill_id: skill?.id || undefined,
      match_status: matchStatus ?? undefined,
      match_confidence: matchConfidence ?? undefined,
      level: level ?? undefined,
      context: context ?? undefined,
      ...over,
    }),
    [kind, rawLabel, skill, matchStatus, matchConfidence, level, context],
  );

  const persist = useCallback(
    async (over?: Record<string, unknown>): Promise<{ ok: boolean; offline: boolean }> => {
      if (!kind) return { ok: false, offline: false };
      const payload = buildPayload(over);

      const id = draftIdRef.current;
      if (!id) {
        if (!creatingRef.current) {
          creatingRef.current = api("/api/skills/declarations", {
            method: "POST",
            body: JSON.stringify({ ...payload, status: "draft", ...over }),
          }).then((res) => {
            creatingRef.current = null;
            if (res.ok) {
              const created = extractId(res.data);
              if (created) {
                draftIdRef.current = created;
                setDraftSaved(true);
                return created;
              }
            }
            if (res.status === 404) {
              setSoftError("Brouillon enregistré localement uniquement.");
              return "offline";
            }
            setSoftError("Impossible d'enregistrer le brouillon pour l'instant.");
            return null;
          });
        }
        const created = await creatingRef.current;
        if (created === "offline") return { ok: true, offline: true };
        if (!created) return { ok: false, offline: false };
        // The POST already carried `over` (status etc.).
        return { ok: true, offline: false };
      }

      const res = await api(`/api/skills/declarations/${id}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        setDraftSaved(true);
        return { ok: true, offline: false };
      }
      if (res.status === 404) {
        setSoftError("Brouillon enregistré localement uniquement.");
        return { ok: true, offline: true };
      }
      setSoftError("Impossible d'enregistrer le brouillon pour l'instant.");
      return { ok: false, offline: false };
    },
    [kind, buildPayload],
  );

  // Autosave on level/context change (once a draft exists or a skill/raw label is set)
  const autosaveReady = step >= 3;
  useEffect(() => {
    if (!autosaveReady || !kind) return;
    const t = window.setTimeout(() => void persist(), 500);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [level, context, autosaveReady]);

  /* ── Derived ── */

  const displayLabel = skill?.label || rawLabel.trim();
  const kindLabel = kind === "soft" ? "Soft skill" : kind === "hard" ? "Compétence métier" : null;
  const hasMatchBest = Boolean(match?.best && match.best.confidence >= CONFIDENCE_THRESHOLD);
  const lowConfidence = Boolean(match) && !hasMatchBest && rawLabel.trim().length >= 3;
  const alternatives = useMemo(() => {
    if (!match) return [];
    const bestId = match.best?.skill_id;
    return match.alternatives.filter((a) => a.skill_id !== bestId).slice(0, 2);
  }, [match]);

  const frequent = useMemo(
    () => normalizeFrequent(match?.frequent ?? catalog?.frequent),
    [match, catalog],
  );

  const domainCount = catalog?.domains.length || 10;
  const softCount = catalog?.softSkills.length || 20;

  /* ── Actions ── */

  const chooseKind = (next: Kind) => {
    if (next !== kind) {
      setSkill(null);
      setMatchStatus(null);
      setMatchConfidence(null);
      setMatch(null);
    }
    setKind(next);
    setStep(2);
  };

  const acceptSkill = (picked: PickedSkill, confidence: number | null) => {
    setSkill(picked);
    setMatchStatus("matched");
    setMatchConfidence(confidence);
    setStep(3);
    queueMicrotask(() => void persist({ skill_id: picked.id || undefined, match_status: "matched", match_confidence: confidence ?? undefined }));
  };

  const keepRawWords = () => {
    if (rawLabel.trim().length < 2) return;
    setSkill(null);
    setMatchStatus("pending_review");
    setMatchConfidence(match?.best?.confidence ?? null);
    setStep(3);
    queueMicrotask(() => void persist({ skill_id: undefined, match_status: "pending_review" }));
  };

  const pickFromCatalog = (s: CatalogSkill) => {
    setBrowserOpen(false);
    setRawLabel((prev) => prev.trim() || s.label);
    acceptSkill({ id: s.id, label: s.label }, 1);
  };

  const pickFrequent = (f: PickedSkill) => {
    if (f.id) {
      setRawLabel((prev) => prev.trim() || f.label);
      acceptSkill(f, 1);
    } else {
      setRawLabel(f.label);
    }
  };

  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
    else router.push(SKILLS_HOME);
  };

  const finish = async (withProof: boolean) => {
    if (!level || submitting) return;
    setSubmitting(true);
    setSoftError(null);
    const hasProof =
      withProof &&
      (proofUrl.trim().length > 0 || proofNote.trim().length > 0 || Boolean(proofFile));

    // Jamais « proven » ici : Byound analyse la preuve ensuite.
    let result = await persist({ status: "declared" });
    if (!result.ok) {
      setSubmitting(false);
      setSoftError("Enregistrement impossible. Réessaie.");
      return;
    }

    if (hasProof && draftIdRef.current && !result.offline) {
      const form = new FormData();
      if (proofUrl.trim()) form.set("proofUrl", proofUrl.trim());
      if (proofNote.trim()) form.set("proofNote", proofNote.trim());
      if (proofFile) form.set("file", proofFile);
      const proofRes = await fetch(`/api/skills/declarations/${draftIdRef.current}/proof`, {
        method: "POST",
        body: form,
        credentials: "include",
      });
      const proofJson = await proofRes.json().catch(() => null);
      if (!proofRes.ok) {
        setSubmitting(false);
        setSoftError(
          typeof proofJson?.error === "string"
            ? proofJson.error
            : "Preuve non analysée — ta déclaration est enregistrée, tu pourras compléter.",
        );
        // Déclaration déjà sauvée : on laisse accéder à la liste
        setTimeout(() => {
          router.push(SKILLS_HOME);
          router.refresh();
        }, 1600);
        return;
      }
    }

    setSubmitting(false);
    router.push(SKILLS_HOME);
    router.refresh();
  };

  /* ───────── Render ───────── */

  const stepTitle =
    step === 1
      ? "Déclarer une compétence"
      : step === 2
        ? "Quelle compétence ?"
        : step === 3 || step === 4
          ? displayLabel || "Ta compétence"
          : "";

  const stepSubtitle =
    step === 1
      ? "Dis-nous quel type de compétence tu veux déclarer."
      : step === 2
        ? "Écris-la avec tes mots, on s'occupe de la retrouver."
        : step === 3
          ? "Choisis le niveau qui te ressemble le plus aujourd'hui."
          : "Une preuve rend ta compétence plus crédible. Elle reste facultative.";

  return (
    <div className="mx-auto w-full max-w-[1040px] pb-20 pt-1">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 text-[13px]">
        <button
          type="button"
          onClick={() => router.push(SKILLS_HOME)}
          className="text-white/55 transition hover:text-white"
        >
          ‹ Mes compétences
        </button>
        <div className="flex items-center gap-3">
          <span className="text-white/45">
            {draftSaved ? "Enregistré en brouillon" : "Brouillon non enregistré"}
          </span>
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => router.push(SKILLS_HOME)}
            className="flex h-9 w-9 items-center justify-center rounded-full text-white/70 transition hover:bg-white/[0.06] hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Title */}
      <div className="mt-7">
        <p className="text-[12px] font-medium" style={{ color: C.blue }}>
          Déclarer une compétence · étape {step} sur 4
        </p>
        <h1 className="mt-2 text-[28px] font-bold tracking-[-0.03em] text-white sm:text-[34px]">
          {stepTitle}
        </h1>
        <p className="mt-1 text-[14px] text-white/50">{stepSubtitle}</p>
      </div>

        {/* Progress */}
        <div className="mt-6 grid grid-cols-4 gap-3">
          {STEP_LABELS.map((label, i) => {
            const n = i + 1;
            const done = n < step;
            const current = n === step;
            return (
              <div key={label}>
                <div
                  className="h-1 rounded-full"
                  style={{ background: done ? C.green : current ? C.violet : C.border }}
                />
                <p
                  className={cn(
                    "mt-1.5 text-[11px]",
                    current ? "font-semibold text-white" : done ? "text-white/70" : "text-white/35",
                  )}
                >
                  {done ? "✓ " : ""}
                  {label}
                </p>
              </div>
            );
          })}
        </div>

        {/* Body + sidebar */}
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-w-0">
            {step === 1 && (
              <div className="grid gap-4 sm:grid-cols-2">
                {(
                  [
                    {
                      id: "hard" as const,
                      title: "Compétence métier",
                      desc: "Un savoir-faire lié à ton métier, ta formation ou tes projets.",
                      Icon: Briefcase,
                    },
                    {
                      id: "soft" as const,
                      title: "Soft skill",
                      desc: "Une qualité relationnelle ou comportementale : écoute, organisation, leadership…",
                      Icon: Sparkles,
                    },
                  ] as const
                ).map(({ id, title, desc, Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => chooseKind(id)}
                    className="group rounded-2xl border p-6 text-left transition hover:-translate-y-0.5"
                    style={{
                      background: C.card,
                      borderColor: kind === id ? C.violet : C.border,
                    }}
                  >
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-xl"
                      style={{ background: `${C.violet}26`, color: C.blue }}
                    >
                      <Icon className="h-5 w-5" />
                    </span>
                    <p className="mt-5 text-[17px] font-semibold text-white">{title}</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-white/50">{desc}</p>
                    <span className="mt-5 inline-flex items-center gap-1 text-[13px] font-medium" style={{ color: C.blue }}>
                      Choisir <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                    </span>
                  </button>
                ))}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <label htmlFor="declare-raw" className="text-[13px] font-medium text-white">
                    Ta compétence, avec tes mots
                  </label>
                  <div className="relative mt-2">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-white/30" />
                    <input
                      id="declare-raw"
                      autoFocus
                      value={rawLabel}
                      onChange={(e) => {
                        setRawLabel(e.target.value);
                        setSkill(null);
                        setMatchStatus(null);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && rawLabel.trim().length >= 3 && !matching) {
                          e.preventDefault();
                          if (hasMatchBest && match?.best) {
                            acceptSkill(
                              { id: match.best.skill_id, label: match.best.label },
                              match.best.confidence,
                            );
                          } else {
                            keepRawWords();
                          }
                        }
                      }}
                      placeholder={
                        kind === "soft"
                          ? "ex. je sais bien écouter les gens"
                          : "ex. accueil client en restaurant"
                      }
                      className="w-full rounded-2xl border py-4 pl-12 pr-12 text-[16px] text-white outline-none placeholder:text-white/25 focus:border-[#6E5BFF]"
                      style={{ background: C.card, borderColor: C.border }}
                    />
                    {matching ? (
                      <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-white/40" />
                    ) : null}
                  </div>
                </div>

                {hasMatchBest && match?.best ? (
                  <div
                    className="rounded-2xl border p-5"
                    style={{ background: C.card, borderColor: `${C.violet}66` }}
                  >
                    <p className="flex items-center gap-1.5 text-[12px] font-semibold" style={{ color: C.blue }}>
                      <Sparkles className="h-3.5 w-3.5" /> On a compris
                    </p>
                    <p className="mt-3 text-[18px] font-semibold text-white">{match.best.label}</p>
                    {match.best.domain_label ? (
                      <p className="mt-0.5 text-[12px]" style={{ color: C.blue }}>
                        {match.best.domain_label}
                      </p>
                    ) : null}
                    {match.best.description ? (
                      <p className="mt-2 text-[13px] leading-relaxed text-white/55">{match.best.description}</p>
                    ) : null}
                    <button
                      type="button"
                      className={cn(primaryBtn, "mt-4")}
                      onClick={() =>
                        acceptSkill(
                          { id: match.best!.skill_id, label: match.best!.label },
                          match.best!.confidence,
                        )
                      }
                    >
                      C&apos;est ça <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}

                {lowConfidence ? (
                  <div className="rounded-2xl border p-5" style={{ background: C.card, borderColor: C.border }}>
                    <p className="text-[14px] font-medium text-white">
                      On ne l&apos;a pas encore dans notre liste…
                    </p>
                    <p className="mt-1 text-[13px] text-white/50">
                      Pas de souci : tu peux déclarer exactement ce que tu as vécu (ex. accueil en restaurant).
                      On classera ça ensuite.
                    </p>
                    <button type="button" className={cn(primaryBtn, "mt-4")} onClick={keepRawWords}>
                      Continuer avec mes mots <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : null}

                {alternatives.length > 0 ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[13px] text-white/50">Ou plutôt :</span>
                    {alternatives.map((alt) => (
                      <button
                        key={alt.skill_id}
                        type="button"
                        onClick={() =>
                          acceptSkill({ id: alt.skill_id, label: alt.label }, alt.confidence)
                        }
                        className="rounded-full border px-3.5 py-1.5 text-[13px] text-white transition hover:border-[#6E5BFF]"
                        style={{ background: C.card, borderColor: C.border }}
                      >
                        {alt.label}
                      </button>
                    ))}
                  </div>
                ) : null}

                {/* Toujours possible de sortir du référentiel dès 3 caractères */}
                {rawLabel.trim().length >= 3 && !lowConfidence ? (
                  <div className="flex flex-wrap items-center gap-3">
                    {hasMatchBest ? (
                      <button
                        type="button"
                        onClick={keepRawWords}
                        className="text-[13px] font-medium text-white/55 underline-offset-4 hover:text-white hover:underline"
                      >
                        Non, garder exactement mes mots
                      </button>
                    ) : !matching ? (
                      <button type="button" className={cn(primaryBtn)} onClick={keepRawWords}>
                        Continuer avec mes mots <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : null}
                  </div>
                ) : null}

                {frequent.length > 0 ? (
                  <div>
                    <p className="text-[13px] font-medium text-white">
                      Compétences fréquentes dans ta formation
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {frequent.map((f) => (
                        <button
                          key={`${f.id}-${f.label}`}
                          type="button"
                          onClick={() => pickFrequent(f)}
                          className="rounded-full border px-3.5 py-1.5 text-[13px] text-white/85 transition hover:border-[#6E5BFF]"
                          style={{ background: C.card, borderColor: C.border }}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}

                <button
                  type="button"
                  onClick={() => setBrowserOpen(true)}
                  className="text-[13px] font-medium underline-offset-4 hover:underline"
                  style={{ color: C.blue }}
                >
                  Parcourir toutes les compétences · {domainCount} domaines · {softCount} soft skills
                </button>

                <div className="flex items-center justify-between pt-2">
                  <button type="button" className={ghostBtn} style={{ borderColor: C.border }} onClick={goBack}>
                    ‹ Retour
                  </button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-8">
                <div>
                  <p className="text-[16px] font-semibold text-white">Quel est ton niveau ?</p>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    {DECLARE_LEVELS.map((l) => {
                      const selected = level === l.id;
                      return (
                        <button
                          key={l.id}
                          type="button"
                          onClick={() => setLevel(l.id)}
                          aria-pressed={selected}
                          className="rounded-2xl border p-4 text-left transition hover:-translate-y-0.5"
                          style={{
                            background: selected ? `${C.violet}1F` : C.card,
                            borderColor: selected ? C.violet : C.border,
                          }}
                        >
                          <Bars count={l.bars} active={selected} />
                          <p className="mt-4 text-[14px] font-semibold text-white">{l.label}</p>
                          <p className="mt-1.5 text-[12px] leading-relaxed text-white/50">{l.description}</p>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-[12px] text-white/40">
                    Pas de bonne ou mauvaise réponse. Tu pourras la modifier plus tard.
                  </p>
                </div>

                <div>
                  <p className="text-[14px] font-semibold text-white">
                    Où l&apos;as-tu pratiquée ? <span className="font-normal text-white/40">· facultatif</span>
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {DECLARE_CONTEXTS.map((c) => {
                      const selected = context === c.id;
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setContext(selected ? null : c.id)}
                          aria-pressed={selected}
                          className="rounded-full border px-4 py-1.5 text-[13px] text-white transition"
                          style={{
                            background: selected ? `${C.violet}26` : C.card,
                            borderColor: selected ? C.violet : C.border,
                          }}
                        >
                          {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-4">
                  <button type="button" className={ghostBtn} style={{ borderColor: C.border }} onClick={goBack}>
                    ‹ Retour
                  </button>
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-[12px] text-white/45">
                      Étape suivante : ajouter une preuve (facultatif)
                    </span>
                    <button
                      type="button"
                      className={primaryBtn}
                      disabled={!level}
                      onClick={() => setStep(4)}
                    >
                      Continuer <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-6">
                <div className="rounded-2xl border p-5" style={{ background: C.card, borderColor: C.border }}>
                  <p className="text-[15px] font-semibold text-white">Ajoute une preuve</p>
                  <p className="mt-1 text-[13px] text-white/50">
                    PDF, vidéo, image, lien ou note — Byound lit le contenu. Un PDF hors sujet ou vide de sens est refusé : ça ne valide pas la compétence.
                    Une note seule du type « je ne sais pas » ne suffit pas.
                  </p>

                  <label htmlFor="declare-proof-file" className="mt-5 block text-[12px] text-white/50">
                    Fichier (PDF, vidéo, image…)
                  </label>
                  <label
                    htmlFor="declare-proof-file"
                    className="mt-1.5 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-3 text-[13px] text-white/60 transition hover:border-[#6E5BFF]/60"
                    style={{ borderColor: C.border, background: C.bg }}
                  >
                    <FileUp className="h-4 w-4 shrink-0 text-white/40" />
                    <span className="min-w-0 truncate">
                      {proofFile ? proofFile.name : "Choisir un fichier (max 80 Mo)"}
                    </span>
                    <input
                      id="declare-proof-file"
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.mp4,.webm,.mov,.doc,.docx,.ppt,.pptx"
                      className="sr-only"
                      onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                    />
                  </label>

                  <label htmlFor="declare-proof-url" className="mt-4 block text-[12px] text-white/50">
                    Lien (URL)
                  </label>
                  <div className="relative mt-1.5">
                    <Link2 className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
                    <input
                      id="declare-proof-url"
                      type="url"
                      inputMode="url"
                      value={proofUrl}
                      onChange={(e) => setProofUrl(e.target.value)}
                      placeholder="https://…"
                      className="w-full rounded-xl border py-3 pl-10 pr-4 text-[14px] text-white outline-none placeholder:text-white/25 focus:border-[#6E5BFF]"
                      style={{ background: C.bg, borderColor: C.border }}
                    />
                  </div>

                  <label htmlFor="declare-proof-note" className="mt-4 block text-[12px] text-white/50">
                    Note (explique ce que la preuve montre)
                  </label>
                  <textarea
                    id="declare-proof-note"
                    rows={3}
                    value={proofNote}
                    onChange={(e) => setProofNote(e.target.value)}
                    placeholder="Ex. Attestation de stage signée — mission X réalisée en 2025."
                    className="mt-1.5 w-full resize-none rounded-xl border px-4 py-3 text-[14px] text-white outline-none placeholder:text-white/25 focus:border-[#6E5BFF]"
                    style={{ background: C.bg, borderColor: C.border }}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button type="button" className={ghostBtn} style={{ borderColor: C.border }} onClick={goBack}>
                    ‹ Retour
                  </button>
                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      className={ghostBtn}
                      style={{ borderColor: C.border }}
                      disabled={submitting}
                      onClick={() => void finish(false)}
                    >
                      Déclarer sans preuve
                    </button>
                    <button
                      type="button"
                      className={primaryBtn}
                      disabled={
                        submitting || (!proofUrl.trim() && !proofNote.trim() && !proofFile)
                      }
                      onClick={() => void finish(true)}
                    >
                      {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                      Envoyer pour analyse Byound
                    </button>
                  </div>
                </div>
              </div>
            )}

            {softError ? (
              <p className="mt-6 text-[12px] text-amber-300/80" role="status">
                {softError}
              </p>
            ) : null}
          </div>

          {/* Sidebar */}
          <aside className="space-y-4 lg:sticky lg:top-6 lg:self-start">
            <div className="rounded-2xl border p-5" style={{ background: C.card, borderColor: C.border }}>
              <p className="border-b pb-3 text-[14px] font-semibold text-white" style={{ borderColor: C.border }}>
                Ta déclaration
              </p>
              <RecapRow label="Type" value={kindLabel} />
              <RecapRow label="Compétence" value={skill?.label ?? null} />
              <RecapRow label="Tes mots" value={rawLabel.trim() || null} />
              <RecapRow label="Niveau" value={declareLevelLabel(level)} />
              <RecapRow label="Pratiquée" value={declareContextLabel(context)} />
              <RecapRow
                label="Preuve"
                value={
                  proofUrl.trim() || proofNote.trim() || proofFile
                    ? proofFile
                      ? `Fichier · ${proofFile.name}`
                      : "Prête à analyser"
                    : null
                }
              />
            </div>
            <div
              className="flex gap-3 rounded-2xl border p-4 text-[12px] leading-relaxed text-white/60"
              style={{ background: C.card, borderColor: C.border }}
            >
              <span aria-hidden>💡</span>
              <p>
                {step === 2
                  ? "Tu n’es pas limité au catalogue. Si on ne trouve pas, tu continues avec tes mots : ta déclaration reste visible, on la classera ensuite."
                  : "Byound lit ta preuve. « Prouvée » seulement si le contenu démontre vraiment la compétence — un PDF n’importe quoi est refusé."}
              </p>
            </div>
          </aside>
        </div>

      {browserOpen ? (
        <CatalogBrowser
          kind={kind ?? "hard"}
          catalog={catalog}
          onClose={() => setBrowserOpen(false)}
          onPick={pickFromCatalog}
        />
      ) : null}
    </div>
  );
}

/* ───────── Catalog drawer ───────── */

function CatalogBrowser({
  kind,
  catalog,
  onClose,
  onPick,
}: {
  kind: Kind;
  catalog: Catalog | null;
  onClose: () => void;
  onPick: (s: CatalogSkill) => void;
}) {
  const [q, setQ] = useState("");
  const [openDomain, setOpenDomain] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const query = q.trim().toLowerCase();
  const matches = (s: CatalogSkill) =>
    !query ||
    s.label.toLowerCase().includes(query) ||
    (s.aliases ?? []).some((a) => a.toLowerCase().includes(query));

  const soft = (catalog?.softSkills ?? []).filter(matches);
  const domains = (catalog?.domains ?? [])
    .map((d) => ({ ...d, skills: d.skills.filter((s) => !s.is_soft).filter(matches) }))
    .filter((d) => d.skills.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Parcourir les compétences">
      <button type="button" aria-label="Fermer" className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative flex h-full w-full max-w-[460px] flex-col border-l"
        style={{ background: C.bg, borderColor: C.border }}
      >
        <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: C.border }}>
          <p className="text-[15px] font-semibold text-white">
            {kind === "soft" ? "Soft skills" : "Toutes les compétences"}
          </p>
          <button type="button" aria-label="Fermer" onClick={onClose} className="text-white/60 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="px-5 pt-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Rechercher une compétence…"
              className="w-full rounded-xl border py-3 pl-10 pr-4 text-[14px] text-white outline-none placeholder:text-white/25 focus:border-[#6E5BFF]"
              style={{ background: C.card, borderColor: C.border }}
            />
          </div>
        </div>
        <div className="flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {!catalog ? (
            <p className="text-[13px] text-white/45">
              Le catalogue n&apos;est pas disponible pour l&apos;instant. Tu peux garder tes mots à l&apos;étape précédente.
            </p>
          ) : kind === "soft" ? (
            soft.length === 0 ? (
              <p className="text-[13px] text-white/45">Aucun résultat.</p>
            ) : (
              <ul className="overflow-hidden rounded-2xl border" style={{ background: C.card, borderColor: C.border }}>
                {soft.map((s) => (
                  <SkillRow key={s.id} skill={s} onPick={onPick} />
                ))}
              </ul>
            )
          ) : domains.length === 0 ? (
            <p className="text-[13px] text-white/45">Aucun résultat.</p>
          ) : (
            domains.map((d) => {
              const open = Boolean(query) || openDomain === d.id;
              return (
                <div
                  key={d.id}
                  className="overflow-hidden rounded-2xl border"
                  style={{ background: C.card, borderColor: C.border }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenDomain(openDomain === d.id ? null : d.id)}
                    className="flex w-full items-center justify-between px-4 py-3.5 text-left"
                  >
                    <span className="text-[14px] font-semibold text-white">{d.label}</span>
                    <span className="text-[12px] text-white/40">{d.skills.length}</span>
                  </button>
                  {open ? (
                    <ul className="border-t" style={{ borderColor: C.border }}>
                      {d.skills.map((s) => (
                        <SkillRow key={s.id} skill={s} onPick={onPick} />
                      ))}
                    </ul>
                  ) : null}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function SkillRow({ skill, onPick }: { skill: CatalogSkill; onPick: (s: CatalogSkill) => void }) {
  return (
    <li className="border-b last:border-b-0" style={{ borderColor: C.border }}>
      <button
        type="button"
        onClick={() => onPick(skill)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition hover:bg-white/[0.03]"
      >
        <span className="min-w-0">
          <span className="block text-[14px] text-white">{skill.label}</span>
          {skill.description ? (
            <span className="mt-0.5 line-clamp-2 block text-[12px] text-white/40">{skill.description}</span>
          ) : null}
        </span>
        <ArrowRight className="h-4 w-4 shrink-0 text-white/25" />
      </button>
    </li>
  );
}
