"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { parseFetchJson } from "@/lib/api/parse-fetch-json";
import {
  CRM_PROJECT_STAGES,
  CRM_PROJECT_TOPICS,
  projectTopicMeta,
  type CrmProject,
  type CrmProjectStageSlug,
  type CrmProjectTopicSlug,
} from "@/lib/crm/projects-shared";
import {
  DEFAULT_PIPELINE_BTOB_OWNER_EMAIL,
  PIPELINE_BTOB_CONTACT_OWNERS,
  pipelineOwnerLabel,
} from "@/lib/crm/pipeline-btob-owners";
import { cn } from "@/lib/utils";

type ProjectForm = {
  title: string;
  description: string;
  stage_slug: CrmProjectStageSlug;
  topic_slug: CrmProjectTopicSlug;
  owner_email: string;
};

const emptyForm = (stage: CrmProjectStageSlug = "projet_a_definir"): ProjectForm => ({
  title: "",
  description: "",
  stage_slug: stage,
  topic_slug: "commercial",
  owner_email: DEFAULT_PIPELINE_BTOB_OWNER_EMAIL,
});

export function ProjetsBoardClient() {
  const [projects, setProjects] = useState<CrmProject[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<ProjectForm>(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/crm/projects");
      const json = await parseFetchJson<{ projects?: CrmProject[]; error?: string }>(res);
      if (!res.ok) throw new Error(json.error);
      setProjects(json.projects ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const projectsByStage = useMemo(() => {
    const map = new Map<CrmProjectStageSlug, CrmProject[]>();
    for (const s of CRM_PROJECT_STAGES) map.set(s.slug, []);
    for (const p of projects) {
      const list = map.get(p.stage_slug as CrmProjectStageSlug) ?? [];
      list.push(p);
      map.set(p.stage_slug as CrmProjectStageSlug, list);
    }
    return map;
  }, [projects]);

  const openCreate = (stage: CrmProjectStageSlug) => {
    setEditingId(null);
    setForm(emptyForm(stage));
    setDialogOpen(true);
  };

  const openEdit = (project: CrmProject) => {
    setEditingId(project.id);
    setForm({
      title: project.title,
      description: project.description ?? "",
      stage_slug: project.stage_slug,
      topic_slug: project.topic_slug,
      owner_email: project.owner_email ?? DEFAULT_PIPELINE_BTOB_OWNER_EMAIL,
    });
    setDialogOpen(true);
  };

  const saveProject = async () => {
    if (!form.title.trim()) {
      toast.error("Titre requis");
      return;
    }
    try {
      if (editingId) {
        const res = await fetch(`/api/super-admin/crm/projects/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = await parseFetchJson<{ error?: string }>(res);
        if (!res.ok) throw new Error(json.error);
      } else {
        const res = await fetch("/api/super-admin/crm/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(form),
        });
        const json = await parseFetchJson<{ error?: string }>(res);
        if (!res.ok) throw new Error(json.error);
      }
      setDialogOpen(false);
      await load();
      toast.success(editingId ? "Projet mis à jour" : "Projet créé");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const deleteProject = async (id: string) => {
    if (!confirm("Supprimer ce projet ?")) return;
    const res = await fetch(`/api/super-admin/crm/projects/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Suppression impossible");
      return;
    }
    await load();
  };

  const moveProject = async (id: string, stageSlug: CrmProjectStageSlug) => {
    const res = await fetch(`/api/super-admin/crm/projects/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage_slug: stageSlug }),
    });
    if (!res.ok) {
      toast.error("Déplacement impossible");
      return;
    }
    await load();
  };

  if (loading) {
    return <p className="py-12 text-center text-sm text-gray-500">Chargement des projets…</p>;
  }

  return (
    <>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {CRM_PROJECT_STAGES.map((stage) => {
          const column = projectsByStage.get(stage.slug) ?? [];
          return (
            <div
              key={stage.slug}
              className="flex w-72 shrink-0 flex-col rounded-xl border border-gray-200 bg-gray-50"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const id = e.dataTransfer.getData("projectId");
                if (id) void moveProject(id, stage.slug);
              }}
            >
              <div className="border-b border-gray-200 bg-white px-3 py-3 rounded-t-xl">
                <p className="text-sm font-semibold text-gray-900">{stage.label}</p>
                <p className="text-xs text-gray-500">{column.length} projet{column.length > 1 ? "s" : ""}</p>
              </div>

              <div className="flex-1 space-y-2 p-2 min-h-[140px]">
                {column.map((project) => {
                  const topic = projectTopicMeta(project.topic_slug);
                  return (
                    <div
                      key={project.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData("projectId", project.id)}
                      className={cn(
                        "cursor-grab rounded-xl border bg-gradient-to-br p-3 text-white shadow-lg active:cursor-grabbing",
                        topic.cardClass,
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <button
                          type="button"
                          className="text-left text-sm font-semibold leading-tight hover:underline"
                          onClick={() => openEdit(project)}
                        >
                          {project.title}
                        </button>
                        <button
                          type="button"
                          className="shrink-0 text-white/60 hover:text-rose-300"
                          onClick={() => void deleteProject(project.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      {project.description ? (
                        <p className="mt-1 line-clamp-2 text-xs text-white/75">{project.description}</p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        <Badge
                          variant="outline"
                          className={cn("border-0 text-[10px]", topic.badgeClass)}
                        >
                          {topic.label}
                        </Badge>
                        {project.owner_email ? (
                          <span className="text-[10px] text-white/70">
                            Qui : {pipelineOwnerLabel(project.owner_email)}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="border-t border-gray-200 p-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full text-xs"
                  onClick={() => openCreate(stage.slug)}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Ajouter
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier le projet" : "Nouveau projet"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>Titre *</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sujet</Label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={form.topic_slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, topic_slug: e.target.value as CrmProjectTopicSlug }))
                }
              >
                {CRM_PROJECT_TOPICS.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Qui ?</Label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={form.owner_email}
                onChange={(e) => setForm((f) => ({ ...f, owner_email: e.target.value }))}
              >
                {PIPELINE_BTOB_CONTACT_OWNERS.map((o) => (
                  <option key={o.email} value={o.email}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Étape</Label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={form.stage_slug}
                onChange={(e) =>
                  setForm((f) => ({ ...f, stage_slug: e.target.value as CrmProjectStageSlug }))
                }
              >
                {CRM_PROJECT_STAGES.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => void saveProject()}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
