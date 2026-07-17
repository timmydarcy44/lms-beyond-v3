"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Download, Loader2, Mail, Plus, Trash2, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  JessicaSuperCard,
  JessicaSuperPage,
} from "@/components/jessica-contentin/super/jessica-super-ui";
import {
  buildJessicaInvoiceEmailBodyText,
  buildJessicaInvoiceEmailSubject,
} from "@/lib/jessica-contentin/jessica-invoice-email-shared";
import { downloadJessicaInvoicePdf } from "@/lib/jessica-contentin/jessica-invoice-pdf";
import {
  JESSICA_INVOICE_SECTION_TITLE_DEFAULT,
  JESSICA_PRESTATION_OPTIONS,
  emptyInvoiceLine,
  linesTotalCents,
  storedInvoiceToPdfInput,
  type JessicaInvoiceLineItem,
  type JessicaPrestationType,
  type JessicaStoredInvoice,
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

function priceCentsToDraft(cents: number): string {
  if (!Number.isFinite(cents) || cents <= 0) return "";
  const euros = cents / 100;
  return Number.isInteger(euros) ? String(euros) : euros.toFixed(2).replace(/\.?0+$/, "") || String(euros);
}

function parsePriceDraft(raw: string): number | null {
  const cleaned = raw.trim().replace(/\s/g, "").replace(",", ".");
  if (!cleaned) return 0;
  const v = Number(cleaned);
  if (!Number.isFinite(v) || v < 0) return null;
  return Math.round(v * 100);
}

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
  const [priceDrafts, setPriceDrafts] = useState<string[]>(() =>
    [emptyInvoiceLine()].map((l) => priceCentsToDraft(l.unit_price_cents)),
  );
  const [creating, setCreating] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [invoices, setInvoices] = useState(initialInvoices);

  const [sendOpen, setSendOpen] = useState(false);
  const [sendInvoiceDraft, setSendInvoiceDraft] = useState<StoredInvoice | null>(null);
  const [sendTo, setSendTo] = useState("");
  const [sendSubject, setSendSubject] = useState("");
  const [sendBody, setSendBody] = useState("");

  const selected = sortedClients.find((c) => c.id === clientId) ?? null;
  const totalEuros = linesTotalCents(lines) / 100;

  useEffect(() => {
    setPriceDrafts((prev) => {
      if (prev.length === lines.length) return prev;
      return lines.map((l, i) => prev[i] ?? priceCentsToDraft(l.unit_price_cents));
    });
  }, [lines.length]);

  const updateLine = (index: number, patch: Partial<JessicaInvoiceLineItem>) => {
    setLines((prev) => prev.map((l, i) => (i === index ? { ...l, ...patch } : l)));
    if (patch.unit_price_cents != null) {
      setPriceDrafts((prev) =>
        prev.map((d, i) => (i === index ? priceCentsToDraft(patch.unit_price_cents!) : d)),
      );
    }
  };

  const commitPriceDraft = (index: number) => {
    const cents = parsePriceDraft(priceDrafts[index] ?? "");
    if (cents == null) {
      setPriceDrafts((prev) =>
        prev.map((d, i) => (i === index ? priceCentsToDraft(lines[index]?.unit_price_cents ?? 0) : d)),
      );
      return;
    }
    updateLine(index, { unit_price_cents: cents });
    setPriceDrafts((prev) => prev.map((d, i) => (i === index ? priceCentsToDraft(cents) : d)));
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

  const openSendOverlay = (invoice: StoredInvoice) => {
    if (!invoice.client_email?.trim()) {
      toast.error("Ce client n'a pas d'adresse email");
      return;
    }
    const stored = invoice as unknown as JessicaStoredInvoice;
    setSendInvoiceDraft(invoice);
    setSendTo(invoice.client_email.trim());
    setSendSubject(buildJessicaInvoiceEmailSubject(stored));
    setSendBody(buildJessicaInvoiceEmailBodyText(stored));
    setSendOpen(true);
  };

  const confirmSendInvoice = async () => {
    if (!sendInvoiceDraft) return;
    const to = sendTo.trim();
    if (!to || !to.includes("@")) {
      toast.error("Adresse email invalide");
      return;
    }
    if (!sendSubject.trim() || !sendBody.trim()) {
      toast.error("Objet et message sont requis");
      return;
    }

    setSendingId(sendInvoiceDraft.id);
    try {
      const res = await fetch(`/api/admin/jessica-invoices/${sendInvoiceDraft.id}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: to,
          subject: sendSubject.trim(),
          body_text: sendBody.trim(),
        }),
      });
      const json = (await res.json()) as { error?: string; sentTo?: string };
      if (!res.ok) throw new Error(json.error ?? "Envoi impossible");
      toast.success(`Facture envoyée à ${json.sentTo ?? to}`);
      setSendOpen(false);
      setSendInvoiceDraft(null);
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
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <h2 className="text-base font-semibold text-black">Créer une facture</h2>
          </div>
          <Button type="button" size="sm" variant="outline" asChild>
            <a href="/super/jessica-crm/new">
              <UserPlus className="mr-1.5 h-3.5 w-3.5" />
              Nouveau client
            </a>
          </Button>
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
                onClick={() => {
                  const next = emptyInvoiceLine();
                  setLines((prev) => [...prev, next]);
                  setPriceDrafts((prev) => [...prev, priceCentsToDraft(next.unit_price_cents)]);
                }}
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
                      onClick={() => {
                        setLines((prev) => prev.filter((_, i) => i !== index));
                        setPriceDrafts((prev) => prev.filter((_, i) => i !== index));
                      }}
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
                          prev.map((l, i) => {
                            if (i !== index) return l;
                            const next = applyPrestationChange(l, type, formations);
                            setPriceDrafts((drafts) =>
                              drafts.map((d, di) =>
                                di === index ? priceCentsToDraft(next.unit_price_cents) : d,
                              ),
                            );
                            return next;
                          }),
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
                          const cents = Math.round(f.priceEuros * 100) || line.unit_price_cents;
                          updateLine(index, {
                            formation_id: f.id,
                            designation: f.title,
                            unit_price_cents: cents,
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
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={priceDrafts[index] ?? ""}
                      onChange={(e) => {
                        const raw = e.target.value;
                        if (raw !== "" && !/^[\d\s.,]*$/.test(raw)) return;
                        setPriceDrafts((prev) => prev.map((d, i) => (i === index ? raw : d)));
                        const cents = parsePriceDraft(raw);
                        if (cents != null) {
                          setLines((prev) =>
                            prev.map((l, i) => (i === index ? { ...l, unit_price_cents: cents } : l)),
                          );
                        }
                      }}
                      onBlur={() => commitPriceDraft(index)}
                      className={jessicaSuper.input}
                      placeholder="ex. 90 ou 90,50"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Quantité</Label>
                    <Input
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      value={line.quantity || ""}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "");
                        if (!raw) {
                          updateLine(index, { quantity: 1 });
                          return;
                        }
                        const v = Number(raw);
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
                        ? "Préparer et envoyer par email"
                        : "Client sans adresse email"
                    }
                    onClick={() => openSendOverlay(inv)}
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

      <Dialog
        open={sendOpen}
        onOpenChange={(open) => {
          if (!open && sendingId) return;
          setSendOpen(open);
          if (!open) setSendInvoiceDraft(null);
        }}
      >
        <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto border-black/10 bg-white text-black sm:rounded-2xl">
          <DialogHeader>
            <DialogTitle>Envoyer la facture</DialogTitle>
          </DialogHeader>
          {sendInvoiceDraft ? (
            <div className="space-y-4 py-2">
              <p className="text-sm text-neutral-600">
                {sendInvoiceDraft.invoice_number} · {(sendInvoiceDraft.amount_cents / 100).toFixed(2)} €
                <span className="block text-xs text-neutral-400">Le PDF sera joint automatiquement.</span>
              </p>
              <div className="space-y-1.5">
                <Label>Destinataire</Label>
                <Input
                  type="email"
                  value={sendTo}
                  onChange={(e) => setSendTo(e.target.value)}
                  className={jessicaSuper.input}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Objet</Label>
                <Input
                  value={sendSubject}
                  onChange={(e) => setSendSubject(e.target.value)}
                  className={jessicaSuper.input}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Message (vouvoiement)</Label>
                <Textarea
                  value={sendBody}
                  onChange={(e) => setSendBody(e.target.value)}
                  rows={12}
                  className={cn(jessicaSuper.input, "min-h-[220px] resize-y font-serif text-[15px] leading-relaxed")}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={Boolean(sendingId)}
              onClick={() => setSendOpen(false)}
            >
              Annuler
            </Button>
            <Button
              type="button"
              className={jessicaSuper.cta}
              disabled={Boolean(sendingId)}
              onClick={() => void confirmSendInvoice()}
            >
              {sendingId ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Mail className="mr-2 h-4 w-4" />
              )}
              Confirmer l&apos;envoi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </JessicaSuperPage>
  );
}
