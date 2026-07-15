"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Euro,
  ExternalLink,
  Mail,
  Percent,
  Phone,
  Plus,
  Trash2,
  UserRound,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PipelineLightSection } from "@/components/crm/pipeline-light-section";
import { PIPELINE_BTOB_CONTACT_OWNERS, pipelineOwnerLabel } from "@/lib/crm/pipeline-btob-owners";
import {
  computeClientCommissionCents,
  formatCommissionAmount,
  formatCommissionLabel,
  sumLinkedCommissionsCents,
  type PrescripteurForm,
  type PrescripteurLinkedDeal,
} from "@/lib/crm/pipeline-prescripteur-shared";
import {
  DEFAULT_PIPELINE_STAGES,
  formatDealAmount,
  type PipelineDeal,
  type PipelineStage,
} from "@/lib/crm/pipeline-shared";

type ProspectOption = Pick<
  PipelineDeal,
  "id" | "company_name" | "contact_first_name" | "contact_last_name" | "stage_slug" | "amount_cents"
>;

function stageLabel(slug: string, stages: PipelineStage[]): string {
  return stages.find((s) => s.slug === slug)?.label ?? slug;
}

export function PipelinePrescripteurCockpit({
  form,
  setForm,
  linkedClients,
  onLinkedClientsChange,
  pipelineDeals,
  pipelineStages,
  savingLink,
  onAddClient,
  onUpdateLink,
  onRemoveLink,
}: {
  form: PrescripteurForm;
  setForm: React.Dispatch<React.SetStateAction<PrescripteurForm>>;
  linkedClients: PrescripteurLinkedDeal[];
  onLinkedClientsChange: React.Dispatch<React.SetStateAction<PrescripteurLinkedDeal[]>>;
  pipelineDeals: ProspectOption[];
  pipelineStages: PipelineStage[];
  savingLink: boolean;
  onAddClient: (dealId: string, commissionType: "percent" | "fixed", commissionValue: number) => Promise<void>;
  onUpdateLink: (
    linkId: string,
    patch: { commission_type?: "percent" | "fixed"; commission_value?: number },
  ) => Promise<void>;
  onRemoveLink: (linkId: string) => Promise<void>;
}) {
  const [selectedDealId, setSelectedDealId] = useState("");
  const [newCommissionType, setNewCommissionType] = useState<"percent" | "fixed">("percent");
  const [newCommissionValue, setNewCommissionValue] = useState("10");

  const linkedDealIds = useMemo(() => new Set(linkedClients.map((l) => l.deal_id)), [linkedClients]);

  const availableDeals = useMemo(
    () => pipelineDeals.filter((d) => !linkedDealIds.has(d.id)),
    [pipelineDeals, linkedDealIds],
  );

  const totalCommissionCents = useMemo(() => sumLinkedCommissionsCents(linkedClients), [linkedClients]);

  const displayName = [form.first_name, form.last_name].filter(Boolean).join(" ").trim() || "Prescripteur";

  const handleAddClient = async () => {
    if (!selectedDealId || !form.id) return;
    const value = Number.parseFloat(newCommissionValue.replace(",", "."));
    if (Number.isNaN(value)) return;
    await onAddClient(selectedDealId, newCommissionType, value);
    setSelectedDealId("");
  };

  const patchLocalLink = (linkId: string, patch: Partial<PrescripteurLinkedDeal>) => {
    onLinkedClientsChange((prev) =>
      prev.map((l) => (l.id === linkId ? { ...l, ...patch } : l)),
    );
  };

  return (
    <div className="space-y-4 text-white">
      <div className="relative -mx-4 -mt-4 mb-2 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-5 text-white sm:-mx-6 sm:-mt-6 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(99,102,241,0.25),transparent_55%)]" />

        <div
          className={cn(
            "relative mb-4 rounded-xl border p-4",
            form.next_action.trim()
              ? "border-violet-400/30 bg-violet-950/35"
              : "border-amber-400/40 bg-amber-950/35",
          )}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-200/90">
            Prochaine action
          </p>
          {form.next_action.trim() ? (
            <p className="mt-1 text-base font-bold text-white">{form.next_action}</p>
          ) : (
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-amber-200">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
              Aucune prochaine action planifiée
            </p>
          )}
          <div className="relative mt-3">
            <Input
              className="h-9 border-white/20 bg-white/10 text-sm text-white placeholder:text-slate-400"
              placeholder="Action à mener…"
              value={form.next_action}
              onChange={(e) => setForm((f) => ({ ...f, next_action: e.target.value }))}
            />
          </div>
        </div>

        <div className="relative grid grid-cols-2 gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-center text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Clients liés</p>
            <p className="font-semibold text-white">{linkedClients.length}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Rétribution totale</p>
            <p className="font-semibold text-emerald-300">{formatCommissionAmount(totalCommissionCents)}</p>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-lg font-bold text-white">{displayName}</p>
            <Input
              className="mt-1 border-0 bg-transparent p-0 text-sm text-slate-300 shadow-none placeholder:text-slate-500 focus-visible:ring-0"
              placeholder="Entreprise *"
              value={form.company_name}
              onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {form.phone?.trim() ? (
              <Button type="button" size="sm" className="bg-indigo-600 hover:bg-indigo-700" asChild>
                <a href={`tel:${form.phone.replace(/\s/g, "")}`}>
                  <Phone className="mr-1.5 h-4 w-4" />
                  Appeler
                </a>
              </Button>
            ) : null}
            {form.email?.trim() ? (
              <Button type="button" size="sm" variant="outline" className="border-white/20 text-white" asChild>
                <a href={`mailto:${form.email.trim()}`}>
                  <Mail className="mr-1.5 h-4 w-4" />
                  Email
                </a>
              </Button>
            ) : null}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Prénom</Label>
            <Input
              className="border-white/15 bg-white/10 text-white"
              value={form.first_name}
              onChange={(e) => setForm((f) => ({ ...f, first_name: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Nom</Label>
            <Input
              className="border-white/15 bg-white/10 text-white"
              value={form.last_name}
              onChange={(e) => setForm((f) => ({ ...f, last_name: e.target.value }))}
            />
          </div>
        </div>

        <div className="mt-3 space-y-1">
          <Label className="text-xs text-slate-400">Responsable</Label>
          <select
            className="w-full rounded-md border border-white/15 bg-white/10 px-2 py-1.5 text-sm text-white"
            value={form.contact_owner_email}
            onChange={(e) => setForm((f) => ({ ...f, contact_owner_email: e.target.value }))}
          >
            {PIPELINE_BTOB_CONTACT_OWNERS.map((o) => (
              <option key={o.email} value={o.email} className="bg-slate-900">
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Users className="h-4 w-4 text-indigo-300" />
          <p className="text-sm font-semibold text-white">Clients obtenus via ce prescripteur</p>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Sélectionnez les prospects du pipeline BTOB liés à ce prescripteur.
        </p>

        {form.id ? (
          <div className="mt-4 space-y-3 rounded-lg border border-white/10 bg-slate-900/40 p-3">
            <div className="space-y-1.5">
              <Label className="text-xs text-slate-400">Ajouter un prospect</Label>
              <select
                className="w-full rounded-md border border-white/15 bg-white/10 px-2 py-2 text-sm text-white"
                value={selectedDealId}
                onChange={(e) => setSelectedDealId(e.target.value)}
              >
                <option value="" className="bg-slate-900">
                  Choisir un client du pipeline…
                </option>
                {availableDeals.map((d) => (
                  <option key={d.id} value={d.id} className="bg-slate-900">
                    {d.company_name}
                    {d.contact_first_name ? ` — ${d.contact_first_name}` : ""}
                    {` (${stageLabel(d.stage_slug, pipelineStages)})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Rétribution</Label>
                <select
                  className="w-full rounded-md border border-white/15 bg-white/10 px-2 py-1.5 text-sm text-white"
                  value={newCommissionType}
                  onChange={(e) => setNewCommissionType(e.target.value as "percent" | "fixed")}
                >
                  <option value="percent" className="bg-slate-900">
                    Pourcentage (%)
                  </option>
                  <option value="fixed" className="bg-slate-900">
                    Montant fixe (€)
                  </option>
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">
                  {newCommissionType === "percent" ? "Taux (%)" : "Montant (€)"}
                </Label>
                <Input
                  type="number"
                  min={0}
                  max={newCommissionType === "percent" ? 100 : undefined}
                  step={newCommissionType === "percent" ? 0.5 : 1}
                  className="border-white/15 bg-white/10 text-white"
                  value={newCommissionValue}
                  onChange={(e) => setNewCommissionValue(e.target.value)}
                />
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              className="w-full bg-indigo-600 hover:bg-indigo-500"
              disabled={!selectedDealId || savingLink}
              onClick={() => void handleAddClient()}
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Lier ce client
            </Button>
          </div>
        ) : (
          <p className="mt-3 text-sm text-amber-200">
            Enregistrez le prescripteur avant de lier des clients.
          </p>
        )}

        {linkedClients.length === 0 ? (
          <p className="mt-4 text-sm text-slate-400">Aucun client lié pour le moment.</p>
        ) : (
          <div className="mt-4 grid gap-3">
            {linkedClients.map((link) => {
              const deal = link.deal;
              const commissionCents = computeClientCommissionCents(link, deal);
              return (
                <article
                  key={link.id}
                  className="rounded-xl border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-4 shadow-lg"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold text-white">{deal?.company_name ?? "Prospect"}</p>
                      <p className="mt-0.5 text-xs text-slate-300">
                        {[deal?.contact_first_name, deal?.contact_last_name].filter(Boolean).join(" ") ||
                          "—"}
                      </p>
                      {deal?.stage_slug ? (
                        <Badge variant="outline" className="mt-2 border-indigo-400/30 text-indigo-200">
                          {stageLabel(deal.stage_slug, pipelineStages)}
                        </Badge>
                      ) : null}
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] uppercase tracking-wide text-slate-400">Rétribution</p>
                      <p className="text-lg font-bold text-emerald-300">
                        {formatCommissionAmount(commissionCents)}
                      </p>
                      <p className="text-[11px] text-slate-400">{formatCommissionLabel(link)}</p>
                    </div>
                  </div>

                  {deal?.amount_cents ? (
                    <p className="mt-2 text-xs text-slate-400">
                      CA prospect : {formatDealAmount(deal.amount_cents)}
                    </p>
                  ) : null}

                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <select
                      className="rounded-md border border-white/15 bg-white/10 px-2 py-1.5 text-xs text-white"
                      value={link.commission_type}
                      onChange={(e) => {
                        const commission_type = e.target.value as "percent" | "fixed";
                        patchLocalLink(link.id, { commission_type });
                        void onUpdateLink(link.id, { commission_type });
                      }}
                    >
                      <option value="percent" className="bg-slate-900">
                        %
                      </option>
                      <option value="fixed" className="bg-slate-900">
                        €
                      </option>
                    </select>
                    <Input
                      type="number"
                      min={0}
                      max={link.commission_type === "percent" ? 100 : undefined}
                      step={link.commission_type === "percent" ? 0.5 : 1}
                      className="h-8 border-white/15 bg-white/10 text-xs text-white"
                      value={link.commission_value}
                      onChange={(e) => {
                        const commission_value = Number.parseFloat(e.target.value);
                        if (Number.isNaN(commission_value)) return;
                        patchLocalLink(link.id, { commission_value });
                      }}
                      onBlur={() =>
                        void onUpdateLink(link.id, {
                          commission_type: link.commission_type,
                          commission_value: link.commission_value,
                        })
                      }
                    />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {deal?.id ? (
                      <Button type="button" size="sm" variant="outline" className="border-white/20 text-white" asChild>
                        <Link href={`/super/crm/pipeline-btob/${deal.id}`}>
                          <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
                          Fiche prospect
                        </Link>
                      </Button>
                    ) : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="text-rose-300 hover:bg-rose-950/40 hover:text-rose-200"
                      onClick={() => void onRemoveLink(link.id)}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Retirer
                    </Button>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {linkedClients.length > 0 ? (
          <div className="mt-4 flex items-center justify-between rounded-lg border border-emerald-400/25 bg-emerald-950/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-emerald-100">
              {newCommissionType === "percent" ? (
                <Percent className="h-4 w-4" />
              ) : (
                <Euro className="h-4 w-4" />
              )}
              Total à retribuer au prescripteur
            </div>
            <p className="text-xl font-bold text-emerald-300">
              {formatCommissionAmount(totalCommissionCents)}
            </p>
          </div>
        ) : null}
      </section>

      <PipelineLightSection title="Coordonnées" subtitle="E-mail, téléphone" defaultOpen tone="dark">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">E-mail</Label>
            <Input
              type="email"
              className="border-white/15 bg-white/10 text-white"
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Téléphone</Label>
            <Input
              className="border-white/15 bg-white/10 text-white"
              value={form.phone}
              onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
            />
          </div>
        </div>
      </PipelineLightSection>

      <section className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        <Label className="text-sm font-semibold text-white">Notes internes</Label>
        <Textarea
          className="mt-2 border-white/15 bg-white/10 text-white placeholder:text-slate-500"
          rows={4}
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          placeholder="Contexte, historique, préférences de contact…"
        />
      </section>

      {!form.id ? (
        <div className="flex items-center gap-2 rounded-lg border border-amber-400/30 bg-amber-950/30 px-3 py-2 text-xs text-amber-100">
          <UserRound className="h-4 w-4 shrink-0" />
          Enregistrez la fiche pour lier des clients et calculer les rétributions.
        </div>
      ) : null}
    </div>
  );
}

export const DEFAULT_PRESCRIPTOR_STAGES: PipelineStage[] = DEFAULT_PIPELINE_STAGES.map((s) => ({
  slug: s.slug,
  label: s.label,
  sort_order: s.sort_order,
}));
