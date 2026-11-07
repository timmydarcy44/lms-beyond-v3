"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { parseFetchJson } from "@/lib/api/parse-fetch-json";
import type { BpfDraft, BpfLine } from "@/lib/formation-bpf/compute";
import { BPF_CHARGE_LABELS } from "@/lib/formation-bpf/labels";

function euros(cents: number): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
  }).format(cents / 100);
}

function formatLine(line: BpfLine): string {
  if (line.unit === "eur_ht") return euros(line.value);
  if (line.unit === "hours") return `${line.value.toFixed(1)} h`;
  return String(line.value);
}

function CadreBlock({
  title,
  lines,
  onSelect,
}: {
  title: string;
  lines: BpfLine[];
  onSelect: (line: BpfLine) => void;
}) {
  return (
    <section className="rounded-2xl border border-[#262A4A] bg-[#141731] p-4">
      <h2 className="text-sm font-semibold text-[#F3F4FA]">{title}</h2>
      <ul className="mt-3 space-y-1">
        {lines.length === 0 ? (
          <li className="text-xs text-[#A3A8C7]">Aucune donnée</li>
        ) : (
          lines.map((line) => (
            <li key={line.key}>
              <button
                type="button"
                onClick={() => onSelect(line)}
                className="flex w-full items-center justify-between gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-[#0A0C1B]"
              >
                <span className="text-[#A3A8C7]">{line.label}</span>
                <span className="font-semibold text-[#B7AEFF]">{formatLine(line)}</span>
              </button>
            </li>
          ))
        )}
      </ul>
    </section>
  );
}

export default function BpfPage() {
  const [draft, setDraft] = useState<BpfDraft | null>(null);
  const [deadline, setDeadline] = useState("");
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<BpfLine | null>(null);
  const [charges, setCharges] = useState({
    total_charges: "",
    salaires_formateurs: "",
    achats_prestations_formation: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/super-admin/crm/bpf");
      const json = await parseFetchJson<{
        draft?: BpfDraft;
        campaign?: { deadline: string | null };
        error?: string;
      } & Record<string, unknown>>(res);
      if (!res.ok) throw new Error(json.error || "Chargement impossible");
      setDraft(json.draft ?? null);
      setDeadline(json.campaign?.deadline ? String(json.campaign.deadline).slice(0, 10) : "");
      if (json.draft) {
        const map: Record<string, string> = {};
        for (const line of json.draft.cadre_d) {
          map[line.key] = line.value ? String(line.value / 100) : "";
        }
        setCharges({
          total_charges: map.total_charges || "",
          salaires_formateurs: map.salaires_formateurs || "",
          achats_prestations_formation: map.achats_prestations_formation || "",
        });
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur BPF");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const saveCharges = async () => {
    if (!draft) return;
    const entries = (
      Object.keys(BPF_CHARGE_LABELS) as Array<keyof typeof BPF_CHARGE_LABELS>
    ).map((kind) => ({
      kind,
      amount_ht_cents: Math.round(Number(charges[kind] || 0) * 100),
      label: BPF_CHARGE_LABELS[kind],
    }));
    const res = await fetch("/api/super-admin/crm/bpf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "save_charges",
        fiscal_year_start: draft.period.start,
        fiscal_year_end: draft.period.end,
        entries,
      }),
    });
    const json = await parseFetchJson<{ error?: string }>(res);
    if (!res.ok) {
      toast.error(json.error || "Enregistrement impossible");
      return;
    }
    toast.success("Charges Cadre D enregistrées");
    await load();
  };

  const saveSnapshot = async () => {
    const res = await fetch("/api/super-admin/crm/bpf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "snapshot" }),
    });
    const json = await parseFetchJson<{ error?: string; snapshot_id?: string }>(res);
    if (!res.ok) {
      toast.error(json.error || "Snapshot impossible");
      return;
    }
    toast.success("Brouillon sauvegardé");
  };

  const saveDeadline = async () => {
    const res = await fetch("/api/super-admin/crm/bpf", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set_deadline", deadline: deadline || null }),
    });
    if (!res.ok) {
      toast.error("Échéance non enregistrée");
      return;
    }
    toast.success("Échéance campagne enregistrée");
  };

  return (
    <div className="min-h-screen bg-[#0A0C1B] px-4 py-6 text-[#F3F4FA] md:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#A3A8C7]">Qualité et pilotage</p>
            <h1 className="mt-1 text-2xl font-bold">BPF — Bilan pédagogique et financier</h1>
            <p className="mt-1 text-sm text-[#A3A8C7]">
              Brouillon Cerfa 10443 à reporter sur Mon Activité Formation.
              {draft
                ? ` Exercice ${draft.period.start} → ${draft.period.end}.`
                : ""}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="border-[#262A4A] bg-transparent text-[#B7AEFF]"
              onClick={() => window.open("/api/super-admin/crm/bpf?format=pdf", "_blank")}
            >
              Export PDF
            </Button>
            <Button
              variant="outline"
              className="border-[#262A4A] bg-transparent text-[#B7AEFF]"
              onClick={() => window.open("/api/super-admin/crm/bpf?format=csv", "_blank")}
            >
              Export CSV
            </Button>
            <Button className="bg-[#6C5CF5] text-white" onClick={() => void saveSnapshot()}>
              Sauver brouillon
            </Button>
          </div>
        </header>

        {loading || !draft ? (
          <p className="text-sm text-[#A3A8C7]">Calcul du brouillon…</p>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#262A4A] bg-[#141731] px-4 py-3 text-sm">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                  draft.anomalies.length
                    ? "bg-amber-500/20 text-amber-200"
                    : "bg-emerald-500/20 text-emerald-200"
                }`}
              >
                {draft.anomalies.length
                  ? `${draft.anomalies.length} anomalie(s)`
                  : "Complet"}
              </span>
              <span className="text-[#A3A8C7]">
                Produits {(draft.totals.products_ht_cents / 100).toLocaleString("fr-FR")} € HT ·
                Heures-stagiaires {draft.totals.learner_hours.toFixed(1)} h
              </span>
              <div className="ml-auto flex items-center gap-2">
                <Input
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                  className="w-auto border-[#262A4A] bg-[#0A0C1B] text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="border-[#262A4A] bg-transparent"
                  onClick={() => void saveDeadline()}
                >
                  Échéance campagne
                </Button>
              </div>
            </div>

            {draft.anomalies.length > 0 ? (
              <section className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4">
                <h2 className="text-sm font-semibold text-amber-100">Anomalies</h2>
                <ul className="mt-2 space-y-1 text-sm text-amber-50/90">
                  {draft.anomalies.map((a, i) => (
                    <li key={`${a.code}-${i}`}>
                      {a.href ? (
                        <Link href={a.href} className="underline decoration-amber-200/50">
                          {a.message}
                        </Link>
                      ) : (
                        a.message
                      )}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="rounded-2xl border border-[#262A4A] bg-[#141731] p-4">
              <h2 className="text-sm font-semibold">Cadre D — Charges (saisie)</h2>
              <div className="mt-3 grid gap-3 md:grid-cols-3">
                {(Object.keys(BPF_CHARGE_LABELS) as Array<keyof typeof BPF_CHARGE_LABELS>).map(
                  (key) => (
                    <div key={key} className="space-y-1">
                      <p className="text-xs text-[#A3A8C7]">{BPF_CHARGE_LABELS[key]}</p>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="€ HT"
                        value={charges[key]}
                        onChange={(e) => setCharges((c) => ({ ...c, [key]: e.target.value }))}
                        className="border-[#262A4A] bg-[#0A0C1B]"
                      />
                    </div>
                  ),
                )}
              </div>
              <Button
                className="mt-3 bg-[#6C5CF5] text-white"
                onClick={() => void saveCharges()}
              >
                Enregistrer les charges
              </Button>
            </section>

            <div className="grid gap-4 lg:grid-cols-2">
              <section className="rounded-2xl border border-[#262A4A] bg-[#141731] p-4 text-sm">
                <h2 className="font-semibold">Cadre A / B — Identification</h2>
                <dl className="mt-3 space-y-1 text-[#A3A8C7]">
                  {Object.entries({ ...draft.cadre_a, ...draft.cadre_b }).map(([k, v]) => (
                    <div key={k} className="flex justify-between gap-2">
                      <dt>{k}</dt>
                      <dd className="text-[#F3F4FA]">{v || "—"}</dd>
                    </div>
                  ))}
                </dl>
              </section>
              <CadreBlock title="Cadre C — Produits HT" lines={draft.cadre_c} onSelect={setSelected} />
              <CadreBlock title="Cadre D — Charges" lines={draft.cadre_d} onSelect={setSelected} />
              <CadreBlock title="Cadre E — Intervenants" lines={draft.cadre_e} onSelect={setSelected} />
              <CadreBlock title="Cadre F-1 — Stagiaires" lines={draft.cadre_f1} onSelect={setSelected} />
              <CadreBlock title="Cadre F-2 — Confiée" lines={draft.cadre_f2} onSelect={setSelected} />
              <CadreBlock title="Cadre F-3 — Objectifs" lines={draft.cadre_f3} onSelect={setSelected} />
              <CadreBlock title="Cadre F-4 — NSF" lines={draft.cadre_f4} onSelect={setSelected} />
              <CadreBlock title="Cadre G — Sous-traitance reçue" lines={draft.cadre_g} onSelect={setSelected} />
            </div>

            {selected ? (
              <section className="rounded-2xl border border-[#6C5CF5]/40 bg-[#141731] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h2 className="font-semibold">{selected.label}</h2>
                    <p className="text-sm text-[#B7AEFF]">{formatLine(selected)}</p>
                  </div>
                  <button
                    type="button"
                    className="text-sm text-[#A3A8C7]"
                    onClick={() => setSelected(null)}
                  >
                    Fermer
                  </button>
                </div>
                <ul className="mt-3 max-h-64 space-y-1 overflow-y-auto text-sm">
                  {selected.sources.length === 0 ? (
                    <li className="text-[#A3A8C7]">Aucune source détaillée</li>
                  ) : (
                    selected.sources.map((s) => (
                      <li key={`${s.id}-${s.label}`} className="flex justify-between gap-2">
                        {s.href ? (
                          <Link href={s.href} className="text-[#B7AEFF] underline">
                            {s.label}
                          </Link>
                        ) : (
                          <span>{s.label}</span>
                        )}
                        <span className="text-[#A3A8C7]">
                          {s.amount != null
                            ? selected.unit === "eur_ht"
                              ? euros(s.amount)
                              : selected.unit === "hours"
                                ? `${s.amount} h`
                                : s.amount
                            : ""}
                        </span>
                      </li>
                    ))
                  )}
                </ul>
              </section>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}
