"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
} from "recharts";
import { ArrowLeft, ArrowRight, Check, Mail, Sparkles } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  beyondBtnPrimary,
  beyondBtnSecondaryDark,
  BeyondKicker,
} from "@/components/marketing/beyond-design-system";
import { BEYOND_INDEX_QUESTIONS, ORG_SIZE_OPTIONS } from "@/lib/beyond-index/questions";
import { scoreGlobal, scoreRawTotal } from "@/lib/beyond-index/scoring";
import {
  clearBeyondIndexState,
  finalizeBeyondIndex,
  loadBeyondIndexState,
  saveBeyondIndexAnswers,
} from "@/lib/beyond-index/storage";
import type {
  BeyondIndexAnswers,
  BeyondIndexContact,
  BeyondIndexQuestion,
  BeyondIndexResult,
  BeyondIndexStep,
  ScaleAnswer,
} from "@/lib/beyond-index/types";

const advisoryMail =
  "mailto:contact@beyondcenter.fr?subject=Beyond%20Studio%20%E2%80%94%20Appel%20strat%C3%A9gique%2045%20min";

const SCALE_LABELS = ["1", "2", "3", "4", "5"];

const AXIS_LABELS: Record<string, string> = {
  competences: "Compétences",
  formation: "Formation",
  ia: "IA & innovation",
  recrutement: "Recrutement",
  transmission: "Transmission",
  "vision-rh": "Vision RH",
};

function getAxisLabelForQuestion(index: number): string | null {
  const q = BEYOND_INDEX_QUESTIONS[index];
  if (!q) return null;
  const prev = BEYOND_INDEX_QUESTIONS[index - 1];
  if (!prev || prev.axisId !== q.axisId) return AXIS_LABELS[q.axisId] ?? q.axisId;
  return null;
}

function isQuestionAnswered(q: BeyondIndexQuestion, answers: BeyondIndexAnswers): boolean {
  const a = answers[q.id];
  if (q.type === "scale") return typeof a === "number" && a >= 1 && a <= 5;
  if (q.type === "single") return typeof a === "string" && a.length > 0;
  if (q.type === "multi") return Array.isArray(a) && a.length > 0;
  return false;
}

function StatusBadge({ status }: { status: string }) {
  const styles =
    status === "Point fort"
      ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30"
      : status === "Risque identifié"
        ? "bg-rose-500/15 text-rose-300 border-rose-500/30"
        : "bg-amber-500/15 text-amber-300 border-amber-500/30";

  return (
    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${styles}`}>
      {status}
    </span>
  );
}

export function BeyondIndexApp() {
  const [step, setStep] = useState<BeyondIndexStep>("intro");
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<BeyondIndexAnswers>({});
  const [result, setResult] = useState<BeyondIndexResult | null>(null);
  const [emailSoon, setEmailSoon] = useState(false);
  const [contact, setContact] = useState<BeyondIndexContact>({
    firstName: "",
    lastName: "",
    email: "",
    organization: "",
    role: "",
    orgSize: "",
    phone: "",
  });

  useEffect(() => {
    const stored = loadBeyondIndexState();
    if (stored?.result) {
      setAnswers(stored.answers);
      setResult(stored.result);
      setContact(stored.contact ?? contact);
      setStep("results");
    } else if (stored?.answers && Object.keys(stored.answers).length > 0) {
      setAnswers(stored.answers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentQuestion = BEYOND_INDEX_QUESTIONS[questionIndex];
  const progress =
    step === "question"
      ? ((questionIndex + 1) / BEYOND_INDEX_QUESTIONS.length) * 100
      : step === "contact"
        ? 100
        : 0;

  const liveScore = useMemo(() => scoreGlobal(answers), [answers]);
  const liveRaw = useMemo(() => scoreRawTotal(answers), [answers]);

  const updateAnswer = useCallback(
    (questionId: string, value: ScaleAnswer | string | string[]) => {
      setAnswers((prev) => {
        const next = { ...prev, [questionId]: value };
        saveBeyondIndexAnswers(next);
        return next;
      });
    },
    []
  );

  const toggleMulti = useCallback(
    (q: BeyondIndexQuestion, optionId: string) => {
      const opt = q.options?.find((o) => o.id === optionId);
      if (!opt) return;

      setAnswers((prev) => {
        let selected = Array.isArray(prev[q.id]) ? [...(prev[q.id] as string[])] : [];

        if (opt.exclusive) {
          selected = selected.includes(optionId) ? [] : [optionId];
        } else {
          const exclusive = q.options?.find((o) => o.exclusive);
          if (exclusive) selected = selected.filter((id) => id !== exclusive.id);

          if (selected.includes(optionId)) {
            selected = selected.filter((id) => id !== optionId);
          } else {
            const max = q.maxSelections ?? q.options!.length;
            if (selected.length < max) selected.push(optionId);
          }
        }

        const next = { ...prev, [q.id]: selected };
        saveBeyondIndexAnswers(next);
        return next;
      });
    },
    []
  );

  const canProceed =
    step === "question" && currentQuestion
      ? isQuestionAnswered(currentQuestion, answers)
      : false;

  const contactValid =
    contact.firstName.trim() &&
    contact.lastName.trim() &&
    contact.email.trim() &&
    contact.organization.trim() &&
    contact.role.trim() &&
    contact.orgSize;

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactValid) return;
    const res = finalizeBeyondIndex(answers, {
      ...contact,
      phone: contact.phone?.trim() || undefined,
    });
    setResult(res);
    setStep("results");
  };

  const restart = () => {
    clearBeyondIndexState();
    setAnswers({});
    setResult(null);
    setQuestionIndex(0);
    setStep("intro");
    setContact({
      firstName: "",
      lastName: "",
      email: "",
      organization: "",
      role: "",
      orgSize: "",
      phone: "",
    });
  };

  const radarData =
    result?.axisScores.map((a) => ({
      axis: a.label.replace(" & innovation", ""),
      score: a.score,
      fullMark: 100,
    })) ?? [];

  return (
    <div className="min-h-screen bg-[#071A2F] text-slate-100">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[#071A2F]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-5 py-4 md:px-8">
          <Link href="/" className="text-sm font-semibold text-white hover:text-cyan-300">
            ← Beyond
          </Link>
          <span className="text-xs uppercase tracking-[0.25em] text-cyan-400/80">
            Beyond Index
          </span>
        </div>
        {(step === "question" || step === "contact") && (
          <div className="mx-auto max-w-3xl px-5 pb-3 md:px-8">
            <Progress
              value={progress}
              className="h-1.5 bg-white/10"
              indicatorClassName="bg-gradient-to-r from-[#7C3AED] to-[#06B6D4]"
            />
            {step === "question" && (
              <p className="mt-2 text-xs text-slate-400">
                Question {questionIndex + 1} / {BEYOND_INDEX_QUESTIONS.length}
                {liveRaw > 0 && (
                  <span className="ml-2 text-cyan-400/80">
                    · Score provisoire {liveScore}/100
                  </span>
                )}
              </p>
            )}
          </div>
        )}
      </header>

      <main className="mx-auto max-w-3xl px-5 py-10 md:px-8 md:py-16">
        {/* INTRO */}
        {step === "intro" && (
          <div>
            <BeyondKicker>Diagnostic gratuit</BeyondKicker>
            <h1 className="mt-4 text-[clamp(2rem,4vw,3rem)] font-semibold leading-tight tracking-tight text-white">
              Index de Maturité Compétences™
            </h1>
            <p className="mt-6 text-lg leading-relaxed text-slate-300">
              Évaluez en quelques minutes la capacité de votre organisation à identifier,
              développer et reconnaître les compétences.
            </p>

            <div className="mt-10 rounded-2xl border border-white/10 bg-[#102A43]/60 p-6 md:p-8">
              <p className="text-sm font-medium text-slate-200">6 axes analysés</p>
              <ul className="mt-4 grid gap-2 sm:grid-cols-2">
                {Object.values(AXIS_LABELS).map((label) => (
                  <li key={label} className="flex items-center gap-2 text-sm text-slate-400">
                    <Check className="h-4 w-4 shrink-0 text-cyan-400" strokeWidth={2} />
                    {label}
                  </li>
                ))}
              </ul>
              <p className="mt-6 text-sm text-slate-500">
                15 questions · ~8 minutes · Résultats personnalisés avec recommandations
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <button type="button" onClick={() => setStep("question")} className={beyondBtnPrimary}>
                Commencer le test
                <ArrowRight className="h-4 w-4" />
              </button>
              <Link href="/" className={beyondBtnSecondaryDark}>
                Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        )}

        {/* QUESTION */}
        {step === "question" && currentQuestion && (
          <div>
            {getAxisLabelForQuestion(questionIndex) && (
              <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-violet-400/90">
                Axe — {getAxisLabelForQuestion(questionIndex)}
              </p>
            )}

            <h2 className="text-xl font-semibold leading-snug text-white md:text-2xl">
              {currentQuestion.label}
            </h2>

            <div className="mt-8 space-y-3">
              {currentQuestion.type === "scale" && (
                <>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{currentQuestion.scaleLabels?.min}</span>
                    <span>{currentQuestion.scaleLabels?.max}</span>
                  </div>
                  <div className="grid grid-cols-5 gap-2 md:gap-3">
                    {SCALE_LABELS.map((_, i) => {
                      const val = (i + 1) as ScaleAnswer;
                      const selected = answers[currentQuestion.id] === val;
                      return (
                        <button
                          key={val}
                          type="button"
                          aria-label={`Note ${val} sur 5`}
                          onClick={() => updateAnswer(currentQuestion.id, val)}
                          className={`rounded-xl border py-4 text-lg font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${
                            selected
                              ? "border-cyan-400/60 bg-cyan-400/15 text-cyan-200"
                              : "border-white/10 bg-[#102A43]/50 text-slate-300 hover:border-white/25"
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </>
              )}

              {currentQuestion.type === "single" &&
                currentQuestion.options?.map((opt) => {
                  const selected = answers[currentQuestion.id] === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => updateAnswer(currentQuestion.id, opt.id)}
                      className={`flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${
                        selected
                          ? "border-violet-400/50 bg-violet-500/10 text-white"
                          : "border-white/10 bg-[#102A43]/40 text-slate-300 hover:border-white/20"
                      }`}
                    >
                      <span
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          selected ? "border-violet-400 bg-violet-500" : "border-white/30"
                        }`}
                      >
                        {selected && <Check className="h-3 w-3 text-white" />}
                      </span>
                      {opt.label}
                    </button>
                  );
                })}

              {currentQuestion.type === "multi" && (
                <>
                  {currentQuestion.maxSelections && (
                    <p className="text-xs text-slate-500">
                      Sélectionnez jusqu&apos;à {currentQuestion.maxSelections} options
                    </p>
                  )}
                  {currentQuestion.options?.map((opt) => {
                    const selected = Array.isArray(answers[currentQuestion.id])
                      ? (answers[currentQuestion.id] as string[]).includes(opt.id)
                      : false;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => toggleMulti(currentQuestion, opt.id)}
                        className={`flex w-full items-start gap-3 rounded-xl border px-4 py-4 text-left text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400 ${
                          selected
                            ? "border-cyan-400/50 bg-cyan-400/10 text-white"
                            : "border-white/10 bg-[#102A43]/40 text-slate-300 hover:border-white/20"
                        }`}
                      >
                        <span
                          className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border ${
                            selected ? "border-cyan-400 bg-cyan-500" : "border-white/30"
                          }`}
                        >
                          {selected && <Check className="h-3 w-3 text-white" />}
                        </span>
                        {opt.label}
                      </button>
                    );
                  })}
                </>
              )}
            </div>

            <div className="mt-10 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => {
                  if (questionIndex === 0) setStep("intro");
                  else setQuestionIndex((i) => i - 1);
                }}
                className="inline-flex items-center gap-1 text-sm text-slate-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
              <button
                type="button"
                disabled={!canProceed}
                onClick={() => {
                  if (questionIndex < BEYOND_INDEX_QUESTIONS.length - 1) {
                    setQuestionIndex((i) => i + 1);
                  } else {
                    setStep("contact");
                  }
                }}
                className={`${beyondBtnPrimary} disabled:cursor-not-allowed disabled:opacity-40`}
              >
                {questionIndex < BEYOND_INDEX_QUESTIONS.length - 1 ? "Suivant" : "Voir mes résultats"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}

        {/* CONTACT */}
        {step === "contact" && (
          <div>
            <div className="flex items-center gap-3">
              <Sparkles className="h-8 w-8 text-violet-400" />
              <h2 className="text-2xl font-semibold text-white md:text-3xl">
                Votre Beyond Index est prêt.
              </h2>
            </div>
            <p className="mt-4 text-slate-400">
              Complétez vos coordonnées pour accéder à votre score, votre profil de maturité et
              vos recommandations personnalisées.
            </p>

            <form onSubmit={handleContactSubmit} className="mt-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-slate-300">
                    Prénom *
                  </Label>
                  <Input
                    id="firstName"
                    required
                    value={contact.firstName}
                    onChange={(e) => setContact((c) => ({ ...c, firstName: e.target.value }))}
                    className="border-white/15 bg-[#102A43]/60 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-slate-300">
                    Nom *
                  </Label>
                  <Input
                    id="lastName"
                    required
                    value={contact.lastName}
                    onChange={(e) => setContact((c) => ({ ...c, lastName: e.target.value }))}
                    className="border-white/15 bg-[#102A43]/60 text-white placeholder:text-slate-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">
                  Email professionnel *
                </Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={contact.email}
                  onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
                  className="border-white/15 bg-[#102A43]/60 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organization" className="text-slate-300">
                  Organisation *
                </Label>
                <Input
                  id="organization"
                  required
                  value={contact.organization}
                  onChange={(e) => setContact((c) => ({ ...c, organization: e.target.value }))}
                  className="border-white/15 bg-[#102A43]/60 text-white placeholder:text-slate-500"
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-slate-300">
                    Fonction *
                  </Label>
                  <Input
                    id="role"
                    required
                    value={contact.role}
                    onChange={(e) => setContact((c) => ({ ...c, role: e.target.value }))}
                    className="border-white/15 bg-[#102A43]/60 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="orgSize" className="text-slate-300">
                    Taille de l&apos;organisation *
                  </Label>
                  <select
                    id="orgSize"
                    required
                    value={contact.orgSize}
                    onChange={(e) => setContact((c) => ({ ...c, orgSize: e.target.value }))}
                    className="h-9 w-full rounded-md border border-white/15 bg-[#102A43]/60 px-3 text-sm text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400"
                  >
                    <option value="" disabled className="text-slate-900">
                      Sélectionner
                    </option>
                    {ORG_SIZE_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id} className="text-slate-900">
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="text-slate-300">
                  Téléphone <span className="text-slate-500">(optionnel)</span>
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={contact.phone ?? ""}
                  onChange={(e) => setContact((c) => ({ ...c, phone: e.target.value }))}
                  className="border-white/15 bg-[#102A43]/60 text-white placeholder:text-slate-500"
                />
              </div>

              <button
                type="submit"
                disabled={!contactValid}
                className={`${beyondBtnPrimary} w-full sm:w-auto disabled:cursor-not-allowed disabled:opacity-40`}
              >
                Accéder à mes résultats
              </button>
            </form>
          </div>
        )}

        {/* RESULTS */}
        {step === "results" && result && (
          <div className="space-y-12">
            <div className="text-center">
              <BeyondKicker>Résultats</BeyondKicker>
              <div className="mx-auto mt-6 flex h-36 w-36 items-center justify-center rounded-full border-4 border-cyan-400/30 bg-[#102A43]/80">
                <div>
                  <p className="text-4xl font-bold text-white">{result.globalScore}</p>
                  <p className="text-xs text-slate-400">/ 100</p>
                </div>
              </div>
              <h2 className="mt-6 text-2xl font-semibold text-white">{result.globalProfile.title}</h2>
              <p className="mx-auto mt-4 max-w-xl text-slate-400 leading-relaxed">
                {result.globalProfile.description}
              </p>
            </div>

            {/* Radar */}
            <div className="rounded-2xl border border-white/10 bg-[#102A43]/50 p-6">
              <h3 className="text-lg font-semibold text-white">Scores par axe</h3>
              <div className="mt-4 h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.1)" />
                    <PolarAngleAxis dataKey="axis" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke="#06B6D4"
                      fill="#7C3AED"
                      fillOpacity={0.35}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </div>

              <ul className="mt-6 space-y-3">
                {result.axisScores.map((axis) => (
                  <li key={axis.id} className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm text-slate-300">{axis.label}</span>
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-24 overflow-hidden rounded-full bg-white/10">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400"
                          style={{ width: `${axis.score}%` }}
                        />
                      </div>
                      <span className="w-8 text-right text-sm font-medium text-white">
                        {axis.score}
                      </span>
                      <StatusBadge status={axis.statusLabel} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5">
                <h3 className="font-semibold text-emerald-300">3 points forts</h3>
                <ul className="mt-4 space-y-2">
                  {result.strengths.map((s) => (
                    <li key={s} className="text-sm text-slate-300">
                      · {s}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-rose-500/20 bg-rose-500/5 p-5">
                <h3 className="font-semibold text-rose-300">3 risques identifiés</h3>
                <ul className="mt-4 space-y-2">
                  {result.risks.map((r) => (
                    <li key={r} className="text-sm text-slate-300">
                      · {r}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 p-5">
                <h3 className="font-semibold text-violet-300">3 recommandations</h3>
                <ul className="mt-4 space-y-2">
                  {result.recommendations.map((r) => (
                    <li key={r} className="text-sm text-slate-300">
                      · {r}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="rounded-2xl border border-cyan-400/25 bg-gradient-to-br from-[#0B2442] to-[#102A43] p-8 text-center">
              <h3 className="text-xl font-semibold text-white">
                Réserver un appel stratégique gratuit de 45 minutes
              </h3>
              <p className="mt-2 text-sm text-slate-400">Beyond Studio</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <a href={advisoryMail} className={beyondBtnPrimary}>
                  Réserver mon appel
                </a>
                <button
                  type="button"
                  onClick={() => setEmailSoon(true)}
                  className={beyondBtnSecondaryDark}
                >
                  <Mail className="h-4 w-4" />
                  Recevoir mon rapport par email
                </button>
              </div>
              {emailSoon && (
                <p className="mt-4 text-sm text-amber-300/90">
                  Fonction bientôt disponible — contactez-nous via Beyond Studio en attendant.
                </p>
              )}
            </div>

            <div className="flex flex-wrap justify-center gap-4 text-sm">
              <button type="button" onClick={restart} className="text-slate-400 hover:text-white">
                Refaire le test
              </button>
              <Link href="/" className="text-cyan-400 hover:text-cyan-300">
                Retour à l&apos;accueil
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
