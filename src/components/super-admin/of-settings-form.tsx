"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  ACTIVITY_LABELS,
  DEFAULT_QUALIOPI_ACTIVITIES,
  parseActivityProfile,
  type QualiopiActivityProfile,
} from "@/lib/qualiopi/activity-profile";
import type { QualiopiActivityKey } from "@/lib/qualiopi/indicators";

type OfSettings = {
  legal_name: string | null;
  nda: string | null;
  siret: string | null;
  siren: string | null;
  vat_intra: string | null;
  address_line: string | null;
  address_city: string | null;
  address_zip: string | null;
  address_country: string | null;
  fiscal_year_start: string | null;
  fiscal_year_end: string | null;
  referent_handicap_user_id: string | null;
  bpf_campaign_deadline: string | null;
  results_indicators_method: string | null;
  referent_qualite_user_id: string | null;
  referent_signalement_user_id: string | null;
  lms_inactive_alert_days: string | null;
  reclamation_ack_business_days: string | null;
  reclamation_reply_business_days: string | null;
  signalement_ack_business_days: string | null;
  /** true = front public affiche les financements réels (OPCO compris). */
  qualiopi_certified: string | null;
};

/** Activités affichées dans les paramètres (hors flags techniques certifying / pfst). */
const ACTIVITY_SWITCH_KEYS: QualiopiActivityKey[] = ["of", "cfa", "vae", "bilan"];

type HandicapReferentOption = {
  key: string;
  label: string;
  email: string;
  userId: string | null;
};

type StaffOption = { userId: string; label: string; email: string };

const EMPTY: OfSettings = {
  legal_name: "",
  nda: "",
  siret: "",
  siren: "",
  vat_intra: "",
  address_line: "",
  address_city: "",
  address_zip: "",
  address_country: "FR",
  fiscal_year_start: "",
  fiscal_year_end: "",
  referent_handicap_user_id: "",
  bpf_campaign_deadline: "",
  results_indicators_method: "",
  referent_qualite_user_id: "",
  referent_signalement_user_id: "",
  lms_inactive_alert_days: "7",
  reclamation_ack_business_days: "2",
  reclamation_reply_business_days: "10",
  signalement_ack_business_days: "2",
  qualiopi_certified: "false",
};

export function OfSettingsForm() {
  const [form, setForm] = useState<OfSettings>(EMPTY);
  const [activities, setActivities] = useState<QualiopiActivityProfile>(DEFAULT_QUALIOPI_ACTIVITIES);
  const [referentOptions, setReferentOptions] = useState<HandicapReferentOption[]>([]);
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/super-admin/of-settings");
        const json = (await res.json()) as {
          settings?: (Partial<OfSettings> & { qualiopi_activities?: unknown }) | null;
          handicapReferentOptions?: HandicapReferentOption[];
          staffOptions?: StaffOption[];
        };
        if (json.settings) {
          const { qualiopi_activities, ...rest } = json.settings;
          const certified =
            typeof (json.settings as { qualiopi_certified?: boolean }).qualiopi_certified ===
            "boolean"
              ? Boolean((json.settings as { qualiopi_certified?: boolean }).qualiopi_certified)
              : Boolean(
                  (qualiopi_activities as { qualiopi_certified?: boolean } | null)
                    ?.qualiopi_certified,
                );
          setForm({
            ...EMPTY,
            ...Object.fromEntries(
              Object.entries(rest).map(([key, value]) => [
                key,
                value == null ? "" : String(value),
              ]),
            ),
            qualiopi_certified: certified ? "true" : "false",
          } as OfSettings);
          setActivities(parseActivityProfile(qualiopi_activities));
        }
        setReferentOptions(json.handicapReferentOptions ?? []);
        setStaffOptions(json.staffOptions ?? []);
      } catch {
        toast.error("Paramètres OF indisponibles (migration Lot 1 requise)");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const set = (key: keyof OfSettings, value: string) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const toggleActivity = (key: QualiopiActivityKey, next: boolean) => {
    setActivities((current) => {
      const updated = { ...current, [key]: next };
      const anyCore = ACTIVITY_SWITCH_KEYS.some((k) => updated[k]);
      if (!anyCore) {
        toast.error("Au moins une activité (OF, CFA, VAE ou Bilan) doit rester active.");
        return current;
      }
      return updated;
    });
  };

  const selectedReferentMissing =
    Boolean(form.referent_handicap_user_id) &&
    !referentOptions.some((o) => o.userId && o.userId === form.referent_handicap_user_id);

  return (
    <div className="rounded-2xl border border-[#262A4A] bg-[#141731] p-6 text-[#F3F4FA]">
      <h2 className="font-[family-name:var(--font-plus-jakarta,inherit)] text-xl font-semibold">
        Organisme de formation
      </h2>
      <p className="mt-1 text-sm text-[#A3A8C7]">
        NDA, SIRET/SIREN, exercice comptable et référent handicap (BPF + accessibilité).
      </p>

      {loading ? (
        <p className="mt-4 text-sm text-[#A3A8C7]">Chargement…</p>
      ) : (
        <form
          className="mt-6 grid gap-4 md:grid-cols-2"
          onSubmit={(event) => {
            event.preventDefault();
            void (async () => {
              setSaving(true);
              try {
                const res = await fetch("/api/super-admin/of-settings", {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ ...form, qualiopi_activities: activities }),
                });
                const json = (await res.json()) as {
                  error?: string;
                  settings?: { qualiopi_activities?: unknown };
                };
                if (!res.ok) throw new Error(json.error || "Enregistrement impossible");
                if (json.settings?.qualiopi_activities !== undefined) {
                  setActivities(parseActivityProfile(json.settings.qualiopi_activities));
                }
                toast.success("Paramètres OF enregistrés");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Erreur");
              } finally {
                setSaving(false);
              }
            })();
          }}
        >
          <div className="md:col-span-2 space-y-3 rounded-xl border border-[#262A4A] bg-[#0A0C1B]/60 p-4">
            <div>
              <p className="text-sm font-medium text-[#F3F4FA]">Activités Qualiopi</p>
              <p className="mt-1 text-xs text-[#A3A8C7]">
                Coupez CFA si vous certifiez uniquement en organisme de formation (Business). Les
                indicateurs réservés passent alors en non applicables.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {ACTIVITY_SWITCH_KEYS.map((key) => (
                <label
                  key={key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-[#262A4A] px-3 py-2.5"
                >
                  <span className="text-sm text-[#F3F4FA]">{ACTIVITY_LABELS[key]}</span>
                  <Switch
                    checked={activities[key]}
                    onCheckedChange={(checked) => toggleActivity(key, checked)}
                    className="data-[state=checked]:bg-[#6C5CF5]"
                  />
                </label>
              ))}
            </div>
          </div>

          {(
            [
              ["legal_name", "Raison sociale"],
              ["nda", "N° déclaration d'activité (NDA)"],
              ["siret", "SIRET"],
              ["siren", "SIREN"],
              ["vat_intra", "TVA intracommunautaire"],
              ["address_line", "Adresse"],
              ["address_zip", "Code postal"],
              ["address_city", "Ville"],
              ["fiscal_year_start", "Début exercice (YYYY-MM-DD)"],
              ["fiscal_year_end", "Fin exercice (YYYY-MM-DD)"],
              ["bpf_campaign_deadline", "Échéance campagne BPF (YYYY-MM-DD)"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-[#A3A8C7]">{label}</Label>
              <Input
                type={key.includes("deadline") || key.includes("fiscal_year") ? "date" : "text"}
                value={
                  key === "bpf_campaign_deadline" || key.startsWith("fiscal_year")
                    ? String(form[key] ?? "").slice(0, 10)
                    : (form[key] ?? "")
                }
                onChange={(event) => set(key, event.target.value)}
                className="border-[#262A4A] bg-[#0A0C1B] text-[#F3F4FA]"
              />
            </div>
          ))}

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-[#A3A8C7]">
              Méthode de calcul des indicateurs de résultats (Qualiopi ind. 2)
            </Label>
            <textarea
              value={form.results_indicators_method ?? ""}
              onChange={(event) => set("results_indicators_method", event.target.value)}
              rows={4}
              placeholder="À rédiger — formule, période, nombre de répondants…"
              className="w-full rounded-md border border-[#262A4A] bg-[#0A0C1B] px-3 py-2 text-sm text-[#F3F4FA]"
            />
            <p className="text-xs text-[#A3A8C7]">
              Affichée sous chaque taux sur les fiches publiques. Surchargeable par formation.
            </p>
          </div>

          <div className="space-y-1.5 md:col-span-2">
            <Label className="text-[#A3A8C7]">Référent handicap</Label>
            <select
              value={form.referent_handicap_user_id ?? ""}
              onChange={(event) => {
                const next = event.target.value;
                if (next.startsWith("__missing_")) return;
                set("referent_handicap_user_id", next);
              }}
              className="w-full rounded-md border border-[#262A4A] bg-[#0A0C1B] px-3 py-2 text-sm text-[#F3F4FA]"
            >
              <option value="">— Non assigné —</option>
              {referentOptions.map((opt) => (
                <option
                  key={opt.key}
                  value={opt.userId ?? `__missing_${opt.key}`}
                  disabled={!opt.userId}
                >
                  {opt.label} ({opt.email})
                  {!opt.userId ? " — compte introuvable" : ""}
                </option>
              ))}
              {selectedReferentMissing ? (
                <option value={form.referent_handicap_user_id ?? ""}>
                  Autre (id actuel)
                </option>
              ) : null}
            </select>
            <p className="text-xs text-[#A3A8C7]">
              Donne accès à Qualiopi → Handicap (dossiers RQTH + annuaire partenaires).
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#A3A8C7]">Référent signalements sensibles</Label>
            <select
              value={form.referent_signalement_user_id ?? ""}
              onChange={(event) => set("referent_signalement_user_id", event.target.value)}
              className="w-full rounded-md border border-[#262A4A] bg-[#0A0C1B] px-3 py-2 text-sm text-[#F3F4FA]"
            >
              <option value="">— Non assigné —</option>
              {staffOptions.map((opt) => (
                <option key={opt.userId} value={opt.userId}>
                  {opt.label}
                  {opt.email ? ` (${opt.email})` : ""}
                </option>
              ))}
            </select>
            <p className="text-xs text-[#A3A8C7]">
              Notifié à chaque dépôt ; accès RLS au registre VHD.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[#A3A8C7]">Référent qualité (optionnel)</Label>
            <select
              value={form.referent_qualite_user_id ?? ""}
              onChange={(event) => set("referent_qualite_user_id", event.target.value)}
              className="w-full rounded-md border border-[#262A4A] bg-[#0A0C1B] px-3 py-2 text-sm text-[#F3F4FA]"
            >
              <option value="">— Non assigné —</option>
              {staffOptions.map((opt) => (
                <option key={opt.userId} value={opt.userId}>
                  {opt.label}
                  {opt.email ? ` (${opt.email})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 flex items-start justify-between gap-4 rounded-xl border border-[#262A4A] bg-[#0A0C1B]/60 p-4">
            <div>
              <Label className="text-[#F3F4FA]">Certification Qualiopi obtenue</Label>
              <p className="mt-1 text-xs text-[#A3A8C7]">
                Faux (défaut) : le site public et les documents remis au client affichent la phrase
                « Qualiopi en cours » (OPCO non présenté comme disponible). Vrai : le front
                réaffiche les modalités de financement réelles de chaque fiche.
              </p>
            </div>
            <Switch
              checked={form.qualiopi_certified === "true"}
              onCheckedChange={(next) => set("qualiopi_certified", next ? "true" : "false")}
            />
          </div>

          {(
            [
              ["lms_inactive_alert_days", "Seuil inactivité LMS (jours)"],
              ["reclamation_ack_business_days", "Réclamations — accusé (j ouvrés)"],
              ["reclamation_reply_business_days", "Réclamations — réponse (j ouvrés)"],
              ["signalement_ack_business_days", "Signalements — accusé (j ouvrés)"],
            ] as const
          ).map(([key, label]) => (
            <div key={key} className="space-y-1.5">
              <Label className="text-[#A3A8C7]">{label}</Label>
              <Input
                type="number"
                min={1}
                value={form[key] ?? ""}
                onChange={(event) => set(key, event.target.value)}
                className="border-[#262A4A] bg-[#0A0C1B] text-[#F3F4FA]"
              />
            </div>
          ))}

          <div className="md:col-span-2">
            <Button
              type="submit"
              disabled={saving}
              className="bg-[#6C5CF5] text-white hover:bg-[#5B4DE0]"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
