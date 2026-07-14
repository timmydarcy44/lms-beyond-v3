"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  CalendarClock,
  ExternalLink,
  Loader2,
  Mail,
  Phone,
  Sparkles,
  UserPlus,
} from "lucide-react";
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
import { PIPELINE_BTOB_CONTACT_OWNERS } from "@/lib/crm/pipeline-btob-owners";
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
  email: string;
  phone: string;
  notes: string;
  city: string;
  zip_code: string;
  company_creation_date: string;
  quoted_course_ids: string[];
};

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

  return (
    <div className="space-y-4 text-gray-900">
      {/* Prochaine action — priorité absolue */}
      <section
        className={`rounded-xl border p-4 ${commercial.next_action?.trim() ? "border-indigo-200 bg-indigo-50/80" : "border-amber-200 bg-amber-50/80"}`}
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-600">Prochaine action</p>
        {commercial.next_action?.trim() ? (
          <>
            <p className="mt-1 text-base font-semibold text-gray-900">{commercial.next_action}</p>
            {nextActionDateLabel ? (
              <p className="mt-1 text-sm text-gray-600">À réaliser avant le {nextActionDateLabel}</p>
            ) : null}
          </>
        ) : (
          <p className="mt-1 flex items-center gap-2 text-sm font-medium text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            Aucune prochaine action planifiée
          </p>
        )}
        <div className="mt-3 flex flex-wrap gap-2">
          <Input
            className="h-9 max-w-xs bg-white text-sm"
            placeholder="Action à mener…"
            value={commercial.next_action}
            onChange={(e) => setCommercial((c) => ({ ...c, next_action: e.target.value }))}
          />
          <Input
            type="date"
            className="h-9 w-auto bg-white text-sm"
            value={commercial.next_action_date}
            onChange={(e) => setCommercial((c) => ({ ...c, next_action_date: e.target.value }))}
          />
        </div>
      </section>

      {/* SIRET — outil d'enrichissement */}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <Label className="text-xs font-semibold uppercase tracking-wide text-gray-500">SIRET</Label>
        <div className="mt-1.5 flex gap-2">
          <Input
            value={form.siret}
            onChange={(e) => setForm((f) => ({ ...f, siret: e.target.value }))}
            placeholder="14 chiffres — ou laissez vide si inconnu"
            className="font-mono text-sm"
          />
          <Button type="button" variant="outline" disabled={siretLoading} onClick={onLookupSiret}>
            {siretLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Rechercher"}
          </Button>
        </div>
        <p className="mt-1.5 text-xs text-gray-500">
          Remplit automatiquement raison sociale, adresse, NAF, effectif et OPCO.
        </p>
      </section>

      {/* En-tête prospect */}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <Input
              className="border-0 p-0 text-lg font-bold shadow-none focus-visible:ring-0"
              placeholder="Nom de l'entreprise *"
              value={form.company_name}
              onChange={(e) => setForm((f) => ({ ...f, company_name: e.target.value }))}
            />
            {subtitleParts.length > 0 ? (
              <p className="mt-1 text-sm text-gray-600">{subtitleParts.join(" · ")}</p>
            ) : (
              <p className="mt-1 text-sm text-gray-400">Complétez via SIRET ou saisie manuelle</p>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {form.phone?.trim() ? (
              <Button type="button" size="sm" variant="outline" asChild>
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

        {/* Bandeau commercial */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg bg-gray-50 p-3 text-center text-sm">
          <div>
            <p className="text-xs text-gray-500">Health Score</p>
            <p className="font-bold text-gray-900">
              {intel.healthScore}/100
              {intel.atRisk ? " ⚠" : ""}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Étape</p>
            <p className="font-semibold text-gray-900">{stageLabel}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Priorité</p>
            <p className="font-semibold text-gray-900">{priorityLabel(commercial.priority)}</p>
          </div>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Probabilité de signature : {intel.signatureProbability}%
          {commercial.last_contact_date
            ? ` · Dernier contact : ${commercial.last_contact_date}`
            : " · Dernier contact : aucun"}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Étape pipeline</Label>
            <select
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              value={form.stage_slug}
              onChange={(e) => setForm((f) => ({ ...f, stage_slug: e.target.value }))}
            >
              {visibleStages.map((s) => (
                <option key={s.slug} value={s.slug}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-gray-500">Propriétaire</Label>
            <select
              className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              value={form.contact_owner_email}
              onChange={(e) => setForm((f) => ({ ...f, contact_owner_email: e.target.value }))}
            >
              {PIPELINE_BTOB_CONTACT_OWNERS.map((o) => (
                <option key={o.email} value={o.email}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Synthèse EDGE */}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-semibold text-gray-900">Synthèse EDGE</p>
          {onGenerateAiSummary ? (
            <Button
              type="button"
              size="sm"
              variant="outline"
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
          <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{aiProspectSummary}</p>
        ) : (
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-semibold uppercase text-gray-500">Ce que nous savons</p>
              <ul className="mt-2 space-y-1 text-sm text-gray-700">
                {knowsItems.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-indigo-500">•</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            {missingItems.length > 0 ? (
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Ce qu&apos;il manque</p>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {missingItems.map((item) => (
                    <li key={item} className="flex gap-2">
                      <span className="text-amber-500">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        )}
        {aiProspectSummaryAt ? (
          <p className="mt-2 text-xs text-gray-400">
            Synthèse du {aiProspectSummaryAt.slice(0, 10)}
          </p>
        ) : null}
      </section>

      {/* Besoins et offre */}
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-semibold text-gray-900">Besoins identifiés</p>
        {commercial.training_needs.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Aucun besoin confirmé</p>
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
            className="h-9 text-sm"
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

        <div className="mt-5 border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-900">Offre envisagée</p>
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
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <p className="text-sm font-semibold text-gray-900">Personnes impliquées</p>
        {people.length === 0 ? (
          <p className="mt-2 text-sm text-gray-500">Aucun contact renseigné</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {people.map((p) => (
              <li key={p.name} className="rounded-lg border border-gray-100 bg-gray-50/80 p-3">
                <p className="font-medium text-gray-900">{p.name}</p>
                <p className="text-xs text-gray-600">{p.roles.join(" · ")}</p>
                {p.phone ? <p className="mt-1 text-sm text-gray-700">{p.phone}</p> : null}
                {p.email ? <p className="text-sm text-gray-700">{p.email}</p> : null}
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
      <div className="rounded-xl border border-gray-200 bg-white p-4">
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
      <section className="rounded-xl border border-gray-200 bg-white p-4">
        <Label className="text-sm font-semibold text-gray-900">Notes internes</Label>
        <p className="mt-0.5 text-xs text-gray-500">
          Observations commerciales uniquement — pas de données administratives.
        </p>
        <Textarea
          className="mt-2"
          value={form.notes}
          onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
          rows={4}
          placeholder="Ex. : Marc est dirigeant. Petite structure, intérêt pour la digitalisation pédagogique…"
        />
      </section>

      {/* Coordonnées — édition */}
      <PipelineLightSection
        title="Modifier les coordonnées"
        subtitle="Prénom, nom, téléphone, email, LinkedIn"
        defaultOpen={editContactOpen}
      >
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Prénom</Label>
              <Input
                value={form.contact_first_name}
                onChange={(e) => setForm((f) => ({ ...f, contact_first_name: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Nom</Label>
              <Input
                value={form.contact_last_name}
                onChange={(e) => setForm((f) => ({ ...f, contact_last_name: e.target.value }))}
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Rôle du contact</Label>
            <Input
              value={commercial.contact_role}
              onChange={(e) => setCommercial((c) => ({ ...c, contact_role: e.target.value }))}
              placeholder="Dirigeant, DRH…"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Téléphone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Ville</Label>
              <Input
                value={form.city}
                onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Code postal</Label>
              <Input
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
          defaultOpen={false}
        >
          <ul className="space-y-1 text-sm text-gray-700">
            {missingItems.map((item) => (
              <li key={item} className="flex gap-2">
                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                {item}
              </li>
            ))}
          </ul>
        </PipelineLightSection>
      ) : null}
    </div>
  );
}
