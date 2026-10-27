"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { followUpLabel } from "@/lib/expert/care-client-fields";
import { careTestTitle, describeCareAnswers } from "@/lib/expert/care-result-view";
import { AppleSuccessOverlay } from "@/components/expert/apple-success-overlay";
import { EmptyState, ExpertPageFrame, ExpertPageHeader, ExpertPrimaryButton } from "@/components/expert/expert-ui";

type Client = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  address_line?: string | null;
  postal_code?: string | null;
  city?: string | null;
  follow_up?: string | null;
  child_one_first_name?: string | null;
  child_one_last_name?: string | null;
  child_two_first_name?: string | null;
  child_two_last_name?: string | null;
  notes?: string | null;
};

type ResponseRow = {
  id: string;
  test_slug: string;
  score: number | null;
  score_label: string | null;
  synthesis: string | null;
  answers: Record<string, unknown> | null;
  submitted_at: string;
};

type Invite = {
  id: string;
  test_slug: string;
  sent_at: string | null;
  completed_at: string | null;
};

export function CareClientFiche({ clientId }: { clientId: string }) {
  const [client, setClient] = useState<Client | null>(null);
  const [responses, setResponses] = useState<ResponseRow[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const load = async () => {
    const res = await fetch(`/api/expert/care/clients/${clientId}`, { cache: "no-store" });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Fiche introuvable");
      return;
    }
    setClient(json.client);
    setResponses(json.responses ?? []);
    setInvites(json.invites ?? []);
    setError(json.error ?? null);
    if (!openId && json.responses?.[0]?.id) setOpenId(json.responses[0].id);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

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
      setSuccess("Synthèse générée");
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Synthèse impossible");
    } finally {
      setBusy(false);
    }
  };

  if (error && !client) {
    return (
      <ExpertPageFrame>
        <ExpertPageHeader title="Fiche client" subtitle={error} action={<ExpertPrimaryButton href="/dashboard/expert/dossiers">Retour au CRM</ExpertPrimaryButton>} />
      </ExpertPageFrame>
    );
  }

  if (!client) {
    return (
      <ExpertPageFrame>
        <ExpertPageHeader title="Fiche client" subtitle="Chargement…" />
      </ExpertPageFrame>
    );
  }

  const name = [client.first_name, client.last_name].filter(Boolean).join(" ").trim() || client.email;
  const address = [client.address_line, [client.postal_code, client.city].filter(Boolean).join(" ")].filter(Boolean).join(", ");

  return (
    <ExpertPageFrame>
      <AppleSuccessOverlay open={Boolean(success)} title={success ?? ""} onClose={() => setSuccess(null)} />
      <ExpertPageHeader
        title={name}
        subtitle="Fiche de renseignement et résultats des tests Byound Care"
        action={<ExpertPrimaryButton href="/dashboard/expert/dossiers">Retour au CRM</ExpertPrimaryButton>}
      />

      <section className="rounded-[28px] bg-[#12141A] p-6">
        <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#9096A3]">Identité</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div><dt className="text-[#9096A3]">Prénom</dt><dd className="font-extrabold">{client.first_name || "—"}</dd></div>
          <div><dt className="text-[#9096A3]">Nom</dt><dd className="font-extrabold">{client.last_name || "—"}</dd></div>
          <div><dt className="text-[#9096A3]">Adresse e-mail</dt><dd className="font-extrabold">{client.email}</dd></div>
          <div><dt className="text-[#9096A3]">Téléphone</dt><dd className="font-extrabold">{client.phone || "—"}</dd></div>
          <div className="sm:col-span-2"><dt className="text-[#9096A3]">Adresse postale</dt><dd className="font-extrabold">{address || "—"}</dd></div>
          {followUpLabel(client) ? (
            <div className="sm:col-span-2"><dt className="text-[#9096A3]">Suivi</dt><dd className="font-extrabold">{followUpLabel(client)}</dd></div>
          ) : null}
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          <Link href="/dashboard/expert/tests" className="rounded-full bg-[#1E2130] px-4 py-2 text-xs font-extrabold">
            Envoyer un test
          </Link>
          <Link href="/dashboard/expert/facturation" className="rounded-full bg-[#F4F5F7] px-4 py-2 text-xs font-extrabold text-[#07080B]">
            Créer une facture
          </Link>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold">Résultats des tests</h2>
            <p className="mt-1 text-sm text-[#B5BAC6]">
              {responses.length ? `${responses.length} test${responses.length > 1 ? "s" : ""} reçu${responses.length > 1 ? "s" : ""}` : "Aucun test complété pour l’instant."}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void makeSynthesis()}
            disabled={busy || responses.length === 0}
            className="h-11 rounded-full bg-[#1E2130] px-5 text-sm font-extrabold disabled:opacity-40"
          >
            {busy ? "Synthèse…" : "Synthèse OpenAI"}
          </button>
        </div>

        {responses.length === 0 ? (
          <EmptyState
            title="Pas encore de résultat"
            text={invites.length ? "Le test a été envoyé. Dès qu’il sera complété, le score et les réponses apparaîtront ici." : "Envoyez un test depuis Byound tests."}
          />
        ) : (
          <div className="space-y-3">
            {responses.map((row) => {
              const items = describeCareAnswers(row.test_slug, row.answers);
              const open = openId === row.id;
              const when = new Date(row.submitted_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              });
              return (
                <article key={row.id} className="rounded-[24px] bg-[#12141A] p-5">
                  <button type="button" className="flex w-full items-start justify-between gap-4 text-left" onClick={() => setOpenId(open ? null : row.id)}>
                    <span>
                      <span className="block text-lg font-extrabold">{careTestTitle(row.test_slug)}</span>
                      <span className="mt-1 block text-sm text-[#B5BAC6]">{when}</span>
                    </span>
                    <span className="rounded-full bg-[#FF4B4B] px-3 py-1 text-xs font-extrabold text-[#04140C]">
                      {row.score_label || (row.score != null ? String(row.score) : "Complété")}
                    </span>
                  </button>
                  {row.synthesis ? <p className="mt-4 whitespace-pre-wrap text-sm leading-6 text-[#DADDE4]">{row.synthesis}</p> : null}
                  {open ? (
                    <ul className="mt-4 space-y-3 border-t border-[#1E2130] pt-4">
                      {items.length === 0 ? (
                        <li className="text-sm text-[#9096A3]">Les réponses ont été enregistrées, sans détail affichable.</li>
                      ) : (
                        items.map((item) => (
                          <li key={item.question} className="text-sm">
                            <p className="text-[#9096A3]">{item.question}</p>
                            <p className="mt-1 font-extrabold">{item.answer}</p>
                          </li>
                        ))
                      )}
                    </ul>
                  ) : (
                    <p className="mt-3 text-xs font-semibold text-[#9096A3]">Voir les réponses</p>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>
    </ExpertPageFrame>
  );
}
