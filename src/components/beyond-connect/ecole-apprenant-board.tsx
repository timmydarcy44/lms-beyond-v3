"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { BookOpen, ChevronRight, ExternalLink, FileText, PencilLine, Phone, Sparkles, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { WalletEarnedBadgeRow } from "@/lib/dashboard/ecole-learner-wallet";
import { SchoolAdminDocumentsModal } from "@/components/beyond-connect/school-admin-documents-modal";
import { SchoolStudentAdminFieldsPanel } from "@/components/beyond-connect/school-student-admin-fields-panel";
import {
  SchoolStudentAlternancePanel,
  type CompanyOption,
} from "@/components/beyond-connect/school-student-alternance-panel";
import { EcoleLearnerEditCardModal } from "@/components/beyond-connect/ecole-learner-edit-card-modal";
import type { EcoleLearnerPedagogySnapshot } from "@/lib/dashboard/ecole-learner-pedagogy";
import { LEARNER_SCHOOL_SYNC_COPY } from "@/lib/apprenant/learner-profile-copy";

const defaultRadarOrder = ["Leadership", "Organisation", "Communication", "Adaptabilite", "Creativite"];

function scoreToPercent(raw: number): number {
  if (!Number.isFinite(raw)) return 0;
  return raw <= 10 ? Math.round(raw * 10) : Math.round(Math.min(100, raw));
}

function badgeLevel(pct: number): string {
  if (pct >= 75) return "Avancé";
  if (pct >= 45) return "Intermédiaire";
  return "Fondations";
}

function walletAccent(i: number): string {
  const g = [
    "from-violet-500 to-fuchsia-600",
    "from-orange-500 to-rose-600",
    "from-sky-500 to-cyan-500",
    "from-teal-500 to-emerald-500",
  ];
  return g[i % g.length];
}

type OfferRow = { id: string; title?: string | null; city?: string | null; salary?: string | null };

type Props = {
  profile: Record<string, unknown>;
  learnerId: string;
  schoolId: string | null;
  companies: CompanyOption[];
  walletEarnedBadges: WalletEarnedBadgeRow[];
  offers: OfferRow[];
  initialPlacement: string | null;
  initialDob: string | null;
  initialPermis: boolean | null;
  initialHost: string | null;
  initialTutorName: string | null;
  initialTutorEmail: string | null;
  placementDisplayLabel: string;
  pedagogy: EcoleLearnerPedagogySnapshot;
};

export function EcoleApprenantBoard(props: Props) {
  const {
    profile,
    learnerId,
    schoolId,
    companies,
    walletEarnedBadges,
    offers,
    initialPlacement,
    initialDob,
    initialPermis,
    initialHost,
    initialTutorName,
    initialTutorEmail,
    placementDisplayLabel,
    pedagogy,
  } = props;

  const [showDocs, setShowDocs] = useState(false);
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [editCardOpen, setEditCardOpen] = useState(false);

  const firstName = String(profile.first_name ?? "").trim();
  const lastName = String(profile.last_name ?? "").trim();
  const displayName = `${firstName} ${lastName}`.trim() || "Apprenant";
  const email = String(profile.email ?? "").trim();
  const phone =
    profile.phone != null && String(profile.phone).trim()
      ? String(profile.phone).trim()
      : profile.telephone != null
        ? String(profile.telephone).trim()
        : "";
  const schoolClass = profile.school_class != null ? String(profile.school_class).trim() : "";
  const avatarUrl = profile.avatar_url != null ? String(profile.avatar_url) : null;

  const softMap = useMemo(
    () => (profile.soft_skills_scores as Record<string, number> | null | undefined) ?? {},
    [profile.soft_skills_scores],
  );
  const softRows = useMemo(() => {
    const keys = defaultRadarOrder.filter((k) => k in softMap && typeof softMap[k] === "number");
    const list = keys.length ? keys : Object.keys(softMap).slice(0, 6);
    return list.map((skill) => ({
      skill,
      pct: scoreToPercent(softMap[skill] ?? 0),
    }));
  }, [softMap]);

  const portfolioItems = useMemo(() => {
    const specs: { key: string; label: string }[] = [
      { key: "github_url", label: "GitHub" },
      { key: "gitlab_url", label: "GitLab" },
      { key: "behance_url", label: "Behance" },
      { key: "dribbble_url", label: "Dribbble" },
      { key: "linkedin_url", label: "LinkedIn" },
      { key: "portfolio_url", label: "Portfolio" },
      { key: "website_url", label: "Site web" },
      { key: "case_study_url", label: "Étude de cas" },
      { key: "cv_url", label: "CV" },
      { key: "motivation_letter_url", label: "Lettre de motivation" },
      { key: "rqth_url", label: "RQTH" },
      { key: "cerfa_url", label: "CERFA" },
    ];
    const out: { id: string; label: string; url: string }[] = [];
    for (const { key, label } of specs) {
      const v = profile[key];
      if (typeof v === "string" && /^https?:\/\//i.test(v.trim())) {
        out.push({ id: key, label, url: v.trim() });
      }
    }
    return out;
  }, [profile]);

  return (
    <div className="min-h-screen bg-[#07070c] pb-16 text-zinc-100">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,237,0.22),transparent)]" />

      <div className="relative mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
          <Link
            href="/dashboard/ecole/apprenants"
            className="inline-flex items-center gap-2 text-sm font-medium text-zinc-400 transition hover:text-white"
          >
            <ChevronRight className="h-4 w-4 rotate-180" aria-hidden />
            Retour à la liste des apprenants
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-sm font-semibold text-white">{displayName}</span>
            <button
              type="button"
              onClick={() => setEditCardOpen(true)}
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-200 transition hover:bg-white/10"
            >
              <PencilLine className="h-3.5 w-3.5" aria-hidden />
              Modifier la carte
            </button>
            <SchoolAdminDocumentsModal
              profile={{
                first_name: profile.first_name as string | null | undefined,
                last_name: profile.last_name as string | null | undefined,
                cv_url: profile.cv_url as string | null | undefined,
                motivation_letter_url: profile.motivation_letter_url as string | null | undefined,
                rqth_url: profile.rqth_url as string | null | undefined,
                cerfa_url: profile.cerfa_url as string | null | undefined,
              }}
              triggerClassName="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white shadow-lg shadow-violet-900/40"
            />
          </div>
        </div>

        <p className="mt-4 rounded-2xl border border-violet-500/25 bg-violet-500/[0.08] px-4 py-3 text-sm leading-relaxed text-zinc-200">
          {LEARNER_SCHOOL_SYNC_COPY}
        </p>

        {/* Hero */}
        <section className="relative mt-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/90 via-zinc-950 to-violet-950/40 p-6 shadow-2xl sm:p-8">
          <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-violet-600/25 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 left-1/3 h-56 w-56 rounded-full bg-cyan-500/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:gap-10">
            <div className="relative mx-auto shrink-0 md:mx-0">
              <div className="h-28 w-28 overflow-hidden rounded-full border-2 border-white/20 bg-zinc-800 shadow-xl ring-2 ring-emerald-400/40 sm:h-32 sm:w-32">
                <img
                  src={
                    avatarUrl ||
                    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80"
                  }
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <span className="absolute bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-emerald-500/90 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow">
                Suivi
              </span>
            </div>
            <div className="min-w-0 flex-1 text-center md:text-left">
              <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">{displayName}</h1>
              <p className="mt-1 text-sm text-zinc-400">{email || "—"}</p>
              <dl className="mt-4 grid gap-3 text-left text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Téléphone</dt>
                  <dd className="mt-0.5 text-zinc-200">{phone || "—"}</dd>
                </div>
                <div>
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Cursus</dt>
                  <dd className="mt-0.5 text-zinc-200">{schoolClass || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Statut</dt>
                  <dd className="mt-1.5">
                    <span className="inline-flex rounded-full border border-violet-500/40 bg-violet-500/15 px-3 py-1 text-sm font-medium text-violet-100">
                      {placementDisplayLabel}
                    </span>
                    <p className="mt-2 text-[11px] text-zinc-500">
                      Déduit automatiquement de l&apos;entreprise liée ou du parcours « Initial » (modifiable dans
                      « Modifier la carte »).
                    </p>
                  </dd>
                </div>
              </dl>
              <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
                <a
                  href="#wallet-open-badges"
                  className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur hover:bg-white/10"
                >
                  Wallet
                </a>
                <button
                  type="button"
                  onClick={() => setShowDocs((v) => !v)}
                  className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur hover:bg-white/10"
                >
                  Admin
                </button>
                <Link
                  href={`/dashboard/ecole/apprenants/${learnerId}/suivi`}
                  className="rounded-full border border-white/20 bg-white/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/90 backdrop-blur hover:bg-white/10"
                >
                  Suivi
                </Link>
              </div>
            </div>
          </div>
        </section>

        {showDocs ? (
          <div className="mt-4 rounded-2xl border border-white/10 bg-zinc-900/60 p-4 text-sm text-zinc-300">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Documents</p>
            <p className="mt-2 text-xs text-zinc-400">
              Utilisez le bouton « + Administratif » pour ouvrir la fenêtre de gestion des pièces (CV, LM, RQTH, CERFA).
            </p>
          </div>
        ) : null}

        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          {/* Informations personnelles */}
          <section className="rounded-3xl border border-white/10 bg-zinc-900/70 p-5 shadow-xl backdrop-blur-sm sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/90">
              Informations personnelles
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Date de naissance et permis B (le reste figure dans l&apos;en-tête).
            </p>
            <div className="mt-5 border-t border-white/10 pt-5">
              <SchoolStudentAdminFieldsPanel
                schoolId={schoolId}
                learnerId={learnerId}
                initialPlacementStatus={initialPlacement}
                initialDateOfBirth={initialDob}
                initialHasDrivingLicenseB={initialPermis}
                appearance="dark"
                fields="dobPermis"
              />
            </div>
          </section>

          {/* Soft skills */}
          <section className="rounded-3xl border border-white/10 bg-zinc-900/70 p-5 shadow-xl backdrop-blur-sm sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/90">Soft skills</p>
              <span className="text-[10px] font-medium text-zinc-500">/100</span>
            </div>
            <div className="mt-5 space-y-4">
              {softRows.length ? (
                softRows.map(({ skill, pct }) => (
                  <div key={skill}>
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="inline-flex items-center gap-2 font-medium text-white">
                        <Star className="h-3.5 w-3.5 text-amber-400" />
                        {skill}
                      </span>
                      <span className="text-xs text-zinc-400">{pct}/100</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all"
                        style={{ width: `${Math.min(100, pct)}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-zinc-500">Aucune soft skill renseignée sur le profil.</p>
              )}
            </div>
          </section>
        </div>

        {/* Suivi pédagogique LMS */}
        <section className="mt-8 rounded-3xl border border-white/10 bg-zinc-900/70 p-5 shadow-xl backdrop-blur-sm sm:p-6">
          <div className="flex flex-wrap items-center gap-2">
            <BookOpen className="h-4 w-4 text-violet-400" aria-hidden />
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/90">
              Suivi pédagogique (LMS)
            </p>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Formations suivies, scores QCM, tentatives et aperçu des réponses enregistrées sur la plateforme.
          </p>

          <div className="mt-6 grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-white">Formations & progression</h3>
              {pedagogy.courses.length ? (
                <ul className="mt-3 space-y-2 text-sm">
                  {pedagogy.courses.map((c) => (
                    <li
                      key={c.courseId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/10 bg-zinc-950/50 px-3 py-2"
                    >
                      <span className="font-medium text-zinc-100">{c.title || "Formation"}</span>
                      <span className="text-xs text-violet-300/90">
                        {c.progressPercent != null ? `${Math.round(c.progressPercent)} %` : "—"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-3 text-sm text-zinc-500">Aucune inscription cours repérée.</p>
              )}
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">Transformations IA (favoris)</h3>
              <p className="mt-1 text-[11px] text-zinc-500">Actions les plus utilisées sur les leçons (assistant).</p>
              {pedagogy.transformations.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {pedagogy.transformations.slice(0, 10).map((t) => (
                    <span
                      key={t.action}
                      className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-1 text-xs text-cyan-100"
                    >
                      {t.action}{" "}
                      <span className="text-[10px] text-cyan-300/80">×{t.count}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-zinc-500">Pas encore d&apos;historique de transformations.</p>
              )}
            </div>
          </div>

          <div className="mt-8">
            <h3 className="text-sm font-semibold text-white">QCM & évaluations</h3>
            {pedagogy.quizzes.length ? (
              <div className="mt-3 space-y-4">
                {pedagogy.quizzes.map((q) => {
                  let dateLabel = "—";
                  try {
                    dateLabel = new Intl.DateTimeFormat("fr-FR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    }).format(new Date(q.lastAt));
                  } catch {
                    /* ignore */
                  }
                  return (
                    <div
                      key={q.testId}
                      className="rounded-xl border border-white/10 bg-zinc-950/50 p-4 text-sm text-zinc-300"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <p className="font-medium text-white">{q.testTitle || "QCM"}</p>
                        <span className="text-xs text-zinc-500">{dateLabel}</span>
                      </div>
                      <p className="mt-2 text-xs text-zinc-400">
                        Dernière note : <span className="text-zinc-100">{q.lastScore}</span> · Meilleur score :{" "}
                        <span className="text-zinc-100">{q.bestScore}</span> · Tentatives :{" "}
                        <span className="text-amber-300/90">{q.attemptCount}</span>
                      </p>
                      {(q.lastReview && Object.keys(q.lastReview).length > 0) ||
                      (q.lastAnswers && Object.keys(q.lastAnswers).length > 0) ? (
                        <details className="mt-3">
                          <summary className="cursor-pointer text-xs font-medium text-violet-300/90">
                            Réponses & analyse (dernière tentative)
                          </summary>
                          <div className="mt-2 grid gap-2 sm:grid-cols-2">
                            {q.lastAnswers && Object.keys(q.lastAnswers).length > 0 ? (
                              <div>
                                <p className="text-[10px] font-semibold uppercase text-zinc-500">Réponses</p>
                                <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-black/40 p-2 text-[10px] leading-snug text-zinc-400">
                                  {JSON.stringify(q.lastAnswers, null, 2)}
                                </pre>
                              </div>
                            ) : null}
                            {q.lastReview && Object.keys(q.lastReview).length > 0 ? (
                              <div>
                                <p className="text-[10px] font-semibold uppercase text-zinc-500">Revue / corrections</p>
                                <pre className="mt-1 max-h-40 overflow-auto rounded-lg bg-black/40 p-2 text-[10px] leading-snug text-zinc-400">
                                  {JSON.stringify(q.lastReview, null, 2)}
                                </pre>
                              </div>
                            ) : null}
                          </div>
                        </details>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-3 text-sm text-zinc-500">Aucune soumission de QCM enregistrée.</p>
            )}
          </div>
        </section>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          <section className="rounded-3xl border border-white/10 bg-zinc-900/70 p-5 shadow-xl backdrop-blur-sm sm:p-6">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/90">
              Entreprise d&apos;accueil
            </p>
            <p className="mt-2 text-xs text-zinc-500">
              Choisissez une fiche cliente : les coordonnées CRM et le contact tuteur sont appliqués automatiquement sur
              le profil.
            </p>
            <div className="mt-5">
              <SchoolStudentAlternancePanel
                schoolId={schoolId}
                learnerId={learnerId}
                companies={companies}
                initialHostCompanyProspectId={initialHost}
                initialTutorName={initialTutorName}
                initialTutorEmail={initialTutorEmail}
                appearance="dark"
                variant="compact"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-zinc-900/70 p-5 shadow-xl backdrop-blur-sm sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/90">
                Suivi en entreprise
              </p>
              <span className="text-[10px] font-medium text-zinc-500">Aperçu</span>
            </div>
            <ul className="mt-5 space-y-4 border-l border-white/10 pl-4">
              {[
                { t: "Évaluation mission", d: "Récent", sub: "À renseigner avec le tuteur" },
                { t: "Compte rendu", d: "—", sub: "Historique à alimenter" },
                { t: "Objectif mis à jour", d: "—", sub: "Suivi pédagogique" },
                { t: "Feedback", d: "—", sub: "Échanges entreprise / école" },
              ].map((row) => (
                <li key={row.t} className="relative">
                  <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 shadow-lg shadow-violet-900/50" />
                  <p className="text-sm font-medium text-white">{row.t}</p>
                  <p className="text-[11px] text-zinc-500">{row.d}</p>
                  <p className="mt-1 text-xs text-zinc-400">{row.sub}</p>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Wallet */}
        <section
          id="wallet-open-badges"
          className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-b from-zinc-900/80 to-zinc-950/90 p-6 shadow-2xl backdrop-blur-sm"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/90">
              Wallet — Open badges
            </p>
            <Sparkles className="h-4 w-4 text-violet-400" aria-hidden />
          </div>
          <div className="mt-6 flex gap-4 overflow-x-auto pb-2 pt-1">
            {walletEarnedBadges.length ? (
              walletEarnedBadges.map((b, i) => {
                const pct = 70;
                const lvl = badgeLevel(pct);
                const dateLabel = (() => {
                  try {
                    return new Intl.DateTimeFormat("fr-FR", { dateStyle: "short", timeZone: "UTC" }).format(
                      new Date(b.earnedAt),
                    );
                  } catch {
                    return "—";
                  }
                })();
                return (
                  <div
                    key={`${b.name}-${i}`}
                    className="min-w-[140px] shrink-0 rounded-2xl border border-white/10 bg-zinc-950/60 p-4 text-center shadow-lg"
                  >
                    <div
                      className={`mx-auto flex h-14 w-14 items-center justify-center bg-gradient-to-br ${walletAccent(i)} text-lg font-bold text-white shadow-lg`}
                      style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
                    >
                      {b.name.slice(0, 2).toUpperCase()}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-white">{b.name}</p>
                    <p className="mt-1 text-[11px] text-violet-300/90">{lvl}</p>
                    <p className="mt-2 text-[10px] text-zinc-500">Obtenu {dateLabel}</p>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-zinc-500">Aucun badge enregistré pour cet apprenant.</p>
            )}
          </div>
        </section>

        {/* Portfolio */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-zinc-900/70 p-5 sm:p-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/90">Portfolio & liens</p>
          {portfolioItems.length ? (
            <>
              <p className="mt-2 text-xs text-zinc-500">
                {portfolioItems.length} lien{portfolioItems.length > 1 ? "s" : ""} sur le profil. Ouvrez l&apos;aperçu
                pour tout voir d&apos;un coup d&apos;œil.
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPortfolioOpen(true)}
                  className="rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-violet-900/30"
                >
                  Voir le portfolio
                </button>
                <div className="flex flex-wrap gap-2">
                  {portfolioItems.slice(0, 5).map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPortfolioOpen(true)}
                      className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-white/10"
                    >
                      <FileText className="h-3.5 w-3.5 text-zinc-500" aria-hidden />
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>
              <Dialog open={portfolioOpen} onOpenChange={setPortfolioOpen}>
                <DialogContent className="max-h-[85vh] overflow-y-auto border-zinc-800 bg-zinc-950 text-zinc-100 sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="text-white">Portfolio & liens</DialogTitle>
                  </DialogHeader>
                  <ul className="mt-2 space-y-3">
                    {portfolioItems.map((item) => (
                      <li key={item.id}>
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-zinc-900/80 px-3 py-2.5 text-sm text-white transition hover:bg-zinc-800"
                        >
                          <span>{item.label}</span>
                          <ExternalLink className="h-4 w-4 shrink-0 text-violet-400" aria-hidden />
                        </a>
                      </li>
                    ))}
                  </ul>
                </DialogContent>
              </Dialog>
            </>
          ) : (
            <p className="mt-3 text-sm text-zinc-500">Aucun lien portfolio renseigné sur ce profil.</p>
          )}
        </section>

        {/* Offres */}
        <section className="mt-6 rounded-3xl border border-white/10 bg-zinc-900/70 p-5 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-violet-300/90">
              Opportunités de carrière
            </p>
            <span className="text-[10px] text-zinc-500">Matchs indicatifs</span>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {offers.slice(0, 4).length ? (
              offers.slice(0, 4).map((offer, i) => (
                <div
                  key={offer.id}
                  className="rounded-2xl border border-white/10 bg-zinc-950/50 p-4 shadow-inner"
                >
                  <p className="text-xs text-zinc-500">{firstName || "L'apprenant"}</p>
                  <p className="mt-2 line-clamp-2 text-sm font-semibold text-white">{offer.title || "Offre"}</p>
                  <p className="mt-1 text-[11px] text-zinc-500">
                    {offer.city || "—"} · {offer.salary || "—"}
                  </p>
                  <span className="mt-3 inline-flex rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                    Match {88 - i * 4}%
                  </span>
                </div>
              ))
            ) : (
              <p className="text-sm text-zinc-500 sm:col-span-2 lg:col-span-4">Aucune offre pour le moment.</p>
            )}
          </div>
        </section>

        <EcoleLearnerEditCardModal
          open={editCardOpen}
          onOpenChange={setEditCardOpen}
          learnerId={learnerId}
          schoolId={schoolId}
          profile={profile}
          initialHost={initialHost}
          initialPlacement={initialPlacement}
          initialDob={initialDob}
          initialPermis={initialPermis}
        />
      </div>
    </div>
  );
}
