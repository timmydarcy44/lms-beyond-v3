"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  ExternalLink,
  Heart,
  Loader2,
  Mail,
  Phone,
  Sparkles,
  TrendingUp,
  UserPlus,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { PipelineLightSection } from "@/components/crm/pipeline-light-section";
import { PipelineDealActionsSection } from "@/components/crm/pipeline-deal-actions-section";
import { PipelineQuoteFormationsCompact } from "@/components/crm/pipeline-quote-formations";
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

export type DealCockpitForm = {
  id?: string;
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
  notes: string;
  city: string;
  zip_code: string;
  company_creation_date: string;
  quoted_course_ids: string[];
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

function formatSiret(raw: string): string {
  const d = raw.replace(/\s/g, "");
  if (d.length !== 14) return raw;
  return `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6, 9)} ${d.slice(9, 14)}`;
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

function linkedInSearchUrl(company: string, city: string): string {
  return `https://www.linkedin.com/search/results/companies/?keywords=${encodeURIComponent([company, city].filter(Boolean).join(" "))}`;
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
}: {
  form: DealCockpitForm;
  setForm: React.Dispatch<React.SetStateAction<DealCockpitForm>>;
  commercial: BtobCommercialFormState;
  setCommercial: React.Dispatch<React.SetStateAction<BtobCommercialFormState>>;
  visibleStages: PipelineStage[];
  intelligenceInput: DealIntelligenceInput;
  editingDealMeta: { created_at?: string };
  siretLoading: boolean;
  onLookupSiret: () => void;
  currentUserEmail: string | null;
  aiProspectSummary?: string | null;
  aiProspectSummaryAt?: string | null;
  onGenerateAiSummary?: () => void;
  generatingAiSummary?: boolean;
  onQuoteTotalChange: (cents: number) => void;
  onActionsChange?: () => void;
}) {
  const [editContactOpen, setEditContactOpen] = useState(!form.company_name.trim());

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
  ].filter(Boolean);

  const nextActionDateLabel = commercial.next_action_date
    ? format(new Date(commercial.next_action_date), "d MMMM yyyy", { locale: fr })
    : null;

  const knowsItems = [
    form.company_name ? `${form.company_name}${commercial.employee_count ? ` · ${employeeLabel(commercial.employee_count)}` : ""}` : null,
    form.opco_name ? `OPCO ${form.opco_name}` : null,
    commercial.training_needs.length > 0
      ? `Besoins : ${commercial.training_needs.join(", ")}`
      : "Besoin non encore qualifié",
    commercial.last_contact_date
      ? `Dernier contact : ${commercial.last_contact_date}`
      : "Aucun échange commercial consigné",
  ].filter(Boolean) as string[];

  const missingItems = intel.missingFields.slice(0, 6).map((f) => f.label);
  const hv = healthVisual(intel.healthScore, intel.healthLevel);
  const nextActionOverdue =
    commercial.next_action_date && commercial.next_action_date < new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4 text-white">
      {/* Bandeau intelligence EDGE — impact visuel */}
      <div className="relative -mx-4 -mt-4 mb-2 overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 px-4 py-5 text-white sm:-mx-6 sm:-mt-6 sm:px-6">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(99,102,241,0.25),transparent_55%)]" />

        {/* Prochaine action */}
        <div
          className={cn(
            "relative mb-4 rounded-xl border p-4",
            commercial.next_action?.trim()
              ? nextActionOverdue
                ? "border-rose-400/50 bg-rose-950/40"
                : "border-violet-400/30 bg-violet-950/35"
              : "border-amber-400/40 bg-amber-950/35",
          )}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-200/90">
            Prochaine action
          </p>
          {commercial.next_action?.trim() ? (
            <>
              <p className="mt-1 text-base font-bold text-white">{commercial.next_action}</p>
              {nextActionDateLabel ? (
                <p
                  className={cn(
                    "mt-1 text-sm",
                    nextActionOverdue ? "font-semibold text-rose-300" : "text-slate-300",
                  )}
                >
                  {nextActionOverdue ? "⚠ En retard — " : "À réaliser avant le "}
                  {nextActionDateLabel}
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-amber-200">
              <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400" />
              Aucune prochaine action planifiée
            </p>
          )}
          <div className="relative mt-3 flex flex-wrap gap-2">
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
          </div>
        </div>

        {/* Dossier incomplet */}
        {intel.missingFields.length > 0 ? (
          <div className="relative mb-4 rounded-xl border border-amber-400/35 bg-amber-950/30 p-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-amber-200">
              Dossier incomplet — {intel.completenessScore}%
            </p>
            <ul className="mt-2 space-y-1">
              {intel.missingFields.slice(0, 4).map((f) => (
                <li key={f.key} className="flex items-center gap-2 text-xs text-amber-100/90">
                  <Circle className="h-3 w-3 shrink-0" />
                  {f.label}
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="relative mb-4 flex items-center gap-2 text-xs text-emerald-300">
            <CheckCircle2 className="h-4 w-4" />
            Dossier complet ({intel.completenessScore}%)
          </div>
        )}

        {/* Health Score */}
        <div className={cn("relative mb-4 rounded-xl border p-4", hv.bg, hv.border)}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-indigo-200/80">
                Health Score
              </p>
              <p className={cn("mt-1 text-4xl font-bold", hv.text)}>
                {intel.healthScore}
                <span className="text-xl font-normal text-slate-400">/100</span> {hv.emoji}
              </p>
              <p className="mt-1 text-sm text-slate-300">
                Probabilité de signature :{" "}
                <span className="font-semibold text-white">{intel.signatureProbability}%</span>
              </p>
            </div>
            <TrendingUp className="h-6 w-6 shrink-0 text-indigo-300" />
          </div>
          <ul className="mt-3 grid gap-1 sm:grid-cols-2">
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
          <div className="relative mb-4 flex items-center gap-2 rounded-xl border border-rose-500/40 bg-rose-950/50 px-4 py-3 text-sm font-semibold text-rose-100">
            <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
            Attention : deal en risque — action requise.
          </div>
        ) : null}

        <div className="relative grid grid-cols-3 gap-2 rounded-xl border border-white/10 bg-white/5 p-3 text-center text-sm">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Étape</p>
            <p className="font-semibold text-white">{stageLabel}</p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Priorité</p>
            <p className="font-semibold text-white">{priorityLabel(commercial.priority)}</p>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Relation</p>
            <p className="flex items-center gap-1 font-semibold text-white">
              <Heart className="h-3.5 w-3.5 text-rose-400" />
              {intel.relationshipScore}%
            </p>
          </div>
        </div>

        {/* SIRET compact dans le bandeau */}
        <div className="relative mt-4 rounded-lg border border-white/10 bg-black/20 p-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Enrichir via SIRET
          </p>
          <div className="mt-1.5 flex gap-2">
            <Input
              value={form.siret}
              onChange={(e) => setForm((f) => ({ ...f, siret: e.target.value }))}
              placeholder="14 chiffres"
              className="h-8 border-white/15 bg-white/10 font-mono text-xs text-white placeholder:text-slate-500"
            />
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="h-8 shrink-0 bg-white/15 text-white hover:bg-white/25"
              disabled={siretLoading}
              onClick={onLookupSiret}
            >
              {siretLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rechercher"}
            </Button>
          </div>
        </div>
      </div>

      {/* En-tête prospect */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Input
              className="border-0 bg-transparent p-0 text-lg font-bold text-white shadow-none placeholder:text-slate-500 focus-visible:ring-0"
              placeholder="Nom de l'entreprise *"
              value={form.company_name}
              onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
            />
            {subtitleParts.length > 0 ? (
              <p className="mt-1 text-sm text-slate-300">{subtitleParts.join(" · ")}</p>
            ) : (
              <p className="mt-1 text-sm text-slate-500">Complétez via SIRET ou saisie manuelle</p>
            )}
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
              <Button type="button" size="sm" variant="outline" asChild>
                <a href={`mailto:${form.email.trim()}`}>
                  <Mail className="mr-1.5 h-4 w-4" />
                  Email
                </a>
              </Button>
            ) : null}
            {contactLinkedIn ? (
              <Button type="button" size="sm" variant="outline" asChild>
                <a href={contactLinkedIn} target="_blank" rel="noopener noreferrer">
                  LinkedIn
                </a>
              </Button>
            ) : (
              <Button type="button" size="sm" variant="ghost" asChild>
                <a
                  href={linkedInSearchUrl(form.company_name, form.city)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Rechercher LinkedIn
                </a>
              </Button>
            )}
          </div>
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2">
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

      {/* Synthèse EDGE */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-white">Synthèse EDGE</p>
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
          <div className="mt-3 rounded-lg border border-emerald-400/30 bg-emerald-950/40 p-3">
            <p className="whitespace-pre-wrap text-sm text-emerald-100">{aiProspectSummary}</p>
          </div>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div className="rounded-lg border border-indigo-400/25 bg-indigo-950/40 p-3">
              <p className="text-xs font-semibold uppercase text-indigo-200">Ce que nous savons</p>
              <ul className="mt-2 space-y-1.5 text-sm text-indigo-50/90">
                {knowsItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {missingItems.length > 0 ? (
              <div className="rounded-lg border border-amber-400/30 bg-amber-950/35 p-3">
                <p className="text-xs font-semibold uppercase text-amber-200">Ce qu&apos;il manque</p>
                <ul className="mt-2 space-y-1.5 text-sm text-amber-50">
                  {missingItems.map((item) => (
                    <li key={item} className="flex gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
        {aiProspectSummaryAt ? (
          <p className="mt-2 text-xs text-slate-500">
            Synthèse du {aiProspectSummaryAt.slice(0, 10)}
          </p>
        ) : null}
      </section>

      {/* Besoins et offre */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        <p className="text-sm font-semibold text-white">Besoins identifiés</p>
        {commercial.training_needs.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">Aucun besoin confirmé</p>
        ) : (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {commercial.training_needs.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
                <button
                  type="button"
                  className="ml-1 text-gray-500 hover:text-gray-900"
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
        <div className="mt-2 flex gap-2">
          <Input
            placeholder="Ajouter un besoin…"
            className="h-9 border-white/15 bg-white/10 text-sm text-white placeholder:text-slate-500"
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
        </div>

        <div className="mt-5 border-t border-white/10 pt-4">
          <p className="text-sm font-semibold text-white">Offre envisagée</p>
          <div className="mt-2">
            <PipelineQuoteFormationsCompact
              selectedIds={form.quoted_course_ids}
              onChange={(ids) => setForm((f) => ({ ...f, quoted_course_ids: ids }))}
              onTotalChange={onQuoteTotalChange}
            />
          </div>
        </div>
      </section>

      {/* Personnes impliquées */}
      <section className="rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
        <p className="text-sm font-semibold text-white">Personnes impliquées</p>
        {people.length === 0 ? (
          <p className="mt-2 text-sm text-slate-400">Aucun contact renseigné</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {people.map((p) => (
              <li key={p.name} className="rounded-lg border border-white/10 bg-slate-900/50 p-3">
                <p className="font-medium text-white">{p.name}</p>
                <p className="text-xs text-slate-400">{p.roles.join(" · ")}</p>
                {p.phone ? <p className="mt-1 text-sm text-slate-300">{p.phone}</p> : null}
                {p.email ? <p className="text-sm text-slate-300">{p.email}</p> : null}
              </li>
            ))}
          </ul>
        )}
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="mt-3"
          onClick={() => setEditContactOpen(true)}
        >
          <UserPlus className="mr-1.5 h-4 w-4" />
          {people.length === 0 ? "Ajouter un contact" : "Modifier les contacts"}
        </Button>
      </section>

      {/* Activité */}
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
        />
      </div>

      {/* Notes humaines */}
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

      {/* Coordonnées — édition */}
      <PipelineLightSection
        title="Modifier les coordonnées"
        subtitle="Civilité, prénom, nom, téléphone, email, LinkedIn"
        defaultOpen={editContactOpen}
        tone="dark"
      >
        <div className="space-y-3">
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
          <div className="grid grid-cols-2 gap-3">
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
            <Label className="text-xs text-slate-400">Rôle du contact</Label>
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
          {contactLinkedIn ? (
            <Button type="button" size="sm" variant="outline" asChild>
              <a href={contactLinkedIn} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-4 w-4" />
                Voir le profil LinkedIn
              </a>
            </Button>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs">LinkedIn contact (URL complète)</Label>
              <Input
                value={commercial.contact_linkedin}
                onChange={(e) => setCommercial((c) => ({ ...c, contact_linkedin: e.target.value }))}
                placeholder="Coller l'URL une fois trouvée"
              />
            </div>
          )}
          {companyLinkedIn ? (
            <Button type="button" size="sm" variant="outline" asChild>
              <a href={companyLinkedIn} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-4 w-4" />
                Voir l&apos;entreprise sur LinkedIn
              </a>
            </Button>
          ) : (
            <div className="space-y-1">
              <Label className="text-xs">LinkedIn entreprise (URL complète)</Label>
              <Input
                value={commercial.company_linkedin}
                onChange={(e) => setCommercial((c) => ({ ...c, company_linkedin: e.target.value }))}
                placeholder="Coller l'URL une fois trouvée"
              />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
            <div className="space-y-1">
              <Label className="text-xs">Décideur (nom)</Label>
              <Input
                value={commercial.decision_maker_name}
                onChange={(e) =>
                  setCommercial((c) => ({ ...c, decision_maker_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Champion</Label>
              <Input
                value={commercial.champion_name}
                onChange={(e) => setCommercial((c) => ({ ...c, champion_name: e.target.value }))}
              />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={commercial.decision_maker_identified}
              onChange={(e) =>
                setCommercial((c) => ({ ...c, decision_maker_identified: e.target.checked }))
              }
            />
            Le contact principal est le décideur
          </label>
        </div>
      </PipelineLightSection>

      {/* Informations administratives */}
      <PipelineLightSection
        title="Informations administratives"
        subtitle="SIRET, NAF, OPCO, adresse, effectif"
        badge={form.siret ? "Renseigné" : undefined}
      >
        <dl className="space-y-2 text-sm">
          {form.siret ? (
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-gray-500">SIRET</dt>
              <dd className="font-mono text-gray-900">{formatSiret(form.siret)}</dd>
            </div>
          ) : null}
          {form.naf_code ? (
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-gray-500">NAF</dt>
              <dd>{form.naf_code}</dd>
            </div>
          ) : null}
          {form.opco_name ? (
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-gray-500">OPCO</dt>
              <dd>{form.opco_name}</dd>
            </div>
          ) : null}
          {commercial.location ? (
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-gray-500">Adresse</dt>
              <dd>{commercial.location}</dd>
            </div>
          ) : null}
          {commercial.employee_count ? (
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-gray-500">Effectif</dt>
              <dd>{employeeLabel(commercial.employee_count)}</dd>
            </div>
          ) : null}
          {form.company_creation_date ? (
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-gray-500">Création</dt>
              <dd>{form.company_creation_date}</dd>
            </div>
          ) : null}
          {editingDealMeta.created_at ? (
            <div className="flex gap-2">
              <dt className="w-28 shrink-0 text-gray-500">Prospect CRM</dt>
              <dd>
                {format(new Date(editingDealMeta.created_at), "d MMMM yyyy", { locale: fr })}
              </dd>
            </div>
          ) : null}
        </dl>
        {!form.siret && !form.naf_code && !form.opco_name && !commercial.location ? (
          <p className="text-sm text-gray-500">Recherchez le SIRET pour préremplir ces données.</p>
        ) : null}
      </PipelineLightSection>

      {/* Informations à compléter */}
      {missingItems.length > 0 ? (
        <PipelineLightSection
          title="Informations à compléter"
          badge={`${missingItems.length}`}
          tone="warning"
          defaultOpen={false}
        >
          <ul className="space-y-1.5 text-sm text-amber-950">
            {missingItems.map((item) => (
              <li key={item} className="flex gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                {item}
              </li>
            ))}
          </ul>
        </PipelineLightSection>
      ) : null}
    </div>
  );
}
