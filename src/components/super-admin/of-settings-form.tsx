"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
};

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
};

export function OfSettingsForm() {
  const [form, setForm] = useState<OfSettings>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch("/api/super-admin/of-settings");
        const json = (await res.json()) as { settings?: Partial<OfSettings> | null };
        if (json.settings) {
          setForm({
            ...EMPTY,
            ...Object.fromEntries(
              Object.entries(json.settings).map(([key, value]) => [key, value ?? ""]),
            ),
          } as OfSettings);
        }
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
                  body: JSON.stringify(form),
                });
                const json = (await res.json()) as { error?: string };
                if (!res.ok) throw new Error(json.error || "Enregistrement impossible");
                toast.success("Paramètres OF enregistrés");
              } catch (error) {
                toast.error(error instanceof Error ? error.message : "Erreur");
              } finally {
                setSaving(false);
              }
            })();
          }}
        >
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
              ["referent_handicap_user_id", "Référent handicap (user id)"],
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
