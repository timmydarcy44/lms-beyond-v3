"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckSquare, Clock, AlertCircle, ArrowRight, ChevronDown, ChevronUp, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type TodoTask = {
  id: string;
  title: string;
  description?: string;
  status: "todo" | "in_progress" | "done" | "archived";
  priority: "low" | "normal" | "high" | "urgent";
  due_date?: string;
  task_type: string;
};

export function LearnerTasksBanner() {
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    const loadTasks = async () => {
      try {
        // Essayer d'abord avec role_filter=learner
        let response = await fetch("/api/todo-tasks?role_filter=learner&status=todo,in_progress");
        if (!response.ok) {
          // Si ça échoue, essayer sans role_filter
          response = await fetch("/api/todo-tasks?status=todo,in_progress");
        }
        
        if (response.ok) {
          const data = await response.json();
          console.log("[learner-tasks-banner] Tasks loaded:", data.length);
          
          // Filtrer les tâches pour les apprenants (role_filter = 'learner' ou pas de role_filter)
          // Les tâches d'apprenants ont des task_type comme: homework, review, project, exam, reading, exercise
          const learnerTasks = data.filter((task: TodoTask) => {
            const learnerTaskTypes = ['homework', 'review', 'project', 'exam', 'reading', 'exercise'];
            return !task.task_type || learnerTaskTypes.includes(task.task_type);
          });
          
          // Prendre les 3 premières tâches prioritaires
          const sortedTasks = learnerTasks
            .sort((a: TodoTask, b: TodoTask) => {
              const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
              return (priorityOrder[b.priority] || 0) - (priorityOrder[a.priority] || 0);
            })
            .slice(0, 3);
          
          console.log("[learner-tasks-banner] Filtered tasks:", sortedTasks.length);
          setTasks(sortedTasks);
        } else {
          console.warn("[learner-tasks-banner] Failed to load tasks:", response.status);
        }
      } catch (error) {
        console.error("[learner-tasks-banner] Error loading tasks:", error);
      } finally {
        setLoading(false);
      }
    };

    loadTasks();
  }, []);

  if (loading) {
    return null;
  }

  if (tasks.length === 0) {
    return null;
  }

  const urgentTasks = tasks.filter((t) => t.priority === "urgent" || t.priority === "high");
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress");
  const taskCount = tasks.length;

  // Si réduit, afficher juste une notification
  if (isCollapsed) {
    return (
      <Card className="border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-md">
        <CardContent className="p-3">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setIsCollapsed(false)}
              className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
            >
              <Bell className="h-4 w-4" />
              <span className="text-sm font-medium">
                {taskCount} tâche{taskCount > 1 ? 's' : ''} à faire / en cours
              </span>
            </button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(false)}
              className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
            >
              <ChevronDown className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent backdrop-blur-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-white/80" />
                <h3 className="text-sm font-semibold text-white">À faire / En cours</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCollapsed(true)}
                className="h-6 w-6 text-white/60 hover:text-white hover:bg-white/10"
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-1.5">
              {tasks.slice(0, 2).map((task) => {
                const isUrgent = task.priority === "urgent" || task.priority === "high";
                const isInProgress = task.status === "in_progress";
                const dueDate = task.due_date ? new Date(task.due_date) : null;
                const isOverdue = dueDate && dueDate < new Date() && !isInProgress;

                return (
                  <div
                    key={task.id}
                    className={cn(
                      "flex items-center gap-2 rounded-lg border p-2 transition-all hover:bg-white/5",
                      isUrgent
                        ? "border-red-500/30 bg-red-500/10"
                        : isInProgress
                          ? "border-blue-500/30 bg-blue-500/10"
                          : "border-white/10 bg-white/5",
                    )}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {isInProgress ? (
                          <Clock className="h-3.5 w-3.5 text-blue-400 flex-shrink-0" />
                        ) : isUrgent ? (
                          <AlertCircle className="h-3.5 w-3.5 text-red-400 flex-shrink-0" />
                        ) : (
                          <CheckSquare className="h-3.5 w-3.5 text-white/60 flex-shrink-0" />
                        )}
                        <span className="text-xs font-medium text-white truncate">{task.title}</span>
                        {isUrgent && (
                          <span className="rounded-full bg-red-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-red-300 flex-shrink-0">
                            {task.priority === "urgent" ? "Urgent" : "Important"}
                          </span>
                        )}
                        {isInProgress && (
                          <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-blue-300 flex-shrink-0">
                            En cours
                          </span>
                        )}
                      </div>
                      {dueDate && (
                        <p
                          className={cn(
                            "mt-0.5 text-[10px]",
                            isOverdue ? "text-red-400" : "text-white/50",
                          )}
                        >
                          {isOverdue ? "En retard" : `Échéance: ${dueDate.toLocaleDateString("fr-FR")}`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {tasks.length > 2 && (
                <div className="text-xs text-white/60 text-center pt-1">
                  +{tasks.length - 2} autre{tasks.length - 2 > 1 ? 's' : ''} tâche{tasks.length - 2 > 1 ? 's' : ''}
                </div>
              )}
            </div>
          </div>

          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/10 text-xs h-8"
          >
            <Link href="/dashboard/apprenant/todo" className="flex items-center gap-1.5">
              Voir tout
              <ArrowRight className="h-3 w-3" />
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

