"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Info, CheckSquare, Clock, AlertCircle, ArrowRight, Bell, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { LearnerHero as LearnerHeroType, LearnerCard } from "@/lib/queries/apprenant";

const NAV_ITEMS = ["Accueil", "Formations", "Tests", "Drive", "Ma liste"]; // display only

type TodoTask = {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done" | "archived";
  priority: "low" | "normal" | "high" | "urgent";
  due_date?: string;
  task_type: string;
};

type LearnerHeroProps = {
  hero: LearnerHeroType;
  previews: LearnerCard[];
};

export const LearnerHero = ({ hero, previews }: LearnerHeroProps) => {
  const [activeNav, setActiveNav] = useState<string>(NAV_ITEMS[0]);
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTasksExpanded, setIsTasksExpanded] = useState(false);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        let response = await fetch("/api/todo-tasks?role_filter=learner&status=todo,in_progress");
        if (!response.ok) {
          response = await fetch("/api/todo-tasks?status=todo,in_progress");
        }
        
        if (response.ok) {
          const data = await response.json();
          const learnerTasks = data.filter((task: TodoTask) => {
            const learnerTaskTypes = ['homework', 'review', 'project', 'exam', 'reading', 'exercise'];
            return !task.task_type || learnerTaskTypes.includes(task.task_type);
          });
          
          const sortedTasks = learnerTasks
            .sort((a: TodoTask, b: TodoTask) => {
              const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
              return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
            })
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

  return (
    <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 shadow-[0_40px_140px_rgba(139,92,246,0.35)]">
      <div className="absolute inset-0">
        {hero.backgroundImage && hero.backgroundImage.trim() !== "" ? (
          <Image
            src={hero.backgroundImage}
            alt={hero.title}
            fill
            priority
            className="object-cover"
          />
        ) : null}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(239,68,68,0.85),_transparent_60%)]" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-[#EF4444]/35 to-[#3B82F6]/55" />
      </div>

      {/* Notification To-Do en haut à droite */}
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
                className="group relative flex items-center gap-2 rounded-full border border-white/20 bg-white/10 backdrop-blur-md px-4 py-2 transition-all hover:bg-white/20 hover:scale-105"
              >
                <Bell className="h-4 w-4 text-white" />
                <span className="text-sm font-medium text-white">
                  {taskCount} tâche{taskCount > 1 ? 's' : ''}
                </span>
                {taskCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-gradient-to-r from-red-500 to-blue-500 text-[10px] font-bold text-white shadow-lg">
                    {taskCount}
                  </span>
                )}
              </motion.button>
            ) : (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="w-80 rounded-2xl border border-white/20 bg-white/10 backdrop-blur-md shadow-2xl"
              >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CheckSquare className="h-4 w-4 text-white/80" />
                    <h3 className="text-sm font-semibold text-white">À faire / En cours</h3>
                  </div>
                  <button
                    onClick={() => setIsTasksExpanded(false)}
                    className="rounded-full p-1 text-white/60 hover:bg-white/10 hover:text-white transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {tasks.map((task) => {
                    const isUrgent = task.priority === "urgent" || task.priority === "high";
                    const isInProgress = task.status === "in_progress";
                    const dueDate = task.due_date ? new Date(task.due_date) : null;
                    const isOverdue = dueDate && dueDate < new Date() && !isInProgress;

                    return (
                      <div
                        key={task.id}
                        className={cn(
                          "rounded-lg border p-2.5 transition-all hover:bg-white/5",
                          isUrgent
                            ? "border-red-500/30 bg-red-500/10"
                            : isInProgress
                              ? "border-blue-500/30 bg-blue-500/10"
                              : "border-white/10 bg-white/5",
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {isInProgress ? (
                            <Clock className="h-3.5 w-3.5 text-blue-400 flex-shrink-0 mt-0.5" />
                          ) : isUrgent ? (
                            <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0 mt-0.5" />
                          ) : (
                            <CheckSquare className="h-3.5 w-3.5 text-white/60 flex-shrink-0 mt-0.5" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-medium text-white">{task.title}</span>
                              {isUrgent && (
                                <span className="rounded-full bg-red-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-red-300">
                                  {task.priority === "urgent" ? "Urgent" : "Important"}
                                </span>
                              )}
                              {isInProgress && (
                                <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-blue-300">
                                  En cours
                                </span>
                              )}
                            </div>
                            {dueDate && (
                              <p
                                className={cn(
                                  "mt-1 text-[10px]",
                                  isOverdue ? "text-red-400" : "text-white/50",
                                )}
                              >
                                {isOverdue ? "En retard" : `Échéance: ${dueDate.toLocaleDateString("fr-FR")}`}
                              </p>
                            )}
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
                  className="mt-3 w-full rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/10 text-xs h-8"
                >
                  <Link href="/dashboard/apprenant/todo" className="flex items-center justify-center gap-1.5">
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

      <div className="relative z-10 flex flex-col gap-8 px-6 py-10 md:px-12 md:py-16">
        <nav className="flex flex-wrap items-center gap-6 text-sm font-medium text-white/85">
          {NAV_ITEMS.map((item) => (
            <button
              key={item}
              type="button"
              onMouseEnter={() => setActiveNav(item)}
              className="relative pb-1 transition hover:text-white"
            >
              {item}
              <AnimatePresence>
                {activeNav === item ? (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute bottom-0 left-0 h-[2px] w-full rounded-full bg-[linear-gradient(135deg,#EF4444,#3B82F6)]"
                    initial={{ opacity: 0, scaleX: 0 }}
                    animate={{ opacity: 1, scaleX: 1 }}
                    exit={{ opacity: 0, scaleX: 0 }}
                    transition={{ duration: 0.2 }}
                  />
                ) : null}
              </AnimatePresence>
            </button>
          ))}
        </nav>

        <div className="space-y-4 text-white md:max-w-3xl">
          {hero.badge ? (
            <span className="inline-flex items-center rounded-full bg-white/15 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/90">
              {hero.badge}
            </span>
          ) : null}
          <motion.h1
            className="text-3xl font-semibold leading-tight md:text-5xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {hero.title}
          </motion.h1>
          <motion.p
            className="text-sm text-white/75 md:text-base"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            {hero.description}
          </motion.p>
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-white/70 md:text-sm">
            {hero.meta ? <span className="rounded-full border border-white/30 px-3 py-1 text-white/85">{hero.meta}</span> : null}
            {hero.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-white/10 px-3 py-1">
                {tag}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Button className="flex items-center gap-2 rounded-full bg-[linear-gradient(135deg,#EF4444,#3B82F6)] px-6 py-2 text-sm font-semibold text-white shadow-[0_16px_50px_rgba(139,92,246,0.35)] hover:brightness-110">
              <Play className="h-4 w-4" /> Reprendre
            </Button>
            <Button
              variant="outline"
              className="flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-2 text-sm font-semibold text-white hover:bg-white/20"
            >
              <Info className="h-4 w-4" /> Plus d&apos;infos
            </Button>
          </div>
        </div>

        {previews.length ? (
          <div className="flex items-center gap-4 overflow-x-auto pb-2">
            {previews.map((item) => (
              <motion.div
                key={item.id}
                className="group relative h-24 w-40 overflow-hidden rounded-2xl border border-white/10"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {item.image && item.image.trim() !== "" ? (
                  <Image src={item.image} alt={item.title} fill className="object-cover transition duration-500 group-hover:scale-105" />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-gray-800 to-gray-900" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute inset-x-3 bottom-3">
                  <p className="text-xs font-semibold text-white line-clamp-2">{item.title}</p>
                  {item.meta ? <p className="text-[10px] text-white/70">{item.meta}</p> : null}
                </div>
              </motion.div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
};


