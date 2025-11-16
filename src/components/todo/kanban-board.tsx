"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Calendar, Tag, Clock, User, MoreVertical, X, Edit2, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { UserRole } from "@/types/database";

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

const statusColumns: { status: TaskStatus; label: string; color: string }[] = [
  { status: "todo", label: "À faire", color: "bg-white/10" },
  { status: "in_progress", label: "En cours", color: "bg-blue-500/20" },
  { status: "done", label: "Terminé", color: "bg-emerald-500/20" },
  { status: "archived", label: "Archivé", color: "bg-gray-500/20" },
];

const priorityColors: Record<TaskPriority, string> = {
  low: "bg-gray-500/20 text-gray-300",
  normal: "bg-blue-500/20 text-blue-300",
  high: "bg-orange-500/20 text-orange-300",
  urgent: "bg-red-500/20 text-red-300",
};

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">To-Do List</h2>
          <p className="text-sm text-white/60">Organisez vos tâches avec un Kanban</p>
        </div>
        <Button
          onClick={handleOpenCreateDialog}
          className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nouvelle tâche
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statusColumns.map((column) => {
          const columnTasks = getTasksByStatus(column.status);
          return (
            <div
              key={column.status}
              className="space-y-3"
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(column.status)}
            >
              <div className={cn("rounded-lg px-4 py-2 text-sm font-semibold text-white", column.color)}>
                {column.label} ({columnTasks.length})
              </div>
              <div className="space-y-2 min-h-[400px]">
                {columnTasks.map((task) => (
                  <Card
                    key={task.id}
                    draggable
                    onDragStart={() => handleDragStart(task.id)}
                    className="cursor-move border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                  >
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-white">{task.title}</h3>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleOpenEditDialog(task)}
                              className="h-6 w-6 text-white/60 hover:text-white"
                            >
                              <Edit2 className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleDeleteTask(task.id)}
                              className="h-6 w-6 text-white/60 hover:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        {task.description && (
                          <p className="text-xs text-white/60 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge className={cn("text-xs", priorityColors[task.priority])}>
                            {task.priority}
                          </Badge>
                          {task.due_date && (
                            <div className="flex items-center gap-1 text-xs text-white/50">
                              <Calendar className="h-3 w-3" />
                              {new Date(task.due_date).toLocaleDateString("fr-FR")}
                            </div>
                          )}
                        </div>
                        {task.tags && task.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {task.tags.slice(0, 3).map((tag, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs text-white/60">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
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

