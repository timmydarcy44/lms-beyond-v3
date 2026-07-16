"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, Mail, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  JessicaSuperCard,
  JessicaSuperPage,
} from "@/components/jessica-contentin/super/jessica-super-ui";
import { downloadJessicaInvoicePdf } from "@/lib/jessica-contentin/jessica-invoice-pdf";
import {
  JESSICA_INVOICE_SECTION_TITLE_DEFAULT,
  JESSICA_PRESTATION_OPTIONS,
  emptyInvoiceLine,
  linesTotalCents,
  storedInvoiceToPdfInput,
  type JessicaInvoiceLineItem,
  type JessicaPrestationType,
} from "@/lib/jessica-contentin/jessica-invoice-shared";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";
import { cn } from "@/lib/utils";

export type JessicaInvoiceClientOption = {
  id: string;
  label: string;
  email: string | null;
};

export type JessicaFormationOption = {
  id: string;
  title: string;
  priceEuros: number;
};

type StoredInvoice = {
  id: string;
  invoice_number: string;
  client_label: string;
  client_email: string | null;
  amount_cents: number;
  designation: string;
  section_title?: string | null;
  line_items?: JessicaInvoiceLineItem[] | null;
  payment_method: string;
  invoice_date: string;
  consultation_date: string | null;
  created_at: string;
};

function applyPrestationChange(
  line: JessicaInvoiceLineItem,
  type: JessicaPrestationType,
  formations: JessicaFormationOption[],
): JessicaInvoiceLineItem {
  const opt = JESSICA_PRESTATION_OPTIONS.find((p) => p.value === type);
  const next: JessicaInvoiceLineItem = {
    ...line,
    prestation_type: type,
    custom_label: null,
    formation_id: null,
  };
  if (type === "autre") {
    next.designation = line.custom_label?.trim() || "";
    return next;
  }
  if (type === "formation") {
    const first = formations[0];
    if (first) {
      next.formation_id = first.id;
      next.designation = first.title;
      next.unit_price_cents = Math.round(first.priceEuros * 100) || line.unit_price_cents;
    } else {
      next.designation = "Formation";
    }
    return next;
  }
  next.designation = opt?.label ?? type;
  if (opt && opt.defaultPrice > 0) {
    next.unit_price_cents = Math.round(opt.defaultPrice * 100);
  }
  return next;
}

export function JessicaFacturesClient({
  clients,
  formations,
  initialInvoices,
}: {
  clients: JessicaInvoiceClientOption[];
  formations: JessicaFormationOption[];
  initialInvoices: StoredInvoice[];
}) {
  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.label.localeCompare(b.label, "fr")),
    [clients],
  );

  const [clientId, setClientId] = useState("");
  const [sectionTitle, setSectionTitle] = useState(JESSICA_INVOICE_SECTION_TITLE_DEFAULT);
  const [lines, setLines] = useState<JessicaInvoiceLineItem[]>([emptyInvoiceLine()]);
  const [creating, setCreating] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [invoices, setInvoices] = useState(initialInvoices);

  const selected = sortedClients.find((c) => c.id === clientId) ?? null;
  const totalEuros = linesTotalCents(lines) / 100;

  const updateLine = (index: number, patch: Partial<JessicaInvoiceLineItem>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
  };

  const createInvoice = async () => {
    if (!selected) {
      toast.error("Choisissez un client");
      return;
    }
    const validLines = lines.filter(
      (l) => l.designation.trim() && l.quantity > 0 && l.unit_price_cents > 0,
    );
    if (validLines.length === 0) {
      toast.error("Ajoutez au moins une prestation valide");
      return;
    }

    setCreating(true);
    try {
      const res = await fetch("/api/admin/jessica-invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_label: selected.label,
          client_email: selected.email,
          client_user_id: selected.id.startsWith("user:") ? selected.id.slice(5) : null,
          section_title: sectionTitle,
          line_items: validLines,
        }),
      });
      const json = (await res.json()) as { invoice?: StoredInvoice; error?: string };
      if (!res.ok || !json.invoice) throw new Error(json.error ?? "Création impossible");

      const invoice = json.invoice;
      downloadJessicaInvoicePdf(storedInvoiceToPdfInput(invoice));
      setInvoices((prev) => [invoice, ...prev]);
      toast.success(`Facture ${invoice.invoice_number} générée`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Création impossible");
    } finally {
      setCreating(false);
    }
  };

  const sendInvoice = async (invoice: StoredInvoice) => {
    if (!invoice.client_email?.trim()) {
      toast.error("Ce client n'a pas d'adresse email");
      return;
    }
    setSendingId(invoice.id);
    try {
      const res = await fetch(`/api/admin/jessica-invoices/${invoice.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const json = (await res.json()) as { error?: string; sentTo?: string };
      if (!res.ok) throw new Error(json.error ?? "Envoi impossible");
      toast.success(`Facture envoyée à ${json.sentTo ?? invoice.client_email}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Envoi impossible");
    } finally {
      setSendingId(null);
    }
  };

  return (
    <JessicaSuperPage
      title="Factures"
      subtitle="Créer une facture acquittée — prestations multiples, tarifs modifiables"
      narrow
    >
      <JessicaSuperCard className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <h2 className="text-base font-semibold text-black">Créer une facture</h2>
        </div>

        <div className="space-y-5">
          <div className="space-y-1.5">
            <Label>Client</Label>
            <select
              className={cn(jessicaSuper.input, "w-full")}
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
            >
              <option value="">Sélectionner un client…</option>
              {sortedClients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                  {c.email ? ` — ${c.email}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label>Titre de la facture</Label>
            <Input
              value={sectionTitle}
              onChange={(e) => setSectionTitle(e.target.value)}
              className={jessicaSuper.input}
              placeholder={JESSICA_INVOICE_SECTION_TITLE_DEFAULT}
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Prestations</Label>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setLines((prev) => [...prev, emptyInvoiceLine()])}
              >
                <Plus className="mr-1 h-3.5 w-3.5" />
                Ajouter une ligne
              </Button>
            </div>

            {lines.map((line, index) => (
              <div
                key={index}
                className="space-y-3 rounded-xl border border-black/[0.08] bg-neutral-50/80 p-4"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-neutral-500">
                    Ligne {index + 1}
                  </p>
                  {lines.length > 1 ? (
                    <button
                      type="button"
                      className="text-neutral-400 hover:text-rose-600"
                      onClick={() => setLines((prev) => prev.filter((_, i) => i !== index))}
                      aria-label="Supprimer la ligne"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Type de prestation</Label>
                    <select
                      className={cn(jessicaSuper.input, "w-full")}
                      value={line.prestation_type}
                      onChange={(e) => {
                        const type = e.target.value as JessicaPrestationType;
                        setLines((prev) =>
                          prev.map((l, i) =>
                            i === index ? applyPrestationChange(l, type, formations) : l,
                          ),
                        );
                      }}
                    >
                      {JESSICA_PRESTATION_OPTIONS.map((p) => (
                        <option key={p.value} value={p.value}>
                          {p.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {line.prestation_type === "formation" ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Formation</Label>
                      <select
                        className={cn(jessicaSuper.input, "w-full")}
                        value={line.formation_id ?? ""}
                        onChange={(e) => {
                          const f = formations.find((x) => x.id === e.target.value);
                          if (!f) return;
                          updateLine(index, {
                            formation_id: f.id,
                            designation: f.title,
                            unit_price_cents: Math.round(f.priceEuros * 100) || line.unit_price_cents,
                          });
                        }}
                      >
                        <option value="">Choisir une formation…</option>
                        {formations.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.title}
                            {f.priceEuros > 0 ? ` — ${f.priceEuros.toFixed(2)} €` : ""}
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : line.prestation_type === "autre" ? (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Libellé personnalisé</Label>
                      <Input
                        value={line.custom_label ?? line.designation}
                        onChange={(e) =>
                          updateLine(index, {
                            custom_label: e.target.value,
                            designation: e.target.value,
                          })
                        }
                        className={jessicaSuper.input}
                        placeholder="Saisir la prestation…"
                      />
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="text-xs">Désignation</Label>
                      <Input
                        value={line.designation}
                        onChange={(e) => updateLine(index, { designation: e.target.value })}
                        className={jessicaSuper.input}
                      />
                    </div>
                  )}
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Tarif unitaire (€)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={(line.unit_price_cents / 100).toFixed(2)}
                      onChange={(e) => {
                        const v = Number(e.target.value.replace(",", "."));
                        if (Number.isFinite(v) && v >= 0) {
                          updateLine(index, { unit_price_cents: Math.round(v * 100) });
                        }
                      }}
                      className={jessicaSuper.input}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Quantité</Label>
                    <Input
                      type="number"
                      min="1"
                      step="1"
                      value={line.quantity}
                      onChange={(e) => {
                        const v = Number(e.target.value);
                        if (Number.isFinite(v) && v >= 1) updateLine(index, { quantity: Math.round(v) });
                      }}
                      className={jessicaSuper.input}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Date</Label>
                    <Input
                      type="date"
                      value={line.service_date}
                      onChange={(e) => updateLine(index, { service_date: e.target.value })}
                      className={jessicaSuper.input}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-black/[0.06] bg-white px-4 py-3">
            <span className="text-sm font-medium text-neutral-600">Total TTC</span>
            <span className="text-lg font-semibold text-black">{totalEuros.toFixed(2)} €</span>
          </div>

          <Button
            type="button"
            className={jessicaSuper.cta}
            disabled={creating}
            onClick={() => void createInvoice()}
          >
            {creating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            Générer le PDF
          </Button>
        </div>
      </JessicaSuperCard>

      <JessicaSuperCard>
        <h2 className="mb-4 text-base font-semibold text-black">Dernières factures</h2>
        {invoices.length === 0 ? (
          <p className="text-sm text-neutral-500">Aucune facture pour le moment.</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {invoices.map((inv) => (
              <li key={inv.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-black">
                    {inv.invoice_number} · {inv.client_label}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {(inv.amount_cents / 100).toFixed(2)} € · {inv.invoice_date}
                    {inv.designation ? ` · ${inv.designation}` : ""}
                    {inv.client_email ? ` · ${inv.client_email}` : " · pas d'email"}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={!inv.client_email?.trim() || sendingId === inv.id}
                    title={
                      inv.client_email?.trim()
                        ? "Envoyer par email depuis contentin.cabinet@gmail.com"
                        : "Client sans adresse email"
                    }
                    onClick={() => void sendInvoice(inv)}
                  >
                    {sendingId === inv.id ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Mail className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Envoyer la facture
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => downloadJessicaInvoicePdf(storedInvoiceToPdfInput(inv))}
                  >
                    <Download className="mr-1.5 h-3.5 w-3.5" />
                    PDF
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </JessicaSuperCard>
    </JessicaSuperPage>
  );
}
