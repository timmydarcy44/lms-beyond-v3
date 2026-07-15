"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, Pencil, Plus, Trash2, UserRound } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DEFAULT_PIPELINE_BTOB_OWNER_EMAIL,
  PIPELINE_BTOB_CONTACT_OWNERS,
  pipelineOwnerLabel,
} from "@/lib/crm/pipeline-btob-owners";
import {
  emptyPrescripteurForm,
  type PipelinePrescripteur,
  type PrescripteurForm,
} from "@/lib/crm/pipeline-prescripteur-shared";
import { cn } from "@/lib/utils";

function prescripteurToForm(p: PipelinePrescripteur): PrescripteurForm {
  return {
    first_name: p.first_name,
    last_name: p.last_name,
    company_name: p.company_name,
    email: p.email ?? "",
    phone: p.phone ?? "",
    next_action: p.next_action,
    notes: p.notes ?? "",
    contact_owner_email: p.contact_owner_email ?? DEFAULT_PIPELINE_BTOB_OWNER_EMAIL,
  };
}

export function PrescripteursBoardClient({ currentUserEmail }: { currentUserEmail: string | null }) {
  const [rows, setRows] = useState<PipelinePrescripteur[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PrescripteurForm>(
    emptyPrescripteurForm(currentUserEmail ?? DEFAULT_PIPELINE_BTOB_OWNER_EMAIL),
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/crm/prescripteurs");
      const json = (await res.json()) as { prescripteurs?: PipelinePrescripteur[]; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Chargement impossible");
      setRows(json.prescripteurs ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur de chargement");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyPrescripteurForm(currentUserEmail ?? DEFAULT_PIPELINE_BTOB_OWNER_EMAIL));
    setDialogOpen(true);
  };

  const openEdit = (p: PipelinePrescripteur) => {
    setEditingId(p.id);
    setForm(prescripteurToForm(p));
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.first_name.trim() || !form.last_name.trim() || !form.company_name.trim()) {
      toast.error("Prénom, nom et entreprise sont requis.");
      return;
    }

    setSaving(true);
    try {
      const url = editingId
        ? `/api/super-admin/crm/prescripteurs/${editingId}`
        : "/api/super-admin/crm/prescripteurs";
      const method = editingId ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Enregistrement impossible");

      toast.success(editingId ? "Prescripteur mis à jour" : "Prescripteur ajouté");
      setDialogOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Supprimer ce prescripteur ?")) return;
    try {
      const res = await fetch(`/api/super-admin/crm/prescripteurs/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Suppression impossible");
      toast.success("Prescripteur supprimé");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const stats = useMemo(() => {
    const withAction = rows.filter((r) => r.next_action.trim()).length;
    return { total: rows.length, withAction };
  }, [rows]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-3 text-sm text-gray-600">
          <span className="rounded-full bg-white px-3 py-1 ring-1 ring-gray-200">
            {stats.total} prescripteur{stats.total > 1 ? "s" : ""}
          </span>
          <span className="rounded-full bg-white px-3 py-1 ring-1 ring-gray-200">
            {stats.withAction} action{stats.withAction > 1 ? "s" : ""} en cours
          </span>
        </div>
        <Button type="button" onClick={openCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Ajouter un prescripteur
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Chargement…</p>
      ) : rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <UserRound className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-4 text-sm font-medium text-gray-900">Aucun prescripteur</p>
          <p className="mt-1 text-sm text-gray-500">
            Ajoutez vos contacts prescripteurs pour suivre les actions commerciales.
          </p>
          <Button type="button" onClick={openCreate} className="mt-6 gap-2">
            <Plus className="h-4 w-4" />
            Ajouter
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => (
            <article
              key={p.id}
              className="flex flex-col rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-indigo-200 hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-gray-900">
                    {p.first_name} {p.last_name}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-gray-500">{p.company_name || "—"}</p>
                </div>
                <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">
                  {pipelineOwnerLabel(p.contact_owner_email)}
                </span>
              </div>

              <dl className="mt-4 space-y-2 text-sm">
                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Contact</dt>
                  <dd className="mt-1 space-y-1 text-gray-700">
                    {p.email ? (
                      <a href={`mailto:${p.email}`} className="flex items-center gap-2 hover:text-indigo-600">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{p.email}</span>
                      </a>
                    ) : (
                      <span className="text-gray-400">E-mail non renseigné</span>
                    )}
                    {p.phone ? (
                      <a href={`tel:${p.phone}`} className="flex items-center gap-2 hover:text-indigo-600">
                        <Phone className="h-3.5 w-3.5 shrink-0" />
                        <span>{p.phone}</span>
                      </a>
                    ) : null}
                  </dd>
                </div>

                <div>
                  <dt className="text-xs font-medium uppercase tracking-wide text-gray-400">Action</dt>
                  <dd
                    className={cn(
                      "mt-1 rounded-md px-3 py-2 text-sm",
                      p.next_action.trim()
                        ? "bg-amber-50 text-amber-950 ring-1 ring-amber-100"
                        : "bg-gray-50 text-gray-400",
                    )}
                  >
                    {p.next_action.trim() || "Aucune action définie"}
                  </dd>
                </div>
              </dl>

              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                {p.phone ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`tel:${p.phone}`}>
                      <Phone className="h-3.5 w-3.5" />
                      Appeler
                    </a>
                  </Button>
                ) : null}
                {p.email ? (
                  <Button variant="outline" size="sm" asChild>
                    <a href={`mailto:${p.email}`}>
                      <Mail className="h-3.5 w-3.5" />
                      E-mail
                    </a>
                  </Button>
                ) : null}
                <Button variant="outline" size="sm" onClick={() => openEdit(p)}>
                  <Pencil className="h-3.5 w-3.5" />
                  Modifier
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => void remove(p.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? "Modifier le prescripteur" : "Nouveau prescripteur"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-first">Prénom</Label>
                <Input
                  id="p-first"
                  value={form.first_name}
                  onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-last">Nom</Label>
                <Input
                  id="p-last"
                  value={form.last_name}
                  onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-company">Entreprise</Label>
              <Input
                id="p-company"
                value={form.company_name}
                onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-email">E-mail</Label>
                <Input
                  id="p-email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-phone">Téléphone</Label>
                <Input
                  id="p-phone"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-action">Action</Label>
              <Textarea
                id="p-action"
                rows={2}
                placeholder="Ex. : Relancer pour présentation catalogue, RDV le 20/07…"
                value={form.next_action}
                onChange={(e) => setForm((f) => ({ ...f, next_action: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-notes">Notes</Label>
              <Textarea
                id="p-notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="p-owner">Responsable</Label>
              <select
                id="p-owner"
                value={form.contact_owner_email}
                onChange={(e) => setForm((f) => ({ ...f, contact_owner_email: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {PIPELINE_BTOB_CONTACT_OWNERS.map((o) => (
                  <option key={o.email} value={o.email}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
