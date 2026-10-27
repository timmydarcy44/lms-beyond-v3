"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { BYOUND_CARE_TESTS } from "@/lib/expert/care-tests";
import { EmptyState, ExpertPageFrame, ExpertPageHeader, ExpertPrimaryButton } from "@/components/expert/expert-ui";

type Client = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  notes: string | null;
};

type Invite = { id: string; client_id: string; test_slug: string; sent_at: string | null; completed_at: string | null };
type Invoice = { id: string; client_id: string; designation: string; amount_cents: number; status: string; sent_at: string | null };
type ResponseRow = { id: string; client_id: string; test_slug: string; score_label: string | null; synthesis: string | null; submitted_at: string };

const field = "h-12 w-full rounded-2xl border border-[#1E2130] bg-[#12141A] px-4 text-sm text-[#F4F5F7] outline-none";

function labelOf(client: Client) {
  return [client.first_name, client.last_name].filter(Boolean).join(" ").trim() || client.email;
}

export function CareCrmBoard({ mode }: { mode: "crm" | "tests" | "factures" }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [clientId, setClientId] = useState("");
  const [testSlug, setTestSlug] = useState(BYOUND_CARE_TESTS[0].slug);
  const [amount, setAmount] = useState("");
  const [designation, setDesignation] = useState("Prestation Byound Care");
  const [synthesis, setSynthesis] = useState("");
  const [busy, setBusy] = useState(false);

  const load = async () => {
    const [c, t, i, r] = await Promise.all([
      fetch("/api/expert/care/clients").then((res) => res.json()),
      fetch("/api/expert/care/tests").then((res) => res.json()),
      fetch("/api/expert/care/invoices").then((res) => res.json()),
      fetch("/api/expert/care/synthese").then((res) => res.json()),
    ]);
    setClients(c.clients ?? []);
    setInvites(t.invites ?? []);
    setInvoices(i.invoices ?? []);
    setResponses(r.responses ?? []);
    setHint(c.error || t.error || i.error || r.error || null);
    if (!clientId && c.clients?.[0]?.id) setClientId(c.clients[0].id);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addClient = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/expert/care/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ first_name: first, last_name: last, email, phone }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Création impossible");
      toast.success("Membre ajouté au CRM");
      setFirst("");
      setLast("");
      setEmail("");
      setPhone("");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Création impossible");
    } finally {
      setBusy(false);
    }
  };

  const sendTest = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/expert/care/tests/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, testSlug }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Envoi impossible");
      toast.success(json.emailed ? "Test envoyé" : `Lien créé${json.emailError ? ` — ${json.emailError}` : ""}`);
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible");
    } finally {
      setBusy(false);
    }
  };

  const sendInvoice = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/expert/care/invoices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, amount, designation }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Envoi impossible");
      if (json.sampleMissing) toast.message("Facture enregistrée. Déposez un PDF dans Documents > Factures (ou public/documents/facture-exemple.pdf).");
      else toast.success(json.emailed ? "Facture envoyée" : json.emailError ?? "Facture enregistrée");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible");
    } finally {
      setBusy(false);
    }
  };

  const makeSynthesis = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/expert/care/synthese", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Synthèse impossible");
      setSynthesis(json.synthesis ?? "");
      toast.success("Synthèse générée");
      await load();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Synthèse impossible");
    } finally {
      setBusy(false);
    }
  };

  const titles: Record<typeof mode, { title: string; subtitle: string }> = {
    crm: { title: "CRM", subtitle: "Vos membres Byound Care, isolés de ceux des autres experts." },
    tests: { title: "Byound tests", subtitle: "MAI, soft skills et stress académique — envoi depuis le CRM, réponses conservées, synthèse OpenAI." },
    factures: { title: "Facturation", subtitle: "Envoi d'une facture à un membre. Le modèle se lit dans Documents > Factures, ou public/documents/facture-exemple.pdf." },
  };

  return (
    <ExpertPageFrame>
      <ExpertPageHeader title={titles[mode].title} subtitle={titles[mode].subtitle} />
      {hint ? <p className="mb-6 rounded-[24px] bg-[#12141A] p-4 text-sm text-[#FFB4B8]">{hint}</p> : null}

      {mode === "crm" ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={field} placeholder="Prénom" value={first} onChange={(event) => setFirst(event.target.value)} />
            <input className={field} placeholder="Nom" value={last} onChange={(event) => setLast(event.target.value)} />
            <input className={field} placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} />
            <input className={field} placeholder="Téléphone" value={phone} onChange={(event) => setPhone(event.target.value)} />
          </div>
          <ExpertPrimaryButton onClick={() => void addClient()}>{busy ? "Enregistrement…" : "Ajouter au CRM"}</ExpertPrimaryButton>
          {clients.length === 0 ? (
            <EmptyState title="Aucun membre" text="Ajoutez un premier contact pour envoyer tests et factures." />
          ) : (
            <ul className="space-y-2">
              {clients.map((client) => (
                <li key={client.id} className="rounded-[24px] bg-[#12141A] p-4">
                  <p className="font-extrabold">{labelOf(client)}</p>
                  <p className="text-sm text-[#B5BAC6]">{client.email}{client.phone ? ` · ${client.phone}` : ""}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}

      {mode === "tests" ? (
        <div className="space-y-6">
          <div className="grid gap-3 sm:grid-cols-2">
            <select className={field} value={clientId} onChange={(event) => setClientId(event.target.value)} aria-label="Membre CRM">
              <option value="">Choisir un membre</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>{labelOf(client)}</option>
              ))}
            </select>
            <select className={field} value={testSlug} onChange={(event) => setTestSlug(event.target.value)} aria-label="Test">
              {BYOUND_CARE_TESTS.map((test) => (
                <option key={test.slug} value={test.slug}>{test.title}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-wrap gap-2">
            <ExpertPrimaryButton onClick={() => void sendTest()}>{busy ? "Envoi…" : "Envoyer le test"}</ExpertPrimaryButton>
            <button type="button" onClick={() => void makeSynthesis()} className="h-11 rounded-full bg-[#1E2130] px-5 text-sm font-extrabold">
              Synthèse OpenAI
            </button>
          </div>
          {synthesis ? <p className="whitespace-pre-wrap rounded-[24px] bg-[#12141A] p-5 text-sm leading-6">{synthesis}</p> : null}
          <div className="grid gap-3 md:grid-cols-3">
            {BYOUND_CARE_TESTS.map((test) => (
              <article key={test.slug} className="rounded-[24px] bg-[#12141A] p-5">
                <p className="text-lg font-extrabold">{test.title}</p>
                <p className="mt-2 text-sm text-[#B5BAC6]">{test.description}</p>
                <p className="mt-3 text-xs text-[#9096A3]">{test.minutes} min</p>
              </article>
            ))}
          </div>
          <ul className="space-y-2">
            {invites.map((invite) => {
              const member = clients.find((item) => item.id === invite.client_id);
              const test = BYOUND_CARE_TESTS.find((item) => item.slug === invite.test_slug);
              return (
                <li key={invite.id} className="rounded-[24px] bg-[#12141A] p-4 text-sm">
                  <span className="font-extrabold">{test?.title ?? invite.test_slug}</span>
                  <span className="text-[#B5BAC6]"> · {member ? labelOf(member) : "Membre"} · {invite.completed_at ? "Complété" : "Envoyé"}</span>
                </li>
              );
            })}
          </ul>
          {responses.filter((row) => row.client_id === clientId && row.synthesis).slice(0, 1).map((row) => (
            <p key={row.id} className="whitespace-pre-wrap rounded-[24px] bg-[#12141A] p-5 text-sm leading-6">{row.synthesis}</p>
          ))}
        </div>
      ) : null}

      {mode === "factures" ? (
        <div className="space-y-6">
          <select className={field} value={clientId} onChange={(event) => setClientId(event.target.value)} aria-label="Membre CRM">
            <option value="">Choisir un membre</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>{labelOf(client)}</option>
            ))}
          </select>
          <input className={field} placeholder="Désignation" value={designation} onChange={(event) => setDesignation(event.target.value)} />
          <input className={field} placeholder="Montant (€)" value={amount} onChange={(event) => setAmount(event.target.value)} />
          <ExpertPrimaryButton onClick={() => void sendInvoice()}>{busy ? "Envoi…" : "Envoyer la facture"}</ExpertPrimaryButton>
          {invoices.length === 0 ? (
            <EmptyState title="Aucune facture" text="Déposez d'abord un PDF d'exemple dans Documents, dossier Factures." />
          ) : (
            <ul className="space-y-2">
              {invoices.map((invoice) => {
                const member = clients.find((item) => item.id === invoice.client_id);
                return (
                  <li key={invoice.id} className="rounded-[24px] bg-[#12141A] p-4 text-sm">
                    <span className="font-extrabold">{invoice.designation}</span>
                    <span className="text-[#B5BAC6]"> · {member ? labelOf(member) : "Membre"} · {invoice.status}{invoice.amount_cents ? ` · ${(invoice.amount_cents / 100).toLocaleString("fr-FR")} €` : ""}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : null}
    </ExpertPageFrame>
  );
}
