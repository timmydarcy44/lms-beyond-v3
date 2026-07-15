"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  JessicaSuperCard,
  JessicaSuperPage,
} from "@/components/jessica-contentin/super/jessica-super-ui";
import { downloadJessicaInvoicePdf } from "@/lib/jessica-contentin/jessica-invoice-pdf";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";
import { cn } from "@/lib/utils";

export type JessicaInvoiceClientOption = {
  id: string;
  label: string;
  email: string | null;
};

type StoredInvoice = {
  id: string;
  invoice_number: string;
  client_label: string;
  client_email: string | null;
  amount_cents: number;
  designation: string;
  payment_method: string;
  invoice_date: string;
  consultation_date: string | null;
  created_at: string;
};

export function JessicaFacturesClient({
  clients,
  initialInvoices,
}: {
  clients: JessicaInvoiceClientOption[];
  initialInvoices: StoredInvoice[];
}) {
  const sortedClients = useMemo(
    () => [...clients].sort((a, b) => a.label.localeCompare(b.label, "fr")),
    [clients],
  );

  const [clientId, setClientId] = useState("");
  const [amount, setAmount] = useState("90");
  const [creating, setCreating] = useState(false);
  const [invoices, setInvoices] = useState(initialInvoices);

  const selected = sortedClients.find((c) => c.id === clientId) ?? null;

  const createInvoice = async () => {
    if (!selected) {
      toast.error("Choisissez un client");
      return;
    }
    const parsed = Number(amount.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      toast.error("Montant invalide");
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
          amount: parsed,
        }),
      });
      const json = (await res.json()) as { invoice?: StoredInvoice; error?: string };
      if (!res.ok || !json.invoice) throw new Error(json.error ?? "Création impossible");

      const invoice = json.invoice;
      downloadJessicaInvoicePdf({
        invoiceNumber: invoice.invoice_number,
        clientLabel: invoice.client_label,
        amountEuros: invoice.amount_cents / 100,
        invoiceDate: new Date(invoice.invoice_date),
        consultationDate: new Date(invoice.consultation_date ?? invoice.invoice_date),
        paymentMethod: invoice.payment_method,
        designation: invoice.designation,
      });

      setInvoices((prev) => [invoice, ...prev]);
      toast.success(`Facture ${invoice.invoice_number} générée`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Création impossible");
    } finally {
      setCreating(false);
    }
  };

  const redownload = (invoice: StoredInvoice) => {
    downloadJessicaInvoicePdf({
      invoiceNumber: invoice.invoice_number,
      clientLabel: invoice.client_label,
      amountEuros: invoice.amount_cents / 100,
      invoiceDate: new Date(invoice.invoice_date),
      consultationDate: new Date(invoice.consultation_date ?? invoice.invoice_date),
      paymentMethod: invoice.payment_method,
      designation: invoice.designation,
    });
  };

  return (
    <JessicaSuperPage
      title="Factures"
      subtitle="Créer une facture acquittée à partir d'un client CRM"
      narrow
    >
      <JessicaSuperCard className="mb-8">
        <div className="mb-4 flex items-center gap-2">
          <Plus className="h-4 w-4" />
          <h2 className="text-base font-semibold text-black">Créer une facture</h2>
        </div>

        <div className="space-y-4">
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
            <Label>Montant (€)</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className={jessicaSuper.input}
            />
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
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => redownload(inv)}
                >
                  <Download className="mr-1.5 h-3.5 w-3.5" />
                  PDF
                </Button>
              </li>
            ))}
          </ul>
        )}
      </JessicaSuperCard>
    </JessicaSuperPage>
  );
}
