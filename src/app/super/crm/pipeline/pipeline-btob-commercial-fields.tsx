"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
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
  engagement_score: number;
  last_contact_date: string;
  next_action: string;
  next_action_date: string;
  estimated_budget: string;
  estimated_users: string;
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
  engagement_score: 0,
  last_contact_date: "",
  next_action: "",
  next_action_date: "",
  estimated_budget: "",
  estimated_users: "",
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

export function PipelineBtobCommercialFields({
  value,
  onChange,
}: {
  value: BtobCommercialFormState;
  onChange: (next: BtobCommercialFormState) => void;
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

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>LinkedIn contact</Label>
          <Input
            type="url"
            value={value.contact_linkedin}
            onChange={(e) => patch({ contact_linkedin: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label>LinkedIn société</Label>
          <Input
            type="url"
            value={value.company_linkedin}
            onChange={(e) => patch({ company_linkedin: e.target.value })}
          />
        </div>
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
        <Label>Prochaine action</Label>
        <Input value={value.next_action} onChange={(e) => patch({ next_action: e.target.value })} />
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
    engagement_score: deal.engagement_score ?? 0,
    last_contact_date: deal.last_contact_date?.slice(0, 10) ?? "",
    next_action: deal.next_action ?? "",
    next_action_date: deal.next_action_date?.slice(0, 10) ?? "",
    estimated_budget: deal.estimated_budget ?? "",
    estimated_users: deal.estimated_users != null ? String(deal.estimated_users) : "",
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
    engagement_score: c.engagement_score,
    last_contact_date: c.last_contact_date || null,
    next_action: c.next_action || null,
    next_action_date: c.next_action_date || null,
    estimated_budget: c.estimated_budget || null,
    estimated_users: c.estimated_users ? Number(c.estimated_users) : null,
  };
}
