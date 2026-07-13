"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Plus, Pencil, Trash2, DollarSign, ExternalLink, Loader2, Filter, CalendarClock, AlertTriangle } from "lucide-react";
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
  computePipelineRevenueCents,
  formatDealAmount,
  shouldShowRevenueBar,
  type PipelineDeal,
  type PipelineStage,
  type PipelineType,
} from "@/lib/crm/pipeline-shared";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";
import {
  isNextActionOverdue,
  priorityBadgeClass,
  sectorBadgeClass,
} from "@/lib/crm/pipeline-btob-commercial-options";
import {
  commercialFromDeal,
  commercialToPayload,
  emptyBtobCommercial,
  PipelineBtobCommercialFields,
  type BtobCommercialFormState,
} from "./pipeline-btob-commercial-fields";
import { fetchSiretCompany } from "@/lib/ecole/fetch-siret-company";
import {
  DEFAULT_PIPELINE_BTOB_OWNER_EMAIL,
  PIPELINE_BTOB_CONTACT_OWNERS,
  pipelineOwnerLabel,
} from "@/lib/crm/pipeline-btob-owners";
import { Users } from "lucide-react";

type DealForm = {
  id?: string;
  stage_slug: string;
  contact_owner_email: string;
  siret: string;
  siren: string;
  naf_code: string;
  opco_name: string;
  company_name: string;
  contact_first_name: string;
  email: string;
  phone: string;
  amount: string;
  notes: string;
};

const emptyDeal = (stage: string): DealForm => ({
  stage_slug: stage,
  contact_owner_email: DEFAULT_PIPELINE_BTOB_OWNER_EMAIL,
  siret: "",
  siren: "",
  naf_code: "",
  opco_name: "",
  company_name: "",
  contact_first_name: "",
  email: "",
  phone: "",
  amount: "",
  notes: "",
});

export function PipelineBoardClient({
  pipelineType,
  currentUserEmail,
}: {
  pipelineType: PipelineType;
  currentUserEmail: string | null;
}) {
  const isBtoc = pipelineType === "btoc";
  const defaultStage = isBtoc ? "inscription" : "a_appeler";
  const normUserEmail = currentUserEmail?.trim().toLowerCase() ?? null;
  const isJerome = normUserEmail === "jerome.picot@edgebs.fr";

  const [stages, setStages] = useState<PipelineStage[]>([]);
  const [deals, setDeals] = useState<PipelineDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<DealForm>(emptyDeal(defaultStage));
  const [commercial, setCommercial] = useState<BtobCommercialFormState>(emptyBtobCommercial());
  const [editingStage, setEditingStage] = useState<PipelineStage | null>(null);
  const [stageLabelDraft, setStageLabelDraft] = useState("");
  const [siretLoading, setSiretLoading] = useState(false);
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [nextActionFilter, setNextActionFilter] = useState<"all" | "only_with_date">("all");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const sync = isBtoc ? "&sync=1" : "";
      const res = await fetch(`/api/super-admin/crm/pipeline?type=${pipelineType}${sync}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setStages(json.stages ?? []);
      setDeals(json.deals ?? []);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, [pipelineType, isBtoc]);

  useEffect(() => {
    if (isBtoc) return;
    // Par défaut: Jérôme voit ses deals uniquement; Timmy voit tout.
    if (isJerome) setOwnerFilter("jerome.picot@edgebs.fr");
    else setOwnerFilter("all");
  }, [isBtoc, isJerome]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    const onCrmUpdated = () => void load();
    window.addEventListener("crm-updated", onCrmUpdated);
    return () => window.removeEventListener("crm-updated", onCrmUpdated);
  }, [load]);

  const runBtocSync = async () => {
    setSyncing(true);
    try {
      const res = await fetch("/api/super-admin/crm/pipeline/sync-btoc", { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success(`Synchronisation BTOC : ${json.synced ?? 0} contact(s)`);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Sync impossible");
    } finally {
      setSyncing(false);
    }
  };

  const dealsByStage = useMemo(() => {
    const map = new Map<string, PipelineDeal[]>();
    for (const s of stages) map.set(s.slug, []);
    for (const d of deals) {
      const list = map.get(d.stage_slug) ?? [];
      list.push(d);
      map.set(d.stage_slug, list);
    }
    return map;
  }, [stages, deals]);

  const filteredDeals = useMemo(() => {
    if (isBtoc) return deals;
    let list = deals;
    if (ownerFilter !== "all") {
      const norm = ownerFilter.trim().toLowerCase();
      list = list.filter((d) => (d.contact_owner_email ?? "").trim().toLowerCase() === norm);
    }
    if (nextActionFilter === "only_with_date") {
      list = list.filter((d) => Boolean(d.next_action_date));
    }
    return list;
  }, [deals, isBtoc, ownerFilter, nextActionFilter]);

  const filteredDealsByStage = useMemo(() => {
    const map = new Map<string, PipelineDeal[]>();
    for (const s of stages) map.set(s.slug, []);
    for (const d of filteredDeals) {
      const list = map.get(d.stage_slug) ?? [];
      list.push(d);
      map.set(d.stage_slug, list);
    }
    return map;
  }, [stages, filteredDeals]);

  const showCa = !isBtoc && shouldShowRevenueBar(filteredDeals);
  const caTotal = computePipelineRevenueCents(filteredDeals);

  const kpis = useMemo(() => {
    if (isBtoc) return null;
    const totalProspects = filteredDeals.length;
    const myProspects = norm
      ? filteredDeals.filter((d) => (d.contact_owner_email ?? "").trim().toLowerCase() === norm).length
      : 0;
    const overdue = filteredDeals.filter((d) => isNextActionOverdue(d.next_action_date)).length;
    const today = new Date().toISOString().slice(0, 10);
    const actionsToday = filteredDeals.filter((d) => (d.next_action_date ?? "").slice(0, 10) === today).length;
    const actionsWithDate = filteredDeals.filter((d) => Boolean(d.next_action_date)).length;
    return { totalProspects, myProspects, overdue, actionsToday, actionsWithDate };
  }, [filteredDeals, norm, isBtoc]);

  const nextActions = useMemo(() => {
    if (isBtoc) return [];
    const today = new Date().toISOString().slice(0, 10);
    return filteredDeals
      .filter((d) => Boolean(d.next_action_date) && Boolean(d.next_action))
      .map((d) => ({
        id: d.id,
        company: d.company_name,
        owner: d.contact_owner_email ?? null,
        nextAction: d.next_action ?? "",
        date: (d.next_action_date ?? "").slice(0, 10),
        isOverdue: (d.next_action_date ?? "") < today,
        stage: d.stage_slug,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(0, 8);
  }, [filteredDeals, isBtoc]);

  const openCreate = (stageSlug: string) => {
    setForm(emptyDeal(stageSlug));
    setCommercial(emptyBtobCommercial());
    setDialogOpen(true);
  };

  const openEdit = (deal: PipelineDeal) => {
    setForm({
      id: deal.id,
      stage_slug: deal.stage_slug,
      contact_owner_email: deal.contact_owner_email ?? DEFAULT_PIPELINE_BTOB_OWNER_EMAIL,
      siret: deal.siret ?? "",
      siren: deal.siren ?? "",
      naf_code: deal.naf_code ?? "",
      opco_name: deal.opco_name ?? "",
      company_name: deal.company_name,
      contact_first_name: deal.contact_first_name,
      email: deal.email ?? "",
      phone: deal.phone ?? "",
      amount: deal.amount_cents ? String(deal.amount_cents / 100) : "",
      notes: deal.notes ?? "",
    });
    setCommercial(commercialFromDeal(deal));
    setDialogOpen(true);
  };

  const lookupSiret = async () => {
    const digits = form.siret.replace(/\s/g, "");
    if (digits.length !== 14) {
      toast.error("Saisissez un SIRET à 14 chiffres.");
      return;
    }
    setSiretLoading(true);
    const res = await fetchSiretCompany(digits);
    setSiretLoading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    const d = res.data;
    const location = [d.zip_code, d.city].filter(Boolean).join(" ");
    const enrichNotes = [
      d.opco_name ? `OPCO : ${d.opco_name}` : null,
      d.naf_code ? `NAF : ${d.naf_code}` : null,
      d.address ? `Adresse : ${d.address}` : null,
      d.tranche_effectif ? `Effectif : ${d.tranche_effectif}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    setForm((prev) => ({
      ...prev,
      siret: d.siret,
      siren: d.siren,
      naf_code: d.naf_code,
      opco_name: d.opco_name,
      company_name: d.company_name || prev.company_name,
      notes: enrichNotes ? (prev.notes ? `${prev.notes}\n${enrichNotes}` : enrichNotes) : prev.notes,
    }));
    setCommercial((prev) => ({
      ...prev,
      location: location || prev.location,
      why_target: d.sector ? (prev.why_target || `Secteur : ${d.sector}`) : prev.why_target,
    }));
    toast.success("Fiche entreprise récupérée.");
  };

  const saveDeal = async () => {
    if (!form.company_name.trim()) {
      toast.error("Nom de l'entreprise requis");
      return;
    }
    const payload = {
      stage_slug: form.stage_slug,
      contact_owner_email: form.contact_owner_email || null,
      siret: form.siret || null,
      siren: form.siren || null,
      naf_code: form.naf_code || null,
      opco_name: form.opco_name || null,
      company_name: form.company_name,
      contact_first_name: form.contact_first_name,
      email: form.email || null,
      phone: form.phone || null,
      amount: form.amount,
      notes: form.notes || null,
      ...(!isBtoc ? commercialToPayload(commercial) : {}),
    };

    try {
      if (form.id) {
        const res = await fetch(`/api/super-admin/crm/pipeline/deals/${form.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, pipeline_type: pipelineType }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
      } else {
        const res = await fetch("/api/super-admin/crm/pipeline", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...payload, pipeline_type: pipelineType }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
      }
      setDialogOpen(false);
      await load();
      toast.success("Enregistré");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur");
    }
  };

  const deleteDeal = async (id: string) => {
    if (!confirm("Supprimer cette carte ?")) return;
    const res = await fetch(`/api/super-admin/crm/pipeline/deals/${id}`, { method: "DELETE" });
    if (!res.ok) {
      toast.error("Suppression impossible");
      return;
    }
    await load();
  };

  const moveDeal = async (dealId: string, stageSlug: string) => {
    const res = await fetch(`/api/super-admin/crm/pipeline/deals/${dealId}`, {
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

  const saveStageLabel = async () => {
    if (!editingStage || !stageLabelDraft.trim()) return;
    const res = await fetch(
      `/api/super-admin/crm/pipeline/stages/${editingStage.slug}?type=${pipelineType}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: stageLabelDraft }),
      },
    );
    const json = await res.json();
    if (!res.ok) {
      toast.error(json.error ?? "Erreur");
      return;
    }
    setEditingStage(null);
    await load();
    toast.success("Étape mise à jour");
  };

  if (loading) {
    return <p className="text-sm text-gray-500 py-12 text-center">Chargement du pipeline…</p>;
  }

  return (
    <div className="space-y-4">
      {!isBtoc ? (
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 shadow-sm">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                className="bg-transparent text-sm text-gray-900 outline-none"
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
              >
                <option value="all">Tous</option>
                {PIPELINE_BTOB_CONTACT_OWNERS.map((o) => (
                  <option
                    key={o.email}
                    value={o.email}
                    disabled={isJerome && o.email !== "jerome.picot@edgebs.fr" && o.email !== "timmydarcy44@gmail.com"}
                  >
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className={`rounded-2xl border px-3 py-2 text-sm shadow-sm transition ${
                nextActionFilter === "only_with_date"
                  ? "border-indigo-200 bg-indigo-50 text-indigo-900"
                  : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
              }`}
              onClick={() =>
                setNextActionFilter((v) => (v === "all" ? "only_with_date" : "all"))
              }
              title="Filtrer les cartes avec une prochaine action"
            >
              <CalendarClock className="mr-2 inline-block h-4 w-4" />
              Prochaines actions
            </button>
          </div>
        </div>
      ) : null}

      {kpis ? (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-indigo-50/60 px-5 py-4 shadow-sm">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.18),transparent_55%)]" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Prospects</p>
                <Users className="h-4 w-4 text-indigo-500" />
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">{kpis.totalProspects}</p>
              <p className="mt-1 text-xs text-gray-500">Selon le filtre</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-violet-50/70 px-5 py-4 shadow-sm">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_10%,rgba(139,92,246,0.18),transparent_55%)]" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Mes prospects</p>
                <Users className="h-4 w-4 text-violet-500" />
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">{kpis.myProspects}</p>
              <p className="mt-1 text-xs text-gray-500">{currentUserEmail ? pipelineOwnerLabel(normUserEmail) : "—"}</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-amber-50/70 px-5 py-4 shadow-sm">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(245,158,11,0.18),transparent_55%)]" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Actions aujourd’hui</p>
                <CalendarClock className="h-4 w-4 text-amber-600" />
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">{kpis.actionsToday}</p>
              <p className="mt-1 text-xs text-gray-500">{kpis.actionsWithDate} planifiées</p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-white to-rose-50/70 px-5 py-4 shadow-sm">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_20%,rgba(244,63,94,0.18),transparent_55%)]" />
            <div className="relative">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">En retard</p>
                <AlertTriangle className="h-4 w-4 text-rose-600" />
              </div>
              <p className="mt-2 text-3xl font-bold text-gray-900">{kpis.overdue}</p>
              <p className="mt-1 text-xs text-gray-500">À traiter</p>
            </div>
          </div>
        </div>
      ) : null}

      {!isBtoc ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                Prochaines actions
              </p>
              <p className="text-sm text-gray-700">Basé sur “Date prochaine action”</p>
            </div>
            <span className="text-xs text-gray-500">{nextActions.length} à venir</span>
          </div>
          {nextActions.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">Aucune action planifiée sur le filtre actuel.</p>
          ) : (
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {nextActions.map((a) => (
                <Link
                  key={a.id}
                  href={`/super/crm/pipeline-btob/${a.id}`}
                  className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 transition hover:bg-gray-50 ${
                    a.isOverdue ? "border-rose-200 bg-rose-50/40" : "border-gray-200 bg-white"
                  }`}
                  title="Ouvrir la fiche prospect"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900">{a.company}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-gray-600">→ {a.nextAction}</p>
                    {a.owner ? (
                      <p className="mt-1 text-[11px] text-indigo-700">{pipelineOwnerLabel(a.owner)}</p>
                    ) : null}
                  </div>
                  <div className="shrink-0 text-right">
                    <p className={`text-sm font-semibold ${a.isOverdue ? "text-rose-700" : "text-gray-900"}`}>
                      {a.date}
                    </p>
                    <p className="text-[11px] text-gray-500">{a.isOverdue ? "retard" : "prévu"}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {isBtoc ? (
        <div className="flex items-center justify-between rounded-lg border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <span>
            Pipeline synchronisé automatiquement : profils B2C → Inscription / Badge passé (Open Badges) /
            Paiement (catalog_access).
          </span>
          <Button variant="outline" size="sm" disabled={syncing} onClick={() => void runBtocSync()}>
            <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? "animate-spin" : ""}`} />
            Resynchroniser
          </Button>
        </div>
      ) : null}

      {showCa ? (
        <div className="flex items-center justify-between rounded-2xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-white px-6 py-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
              <DollarSign className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-emerald-700">Chiffre d&apos;affaires pipeline</p>
              <p className="text-2xl font-bold text-gray-900">{formatDealAmount(caTotal)}</p>
            </div>
          </div>
          <p className="text-sm text-gray-500 max-w-md text-right">
            Affiché dès qu&apos;une carte atteint « Proposition envoyée » ou « Réussi »
          </p>
        </div>
      ) : null}

      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages.map((stage) => {
          const columnDeals = filteredDealsByStage.get(stage.slug) ?? [];
          const columnTotal = columnDeals.reduce((s, d) => s + d.amount_cents, 0);

          return (
            <div
              key={stage.slug}
              className="flex w-[280px] shrink-0 flex-col rounded-2xl border border-gray-200 bg-gray-50/70"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const dealId = e.dataTransfer.getData("dealId");
                if (dealId) void moveDeal(dealId, stage.slug);
              }}
            >
              <div className="border-b border-gray-200 bg-white px-3 py-2 rounded-t-2xl">
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{stage.label}</p>
                    <p className="text-xs text-gray-500">
                      {formatDealAmount(columnTotal)} · {columnDeals.length} deal{columnDeals.length > 1 ? "s" : ""}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-700"
                    onClick={() => {
                      setEditingStage(stage);
                      setStageLabelDraft(stage.label);
                    }}
                    title="Renommer l'étape"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-2 p-2 min-h-[120px]">
                {columnDeals.map((deal) => (
                  <div
                    key={deal.id}
                    draggable
                    onDragStart={(e) => e.dataTransfer.setData("dealId", deal.id)}
                    className="cursor-grab rounded-lg border border-gray-200 bg-white p-3 shadow-sm hover:border-gray-300 active:cursor-grabbing"
                  >
                    <p className="font-medium text-gray-900 text-sm">{deal.company_name}</p>
                    <p className="text-xs text-gray-600 mt-0.5">{deal.contact_first_name}</p>
                    {!isBtoc && deal.contact_owner_email ? (
                      <p className="text-[10px] text-indigo-600 mt-0.5">
                        {pipelineOwnerLabel(deal.contact_owner_email)}
                      </p>
                    ) : null}
                    {deal.email ? (
                      <p className="text-xs text-gray-500 truncate mt-1">{deal.email}</p>
                    ) : null}
                    {deal.phone ? <p className="text-xs text-gray-500">{deal.phone}</p> : null}
                    {!isBtoc && (deal.sector || deal.priority) ? (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {deal.sector ? (
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${sectorBadgeClass(deal.sector)}`}
                          >
                            {deal.sector}
                          </Badge>
                        ) : null}
                        {deal.priority ? (
                          <Badge
                            variant="outline"
                            className={`text-[10px] ${priorityBadgeClass(deal.priority)}`}
                          >
                            {deal.priority}
                          </Badge>
                        ) : null}
                        {typeof deal.engagement_score === "number" ? (
                          <span className="text-[10px] text-gray-500" title="Score engagement">
                            ● {deal.engagement_score}/3
                          </span>
                        ) : null}
                      </div>
                    ) : null}
                    {!isBtoc && deal.next_action ? (
                      <p
                        className={`text-[10px] mt-1 line-clamp-2 ${
                          isNextActionOverdue(deal.next_action_date)
                            ? "text-red-600 font-medium"
                            : "text-gray-500"
                        }`}
                      >
                        → {deal.next_action}
                        {deal.next_action_date ? ` (${deal.next_action_date.slice(0, 10)})` : ""}
                      </p>
                    ) : null}
                    {deal.source === "auto" ? (
                      <Badge variant="secondary" className="mt-1 text-[10px]">
                        Auto
                      </Badge>
                    ) : null}
                    {deal.amount_cents > 0 ? (
                      <p className="text-xs font-semibold text-emerald-700 mt-2">
                        {formatDealAmount(deal.amount_cents)}
                      </p>
                    ) : null}
                    <div className="mt-2 flex gap-1">
                      {!isBtoc ? (
                        <Button variant="ghost" size="sm" className="h-7 px-2" asChild>
                          <Link href={`/super/crm/pipeline-btob/${deal.id}`} title="Fiche prospect">
                            <ExternalLink className="h-3 w-3" />
                          </Link>
                        </Button>
                      ) : null}
                      <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => openEdit(deal)}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 px-2 text-red-600"
                        onClick={() => void deleteDeal(deal.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-2 border-t border-gray-200">
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
        <DialogContent className={isBtoc ? "max-w-md" : "max-w-2xl max-h-[90vh] overflow-y-auto"}>
          <DialogHeader>
            <DialogTitle>{form.id ? "Modifier la carte" : "Nouvelle opportunité"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Étape</Label>
              <select
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                value={form.stage_slug}
                onChange={(e) => setForm({ ...form, stage_slug: e.target.value })}
              >
                {stages.map((s) => (
                  <option key={s.slug} value={s.slug}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            {!isBtoc ? (
              <div className="space-y-2">
                <Label>Propriétaire du contact</Label>
                <select
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  value={form.contact_owner_email}
                  onChange={(e) => setForm({ ...form, contact_owner_email: e.target.value })}
                >
                  {PIPELINE_BTOB_CONTACT_OWNERS.map((o) => (
                    <option key={o.email} value={o.email}>
                      {o.label} ({o.email})
                    </option>
                  ))}
                </select>
              </div>
            ) : null}
            {!isBtoc ? (
              <div className="space-y-2">
                <Label>SIRET</Label>
                <div className="flex gap-2">
                  <Input
                    value={form.siret}
                    onChange={(e) => setForm({ ...form, siret: e.target.value })}
                    placeholder="14 chiffres"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    disabled={siretLoading}
                    onClick={() => void lookupSiret()}
                  >
                    {siretLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rechercher"}
                  </Button>
                </div>
                {form.opco_name || form.naf_code ? (
                  <div className="flex flex-wrap gap-2 text-xs text-gray-600">
                    {form.opco_name ? <Badge variant="secondary">OPCO : {form.opco_name}</Badge> : null}
                    {form.naf_code ? <Badge variant="secondary">NAF : {form.naf_code}</Badge> : null}
                  </div>
                ) : null}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label>{isBtoc ? "Nom / libellé *" : "Entreprise *"}</Label>
              <Input value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Prénom du contact</Label>
              <Input
                value={form.contact_first_name}
                onChange={(e) => setForm({ ...form, contact_first_name: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Montant (€) — pour le CA</Label>
              <Input
                type="number"
                min={0}
                step={100}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
            </div>
            {!isBtoc ? (
              <PipelineBtobCommercialFields value={commercial} onChange={setCommercial} />
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={() => void saveDeal()}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingStage} onOpenChange={(v) => !v && setEditingStage(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Renommer l&apos;étape</DialogTitle>
          </DialogHeader>
          <Input value={stageLabelDraft} onChange={(e) => setStageLabelDraft(e.target.value)} />
          <DialogFooter>
            <Button onClick={() => void saveStageLabel()}>Enregistrer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
