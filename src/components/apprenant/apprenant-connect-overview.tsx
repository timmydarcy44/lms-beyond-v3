"use client";

import Image from "next/image";
import Link from "next/link";
import { Bell, ChevronRight, Sparkles } from "lucide-react";

type Props = {
  firstName: string;
  /** Bonjour / Bonsoir */
  greetingWord: string;
  tagline: string;
  profileCompletionPct: number;
  catalogHref: string;
  badgesHref: string;
  resultsHref: string;
  matchingHref: string;
  careerHref: string;
  onScrollToProfil: () => void;
  /** Ouvre le formulaire identité (sidebar / API profil) */
  onOpenEditProfile?: () => void;
};

export function ApprenantConnectOverview({
  firstName,
  greetingWord,
  tagline,
  profileCompletionPct,
  catalogHref,
  badgesHref,
  resultsHref,
  matchingHref,
  careerHref,
  onScrollToProfil,
  onOpenEditProfile,
}: Props) {
  const pct = Math.max(0, Math.min(100, Math.round(profileCompletionPct)));
  const heroProgress = Math.min(100, Math.max(12, pct));

  return (
    <div className="mb-10 space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {greetingWord} {firstName}
            <span className="ml-1.5 inline-block text-violet-300" aria-hidden>
              👋
            </span>
          </h1>
          <p className="mt-1 text-sm text-white/55">{tagline}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/80 transition hover:bg-white/10"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-violet-500 px-1 text-[10px] font-bold text-white">
              3
            </span>
          </button>
          {onOpenEditProfile ? (
            <button
              type="button"
              onClick={onOpenEditProfile}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-violet-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-violet-900/35 transition hover:brightness-110"
            >
              Modifier mon profil
            </button>
          ) : null}
          <button
            type="button"
            onClick={onScrollToProfil}
            className="inline-flex items-center gap-2 rounded-xl border border-white/12 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white/90 transition hover:bg-white/10"
          >
            Voir ma fiche
            <ChevronRight className="h-4 w-4 opacity-80" />
          </button>
        </div>
      </header>

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0f1419] shadow-[0_40px_100px_-40px_rgba(124,58,237,0.35)]">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80"
            alt=""
            fill
            className="object-cover opacity-35"
            sizes="100vw"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0b0e14] via-[#0b0e14]/92 to-[#0b0e14]/75" />
        </div>
        <div className="relative grid gap-8 p-6 lg:grid-cols-[1.25fr_1fr] lg:p-10">
          <div className="flex flex-col justify-center gap-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-violet-300/90">Parcours en cours</div>
            <div>
              <h2 className="text-2xl font-bold text-white sm:text-3xl">Votre progression Beyond</h2>
              <p className="mt-2 max-w-lg text-sm text-white/65">
                Poursuivez un parcours sur le catalogue ou complétez votre profil : tout est centralisé ici.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-white/55">
                <span>Complétion du profil</span>
                <span className="font-mono text-violet-200">{pct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-white/55">
                <span>Parcours catalogue (indicatif)</span>
                <span className="font-mono text-white/70">{heroProgress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                  style={{ width: `${heroProgress}%` }}
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href={catalogHref}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-r from-violet-600 to-violet-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/40 transition hover:brightness-110"
              >
                Continuer le parcours
              </Link>
              <button
                type="button"
                onClick={onScrollToProfil}
                className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/85 transition hover:bg-white/10"
              >
                Compléter mon profil
              </button>
            </div>
          </div>
          <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-white/10 bg-black/35 p-8 backdrop-blur-md">
            <div
              className="relative flex h-40 w-40 items-center justify-center rounded-full border-4 border-violet-500/50"
              style={{
                background: `conic-gradient(rgb(139 92 246) ${pct * 3.6}deg, rgba(255,255,255,0.08) 0deg)`,
              }}
            >
              <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-[#0b0e14] text-center">
                <div className="text-2xl font-black text-white">{pct}%</div>
                <div className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-white/45">
                  Profil global
                </div>
              </div>
            </div>
            <p className="max-w-xs text-center text-xs text-white/55">
              Objectif : identité complète, tests et soft skills pour votre visibilité auprès des écoles et entreprises.
            </p>
          </div>
        </div>
        <div className="relative border-t border-white/10 bg-black/30 px-6 py-4 backdrop-blur-sm lg:px-10">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-violet-300/80">Prochain objectif</div>
              <p className="mt-1 text-sm text-white/80">Finaliser votre fiche et lancer les parcours recommandés.</p>
            </div>
            <Link
              href={resultsHref}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold text-white/90 transition hover:bg-white/10"
            >
              Voir mes résultats
              <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <section className="rounded-3xl border border-white/10 bg-[#10151c] p-6 shadow-inner shadow-black/40">
          <h3 className="text-sm font-semibold text-white">Reprendre là où vous en étiez</h3>
          <p className="mt-1 text-xs text-white/50">Dernière activité — poursuivez votre parcours ou vos tests.</p>
          <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-stretch">
            <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="text-xs font-medium text-violet-200/90">Catalogue & parcours</div>
              <p className="mt-2 text-sm text-white/70">Accédez aux modules EDGE Online et suivez votre progression.</p>
              <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[45%] rounded-full bg-violet-500" />
              </div>
              <Link href={catalogHref} className="mt-4 inline-flex text-xs font-semibold text-cyan-300 hover:underline">
                Ouvrir le catalogue →
              </Link>
            </div>
            <div className="flex w-full shrink-0 flex-col justify-between rounded-2xl border border-violet-500/25 bg-violet-500/10 p-4 sm:max-w-[220px]">
              <div className="text-[11px] text-white/60">Raccourci</div>
              <Link
                href={careerHref}
                className="mt-3 inline-flex items-center justify-center rounded-full bg-white/10 px-3 py-2 text-center text-xs font-semibold text-white transition hover:bg-white/15"
              >
                Ma carrière & missions
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#10151c] p-6">
          <h3 className="text-sm font-semibold text-white">Mes badges</h3>
          <p className="mt-1 text-xs text-white/50">Compétences reconnues sur la plateforme.</p>
          <div className="mt-4 flex gap-3 overflow-x-auto pb-1">
            {["Communication", "Organisation", "Leadership"].map((label) => (
              <div
                key={label}
                className="min-w-[120px] shrink-0 rounded-2xl border border-white/10 bg-gradient-to-br from-violet-600/25 to-transparent p-4 text-center"
              >
                <Sparkles className="mx-auto h-6 w-6 text-violet-300" />
                <div className="mt-2 text-xs font-semibold text-white">{label}</div>
                <div className="mt-1 text-[10px] text-white/45">À débloquer</div>
              </div>
            ))}
            <Link
              href={badgesHref}
              className="flex min-w-[100px] shrink-0 flex-col items-center justify-center rounded-2xl border border-dashed border-white/20 text-xs font-semibold text-white/60 transition hover:border-violet-400/50 hover:text-violet-200"
            >
              <span className="text-2xl leading-none text-white/35">+</span>
              <span className="mt-2">Tous les badges</span>
            </Link>
          </div>
        </section>
      </div>

      <section className="rounded-3xl border border-white/10 bg-[#10151c] p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-white">Mes parcours</h3>
            <p className="mt-1 text-xs text-white/50">Filtrez et accédez rapidement au catalogue.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["En cours", "Recommandés", "À terminer", "Nouveautés"].map((tab, i) => (
              <span
                key={tab}
                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                  i === 0 ? "bg-violet-500 text-white" : "border border-white/10 bg-white/5 text-white/55"
                }`}
              >
                {tab}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { title: "EDGE Online", tag: "Catalogue", desc: "Parcours métiers & compétences digitales.", href: catalogHref },
            { title: "Soft skills", tag: "À faire", desc: "Passez l’évaluation comportementale.", href: "/dashboard/apprenant/soft-skills-intro" },
            { title: "Test DISC", tag: "Profil", desc: "Comprenez votre style de travail.", href: "/dashboard/apprenant/test-comportemental-intro" },
          ].map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 transition hover:border-violet-400/40 hover:bg-white/[0.06]"
            >
              <span className="text-[10px] font-bold uppercase tracking-wider text-violet-300">{card.tag}</span>
              <div className="mt-2 text-base font-semibold text-white">{card.title}</div>
              <p className="mt-2 text-xs text-white/55">{card.desc}</p>
              <ChevronRight className="absolute bottom-4 right-4 h-4 w-4 text-white/25 transition group-hover:translate-x-0.5 group-hover:text-violet-300" />
            </Link>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border border-white/10 bg-[#10151c] p-6">
        <h3 className="text-sm font-semibold text-white">À explorer ensuite</h3>
        <p className="mt-1 max-w-3xl text-xs text-white/50">
          Raccourcis vers le catalogue, le matching et la carrière. Ce n’est pas encore une recommandation IA : nous
          affichons des entrées fixes pour vous orienter. La personnalisation selon vos résultats arrivera ensuite.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {[
            { k: "Catalogue", sub: "PARCOURS", meta: "EDGE Online", href: catalogHref },
            { k: "Opportunités", sub: "MATCHING", meta: "Entreprises & offres", href: matchingHref },
            { k: "Carrière", sub: "MISSIONS", meta: "CV & entretiens", href: careerHref },
          ].map((x) => (
            <Link
              key={x.k}
              href={x.href}
              className="rounded-2xl border border-white/10 bg-gradient-to-br from-slate-800/80 to-slate-900/40 p-4 transition hover:border-violet-500/35"
            >
              <div className="text-[10px] font-bold text-violet-300/90">{x.sub}</div>
              <div className="mt-2 text-lg font-bold text-white">{x.k}</div>
              <div className="mt-3 text-xs text-emerald-300/90">{x.meta}</div>
            </Link>
          ))}
        </div>
      </section>

      <div className="rounded-3xl border border-violet-500/30 bg-gradient-to-r from-violet-950/80 to-[#12182a] px-6 py-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-violet-200/80">Agenda</div>
            <p className="mt-1 text-sm text-white/85">Planifiez vos entretiens et suivis carrière depuis l’espace dédié.</p>
          </div>
          <Link
            href={careerHref}
            className="inline-flex shrink-0 items-center justify-center rounded-full bg-violet-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-900/30 transition hover:bg-violet-400"
          >
            Voir ma carrière
          </Link>
        </div>
      </div>
    </div>
  );
}
