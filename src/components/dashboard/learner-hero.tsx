"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  Info,
  CheckSquare,
  Clock,
  AlertCircle,
  ArrowRight,
  Bell,
  X,
  Sparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LearnerHero as LearnerHeroType, LearnerCard } from "@/lib/queries/apprenant";

type TodoTask = {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done" | "archived";
  priority: "low" | "normal" | "high" | "urgent";
  due_date?: string;
  task_type: string;
};

type HeroStat = {
  label: string;
  value: string;
  hint?: string;
};

type QuickAction = {
  label: string;
  description: string;
  href: string;
};

type HeroHighlight = {
  title: string;
  description: string;
  href: string;
  image?: string | null;
};

type LearnerHeroProps = {
  hero: LearnerHeroType;
  previews: LearnerCard[];
  stats?: HeroStat[];
  quickActions?: QuickAction[];
  highlights?: HeroHighlight[];
};

export const LearnerHero = ({
  hero,
  previews,
  stats = [],
  quickActions = [],
  highlights = [],
}: LearnerHeroProps) => {
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTasksExpanded, setIsTasksExpanded] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        let response = await fetch("/api/todo-tasks?role_filter=learner&status=todo,in_progress");
        if (!response.ok) {
          response = await fetch("/api/todo-tasks?status=todo,in_progress");
        }

        if (response.ok) {
          const data = await response.json();
          const learnerTaskTypes = ["homework", "review", "project", "exam", "reading", "exercise"];
          const learnerTasks = data.filter((task: TodoTask) => {
            return !task.task_type || learnerTaskTypes.includes(task.task_type);
          });

          const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
          const sortedTasks = learnerTasks
            .sort(
              (a: TodoTask, b: TodoTask) =>
                (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0),
            )
            .slice(0, 3);

          setTasks(sortedTasks);
        }
      } catch (error) {
        console.error("[learner-hero] Error loading tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  const taskCount = tasks.length;
  const hasHeroImage = hero.backgroundImage && hero.backgroundImage.trim() !== "";

  return (
    <section className="relative overflow-hidden rounded-[40px] border border-slate-200/70 bg-white text-slate-900 shadow-[0_40px_90px_-55px_rgba(15,23,42,0.4)]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-white via-white to-slate-50" />

      {!loading && taskCount > 0 && (
        <div className="absolute top-4 right-4 z-50">
          <AnimatePresence mode="wait">
            {!isTasksExpanded ? (
              <motion.button
                key="collapsed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setIsTasksExpanded(true)}
                className="group relative flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-4 py-2 text-slate-700 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                <Bell className="h-4 w-4 text-slate-500" />
                <span className="text-sm font-medium">
                  {taskCount} tâche{taskCount > 1 ? "s" : ""}
                </span>
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-900 text-[10px] font-bold text-white shadow-lg">
                  {taskCount}
                </span>
              </motion.button>
            ) : (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="w-80 rounded-2xl border border-slate-200 bg-white/95 shadow-2xl"
              >
                <div className="p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <CheckSquare className="h-4 w-4 text-slate-600" />
                      <h3 className="text-sm font-semibold text-slate-800">À faire / En cours</h3>
                    </div>
                    <button
                      onClick={() => setIsTasksExpanded(false)}
                      className="rounded-full p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="max-h-64 space-y-2 overflow-y-auto">
                    {tasks.map((task) => {
                      const isUrgent = task.priority === "urgent" || task.priority === "high";
                      const isInProgress = task.status === "in_progress";
                      const dueDate = task.due_date ? new Date(task.due_date) : null;
                      const isOverdue = dueDate && dueDate < new Date() && !isInProgress;

                      return (
                        <div
                          key={task.id}
                          className={cn(
                            "rounded-lg border p-2.5 transition-all hover:bg-slate-50",
                            isUrgent
                              ? "border-red-500/30 bg-red-50"
                              : isInProgress
                                ? "border-blue-500/30 bg-blue-50"
                                : "border-slate-200 bg-white",
                          )}
                        >
                          <div className="flex items-start gap-2">
                            {isInProgress ? (
                              <Clock className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-blue-500" />
                            ) : isUrgent ? (
                              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                            ) : (
                              <CheckSquare className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-slate-400" />
                            )}
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-xs font-medium text-slate-800">
                                  {task.title}
                                </span>
                                {isUrgent ? (
                                  <span className="rounded-full bg-red-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-red-500">
                                    {task.priority === "urgent" ? "Urgent" : "Important"}
                                  </span>
                                ) : null}
                                {isInProgress ? (
                                  <span className="rounded-full bg-blue-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-blue-500">
                                    En cours
                                  </span>
                                ) : null}
                              </div>
                              {dueDate ? (
                                <p
                                  className={cn(
                                    "mt-1 text-[10px]",
                                    isOverdue ? "text-red-500" : "text-slate-400",
                                  )}
                                >
                                  {isOverdue
                                    ? "En retard"
                                    : `Échéance: ${dueDate.toLocaleDateString("fr-FR")}`}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <Button
                    asChild
                    variant="ghost"
                    size="sm"
                    className="mt-3 h-8 w-full rounded-full border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    <Link
                      href="/dashboard/apprenant/todo"
                      className="flex items-center justify-center gap-1.5"
                    >
                      Voir tout
                      <ArrowRight className="h-3 w-3" />
                    </Link>
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {quickActions.length > 0 ? (
        <div className="absolute bottom-6 right-6 z-40">
          <AnimatePresence>
            {showQuickActions ? (
              <motion.div
                key="quick-actions-panel"
                initial={{ opacity: 0, y: 16, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 16, scale: 0.98 }}
                transition={{ duration: 0.2 }}
                className="mb-4 w-72 rounded-3xl border border-slate-200 bg-white/95 p-5 shadow-[0_30px_60px_-38px_rgba(15,23,42,0.35)] backdrop-blur"
              >
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Actions rapides</p>
                  <button
                    onClick={() => setShowQuickActions(false)}
                    className="rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
                    aria-label="Fermer les actions rapides"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="space-y-3">
                  {quickActions.map((action) => (
                    <Link
                      key={action.label}
                      href={action.href}
                      className="group flex items-center justify-between rounded-2xl border border-slate-200/80 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-900/20 hover:shadow-sm"
                    >
                      <span>{action.label}</span>
                      <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-1 group-hover:text-slate-600" />
                    </Link>
                  ))}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
          <motion.button
            type="button"
            onClick={() => setShowQuickActions((prev) => !prev)}
            aria-expanded={showQuickActions}
            className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/95 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-[0_12px_24px_-18px_rgba(15,23,42,0.4)] transition hover:border-slate-900/20 hover:shadow-[0_18px_32px_-24px_rgba(15,23,42,0.45)]"
            whileTap={{ scale: 0.97 }}
          >
            <Sparkles className="h-4 w-4 text-slate-500" />
            Actions rapides
          </motion.button>
        </div>
      ) : null}

      <div className="relative z-10 flex flex-col gap-12 px-6 py-12 md:px-14 md:py-16">
        <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
          <div className="space-y-8 text-slate-900">
            {hero.badge ? (
              <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-100 px-4 py-1 text-xs font-semibold uppercase tracking-[0.35em] text-slate-600">
                {hero.badge}
              </span>
            ) : null}
            <motion.h1
              className="text-[clamp(32px,5vw,58px)] font-semibold leading-tight tracking-tight"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
            >
              {hero.title}
            </motion.h1>
            <motion.p
              className="max-w-2xl text-lg text-slate-600 md:text-xl"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
            >
              {hero.description}
            </motion.p>
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-500 md:text-sm">
              {hero.meta ? (
                <span className="rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-slate-700">
                  {hero.meta}
                </span>
              ) : null}
              {hero.tags.map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
                  {tag}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button className="flex items-center gap-2 rounded-full bg-slate-900 px-6 py-2 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">
                <Play className="h-4 w-4" /> Reprendre
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                <Info className="h-4 w-4" /> Plus d&apos;infos
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            {hasHeroImage ? (
              <div className="relative overflow-hidden rounded-[32px] border border-slate-200 bg-gradient-to-br from-white to-slate-100 p-6 shadow-[0_30px_60px_-45px_rgba(15,23,42,0.35)]">
                <div className="relative aspect-[5/4] overflow-hidden rounded-[24px] bg-white">
                  <Image
                    src={hero.backgroundImage ?? ""}
                    alt={hero.title}
                    fill
                    priority
                    className="object-cover"
                  />
                </div>
              </div>
            ) : null}

            {stats.length > 0 ? (
              <div className="rounded-[32px] border border-slate-200 bg-slate-50/60 px-8 py-10 shadow-[0_30px_60px_-45px_rgba(15,23,42,0.35)]">
                <p className="text-xs font-semibold uppercase tracking-[0.35em] text-slate-400">
                  Vue rapide
                </p>
                <div className="mt-6 space-y-6">
                  {stats.map((stat, index) => (
                    <div
                      key={stat.label}
                      className={cn(
                        "space-y-2 pb-6",
                        index !== stats.length - 1 ? "border-b border-slate-200/70" : "pb-0",
                      )}
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
                        {stat.label}
                      </p>
                      <p className="text-4xl font-semibold text-slate-900">{stat.value}</p>
                      {stat.hint ? <p className="text-sm text-slate-500">{stat.hint}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {highlights.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {highlights.map((highlight) => (
              <Link
                key={highlight.title}
                href={highlight.href}
                className="group relative overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_26px_52px_-38px_rgba(15,23,42,0.25)] transition hover:-translate-y-1 hover:shadow-[0_32px_60px_-40px_rgba(15,23,42,0.3)]"
              >
                <div className="relative h-44 overflow-hidden">
                  {highlight.image ? (
                    <Image
                      src={highlight.image}
                      alt={highlight.title}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-slate-200 via-slate-100 to-slate-300" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/35 via-slate-900/5 to-transparent" />
                </div>
                <div className="space-y-2 px-6 py-5 text-slate-900">
                  <h3 className="text-lg font-semibold">{highlight.title}</h3>
                  <p className="text-sm text-slate-500 line-clamp-3">{highlight.description}</p>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-700">
                    Explorer
                    <ArrowRight className="h-3 w-3 transition group-hover:translate-x-1 group-hover:text-slate-900" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : null}

        {previews.length ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {previews.map((item, index) => {
              const progressValue =
                typeof item.progress === "number"
                  ? Math.min(Math.max(item.progress, 0), 100)
                  : 0;
              const categoryLabel = item.category ?? item.meta ?? "Programme";

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.06 }}
                  className="group relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_24px_48px_-36px_rgba(15,23,42,0.25)] transition hover:-translate-y-1 hover:shadow-[0_30px_60px_-38px_rgba(15,23,42,0.3)]"
                >
                  <div className="absolute inset-0 rounded-[28px] bg-gradient-to-br from-slate-100 via-white to-blue-50 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                  <div className="relative flex h-full flex-col gap-6 p-6">
                    <span className="inline-flex w-fit items-center rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.32em] text-slate-500">
                      {categoryLabel}
                    </span>
                    <div className="mt-auto space-y-4">
                      <p className="text-lg font-semibold text-slate-900">{item.title}</p>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                          <span>Progression</span>
                          <span>{progressValue}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                          <div
                            className="h-full rounded-full bg-slate-900 transition-all"
                            style={{ width: `${progressValue}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : null}
      </div>
    </section>
  );
};


