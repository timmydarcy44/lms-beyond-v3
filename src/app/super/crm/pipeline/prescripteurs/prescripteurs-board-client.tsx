"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Mail, Phone, Pencil, Plus, Trash2, UserRound, Users } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DEFAULT_PIPELINE_BTOB_OWNER_EMAIL,
  pipelineOwnerLabel,
} from "@/lib/crm/pipeline-btob-owners";
import {
  emptyInterlocutor,
  emptyPrescripteurForm,
  syncPrimaryFromInterlocutors,
  type PipelinePrescripteur,
  type PrescripteurForm,
  type PrescripteurLinkedDeal,
} from "@/lib/crm/pipeline-prescripteur-shared";
import { type PipelineDeal } from "@/lib/crm/pipeline-shared";
import { cn } from "@/lib/utils";
import { PipelineDealSheet, PipelineDealSheetFooter } from "@/components/crm/pipeline-deal-sheet";
import {
  DEFAULT_PRESCRIPTOR_STAGES,
  PipelinePrescripteurCockpit,
} from "@/components/crm/pipeline-prescripteur-cockpit";

function prescripteurToForm(p: PipelinePrescripteur): PrescripteurForm {
  const interlocutors =
    p.interlocutors && p.interlocutors.length > 0
      ? p.interlocutors.map((i) => ({
          id: i.id,
          first_name: i.first_name ?? "",
          last_name: i.last_name ?? "",
          email: i.email ?? "",
          phone: i.phone ?? "",
          linkedin_url: i.linkedin_url ?? "",
        }))
      : [
          {
            ...emptyInterlocutor(),
            first_name: p.first_name ?? "",
            last_name: p.last_name ?? "",
            email: p.email ?? "",
            phone: p.phone ?? "",
          },
        ];

  return {
    id: p.id,
    first_name: p.first_name,
    last_name: p.last_name,
    company_name: p.company_name,
    email: p.email ?? "",
    phone: p.phone ?? "",
    link_url: p.link_url ?? "",
    cta_label: p.cta_label ?? "Ouvrir le lien",
    next_action: p.next_action,
    notes: p.notes ?? "",
    contact_owner_email: p.contact_owner_email ?? DEFAULT_PIPELINE_BTOB_OWNER_EMAIL,
    interlocutors,
  };
}

export function PrescripteursBoardClient({ currentUserEmail }: { currentUserEmail: string | null }) {
  const [rows, setRows] = useState<PipelinePrescripteur[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savingLink, setSavingLink] = useState(false);
  const [form, setForm] = useState<PrescripteurForm>(
    emptyPrescripteurForm(currentUserEmail ?? DEFAULT_PIPELINE_BTOB_OWNER_EMAIL),
  );
  const [linkedClients, setLinkedClients] = useState<PrescripteurLinkedDeal[]>([]);
  const [pipelineDeals, setPipelineDeals] = useState<PipelineDeal[]>([]);
  const [clientCounts, setClientCounts] = useState<Record<string, number>>({});

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

  const loadPipelineDeals = useCallback(async () => {
    try {
      const res = await fetch("/api/super-admin/crm/pipeline?type=btob");
      const json = (await res.json()) as { deals?: PipelineDeal[]; error?: string };
      if (!res.ok) throw new Error(json.error);
      setPipelineDeals(json.deals ?? []);
    } catch {
      setPipelineDeals([]);
    }
  }, []);

  const loadPrescripteurDetail = useCallback(async (id: string) => {
    const res = await fetch(`/api/super-admin/crm/prescripteurs/${id}`);
    const json = (await res.json()) as {
      linked_clients?: PrescripteurLinkedDeal[];
      interlocutors?: PrescripteurForm["interlocutors"];
      prescripteur?: PipelinePrescripteur;
      error?: string;
    };
    if (!res.ok) throw new Error(json.error ?? "Chargement fiche impossible");
    setLinkedClients(json.linked_clients ?? []);
    if (json.prescripteur) {
      setForm(prescripteurToForm({
        ...json.prescripteur,
        interlocutors: json.interlocutors ?? json.prescripteur.interlocutors,
      }));
    } else if (json.interlocutors?.length) {
      setForm((f) =>
        syncPrimaryFromInterlocutors({
          ...f,
          interlocutors: json.interlocutors!,
        }),
      );
    }
  }, []);

  useEffect(() => {
    void load();
    void loadPipelineDeals();
  }, [load, loadPipelineDeals]);

  useEffect(() => {
    if (!rows.length) {
      setClientCounts({});
      return;
    }
    void (async () => {
      const counts: Record<string, number> = {};
      await Promise.all(
        rows.map(async (p) => {
          try {
            const res = await fetch(`/api/super-admin/crm/prescripteurs/${p.id}`);
            const json = (await res.json()) as { linked_clients?: PrescripteurLinkedDeal[] };
            if (res.ok) counts[p.id] = json.linked_clients?.length ?? 0;
          } catch {
            counts[p.id] = 0;
          }
        }),
      );
      setClientCounts(counts);
    })();
  }, [rows]);

  const openCreate = () => {
    setForm(emptyPrescripteurForm(currentUserEmail ?? DEFAULT_PIPELINE_BTOB_OWNER_EMAIL));
    setLinkedClients([]);
    setSheetOpen(true);
  };

  const openEdit = async (p: PipelinePrescripteur) => {
    setForm(prescripteurToForm(p));
    setSheetOpen(true);
    try {
      await loadPrescripteurDetail(p.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Impossible de charger les clients liés");
      setLinkedClients([]);
    }
  };

  const save = async () => {
    const payload = syncPrimaryFromInterlocutors(form);
    if (!payload.first_name.trim() || !payload.last_name.trim() || !payload.company_name.trim()) {
      toast.error("Entreprise et Interlocuteur 1 (prénom + nom) sont requis.");
      return;
    }

    setSaving(true);
    try {
      const url = payload.id
        ? `/api/super-admin/crm/prescripteurs/${payload.id}`
        : "/api/super-admin/crm/prescripteurs";
      const method = payload.id ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json()) as { prescripteur?: PipelinePrescripteur; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Enregistrement impossible");

      if (!payload.id && json.prescripteur?.id) {
        setForm(prescripteurToForm(json.prescripteur));
      } else if (json.prescripteur) {
        setForm(prescripteurToForm(json.prescripteur));
      }

      toast.success(payload.id ? "Prescripteur mis à jour" : "Prescripteur ajouté");
      await load();
      if (json.prescripteur?.id) {
        await loadPrescripteurDetail(json.prescripteur.id);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSaving(false);
    }
  };

  const addClient = async (
    dealId: string,
    commissionType: "percent" | "fixed",
    commissionValue: number,
  ) => {
    if (!form.id) return;
    setSavingLink(true);
    try {
      const res = await fetch(`/api/super-admin/crm/prescripteurs/${form.id}/clients`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deal_id: dealId,
          commission_type: commissionType,
          commission_value: commissionValue,
        }),
      });
      const json = (await res.json()) as { link?: PrescripteurLinkedDeal; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Liaison impossible");
      if (json.link) {
        setLinkedClients((prev) => [json.link!, ...prev]);
        setClientCounts((prev) => ({ ...prev, [form.id!]: (prev[form.id!] ?? 0) + 1 }));
      }
      toast.success("Client lié au prescripteur");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    } finally {
      setSavingLink(false);
    }
  };

  const updateLink = async (
    linkId: string,
    patch: { commission_type?: "percent" | "fixed"; commission_value?: number },
  ) => {
    if (!form.id) return;
    try {
      const res = await fetch(`/api/super-admin/crm/prescripteurs/${form.id}/clients/${linkId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      const json = (await res.json()) as { link?: PrescripteurLinkedDeal; error?: string };
      if (!res.ok) throw new Error(json.error ?? "Mise à jour impossible");
      if (json.link) {
        setLinkedClients((prev) => prev.map((l) => (l.id === linkId ? json.link! : l)));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const removeLink = async (linkId: string) => {
    if (!form.id || !window.confirm("Retirer ce client du prescripteur ?")) return;
    try {
      const res = await fetch(`/api/super-admin/crm/prescripteurs/${form.id}/clients/${linkId}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Suppression impossible");
      setLinkedClients((prev) => prev.filter((l) => l.id !== linkId));
      setClientCounts((prev) => ({
        ...prev,
        [form.id!]: Math.max(0, (prev[form.id!] ?? 1) - 1),
      }));
      toast.success("Client retiré");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm("Supprimer ce prescripteur ?")) return;
    try {
      const res = await fetch(`/api/super-admin/crm/prescripteurs/${id}`, { method: "DELETE" });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Suppression impossible");
      toast.success("Prescripteur supprimé");
      if (form.id === id) setSheetOpen(false);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const stats = useMemo(() => {
    const withAction = rows.filter((r) => r.next_action.trim()).length;
    const withClients = Object.values(clientCounts).filter((n) => n > 0).length;
    return { total: rows.length, withAction, withClients };
  }, [rows, clientCounts]);

  const sheetTitle =
    [form.first_name, form.last_name].filter(Boolean).join(" ").trim() ||
    form.company_name ||
    "Nouveau prescripteur";

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
          <span className="rounded-full bg-white px-3 py-1 ring-1 ring-gray-200">
            {stats.withClients} avec clients liés
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
          {rows.map((p) => {
            const linkedCount = clientCounts[p.id] ?? 0;
            return (
              <article
                key={p.id}
                className="relative cursor-pointer overflow-hidden rounded-xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 text-white shadow-lg transition hover:border-indigo-400/30"
                onClick={() => void openEdit(p)}
              >
                <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_0%,rgba(99,102,241,0.22),transparent_60%)]" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-base font-semibold">
                        {p.first_name} {p.last_name}
                      </p>
                      <p className="mt-0.5 truncate text-sm text-slate-300">{p.company_name || "—"}</p>
                    </div>
                    <span className="shrink-0 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-indigo-200">
                      {pipelineOwnerLabel(p.contact_owner_email)}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-1 text-slate-200">
                      <Users className="h-3 w-3" />
                      {linkedCount} client{linkedCount > 1 ? "s" : ""}
                    </span>
                  </div>

                  <div
                    className={cn(
                      "mt-3 rounded-md px-3 py-2 text-sm",
                      p.next_action.trim()
                        ? "bg-amber-950/40 text-amber-100 ring-1 ring-amber-400/20"
                        : "bg-white/5 text-slate-400",
                    )}
                  >
                    {p.next_action.trim() || "Aucune action définie"}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2" onClick={(e) => e.stopPropagation()}>
                    {p.link_url ? (
                      <Button variant="outline" size="sm" className="border-white/20 text-white" asChild>
                        <a
                          href={
                            p.link_url.startsWith("http") ? p.link_url : `https://${p.link_url}`
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {p.cta_label?.trim() || "Lien"}
                        </a>
                      </Button>
                    ) : null}
                    {p.phone ? (
                      <Button variant="outline" size="sm" className="border-white/20 text-white" asChild>
                        <a href={`tel:${p.phone}`}>
                          <Phone className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    ) : null}
                    {p.email ? (
                      <Button variant="outline" size="sm" className="border-white/20 text-white" asChild>
                        <a href={`mailto:${p.email}`}>
                          <Mail className="h-3.5 w-3.5" />
                        </a>
                      </Button>
                    ) : null}
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white"
                      onClick={() => void openEdit(p)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-rose-300 hover:bg-rose-950/40"
                      onClick={() => void remove(p.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <PipelineDealSheet open={sheetOpen} onOpenChange={setSheetOpen} title={sheetTitle}>
        <PipelinePrescripteurCockpit
          form={form}
          setForm={setForm}
          linkedClients={linkedClients}
          onLinkedClientsChange={setLinkedClients}
          pipelineDeals={pipelineDeals}
          pipelineStages={DEFAULT_PRESCRIPTOR_STAGES}
          savingLink={savingLink}
          onAddClient={addClient}
          onUpdateLink={updateLink}
          onRemoveLink={removeLink}
        />
        <PipelineDealSheetFooter>
          <Button
            variant="outline"
            type="button"
            className="border-white/20 bg-transparent text-white hover:bg-white/10"
            onClick={() => setSheetOpen(false)}
          >
            Annuler
          </Button>
          <Button
            type="button"
            className="bg-indigo-600 hover:bg-indigo-500"
            disabled={saving}
            onClick={() => void save()}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </PipelineDealSheetFooter>
      </PipelineDealSheet>
    </div>
  );
}
