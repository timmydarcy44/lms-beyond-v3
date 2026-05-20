"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { EDGE_MARKETING_HREFS } from "@/lib/edge-lab-marketing";
import { EDGE_ONLINE_APP_SURFACE_PATH } from "@/lib/galaxy-branding";
import type { EdgeOnlineCourse } from "@/lib/queries/edge-online";
import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Compass, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "edge-online-orientation-v1";

const GOALS = [
  {
    id: "efficiency",
    label: "Gagner en efficacité au quotidien",
    hints: ["automat", "ia", "productiv", "outil", "process", "workflow"],
  },
  {
    id: "sell",
    label: "Mieux vendre et convaincre",
    hints: ["vente", "commercial", "prospect", "négoc", "client"],
  },
  {
    id: "lead",
    label: "Manager et faire grandir l'équipe",
    hints: ["leadership", "manage", "équipe", "délég", "management"],
  },
  {
    id: "communicate",
    label: "Communiquer avec impact",
    hints: ["communication", "présent", "parole", "message", "story"],
  },
  {
    id: "grow",
    label: "Développer un état d'esprit solide",
    hints: ["soft", "stress", "émotion", "confiance", "coopération"],
  },
  {
    id: "data",
    label: "Piloter avec les données",
    hints: ["perform", "kpi", "donnée", "analyse", "tableau"],
  },
] as const;

const THEME_CHIPS = [
  { id: "ia", label: "IA & contenus", hints: ["ia", "intelligence", "prompt", "gpt"] },
  { id: "auto", label: "Automatisation", hints: ["automat", "workflow", "notion", "zap"] },
  { id: "comportement", label: "Profils & comportements", hints: ["comport", "disc", "profil", "relation"] },
  { id: "vente", label: "Vente", hints: ["vente", "closing", "prospect"] },
] as const;

const LEVELS = [
  { id: "debutant", label: "Je découvre", hint: "début" },
  { id: "inter", label: "Je pratique déjà", hint: "intermédiaire" },
  { id: "expert", label: "Je veux exceller", hint: "expert" },
] as const;

function formationHref(slug: string) {
  return `${EDGE_ONLINE_APP_SURFACE_PATH}/formations/${encodeURIComponent(slug)}`;
}

function matchesHints(c: EdgeOnlineCourse, hints: string[]): boolean {
  if (hints.length === 0) return true;
  const blob = `${c.title} ${c.categoryName} ${c.description ?? ""} ${c.excerpt}`.toLowerCase();
  return hints.some((h) => blob.includes(h.toLowerCase()));
}

function groupByCategory(courses: EdgeOnlineCourse[]) {
  const map = new Map<string, EdgeOnlineCourse[]>();
  for (const c of courses) {
    const k = c.categoryName.trim() || "À découvrir";
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(c);
  }
  return Array.from(map.entries()).sort((a, b) =>
    a[0].localeCompare(b[0], "fr", { sensitivity: "base" }),
  );
}

function RowScroller({ title, courses }: { title: string; courses: EdgeOnlineCourse[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: -1 | 1) => {
    ref.current?.scrollBy({ left: dir * 420, behavior: "smooth" });
  };

  if (courses.length === 0) return null;

  return (
    <section className="relative px-4 sm:px-6 lg:px-10">
      <div className="mb-4 flex items-end justify-between gap-4">
        <h2 className="text-lg font-semibold tracking-tight text-white sm:text-xl">{title}</h2>
        <div className="hidden gap-1 sm:flex">
          <button
            type="button"
            aria-label="Défiler vers la gauche"
            onClick={() => scroll(-1)}
            className="rounded-full border border-white/15 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            aria-label="Défiler vers la droite"
            onClick={() => scroll(1)}
            className="rounded-full border border-white/15 bg-white/5 p-2 text-white/70 transition hover:bg-white/10 hover:text-white"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
      <div
        ref={ref}
        className="flex gap-4 overflow-x-auto pb-2 pt-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {courses.map((c) => (
          <Link
            key={c.id}
            href={formationHref(c.slug)}
            className="group relative w-[240px] shrink-0 sm:w-[260px]"
          >
            <div className="relative aspect-[16/10] overflow-hidden rounded-xl ring-1 ring-white/10 transition duration-300 group-hover:ring-white/25 group-hover:shadow-xl group-hover:shadow-black/60">
              {c.image ? (
                <Image
                  src={c.image}
                  alt=""
                  fill
                  className="object-cover transition duration-500 group-hover:scale-[1.04]"
                  sizes="260px"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 to-black" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90" />
              <div className="absolute inset-x-0 bottom-0 p-3">
                <p className="line-clamp-2 text-sm font-semibold leading-snug text-white">{c.title}</p>
                {c.level ? (
                  <p className="mt-1 text-[11px] font-medium uppercase tracking-wider text-white/45">{c.level}</p>
                ) : null}
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

function OrientationDialog({ onApply }: { onApply: (hints: string[]) => void }) {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [goalId, setGoalId] = useState<string | null>(null);
  const [levelId, setLevelId] = useState<string | null>(null);
  const [themes, setThemes] = useState<string[]>([]);

  const reset = () => {
    setStep(0);
    setGoalId(null);
    setLevelId(null);
    setThemes([]);
  };

  const finish = () => {
    const hints: string[] = [];
    const g = GOALS.find((x) => x.id === goalId);
    if (g) hints.push(...g.hints);
    for (const t of themes) {
      const chip = THEME_CHIPS.find((c) => c.id === t);
      if (chip) hints.push(...chip.hints);
    }
    const lvl = LEVELS.find((l) => l.id === levelId);
    if (lvl?.hint) hints.push(lvl.hint);
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ hints, goalId, levelId, themes, ts: Date.now() }),
      );
    } catch {
      /* ignore */
    }
    onApply(hints);
    setOpen(false);
    reset();
  };

  const toggleTheme = (id: string) => {
    setThemes((cur) => (cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]));
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-11 rounded-full border-white/20 bg-white/[0.08] px-5 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/[0.14] hover:text-white"
        >
          <Compass className="mr-2 h-4 w-4 opacity-80" />
          Test d&apos;orientation
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-white/10 bg-[#0c0c12] text-white sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold tracking-tight">Par où commencer ?</DialogTitle>
          <DialogDescription className="text-sm text-white/55">
            Quelques questions pour mettre en avant les parcours qui vous correspondent.
          </DialogDescription>
        </DialogHeader>

        {step === 0 ? (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">Objectif</p>
            <div className="grid gap-2">
              {GOALS.map((g) => (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setGoalId(g.id)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left text-sm transition",
                    goalId === g.id
                      ? "border-blue-400/60 bg-white/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-white/75 hover:border-white/20 hover:bg-white/[0.06]",
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <Button
              className="mt-4 w-full rounded-xl bg-blue-600 font-semibold hover:bg-blue-500"
              disabled={!goalId}
              onClick={() => setStep(1)}
            >
              Continuer
            </Button>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">Votre niveau</p>
            <div className="grid gap-2">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLevelId(l.id)}
                  className={cn(
                    "rounded-xl border px-4 py-3 text-left text-sm transition",
                    levelId === l.id
                      ? "border-blue-400/60 bg-white/10 text-white"
                      : "border-white/10 bg-white/[0.03] text-white/75 hover:border-white/20 hover:bg-white/[0.06]",
                  )}
                >
                  {l.label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="ghost"
                className="flex-1 text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => setStep(0)}
              >
                Retour
              </Button>
              <Button
                className="flex-1 rounded-xl bg-blue-600 font-semibold hover:bg-blue-500"
                disabled={!levelId}
                onClick={() => setStep(2)}
              >
                Continuer
              </Button>
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
              Centres d&apos;intérêt (optionnel)
            </p>
            <div className="flex flex-wrap gap-2">
              {THEME_CHIPS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => toggleTheme(t.id)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-xs font-medium transition",
                    themes.includes(t.id)
                      ? "border-amber-400/50 bg-amber-500/15 text-amber-100"
                      : "border-white/12 bg-white/[0.04] text-white/65 hover:border-white/22",
                  )}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button
                variant="ghost"
                className="flex-1 text-white/70 hover:bg-white/10 hover:text-white"
                onClick={() => setStep(1)}
              >
                Retour
              </Button>
              <Button className="flex-1 rounded-xl bg-blue-600 font-semibold hover:bg-blue-500" onClick={finish}>
                Voir mes suggestions
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

export function EdgeOnlineExperience({ initialCourses }: { initialCourses: EdgeOnlineCourse[] }) {
  const [hints, setHints] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const p = JSON.parse(raw) as { hints?: string[] };
      if (Array.isArray(p.hints) && p.hints.length) setHints(p.hints);
    } catch {
      /* ignore */
    }
  }, []);

  const filtered = useMemo(() => {
    if (hints.length === 0) return initialCourses;
    return initialCourses.filter((c) => matchesHints(c, hints));
  }, [hints, initialCourses]);

  const rows = useMemo(() => groupByCategory(filtered), [filtered]);

  const featured = useMemo(() => {
    const withImg = filtered.find((c) => c.image);
    return withImg ?? filtered[0] ?? null;
  }, [filtered]);

  const scrollToSuggestions = useCallback(() => {
    document.getElementById("edge-online-rows")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const onOrientationApply = useCallback(
    (h: string[]) => {
      setHints(h);
      setTimeout(scrollToSuggestions, 80);
    },
    [scrollToSuggestions],
  );

  if (initialCourses.length === 0) {
    return (
      <div className="min-h-[calc(100vh-72px)] bg-black px-6 py-20 text-white">
        <div className="mx-auto max-w-lg text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/50">
            EDGE Online
          </div>
          <h1 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">Catalogue en préparation</h1>
          <p className="mt-3 text-sm leading-relaxed text-white/50">
            Les micro-formations publiées pour EDGE Lab apparaîtront ici. Vérifiez qu’une organisation avec le slug{" "}
            <span className="font-mono text-white/70">edgelab</span> existe et que des cours y sont publiés.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10">
              <Link href="/edge-lab">Retour à l’accueil EDGE</Link>
            </Button>
            <Button asChild className="rounded-full bg-blue-600 font-semibold hover:bg-blue-500">
              <Link href={EDGE_MARKETING_HREFS.galaxyCatalog}>Catalogue membre</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] bg-black text-white">
      <div className="relative isolate overflow-hidden border-b border-white/[0.07]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_0%,rgba(59,130,246,0.12),transparent_55%),radial-gradient(ellipse_50%_45%_at_100%_30%,rgba(180,255,100,0.07),transparent_50%)]" />
        {featured?.image ? (
          <div className="absolute inset-0 opacity-40">
            <Image
              src={featured.image}
              alt=""
              fill
              className="scale-105 object-cover blur-sm"
              sizes="100vw"
              priority
            />
          </div>
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/85 to-black/40" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70" />

        <div className="relative mx-auto flex max-w-6xl flex-col gap-8 px-5 py-12 sm:px-8 sm:py-16 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.06] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em] text-white/50">
              <Sparkles className="h-3.5 w-3.5 text-lime-300/80" />
              EDGE Online
            </div>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.08]">
              Développez vos compétences, à votre rythme.
            </h1>
            <p className="mt-4 text-base leading-relaxed text-white/55 sm:text-lg">
              Micro-formations et parcours courts directement issus de notre studio. Explorez par thématique ou
              laissez-vous guider.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              {featured ? (
                <Button asChild className="h-11 rounded-full bg-blue-600 px-6 font-semibold hover:bg-blue-500">
                  <Link href={formationHref(featured.slug)}>Voir une formation</Link>
                </Button>
              ) : (
                <Button disabled className="h-11 rounded-full" variant="secondary">
                  Bientôt disponible
                </Button>
              )}
              <OrientationDialog onApply={onOrientationApply} />
            </div>
            {hints.length > 0 ? (
              <button
                type="button"
                onClick={() => {
                  setHints([]);
                  try {
                    localStorage.removeItem(STORAGE_KEY);
                  } catch {
                    /* ignore */
                  }
                }}
                className="mt-4 text-xs font-medium text-white/45 underline-offset-4 hover:text-white/70 hover:underline"
              >
                Réinitialiser le filtre d&apos;orientation
              </button>
            ) : null}
          </div>

          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.04] p-5 backdrop-blur-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-200/55">Tendance</p>
            <p className="mt-2 text-lg font-semibold text-white">IA &amp; Automatisation</p>
            <p className="mt-1 text-sm text-white/50">
              Le duo le plus demandé — idéal pour gagner du temps sans sacrifier la qualité.
            </p>
            <Link
              href="/edge-lab#programmes-edge"
              className="mt-4 inline-flex text-sm font-semibold text-white/80 transition hover:text-white"
            >
              Voir les thématiques sur la page EDGE →
            </Link>
          </div>
        </div>
      </div>

      <div id="edge-online-rows" className="space-y-12 py-12">
        {hints.length > 0 ? (
          <p className="px-5 text-center text-sm text-white/50 sm:px-8">
            Suggestions selon votre profil — {filtered.length} formation{filtered.length !== 1 ? "s" : ""} mise
            {filtered.length !== 1 ? "s" : ""} en avant.
          </p>
        ) : null}

        {filtered.length === 0 ? (
          <div className="px-6 text-center">
            <p className="text-lg font-medium text-white/80">Aucun cours ne correspond encore à ce profil.</p>
            <p className="mt-2 text-sm text-white/45">
              Réessayez avec d&apos;autres thèmes ou parcourez tout le catalogue ci-dessous.
            </p>
            <Button className="mt-6 rounded-full" variant="outline" onClick={() => setHints([])}>
              Afficher toutes les formations
            </Button>
          </div>
        ) : null}

        <AnimatePresence mode="wait">
          <motion.div
            key={hints.join(",")}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-12"
          >
            {rows.map(([title, list]) => (
              <RowScroller key={title} title={title} courses={list} />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="border-t border-white/[0.08] px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold text-white">Déjà inscrit sur EDGE ?</p>
            <p className="mt-1 text-sm text-white/45">Accédez au catalogue complet dans votre espace galaxie.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              asChild
              variant="outline"
              className="rounded-full border-white/20 bg-transparent text-white hover:bg-white/10"
            >
              <Link href={EDGE_MARKETING_HREFS.galaxyCatalog}>Ouvrir le catalogue membre</Link>
            </Button>
            <Button asChild className="rounded-full bg-white px-6 font-semibold text-black hover:bg-white/90">
              <Link href="/login?next=/edge-lab/online">Se connecter</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
