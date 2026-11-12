"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Circle,
  ExternalLink,
  GraduationCap,
  Loader2,
  Mail,
  Phone,
  Sparkles,
  UserPlus,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { CatalogueEmailOpenIndicator } from "@/components/crm/catalogue-email-open-indicator";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PipelineDealActionsSection } from "@/components/crm/pipeline-deal-actions-section";
import { PipelineQuoteFormationsCompact } from "@/components/crm/pipeline-quote-formations";
import { PipelineDealFormationDossiers } from "@/components/crm/pipeline-deal-formation-dossiers";
import type { PipelineQuotedProductLine } from "@/lib/crm/pipeline-quoted-products";
import {
  computeDealIntelligence,
  normalizeLinkedInUrl,
  type DealIntelligenceInput,
} from "@/lib/crm/pipeline-deal-intelligence";
import {
  BTOB_EMPLOYEE_COUNT_OPTIONS,
  BTOB_PRIORITY_OPTIONS,
  BTOB_SECTOR_OPTIONS,
} from "@/lib/crm/pipeline-btob-commercial-options";
import { PIPELINE_BTOB_CONTACT_OWNERS, CONTACT_CIVILITY_OPTIONS } from "@/lib/crm/pipeline-btob-owners";
import type { BtobCommercialFormState } from "@/app/super/crm/pipeline/pipeline-btob-commercial-fields";
import type { PipelineStage } from "@/lib/crm/pipeline-shared";
import {
  PIPELINE_SHEET_BADGE,
  PIPELINE_SHEET_BTN_OUTLINE,
  SIGNED_DEAL_STAGES_FOR_FORMATIONS,
  formatDealAmount,
} from "@/lib/crm/pipeline-shared";
import { PIPELINE_OPPORTUNITY_TYPE_OPTIONS } from "@/lib/crm/pipeline-opportunity-ca";
import { canCreateOrganisation, hasOrganisationLink } from "@/lib/onboarding/deal-stages";

type CockpitTab = "overview" | "contacts" | "entreprise" | "activity" | "formation";

export type DealCockpitForm = {
  id?: string;
  organization_id?: string | null;
  stage_slug: string;
  contact_owner_email: string;
  siret: string;
  siren: string;
  naf_code: string;
  opco_name: string;
  company_name: string;
  contact_first_name: string;
  contact_last_name: string;
  contact_civility: string;
  email: string;
  phone: string;
  amount: string;
  opportunity_type: string;
  party_kind: "prospect" | "prescripteur";
  notes: string;
  city: string;
  zip_code: string;
  company_creation_date: string;
  quoted_course_ids: string[];
  quoted_products: PipelineQuotedProductLine[];
};

function healthVisual(score: number, level: string) {
  if (level === "green" || score >= 70) {
    return { emoji: "🟢", text: "text-emerald-400", bg: "bg-emerald-500/15", border: "border-emerald-400/30" };
  }
  if (level === "amber" || score >= 40) {
    return { emoji: "🟠", text: "text-amber-300", bg: "bg-amber-500/15", border: "border-amber-400/30" };
  }
  return { emoji: "🔴", text: "text-rose-300", bg: "bg-rose-500/20", border: "border-rose-400/40" };
}

export function sanitizeHumanNotes(notes: string | null | undefined): string {
  if (!notes) return "";
  return notes
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (!t) return false;
      return !/^(OPCO|NAF|Adresse|Effectif|SIRET|Secteur)\s*:/i.test(t);
    })
    .join("\n")
    .trim();
}

function sectorLabel(slug: string | null | undefined): string {
  if (!slug) return "";
  return BTOB_SECTOR_OPTIONS.find((s) => s.value === slug)?.label ?? slug;
}

function priorityLabel(value: string | null | undefined): string {
  if (!value) return "Standard";
  return BTOB_PRIORITY_OPTIONS.find((p) => p.value === value)?.label ?? value;
}

function employeeLabel(value: string | null | undefined): string {
  if (!value) return "";
  return BTOB_EMPLOYEE_COUNT_OPTIONS.find((e) => e.value === value)?.label ?? value;
}

type PersonInvolved = { name: string; roles: string[]; phone?: string; email?: string };

function buildPeople(form: DealCockpitForm, commercial: BtobCommercialFormState): PersonInvolved[] {
  const people: PersonInvolved[] = [];
  const mainName = [form.contact_first_name, form.contact_last_name].filter(Boolean).join(" ").trim();
  if (mainName) {
    const roles = [commercial.contact_role, commercial.decision_maker_identified ? "Décideur" : null]
      .filter(Boolean) as string[];
    people.push({
      name: mainName,
      roles: roles.length ? roles : ["Contact principal"],
      phone: form.phone || undefined,
      email: form.email || undefined,
    });
  }
  const extras: Array<{ name: string; role: string }> = [
    { name: commercial.decision_maker_name, role: "Décideur" },
    { name: commercial.champion_name, role: "Champion" },
    { name: commercial.blocker_name, role: "Bloqueur" },
    { name: commercial.finance_contact, role: "Finance" },
  ];
  for (const e of extras) {
    const n = e.name.trim();
    if (!n || people.some((p) => p.name.toLowerCase() === n.toLowerCase())) continue;
    people.push({ name: n, roles: [e.role] });
  }
  return people;
}

export function PipelineDealCockpit({
  form,
  setForm,
  commercial,
  setCommercial,
  visibleStages,
  intelligenceInput,
  editingDealMeta,
  siretLoading,
  onLookupSiret,
  currentUserEmail,
  aiProspectSummary,
  aiProspectSummaryAt,
  onGenerateAiSummary,
  generatingAiSummary,
  onQuoteTotalChange,
  onActionsChange,
  onCreateOrganisation,
}: {
  form: DealCockpitForm;
  setForm: React.Dispatch<React.SetStateAction<DealCockpitForm>>;
  commercial: BtobCommercialFormState;
  setCommercial: React.Dispatch<React.SetStateAction<BtobCommercialFormState>>;
  visibleStages: PipelineStage[];
  intelligenceInput: DealIntelligenceInput;
  editingDealMeta: {
    created_at?: string;
    catalog_email_sent_at?: string | null;
    catalog_email_opened_at?: string | null;
  };
  siretLoading: boolean;
  onLookupSiret: () => void;
  currentUserEmail: string | null;
  aiProspectSummary?: string | null;
  aiProspectSummaryAt?: string | null;
  onGenerateAiSummary?: () => void;
  generatingAiSummary?: boolean;
  onQuoteTotalChange: (cents: number) => void;
  onActionsChange?: () => void;
  onCreateOrganisation?: () => void;
}) {
  const isWonFormationStage = (SIGNED_DEAL_STAGES_FOR_FORMATIONS as readonly string[]).includes(
    form.stage_slug,
  );
  const showCreateOrg =
    Boolean(form.id) && canCreateOrganisation(form.stage_slug, form.organization_id);
  const showOpenOrg = hasOrganisationLink(form.organization_id);

  const [activeTab, setActiveTab] = useState<CockpitTab>("overview");
  const [showIntelligence, setShowIntelligence] = useState(false);

  const intel = useMemo(() => computeDealIntelligence(intelligenceInput), [intelligenceInput]);
  const stageLabel =
    visibleStages.find((s) => s.slug === form.stage_slug)?.label ?? form.stage_slug;

  const contactLinkedIn = normalizeLinkedInUrl(commercial.contact_linkedin);
  const companyLinkedIn = normalizeLinkedInUrl(commercial.company_linkedin);
  const people = buildPeople(form, commercial);

  const subtitleParts = [
    form.city,
    employeeLabel(commercial.employee_count),
    sectorLabel(commercial.sector),
    form.opco_name ? `OPCO ${form.opco_name}` : null,
  ].filter(Boolean);

  const nextActionDateLabel = commercial.next_action_date
    ? format(new Date(commercial.next_action_date), "d MMMM yyyy", { locale: fr })
    : null;

  const hv = healthVisual(intel.healthScore, intel.healthLevel);
  const nextActionOverdue =
    commercial.next_action_date && commercial.next_action_date < new Date().toISOString().slice(0, 10);

  const qualifItems = [
    {
      key: "besoin",
      label: "Besoin",
      done: commercial.training_needs.length > 0,
      detail:
        commercial.training_needs.length > 0
          ? commercial.training_needs.join(", ")
          : "Quel besoin formation ?",
    },
    {
      key: "effectif",
      label: "Effectif",
      done: Boolean(commercial.employee_count?.trim()),
      detail: commercial.employee_count
        ? employeeLabel(commercial.employee_count)
        : "Nombre de salariés",
    },
    {
      key: "decideur",
      label: "Décideur",
      done: Boolean(commercial.decision_maker_identified || commercial.decision_maker_name?.trim()),
      detail: commercial.decision_maker_name?.trim() || "Qui signe ?",
    },
    {
      key: "budget",
      label: "Budget",
      done: Boolean(commercial.estimated_budget?.trim() || (form.amount && Number(form.amount) > 0)),
      detail: commercial.estimated_budget?.trim()
        ? commercial.estimated_budget
        : form.amount && Number(form.amount) > 0
          ? `${form.amount} €`
          : "Montant ou prise en charge OPCO",
    },
    {
      key: "date",
      label: "Date de décision",
      done: Boolean(commercial.next_action_date?.trim()),
      detail: nextActionDateLabel || "Quand ?",
    },
  ];
  const qualifDone = qualifItems.filter((i) => i.done).length;

  const tabs: Array<{ id: CockpitTab; label: string }> = [
    { id: "overview", label: "Aperçu" },
    { id: "contacts", label: `Contacts${people.length ? ` (${people.length})` : ""}` },
    { id: "entreprise", label: "Entreprise" },
    { id: "activity", label: "Activité" },
  ];
  if (isWonFormationStage) {
    tabs.push({ id: "formation", label: "Formation" });
  }

  return (
    <div className="space-y-4 text-white">
      {(showCreateOrg || showOpenOrg) && (
        <div
          className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 ${
            showOpenOrg
              ? "border-emerald-400/35 bg-emerald-950/40"
              : "border-[#6E5BFF]/45 bg-[#6E5BFF]/12"
          }`}
        >
          <div className="min-w-0">
            <p className={`text-sm font-semibold ${showOpenOrg ? "text-emerald-100" : "text-[#E8DEFF]"}`}>
              {showOpenOrg ? "Compte client actif" : "Créer un compte client"}
            </p>
            <p className={`text-xs ${showOpenOrg ? "text-emerald-200/80" : "text-[#C9C2FF]/90"}`}>
              {showOpenOrg
                ? "Pilotez dossiers formation et relation depuis Comptes clients."
                : "Le compte apparaîtra dans Comptes clients pour piloter formations et accès."}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {showOpenOrg && form.organization_id ? (
              <Button type="button" size="sm" className="bg-emerald-600 hover:bg-emerald-500" asChild>
                <Link href={`/super/organisations/${form.organization_id}`}>
                  <Building2 className="mr-1.5 h-4 w-4" />
                  Ouvrir le compte
                </Link>
              </Button>
            ) : null}
            {showCreateOrg && onCreateOrganisation ? (
              <Button
                type="button"
                size="sm"
                className="bg-[#6E5BFF] hover:bg-[#5B4AE6]"
                onClick={onCreateOrganisation}
              >
                <GraduationCap className="mr-1.5 h-4 w-4" />
                Créer un compte client
              </Button>
            ) : null}
          </div>
        </div>
      )}

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-white/10 bg-white/5 p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            className={cn(
              "shrink-0 rounded-lg px-3 py-2 text-sm font-medium transition",
              activeTab === t.id
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-white/5 hover:text-white",
            )}
            onClick={() => setActiveTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === "contacts" ? (
        <section className="space-y-4 rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Nom de l&apos;entreprise *</Label>
                <Input
                  className="border-white/15 bg-white/10 text-lg font-bold text-white placeholder:text-slate-500"
                  placeholder="Nom de l'entreprise"
                  value={form.company_name}
                  onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
                />
              </div>
              {subtitleParts.length > 0 ? (
                <p className="text-sm text-slate-300">{subtitleParts.join(" · ")}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <CatalogueEmailOpenIndicator
                sentAt={editingDealMeta.catalog_email_sent_at}
                openedAt={editingDealMeta.catalog_email_opened_at}
                size="md"
              />
              {form.phone?.trim() ? (
                <Button type="button" size="sm" className="bg-indigo-600 hover:bg-indigo-700" asChild>
                  <a href={`tel:${form.phone.replace(/\s/g, "")}`}>
                    <Phone className="mr-1.5 h-4 w-4" />
                    Appeler
                  </a>
                </Button>
              ) : null}
              {form.email?.trim() ? (
                <Button type="button" size="sm" variant="outline" className={PIPELINE_SHEET_BTN_OUTLINE} asChild>
                  <a href={`mailto:${form.email.trim()}`}>
                    <Mail className="mr-1.5 h-4 w-4" />
                    Email
                  </a>
                </Button>
              ) : null}
              {contactLinkedIn ? (
                <Button type="button" size="sm" variant="outline" className={PIPELINE_SHEET_BTN_OUTLINE} asChild>
                  <a href={contactLinkedIn} target="_blank" rel="noopener noreferrer">
                    LinkedIn
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">Civilité</Label>
              <select
                className="w-full rounded-md border border-white/15 bg-white/10 px-2 py-1.5 text-sm text-white"
                value={form.contact_civility}
                onChange={(e) => setForm((f) => ({ ...f, contact_civility: e.target.value }))}
              >
                <option value="" className="bg-slate-900">
                  —
                </option>
                {CONTACT_CIVILITY_OPTIONS.map((c) => (
                  <option key={c} value={c} className="bg-slate-900">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">Prénom</Label>
              <Input
                className="border-white/15 bg-white/10 text-white"
                value={form.contact_first_name}
                onChange={(e) => setForm((f) => ({ ...f, contact_first_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">Nom</Label>
              <Input
                className="border-white/15 bg-white/10 text-white"
                value={form.contact_last_name}
                onChange={(e) => setForm((f) => ({ ...f, contact_last_name: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-400">Fonction (rôle)</Label>
            <Input
              className="border-white/15 bg-white/10 text-white"
              value={commercial.contact_role}
              onChange={(e) => setCommercial((c) => ({ ...c, contact_role: e.target.value }))}
              placeholder="Dirigeant, DRH…"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">Téléphone</Label>
              <Input
                className="border-white/15 bg-white/10 text-white"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">Email</Label>
              <Input
                type="email"
                className="border-white/15 bg-white/10 text-white"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">Ville</Label>
              <Input
                className="border-white/15 bg-white/10 text-white"
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">Code postal</Label>
              <Input
                className="border-white/15 bg-white/10 text-white"
                value={form.zip_code}
                onChange={(e) => setForm((f) => ({ ...f, zip_code: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-slate-400">LinkedIn (URL du contact)</Label>
            {contactLinkedIn ? (
              <div className="flex gap-2">
                <Input
                  className="border-white/15 bg-white/10 text-white"
                  value={commercial.contact_linkedin}
                  onChange={(e) => setCommercial((c) => ({ ...c, contact_linkedin: e.target.value }))}
                />
                <Button type="button" size="sm" variant="outline" className={PIPELINE_SHEET_BTN_OUTLINE} asChild>
                  <a href={contactLinkedIn} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            ) : (
              <Input
                className="border-white/15 bg-white/10 text-white"
                value={commercial.contact_linkedin}
                onChange={(e) => setCommercial((c) => ({ ...c, contact_linkedin: e.target.value }))}
                placeholder="https://www.linkedin.com/in/…"
              />
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-white/10 pt-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">Étape pipeline</Label>
              <select
                className="w-full rounded-md border border-white/15 bg-white/10 px-2 py-1.5 text-sm text-white"
                value={form.stage_slug}
                onChange={(e) => setForm((f) => ({ ...f, stage_slug: e.target.value }))}
              >
                {visibleStages.map((s) => (
                  <option key={s.slug} value={s.slug} className="bg-slate-900">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">Propriétaire</Label>
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
          </div>
        </section>
      ) : null}

      {activeTab === "overview" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-lg font-bold text-white">{form.company_name || "Prospect"}</p>
              {subtitleParts.length > 0 ? (
                <p className="text-sm text-slate-300">{subtitleParts.join(" · ")}</p>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-1.5">
              <CatalogueEmailOpenIndicator
                sentAt={editingDealMeta.catalog_email_sent_at}
                openedAt={editingDealMeta.catalog_email_opened_at}
                size="md"
              />
              {form.phone?.trim() ? (
                <Button type="button" size="sm" className="bg-indigo-600 hover:bg-indigo-700" asChild>
                  <a href={`tel:${form.phone.replace(/\s/g, "")}`}>
                    <Phone className="mr-1.5 h-4 w-4" />
                    Appeler
                  </a>
                </Button>
              ) : null}
              {form.email?.trim() ? (
                <Button type="button" size="sm" variant="outline" className={PIPELINE_SHEET_BTN_OUTLINE} asChild>
                  <a href={`mailto:${form.email.trim()}`}>
                    <Mail className="mr-1.5 h-4 w-4" />
                    E-mail
                  </a>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Étape</p>
              <select
                className="mt-1 w-full rounded-md border border-white/15 bg-white/10 px-2 py-1.5 text-sm font-semibold text-white"
                value={form.stage_slug}
                onChange={(e) => setForm((f) => ({ ...f, stage_slug: e.target.value }))}
              >
                {visibleStages.map((s) => (
                  <option key={s.slug} value={s.slug} className="bg-slate-900">
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <p className="text-[10px] uppercase tracking-wide text-slate-400">Montant</p>
              <p className="mt-1 text-base font-bold text-white">
                {form.amount && Number(form.amount) > 0
                  ? formatDealAmount(Math.round(Number(form.amount) * 100))
                  : "—"}
              </p>
              <p className="text-xs text-slate-400">
                {form.quoted_course_ids.length
                  ? `${form.quoted_course_ids.length} formation${form.quoted_course_ids.length > 1 ? "s" : ""} envisagée${form.quoted_course_ids.length > 1 ? "s" : ""}`
                  : "Aucune formation sélectionnée"}
              </p>
            </div>
            <div
              className={cn(
                "rounded-xl border p-3",
                commercial.next_action?.trim()
                  ? nextActionOverdue
                    ? "border-rose-400/50 bg-rose-950/40"
                    : "border-violet-400/30 bg-violet-950/35"
                  : "border-amber-400/40 bg-amber-950/35",
              )}
            >
              <p className="text-[10px] uppercase tracking-wide text-violet-200/90">Prochaine action</p>
              {commercial.next_action?.trim() ? (
                <>
                  <p className="mt-1 text-sm font-bold text-white">{commercial.next_action}</p>
                  {nextActionDateLabel ? (
                    <p className={cn("mt-0.5 text-xs", nextActionOverdue ? "font-semibold text-rose-300" : "text-slate-300")}>
                      {nextActionOverdue ? "En retard — " : ""}
                      {nextActionDateLabel}
                    </p>
                  ) : null}
                </>
              ) : (
                <p className="mt-1 flex items-center gap-1.5 text-xs font-semibold text-amber-200">
                  <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  Aucune action planifiée
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Input
              className="h-9 max-w-xs border-white/20 bg-white/10 text-sm text-white placeholder:text-slate-400"
              placeholder="Action à mener…"
              value={commercial.next_action}
              onChange={(e) => setCommercial((c) => ({ ...c, next_action: e.target.value }))}
            />
            <Input
              type="date"
              className="h-9 w-auto border-white/20 bg-white/10 text-sm text-white"
              value={commercial.next_action_date}
              onChange={(e) => setCommercial((c) => ({ ...c, next_action_date: e.target.value }))}
            />
            <Button type="button" size="sm" variant="outline" className={PIPELINE_SHEET_BTN_OUTLINE} onClick={() => setActiveTab("activity")}>
              Planifier / Note
            </Button>
          </div>

          <section className="rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-white">Qualification · {qualifDone}/{qualifItems.length}</p>
              <button
                type="button"
                className="text-xs text-indigo-300 hover:text-indigo-200"
                onClick={() => setShowIntelligence((v) => !v)}
              >
                {showIntelligence ? "Masquer l'intelligence" : "Intelligence deal"}
              </button>
            </div>
            <ul className="mt-3 space-y-2">
              {qualifItems.map((item) => (
                <li key={item.key} className="flex items-start gap-2 text-sm">
                  {item.done ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <Circle className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-white">{item.label}</p>
                    <p className="text-xs text-slate-400">{item.detail}</p>
                  </div>
                  {!item.done ? (
                    <button
                      type="button"
                      className="shrink-0 text-xs font-semibold text-indigo-300 hover:text-indigo-200"
                      onClick={() =>
                        setActiveTab(
                          item.key === "decideur" || item.key === "besoin" ? "contacts" : "entreprise",
                        )
                      }
                    >
                      Renseigner
                    </button>
                  ) : null}
                </li>
              ))}
            </ul>

            {showIntelligence ? (
              <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
                <div className={cn("rounded-xl border p-3", hv.bg, hv.border)}>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200/80">
                    Health Score
                  </p>
                  <p className={cn("mt-1 text-3xl font-bold", hv.text)}>
                    {intel.healthScore}
                    <span className="text-lg font-normal text-slate-400">/100</span>
                  </p>
                  <p className="mt-1 text-xs text-slate-300">
                    Probabilité de signature :{" "}
                    <span className="font-semibold text-white">{intel.signatureProbability}%</span>
                    {" · "}Priorité {priorityLabel(commercial.priority)}
                  </p>
                  <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                    {intel.checks.slice(0, 6).map((c) => (
                      <li key={c.label} className="flex items-start gap-2 text-xs">
                        {c.ok ? (
                          <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-400" />
                        ) : (
                          <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-400" />
                        )}
                        <span className={c.ok ? "text-slate-300" : "text-rose-200"}>{c.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {intel.atRisk ? (
                  <div className="flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/50 px-3 py-2 text-xs font-semibold text-rose-100">
                    <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
                    Deal en risque — action requise.
                  </div>
                ) : null}
                <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-white">Synthèse Byound</p>
                    {onGenerateAiSummary ? (
                      <Button
                        type="button"
                        size="sm"
                        className="bg-indigo-600 hover:bg-indigo-700"
                        disabled={generatingAiSummary || !form.id}
                        onClick={onGenerateAiSummary}
                      >
                        {generatingAiSummary ? (
                          <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                        ) : (
                          <Sparkles className="mr-1.5 h-4 w-4" />
                        )}
                        {aiProspectSummary ? "Régénérer" : "Générer"}
                      </Button>
                    ) : null}
                  </div>
                  {aiProspectSummary ? (
                    <p className="mt-2 whitespace-pre-wrap text-sm text-emerald-100">{aiProspectSummary}</p>
                  ) : (
                    <p className="mt-2 text-xs text-slate-400">
                      Synthèse optionnelle — ne bloque pas la qualification.
                    </p>
                  )}
                  {aiProspectSummaryAt ? (
                    <p className="mt-1 text-xs text-slate-500">
                      Synthèse du {aiProspectSummaryAt.slice(0, 10)}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-semibold text-white">Besoins identifiés</p>
            {commercial.training_needs.length === 0 ? (
              <p className="mt-2 text-sm text-slate-400">Aucun besoin confirmé</p>
            ) : (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {commercial.training_needs.map((tag) => (
                  <Badge key={tag} variant="outline" className={PIPELINE_SHEET_BADGE}>
                    {tag}
                    <button
                      type="button"
                      className="ml-1 text-slate-400 hover:text-white"
                      onClick={() =>
                        setCommercial((c) => ({
                          ...c,
                          training_needs: c.training_needs.filter((t) => t !== tag),
                        }))
                      }
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
            <Input
              placeholder="Ajouter un besoin…"
              className="mt-2 h-9 border-white/15 bg-white/10 text-sm text-white placeholder:text-slate-500"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  const v = (e.target as HTMLInputElement).value.trim();
                  if (v && !commercial.training_needs.includes(v)) {
                    setCommercial((c) => ({ ...c, training_needs: [...c.training_needs, v] }));
                    (e.target as HTMLInputElement).value = "";
                  }
                }
              }}
            />

            <div className="mt-5 border-t border-white/10 pt-4">
              <p className="text-sm font-semibold text-white">Offre formation</p>
              <p className="mt-0.5 text-xs text-slate-400">
                Catalogue Byound uniquement — licences / nevo hors de ce pipeline.
              </p>
              <div className="mt-3">
                <PipelineQuoteFormationsCompact
                  selectedIds={form.quoted_course_ids}
                  onChange={(ids) => setForm((f) => ({ ...f, quoted_course_ids: ids }))}
                  onTotalChange={(cents) => onQuoteTotalChange(cents)}
                  tone="dark"
                />
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label className="text-xs text-slate-400">Type d&apos;opportunité</Label>
                  <select
                    className="mt-1 flex h-9 w-full rounded-md border border-white/15 bg-white/10 px-3 text-sm text-white"
                    value={form.opportunity_type || "formation_edge"}
                    onChange={(e) => setForm((f) => ({ ...f, opportunity_type: e.target.value }))}
                  >
                    {PIPELINE_OPPORTUNITY_TYPE_OPTIONS.filter((o) =>
                      ["formation_edge", "autre"].includes(o.value),
                    ).map((o) => (
                      <option key={o.value} value={o.value} className="bg-slate-900 text-white">
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Montant identifié (€)</Label>
                  <Input
                    type="number"
                    min={0}
                    step={100}
                    placeholder="Laisser vide si non chiffré"
                    className="mt-1 h-9 border-white/15 bg-white/10 text-sm text-white placeholder:text-slate-500"
                    value={form.amount}
                    onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Budget estimé</Label>
                  <Input
                    className="mt-1 h-9 border-white/15 bg-white/10 text-sm text-white"
                    value={commercial.estimated_budget}
                    onChange={(e) => setCommercial((c) => ({ ...c, estimated_budget: e.target.value }))}
                    placeholder="OPCO / budget interne…"
                  />
                </div>
                <div>
                  <Label className="text-xs text-slate-400">Type de fiche</Label>
                  <select
                    className="mt-1 flex h-9 w-full rounded-md border border-white/15 bg-white/10 px-3 text-sm text-white"
                    value={form.party_kind || "prospect"}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        party_kind: e.target.value === "prescripteur" ? "prescripteur" : "prospect",
                      }))
                    }
                  >
                    <option value="prospect" className="bg-slate-900 text-white">
                      Prospect
                    </option>
                    <option value="prescripteur" className="bg-slate-900 text-white">
                      Prescripteur
                    </option>
                  </select>
                </div>
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "activity" ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-indigo-400/20 bg-indigo-950/30 p-4 shadow-sm backdrop-blur-sm">
            <PipelineDealActionsSection
              dealId={form.id}
              phone={form.phone}
              email={form.email}
              companyName={form.company_name || "Prospect"}
              contactFirstName={form.contact_first_name}
              contactLastName={form.contact_last_name}
              currentUserEmail={currentUserEmail}
              onActionsChange={onActionsChange}
              theme="dark"
            />
          </div>
          <section className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <Label className="text-sm font-semibold text-white">Notes internes</Label>
            <p className="mt-0.5 text-xs text-slate-400">
              Observations commerciales uniquement — pas de données administratives.
            </p>
            <Textarea
              className="mt-2 border-white/15 bg-white/10 text-white placeholder:text-slate-500"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={4}
              placeholder="Ex. : Marc est dirigeant. Petite structure, intérêt pour la digitalisation pédagogique…"
            />
          </section>
        </div>
      ) : null}

      {activeTab === "entreprise" ? (
        <div className="space-y-4">
          <section className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-sm font-semibold text-white">Enrichir via SIRET</p>
            <div className="mt-2 flex gap-2">
              <Input
                value={form.siret}
                onChange={(e) => setForm((f) => ({ ...f, siret: e.target.value }))}
                placeholder="14 chiffres"
                className="border-white/15 bg-white/10 font-mono text-sm text-white placeholder:text-slate-500"
              />
              <Button
                type="button"
                size="sm"
                variant="secondary"
                className="shrink-0 bg-white/15 text-white hover:bg-white/25"
                disabled={siretLoading}
                onClick={onLookupSiret}
              >
                {siretLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rechercher"}
              </Button>
            </div>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-sm font-semibold text-white">Informations administratives</p>
            <dl className="mt-3 space-y-3 text-sm">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">SIRET</Label>
                  <Input
                    className="border-white/15 bg-white/10 font-mono text-white"
                    value={form.siret}
                    onChange={(e) => setForm((f) => ({ ...f, siret: e.target.value }))}
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">NAF</Label>
                  <Input
                    className="border-white/15 bg-white/10 text-white"
                    value={form.naf_code}
                    onChange={(e) => setForm((f) => ({ ...f, naf_code: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">OPCO</Label>
                <Input
                  className="border-white/15 bg-white/10 text-white"
                  value={form.opco_name}
                  onChange={(e) => setForm((f) => ({ ...f, opco_name: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Adresse complète</Label>
                <Input
                  className="border-white/15 bg-white/10 text-white"
                  value={commercial.location}
                  onChange={(e) => setCommercial((c) => ({ ...c, location: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Effectif</Label>
                  <select
                    className="w-full rounded-md border border-white/15 bg-white/10 px-2 py-1.5 text-sm text-white"
                    value={commercial.employee_count}
                    onChange={(e) => setCommercial((c) => ({ ...c, employee_count: e.target.value }))}
                  >
                    <option value="" className="bg-slate-900">
                      —
                    </option>
                    {BTOB_EMPLOYEE_COUNT_OPTIONS.map((e) => (
                      <option key={e.value} value={e.value} className="bg-slate-900">
                        {e.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-slate-400">Date de création</Label>
                  <Input
                    type="date"
                    className="border-white/15 bg-white/10 text-white"
                    value={form.company_creation_date}
                    onChange={(e) => setForm((f) => ({ ...f, company_creation_date: e.target.value }))}
                  />
                </div>
              </div>
              {editingDealMeta.created_at ? (
                <div className="flex gap-2 border-t border-white/10 pt-3 text-slate-300">
                  <span className="w-28 shrink-0 text-slate-400">Prospect CRM</span>
                  <span>
                    {format(new Date(editingDealMeta.created_at), "d MMMM yyyy", { locale: fr })}
                  </span>
                </div>
              ) : null}
            </dl>
          </section>

          <section className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <p className="text-sm font-semibold text-white">Contacts complémentaires</p>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Décideur (nom)</Label>
                <Input
                  className="border-white/15 bg-white/10 text-white"
                  value={commercial.decision_maker_name}
                  onChange={(e) =>
                    setCommercial((c) => ({ ...c, decision_maker_name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs text-slate-400">Champion</Label>
                <Input
                  className="border-white/15 bg-white/10 text-white"
                  value={commercial.champion_name}
                  onChange={(e) => setCommercial((c) => ({ ...c, champion_name: e.target.value }))}
                />
              </div>
            </div>
            <label className="mt-3 flex items-center gap-2 text-sm text-slate-200">
              <input
                type="checkbox"
                checked={commercial.decision_maker_identified}
                onChange={(e) =>
                  setCommercial((c) => ({ ...c, decision_maker_identified: e.target.checked }))
                }
              />
              Le contact principal est le décideur
            </label>
            <div className="mt-3 space-y-1">
              <Label className="text-xs text-slate-400">LinkedIn entreprise</Label>
              {companyLinkedIn ? (
                <div className="flex gap-2">
                  <Input
                    className="border-white/15 bg-white/10 text-white"
                    value={commercial.company_linkedin}
                    onChange={(e) => setCommercial((c) => ({ ...c, company_linkedin: e.target.value }))}
                  />
                  <Button type="button" size="sm" variant="outline" className={PIPELINE_SHEET_BTN_OUTLINE} asChild>
                    <a href={companyLinkedIn} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              ) : (
                <Input
                  className="border-white/15 bg-white/10 text-white"
                  value={commercial.company_linkedin}
                  onChange={(e) => setCommercial((c) => ({ ...c, company_linkedin: e.target.value }))}
                  placeholder="https://www.linkedin.com/company/…"
                />
              )}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === "formation" ? (
        <div className="space-y-4">
          {showOpenOrg && form.organization_id ? (
            <Button type="button" size="sm" variant="outline" className={PIPELINE_SHEET_BTN_OUTLINE} asChild>
              <Link href={`/super/organisations/${form.organization_id}?tab=dossiers`}>
                <Building2 className="mr-1.5 h-4 w-4" />
                Piloter sur le compte client
              </Link>
            </Button>
          ) : null}
          <section className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
            <PipelineDealFormationDossiers
              dealId={form.id}
              organizationId={form.organization_id}
              tone="dark"
            />
          </section>
        </div>
      ) : null}
    </div>
  );
}
