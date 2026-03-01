"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Calendar, Edit2, Plus, Tag, Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";
import { SourceChip } from "@/components/ui/source-chip";

type TaskStatus = "todo" | "in_progress" | "done" | "archived";
type TaskPriority = "low" | "normal" | "high" | "urgent";

type TaskType =
  // Apprenant
  | "homework"
  | "review"
  | "project"
  | "exam"
  | "reading"
  | "exercise"
  // Formateur
  | "content_creation"
  | "content_review"
  | "course_planning"
  | "grading"
  // Tuteur
  | "student_followup"
  | "correction"
  | "tutoring_session"
  | "feedback"
  // Admin
  | "organization_management"
  | "user_assignment"
  | "content_assignment"
  | "reporting";

type TodoTask = {
  id: string;
  title: string;
  description: string | null;
  due_date: string | null;
  priority: TaskPriority;
  status: TaskStatus;
  task_type: TaskType;
  role_filter: "learner" | "instructor" | "tutor" | "admin";
  tags: string[];
  subtasks: Array<{ id: string; title: string; completed: boolean }>;
  kanban_position: number;
  created_at: string;
  updated_at: string;
};

type KanbanBoardProps = {
  role: UserRole;
};

// Mapping des rôles frontend vers les rôles DB
const roleMapping: Record<UserRole, "learner" | "instructor" | "tutor" | "admin"> = {
  apprenant: "learner",
  formateur: "instructor",
  tuteur: "tutor",
  admin: "admin",
  entreprise: "admin",
  ecole: "admin",
};

// Types de tâches par rôle
const taskTypesByRole: Record<string, { value: TaskType; label: string }[]> = {
  learner: [
    { value: "homework", label: "Devoir" },
    { value: "review", label: "Révision" },
    { value: "project", label: "Projet" },
    { value: "exam", label: "Examen" },
    { value: "reading", label: "Lecture" },
    { value: "exercise", label: "Exercice" },
  ],
  instructor: [
    { value: "content_creation", label: "Création de contenu" },
    { value: "content_review", label: "Révision de contenu" },
    { value: "course_planning", label: "Planification de cours" },
    { value: "grading", label: "Correction" },
  ],
  tutor: [
    { value: "student_followup", label: "Suivi apprenant" },
    { value: "correction", label: "Correction" },
    { value: "tutoring_session", label: "Session de tutorat" },
    { value: "feedback", label: "Retour" },
  ],
  admin: [
    { value: "organization_management", label: "Gestion organisation" },
    { value: "user_assignment", label: "Assignation utilisateur" },
    { value: "content_assignment", label: "Assignation contenu" },
    { value: "reporting", label: "Rapport" },
  ],
};

const statusColumns: {
  status: TaskStatus;
  label: string;
  tone: "primary" | "secondary" | "celebration" | "muted";
  columnGlow?: string;
}[] = [
  { status: "todo", label: "À faire", tone: "primary", columnGlow: "bg-[#101726]/80" },
  { status: "in_progress", label: "En cours", tone: "secondary", columnGlow: "bg-[#0d1a2d]/78" },
  { status: "done", label: "Terminé", tone: "celebration", columnGlow: "bg-[#0B0F19]/70" },
  { status: "archived", label: "Archivé", tone: "muted", columnGlow: "bg-[#0B0F19]/70" },
];

const priorityColors: Record<TaskPriority, string> = {
  low: "bg-gray-500/20 text-gray-300",
  normal: "bg-blue-500/20 text-blue-300",
  high: "bg-orange-500/20 text-orange-300",
  urgent: "bg-red-500/20 text-red-300",
};

const contextBadgeByTaskType: Record<
  TaskType,
  { label: string; tone: "amber" | "indigo" | "cyan" | "emerald" | "rose"; microcopy: string }
> = {
  homework: { label: "Devoir", tone: "amber", microcopy: "Commenter pour guider l’apprenant." },
  review: { label: "Retour", tone: "indigo", microcopy: "Commenter afin d’apporter un feedback clair." },
  project: { label: "Projet", tone: "cyan", microcopy: "Relancer le groupe sur l’étape suivante." },
  exam: { label: "Évaluation", tone: "rose", microcopy: "Valider les copies de la séance." },
  reading: { label: "Lecture", tone: "indigo", microcopy: "Commenter la sélection avant diffusion." },
  exercise: { label: "Exercice", tone: "emerald", microcopy: "Relancer l’activité pour ancrer l’apprentissage." },
  content_creation: { label: "Préparation", tone: "cyan", microcopy: "Commenter le contenu avant partage." },
  content_review: { label: "Retour", tone: "indigo", microcopy: "Commenter pour finaliser la ressource." },
  course_planning: { label: "Planification", tone: "emerald", microcopy: "Relancer les étapes du parcours." },
  grading: { label: "Correction", tone: "amber", microcopy: "Valider les notes avant diffusion." },
  student_followup: { label: "Suivi", tone: "emerald", microcopy: "Relancer l’apprenant avec un message ciblé." },
  correction: { label: "Correction", tone: "amber", microcopy: "Commenter les réponses pour clarifier." },
  tutoring_session: { label: "Coaching", tone: "indigo", microcopy: "Relancer le groupe avec les rappels clés." },
  feedback: { label: "Feedback", tone: "indigo", microcopy: "Commenter efficacement pour soutenir." },
  organization_management: { label: "Organisation", tone: "cyan", microcopy: "Valider la répartition des ressources." },
  user_assignment: { label: "Affectation", tone: "emerald", microcopy: "Relancer les participants concernés." },
  content_assignment: { label: "Diffusion", tone: "emerald", microcopy: "Valider la priorité avant diffusion." },
  reporting: { label: "Analyse", tone: "indigo", microcopy: "Valider les indicateurs puis relancer si besoin." },
};

const badgeToneClasses: Record<(typeof contextBadgeByTaskType)[keyof typeof contextBadgeByTaskType]["tone"], string> = {
  amber: "border-amber-400/30 bg-amber-500/15 text-amber-100",
  indigo: "border-indigo-400/30 bg-indigo-500/15 text-indigo-100",
  cyan: "border-cyan-400/30 bg-cyan-500/15 text-cyan-100",
  emerald: "border-emerald-400/30 bg-emerald-500/15 text-emerald-100",
  rose: "border-rose-400/30 bg-rose-500/15 text-rose-100",
};

type TaskSourceKey = "drive" | "messaging" | "other";

type TaskSource = {
  key: TaskSourceKey;
  chipLabel: "Document" | "Message";
  resourceHint: string | null;
};

function deriveTaskSource(task: TodoTask): TaskSource {
  const rawTag = task.tags?.[0] ?? null;
  const normalized = rawTag?.toLowerCase() ?? "";

  if (normalized.includes("messagerie") || normalized.includes("message") || normalized.includes("conversation")) {
    return { key: "messaging", chipLabel: "Message", resourceHint: rawTag ?? task.title };
  }

  if (normalized.includes("drive") || normalized.includes("document") || normalized.includes("doc") || normalized.includes("fichier")) {
    return { key: "drive", chipLabel: "Document", resourceHint: rawTag ?? task.title };
  }

  if (normalized.includes("relance") || normalized.includes("apprenant")) {
    return { key: "messaging", chipLabel: "Message", resourceHint: rawTag ?? task.title };
  }

  switch (task.task_type) {
    case "content_review":
    case "content_creation":
    case "content_assignment":
    case "homework":
    case "project":
    case "exercise":
    case "grading":
      return { key: "drive", chipLabel: "Document", resourceHint: rawTag ?? task.title };
    case "student_followup":
    case "feedback":
    case "tutoring_session":
      return { key: "messaging", chipLabel: "Message", resourceHint: rawTag ?? task.title };
    default:
      return { key: "other", chipLabel: "Document", resourceHint: rawTag ?? task.title };
  }
}

const actionByTaskType: Partial<Record<TaskType, "Commenter" | "Relancer" | "Valider">> = {
  homework: "Commenter",
  review: "Commenter",
  project: "Commenter",
  exam: "Valider",
  reading: "Commenter",
  exercise: "Relancer",
  content_creation: "Commenter",
  content_review: "Commenter",
  course_planning: "Valider",
  grading: "Valider",
  student_followup: "Relancer",
  correction: "Commenter",
  tutoring_session: "Relancer",
  feedback: "Commenter",
  organization_management: "Valider",
  user_assignment: "Valider",
  content_assignment: "Valider",
};

function getTaskAction(task: TodoTask): "Commenter" | "Relancer" | "Valider" {
  return actionByTaskType[task.task_type] ?? "Valider";
}

function recordTaskCompletion(task: TodoTask) {
  if (typeof window === "undefined") return;
  const source = deriveTaskSource(task);
  if (source.key === "other") return;
  const payload = {
    key: source.key,
    resource: source.resourceHint ?? task.title,
    at: Date.now(),
  };
  try {
    sessionStorage.setItem("trainerWorkflow:lastCompletedSource", JSON.stringify(payload));
  } catch (error) {
    console.warn("[todo] Unable to persist completion source", error);
  }
}

export function KanbanBoard({ role }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<TodoTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<TodoTask | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    task_type: "" as TaskType | "",
    priority: "normal" as TaskPriority,
    due_date: "",
  });

  const roleFilter = roleMapping[role];
  const availableTaskTypes = taskTypesByRole[roleFilter] || [];

  // Charger les tâches
  const loadTasks = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/todo-tasks?role_filter=${roleFilter}`);
      if (!response.ok) throw new Error("Erreur lors du chargement");
      const data = await response.json();
      setTasks(data);
    } catch (error) {
      console.error("[kanban] Error loading tasks:", error);
      toast.error("Erreur lors du chargement des tâches");
    } finally {
      setLoading(false);
    }
  }, [roleFilter]);

  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Réinitialiser le formulaire
  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      task_type: "" as TaskType | "",
      priority: "normal",
      due_date: "",
    });
  };

  // Ouvrir le dialog pour créer une nouvelle tâche
  const handleOpenCreateDialog = () => {
    resetForm();
    setEditingTask(null);
    setIsDialogOpen(true);
  };

  // Ouvrir le dialog pour éditer une tâche
  const handleOpenEditDialog = (task: TodoTask) => {
    setFormData({
      title: task.title,
      description: task.description || "",
      task_type: task.task_type,
      priority: task.priority,
      due_date: task.due_date ? new Date(task.due_date).toISOString().slice(0, 16) : "",
    });
    setEditingTask(task);
    setIsDialogOpen(true);
  };

  // Créer une nouvelle tâche
  const handleCreateTask = async () => {
    if (!formData.title || !formData.task_type) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      const response = await fetch("/api/todo-tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          task_type: formData.task_type,
          role_filter: roleFilter,
          priority: formData.priority,
          due_date: formData.due_date || null,
          status: "todo",
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la création");
      toast.success("Tâche créée");
      setIsDialogOpen(false);
      resetForm();
      loadTasks();
    } catch (error) {
      console.error("[kanban] Error creating task:", error);
      toast.error("Erreur lors de la création");
    }
  };

  // Mettre à jour une tâche
  const handleUpdateTask = async () => {
    if (!editingTask || !formData.title || !formData.task_type) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      const response = await fetch(`/api/todo-tasks/${editingTask.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description || null,
          task_type: formData.task_type,
          priority: formData.priority,
          due_date: formData.due_date || null,
        }),
      });

      if (!response.ok) throw new Error("Erreur lors de la mise à jour");
      toast.success("Tâche mise à jour");
      setIsDialogOpen(false);
      setEditingTask(null);
      resetForm();
      loadTasks();
    } catch (error) {
      console.error("[kanban] Error updating task:", error);
      toast.error("Erreur lors de la mise à jour");
    }
  };

  // Supprimer une tâche
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette tâche ?")) return;

    try {
      const response = await fetch(`/api/todo-tasks/${taskId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Erreur lors de la suppression");
      toast.success("Tâche supprimée");
      loadTasks();
    } catch (error) {
      console.error("[kanban] Error deleting task:", error);
      toast.error("Erreur lors de la suppression");
    }
  };

  // Gérer le drag & drop
  const handleDragStart = (taskId: string) => {
    setDraggedTask(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (newStatus: TaskStatus) => {
    if (!draggedTask) return;

    const task = tasks.find((t) => t.id === draggedTask);
    if (!task || task.status === newStatus) {
      setDraggedTask(null);
      return;
    }

    try {
      const response = await fetch(`/api/todo-tasks/${draggedTask}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Erreur lors de la mise à jour");
      loadTasks();
      if (newStatus === "done" && task) {
        recordTaskCompletion(task);
      }
    } catch (error) {
      console.error("[kanban] Error updating task status:", error);
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setDraggedTask(null);
    }
  };

  // Filtrer les tâches par statut
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter((t) => t.status === status).sort((a, b) => a.kanban_position - b.kanban_position);
  };

  const recommendedTaskId = useMemo(() => {
    const todoTasks = getTasksByStatus("todo");
    return todoTasks.length > 0 ? todoTasks[0].id : null;
  }, [tasks]);

  if (loading) {
    return (
      <Card className="border-white/10 bg-white/5 text-white">
        <CardContent className="flex items-center justify-center py-12">
          <p className="text-white/60">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex items-center justify-between rounded-2xl border border-white/10 bg-[#0B0F19] px-6 py-4">
        <div className="space-y-1 text-sm text-white/70">
          {tasks.filter((task) => task.status === "todo").length > 0 ? (
            <>
              <span>Commencez par une petite action : la colonne “À faire” rassemble vos pas légers du moment.</span>
              <p className="text-xs text-white/50">
                Vous pouvez en traiter une, puis revenir plus tard sans pression.
              </p>
            </>
          ) : (
            <span>Rien d’urgent aujourd’hui. Profitez-en pour consolider vos contenus ou planifier la suite.</span>
          )}
        </div>
        <Button
          onClick={handleOpenCreateDialog}
          className="rounded-full border border-cyan-400/30 bg-cyan-500/18 px-5 py-2 text-sm font-semibold text-white hover:border-cyan-300/40 hover:bg-cyan-500/28 focus-visible:ring-2 focus-visible:ring-cyan-300"
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouvelle tâche
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statusColumns.map((column) => {
          const columnTasks = getTasksByStatus(column.status);
          const toneClasses =
            column.tone === "primary"
              ? "border border-cyan-400/35 bg-cyan-500/10 text-white"
              : column.tone === "secondary"
              ? "border border-blue-400/30 bg-blue-500/10 text-white/85"
              : column.tone === "celebration"
              ? "border border-emerald-400/25 bg-emerald-500/10 text-emerald-50"
              : "border border-white/12 bg-white/6 text-white/60";

          return (
            <div
              key={column.status}
              className={cn(
                "space-y-3 rounded-3xl border border-white/8 p-4 shadow-[0_20px_45px_rgba(3,7,18,0.45)] transition-colors",
                column.columnGlow ?? "bg-[#0B0F19]/70",
                column.status === "todo" ? "ring-1 ring-cyan-400/35" : "",
              )}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.status)}
            >
              <div
                className={cn(
                  "flex items-center justify-between rounded-2xl px-4 py-2 text-[0.7rem] font-semibold uppercase tracking-[0.28em]",
                  toneClasses,
                )}
              >
                <span>{column.label}</span>
                <span>{columnTasks.length}</span>
              </div>

              {column.status === "todo" && recommendedTaskId ? (
                <p className="text-xs font-medium text-white/60">
                  Si vous souhaitez avancer, commencez ici : une étape simple suffit.
                </p>
              ) : null}

              {column.status === "todo" && columnTasks.length === 0 ? (
                <div className="rounded-2xl border border-white/12 bg-white/6 px-4 py-6 text-sm text-white/65">
                  Rien d’urgent aujourd’hui. Bonne progression 👍
                </div>
              ) : column.status === "in_progress" && columnTasks.length === 0 ? (
                <div className="px-1 text-xs text-white/45">
                  Quand vous commencerez, vos actions apparaîtront ici.
                </div>
              ) : column.status === "done" && columnTasks.length > 0 ? (
                <div className="rounded-2xl border border-emerald-400/25 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  Bien joué, ces tâches sont derrière vous.
                </div>
              ) : null}

              <div className="min-h-[400px] space-y-2">
                {columnTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={() => handleOpenEditDialog(task)}
                    onDelete={() => handleDeleteTask(task.id)}
                    onDragStart={() => handleDragStart(task.id)}
                    recommended={task.id === recommendedTaskId}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dialog pour créer/éditer une tâche */}
      <Dialog open={isDialogOpen || editingTask !== null} onOpenChange={(open) => {
        if (!open) {
          setIsDialogOpen(false);
          setEditingTask(null);
        }
      }}>
        <DialogContent className="border-white/10 bg-gradient-to-br from-[#0A0A0A] via-[#111111] to-[#1A1A1A] text-white">
          <DialogHeader>
            <DialogTitle>{editingTask ? "Modifier la tâche" : "Nouvelle tâche"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (editingTask) {
                handleUpdateTask();
              } else {
                handleCreateTask();
              }
            }}
            className="space-y-4"
          >
            <div>
              <label className="text-sm text-white/80">Titre *</label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-white/80">Description</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div>
              <label className="text-sm text-white/80">Type de tâche *</label>
              <Select
                value={formData.task_type}
                onValueChange={(value) => setFormData({ ...formData, task_type: value as TaskType })}
                required
              >
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {availableTaskTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-white/80">Priorité</label>
                <Select
                  value={formData.priority}
                  onValueChange={(value) => setFormData({ ...formData, priority: value as TaskPriority })}
                >
                  <SelectTrigger className="bg-white/5 border-white/10 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="normal">Normale</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm text-white/80">Date d'échéance</label>
                <Input
                  type="datetime-local"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="bg-white/5 border-white/10 text-white"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setIsDialogOpen(false);
                  setEditingTask(null);
                  resetForm();
                }}
              >
                Annuler
              </Button>
              <Button type="submit" className="bg-gradient-to-r from-blue-500 to-cyan-500">
                {editingTask ? "Mettre à jour" : "Créer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

type TaskCardProps = {
  task: TodoTask;
  onDragStart: () => void;
  onEdit: () => void;
  onDelete: () => void;
  recommended?: boolean;
};

function TaskCard({ task, onDragStart, onEdit, onDelete, recommended = false }: TaskCardProps) {
  const context = contextBadgeByTaskType[task.task_type];
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const primaryTag = task.tags?.[0] ?? null;
  const secondaryTags = task.tags?.slice(1, 3) ?? [];
  const initials = primaryTag?.slice(0, 2).toUpperCase() || task.title.slice(0, 2).toUpperCase();
  const taskSource = deriveTaskSource(task);
  const taskAction = getTaskAction(task);

  const handleEdit = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    onEdit();
  };

  const handleDelete = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    event.preventDefault();
    onDelete();
  };

  return (
    <Card
      draggable
      onDragStart={onDragStart}
      className={cn(
        "group cursor-move border border-white/10 bg-white/[0.03] text-white shadow-[0_20px_45px_rgba(3,7,18,0.35)] transition hover:border-cyan-300/35 hover:bg-cyan-500/8",
        recommended ? "ring-1 ring-cyan-200/30" : "",
      )}
    >
      <CardContent className="space-y-4 p-4">
        {recommended ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-500/10 px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-cyan-100">
            Point de départ recommandé
          </div>
        ) : null}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                className={cn(
                  "rounded-full border px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.22em]",
                  badgeToneClasses[context.tone],
                )}
              >
                {context.label}
              </Badge>
              <Badge className={cn("text-[0.65rem] uppercase tracking-[0.18em]", priorityColors[task.priority])}>
                {task.priority}
              </Badge>
              <SourceChip label={taskSource.chipLabel} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold leading-tight text-white">{task.title}</h3>
              <p className="text-xs text-white/50">Action · {taskAction}</p>
            </div>
            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
              <p className="text-sm leading-relaxed text-white/70">
                {task.description ?? context.microcopy}
              </p>
            </div>
          </div>
          <div className="flex gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleEdit}
              className="h-7 w-7 rounded-full border border-white/10 text-white/70 hover:border-white/20 hover:text-white"
              aria-label="Modifier la tâche"
              title="Modifier la tâche"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleDelete}
              className="h-7 w-7 rounded-full border border-white/10 text-white/60 hover:border-red-400/30 hover:text-red-200"
              aria-label="Supprimer la tâche"
              title="Supprimer la tâche"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs text-white/60">
          {dueDate ? (
            <div className="flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[0.7rem] font-medium">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {dueDate.toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })}
              </span>
              <span className="text-white/45">
                {dueDate.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          ) : null}
          <div className="flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-3 py-1 text-[0.7rem] font-medium">
            <Tag className="h-3.5 w-3.5" />
            <span className="capitalize">{task.task_type.replace(/_/g, " ")}</span>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/8 bg-white/4 px-3 py-3 text-sm text-white/70">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-white/10 bg-white/10 text-xs font-semibold text-white">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="text-xs uppercase tracking-[0.2em] text-white/45">
                {primaryTag ? "Formation liée" : "Pilotage formation"}
              </p>
              <p className="text-sm font-medium text-white">
                {primaryTag ?? "Sans formation associée"}
              </p>
            </div>
          </div>
          {secondaryTags.length > 0 ? (
            <div className="flex flex-wrap justify-end gap-1">
              {secondaryTags.map((tag) => (
                <Badge key={tag} variant="outline" className="border-white/15 px-2 py-0.5 text-[0.65rem] text-white/60">
                  {tag}
                </Badge>
              ))}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
