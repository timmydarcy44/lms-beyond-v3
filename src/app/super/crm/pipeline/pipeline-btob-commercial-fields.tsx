"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { AlertTriangle, Crown, DollarSign, ExternalLink, Heart } from "lucide-react";
import {
  LOST_COMPETITOR_OPTIONS,
  LOST_REASON_OPTIONS,
} from "@/lib/crm/pipeline-lost-reason-options";
import { normalizeLinkedInUrl } from "@/lib/crm/pipeline-deal-intelligence";
import {
  BTOB_APPROACH_CHANNEL_OPTIONS,
  BTOB_BUDGET_OPTIONS,
  BTOB_EMPLOYEE_COUNT_OPTIONS,
  BTOB_PRIORITY_OPTIONS,
  BTOB_SECTOR_OPTIONS,
  priorityBadgeClass,
} from "@/lib/crm/pipeline-btob-commercial-options";

export type BtobCommercialFormState = {
  sector: string;
  employee_count: string;
  location: string;
  priority: string;
  why_target: string;
  training_needs: string[];
  contact_role: string;
  contact_linkedin: string;
  company_linkedin: string;
  approach_channel: string;
  decision_maker_identified: boolean;
  decision_maker_name: string;
  champion_name: string;
  blocker_name: string;
  finance_contact: string;
  engagement_score: number;
  last_contact_date: string;
  next_action: string;
  next_action_date: string;
  estimated_budget: string;
  estimated_users: string;
  lost_reason: string;
  lost_reason_detail: string;
  lost_competitor: string;
};

export const emptyBtobCommercial = (): BtobCommercialFormState => ({
  sector: "",
  employee_count: "",
  location: "",
  priority: "standard",
  why_target: "",
  training_needs: [],
  contact_role: "",
  contact_linkedin: "",
  company_linkedin: "",
  approach_channel: "",
  decision_maker_identified: false,
  decision_maker_name: "",
  champion_name: "",
  blocker_name: "",
  finance_contact: "",
  engagement_score: 0,
  last_contact_date: "",
  next_action: "",
  next_action_date: "",
  estimated_budget: "",
  estimated_users: "",
  lost_reason: "",
  lost_reason_detail: "",
  lost_competitor: "",
});

function SelectField({
  label,
  value,
  onChange,
  options,
  placeholder = "—",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function LinkedInField({
  label,
  value,
  onChange,
  viewLabel = "Voir le compte",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  viewLabel?: string;
}) {
  const href = normalizeLinkedInUrl(value);
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="https://linkedin.com/in/..."
          className="min-w-0 flex-1"
        />
        {href ? (
          <Button type="button" variant="outline" size="sm" className="shrink-0" asChild>
            <a href={href} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1 h-3.5 w-3.5" />
              {viewLabel}
            </a>
          </Button>
        ) : null}
      </div>
    </div>
  );
}

export function PipelineBtobCommercialFields({
  value,
  onChange,
  stageSlug,
  contactFirstName,
  hideLinkedIn = false,
}: {
  value: BtobCommercialFormState;
  onChange: (next: BtobCommercialFormState) => void;
  stageSlug?: string;
  contactFirstName?: string;
  hideLinkedIn?: boolean;
}) {
  const [trainingDraft, setTrainingDraft] = useState("");

  const patch = (partial: Partial<BtobCommercialFormState>) => onChange({ ...value, ...partial });

  const addTrainingNeed = () => {
    const tag = trainingDraft.trim();
    if (!tag || value.training_needs.includes(tag)) return;
    patch({ training_needs: [...value.training_needs, tag] });
    setTrainingDraft("");
  };

  return (
    <div className="space-y-4 border-t border-gray-200 pt-4">
      <p className="text-sm font-semibold text-gray-900">Qualification commerciale Beyond</p>

      <div className="grid grid-cols-2 gap-3">
        <SelectField
          label="Secteur"
          value={value.sector}
          onChange={(sector) => patch({ sector })}
          options={BTOB_SECTOR_OPTIONS}
        />
        <SelectField
          label="Effectifs"
          value={value.employee_count}
          onChange={(employee_count) => patch({ employee_count })}
          options={BTOB_EMPLOYEE_COUNT_OPTIONS}
        />
        <div className="space-y-2">
          <Label>Localisation</Label>
          <Input value={value.location} onChange={(e) => patch({ location: e.target.value })} />
        </div>
        <div className="space-y-2">
          <Label>Priorité</Label>
          <select
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            value={value.priority}
            onChange={(e) => patch({ priority: e.target.value })}
          >
            {BTOB_PRIORITY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <Badge variant="outline" className={cn("text-xs", priorityBadgeClass(value.priority))}>
            {BTOB_PRIORITY_OPTIONS.find((p) => p.value === value.priority)?.label ?? value.priority}
          </Badge>
        </div>
      </div>

      <div className="space-y-2">
        <Label>Score engagement (0–3)</Label>
        <div className="flex gap-2">
          {[0, 1, 2, 3].map((n) => (
            <button
              key={n}
              type="button"
              className={cn(
                "h-9 w-9 rounded-full border text-sm font-semibold transition-colors",
                value.engagement_score === n
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-gray-300 bg-white text-gray-600 hover:border-violet-400",
              )}
              onClick={() => patch({ engagement_score: n })}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={value.decision_maker_identified}
          onChange={(e) => patch({ decision_maker_identified: e.target.checked })}
        />
        Décideur identifié
      </label>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {[
          { key: "decision_maker_name" as const, icon: Crown, title: "Décideur", placeholder: contactFirstName || "Jean Dupont" },
          { key: "champion_name" as const, icon: Heart, title: "Champion", placeholder: "Marie Martin" },
          { key: "blocker_name" as const, icon: AlertTriangle, title: "Bloqueur", placeholder: "Service informatique" },
          { key: "finance_contact" as const, icon: DollarSign, title: "Finance", placeholder: "DAF inconnu" },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="rounded-xl border border-gray-200 bg-slate-50/80 p-3">
              <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-gray-600">
                <Icon className="h-3.5 w-3.5" />
                {card.title}
              </div>
              <Input
                className="mt-2 bg-white"
                value={value[card.key]}
                placeholder={card.placeholder}
                onChange={(e) => patch({ [card.key]: e.target.value })}
              />
            </div>
          );
        })}
      </div>

      <SelectField
        label="Canal d'approche"
        value={value.approach_channel}
        onChange={(approach_channel) => patch({ approach_channel })}
        options={BTOB_APPROACH_CHANNEL_OPTIONS}
      />

      <div className="space-y-2">
        <Label>Pourquoi c&apos;est une cible</Label>
        <Textarea
          value={value.why_target}
          onChange={(e) => patch({ why_target: e.target.value })}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label>Types de formation identifiés</Label>
        <div className="flex flex-wrap gap-1">
          {value.training_needs.map((tag) => (
            <Badge key={tag} variant="secondary" className="gap-1">
              {tag}
              <button
                type="button"
                className="ml-1 text-gray-500 hover:text-gray-900"
                onClick={() =>
                  patch({ training_needs: value.training_needs.filter((t) => t !== tag) })
                }
              >
                ×
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Ajouter un besoin…"
            value={trainingDraft}
            onChange={(e) => setTrainingDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTrainingNeed();
              }
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={addTrainingNeed}>
            Ajouter
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {!hideLinkedIn ? (
          <>
            <LinkedInField
              label="LinkedIn contact"
              value={value.contact_linkedin}
              onChange={(contact_linkedin) => patch({ contact_linkedin })}
            />
            <LinkedInField
              label="LinkedIn société"
              value={value.company_linkedin}
              onChange={(company_linkedin) => patch({ company_linkedin })}
              viewLabel="Voir la page"
            />
          </>
        ) : null}
        <div className="space-y-2">
          <Label>Rôle du contact</Label>
          <Input value={value.contact_role} onChange={(e) => patch({ contact_role: e.target.value })} />
        </div>
        <SelectField
          label="Budget estimé"
          value={value.estimated_budget}
          onChange={(estimated_budget) => patch({ estimated_budget })}
          options={BTOB_BUDGET_OPTIONS}
        />
        <div className="space-y-2">
          <Label>Utilisateurs estimés</Label>
          <Input
            type="number"
            min={0}
            value={value.estimated_users}
            onChange={(e) => patch({ estimated_users: e.target.value })}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Prochaine meilleure action</Label>
        <Input value={value.next_action} onChange={(e) => patch({ next_action: e.target.value })} />
        <p className="text-xs text-gray-500">EDGE suggère une action en haut de la fiche — vous pouvez la personnaliser ici.</p>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Date prochaine action</Label>
          <Input
            type="date"
            value={value.next_action_date}
            onChange={(e) => patch({ next_action_date: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>Dernier contact</Label>
          <Input
            type="date"
            value={value.last_contact_date}
            onChange={(e) => patch({ last_contact_date: e.target.value })}
          />
        </div>
      </div>

      {stageSlug === "echec" ? (
        <div className="space-y-3 rounded-xl border border-rose-200 bg-rose-50/50 p-4">
          <p className="text-sm font-semibold text-rose-900">Lost reason</p>
          <SelectField
            label="Cause principale"
            value={value.lost_reason}
            onChange={(lost_reason) => patch({ lost_reason })}
            options={LOST_REASON_OPTIONS}
            placeholder="Sélectionner…"
          />
          {value.lost_reason === "concurrent" ? (
            <SelectField
              label="Concurrent"
              value={value.lost_competitor}
              onChange={(lost_competitor) => patch({ lost_competitor })}
              options={LOST_COMPETITOR_OPTIONS.map((c) => ({ value: c, label: c }))}
              placeholder="Choisir…"
            />
          ) : null}
          <div className="space-y-2">
            <Label>Détail / sous-catégorie</Label>
            <Textarea
              value={value.lost_reason_detail}
              onChange={(e) => patch({ lost_reason_detail: e.target.value })}
              rows={2}
              placeholder="Précisions sur la perte…"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function commercialFromDeal(deal: {
  sector?: string | null;
  employee_count?: string | null;
  location?: string | null;
  priority?: string | null;
  why_target?: string | null;
  training_needs?: string[] | null;
  contact_role?: string | null;
  contact_linkedin?: string | null;
  company_linkedin?: string | null;
  approach_channel?: string | null;
  decision_maker_identified?: boolean | null;
  decision_maker_name?: string | null;
  champion_name?: string | null;
  blocker_name?: string | null;
  finance_contact?: string | null;
  lost_reason?: string | null;
  lost_reason_detail?: string | null;
  lost_competitor?: string | null;
  engagement_score?: number | null;
  last_contact_date?: string | null;
  next_action?: string | null;
  next_action_date?: string | null;
  estimated_budget?: string | null;
  estimated_users?: number | null;
}): BtobCommercialFormState {
  return {
    sector: deal.sector ?? "",
    employee_count: deal.employee_count ?? "",
    location: deal.location ?? "",
    priority: deal.priority ?? "standard",
    why_target: deal.why_target ?? "",
    training_needs: deal.training_needs ?? [],
    contact_role: deal.contact_role ?? "",
    contact_linkedin: deal.contact_linkedin ?? "",
    company_linkedin: deal.company_linkedin ?? "",
    approach_channel: deal.approach_channel ?? "",
    decision_maker_identified: Boolean(deal.decision_maker_identified),
    decision_maker_name: deal.decision_maker_name ?? "",
    champion_name: deal.champion_name ?? "",
    blocker_name: deal.blocker_name ?? "",
    finance_contact: deal.finance_contact ?? "",
    engagement_score: deal.engagement_score ?? 0,
    last_contact_date: deal.last_contact_date?.slice(0, 10) ?? "",
    next_action: deal.next_action ?? "",
    next_action_date: deal.next_action_date?.slice(0, 10) ?? "",
    estimated_budget: deal.estimated_budget ?? "",
    estimated_users: deal.estimated_users != null ? String(deal.estimated_users) : "",
    lost_reason: deal.lost_reason ?? "",
    lost_reason_detail: deal.lost_reason_detail ?? "",
    lost_competitor: deal.lost_competitor ?? "",
  };
}

export function commercialToPayload(c: BtobCommercialFormState): Record<string, unknown> {
  return {
    sector: c.sector || null,
    employee_count: c.employee_count || null,
    location: c.location || null,
    priority: c.priority || "standard",
    why_target: c.why_target || null,
    training_needs: c.training_needs,
    contact_role: c.contact_role || null,
    contact_linkedin: c.contact_linkedin || null,
    company_linkedin: c.company_linkedin || null,
    approach_channel: c.approach_channel || null,
    decision_maker_identified: c.decision_maker_identified,
    decision_maker_name: c.decision_maker_name || null,
    champion_name: c.champion_name || null,
    blocker_name: c.blocker_name || null,
    finance_contact: c.finance_contact || null,
    lost_reason: c.lost_reason || null,
    lost_reason_detail: c.lost_reason_detail || null,
    lost_competitor: c.lost_competitor || null,
    engagement_score: c.engagement_score,
    last_contact_date: c.last_contact_date || null,
    next_action: c.next_action || null,
    next_action_date: c.next_action_date || null,
    estimated_budget: c.estimated_budget || null,
    estimated_users: c.estimated_users ? Number(c.estimated_users) : null,
  };
}
