"use client";

import { useEffect, useState } from "react";

type Summary = {
  title: string;
  client_name: string;
  exchange_date: string | null;
  validated: boolean;
  client_validated_at: string | null;
};

function fmt(date: string | null) {
  if (!date) return null;
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? date : d.toLocaleDateString("fr-FR");
}

export function BesoinValiderClient({ token }: { token: string }) {
  const [status, setStatus] = useState<"loading" | "ready" | "done" | "error">("loading");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/besoin/valider/${encodeURIComponent(token)}`);
        const json = (await res.json().catch(() => null)) as (Summary & { error?: string }) | null;
        if (!res.ok || !json) {
          setStatus("error");
          setMessage(json?.error || "Lien invalide ou expiré.");
          return;
        }
        setSummary(json);
        if (json.validated) {
          setStatus("done");
          setMessage(
            `Cette analyse a déjà été validée${
              json.client_validated_at ? ` le ${fmt(json.client_validated_at)}` : ""
            }. Merci.`,
          );
        } else {
          setStatus("ready");
        }
      } catch {
        setStatus("error");
        setMessage("Impossible de charger le lien.");
      }
    })();
  }, [token]);

  async function validate() {
    setBusy(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/besoin/valider/${encodeURIComponent(token)}`, {
        method: "POST",
      });
      const json = (await res.json().catch(() => null)) as { error?: string } | null;
      if (!res.ok) throw new Error(json?.error || "Validation impossible");
      setStatus("done");
      setMessage("Merci, votre validation a bien été enregistrée.");
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Erreur");
      setStatus("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#F6F4F2] px-4 py-10 text-[#0A0F1E]">
      <section className="w-full max-w-md rounded-[28px] border border-[#E8E4E1] bg-white p-8 shadow-sm">
        <p className="text-[12px] font-bold uppercase tracking-wide text-[#CE0058]">Byound</p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Validation de l’analyse du besoin</h1>

        {summary ? (
          <div className="mt-4 rounded-2xl bg-[#F6F4F2] px-4 py-3 text-sm text-[#5C615C]">
            <p className="font-semibold text-[#0A0F1E]">{summary.title || "Analyse du besoin"}</p>
            <p>{summary.client_name}</p>
            {summary.exchange_date ? <p>Échange du {fmt(summary.exchange_date)}</p> : null}
          </div>
        ) : null}

        <p className="mt-3 text-sm leading-relaxed text-[#5C615C]">
          En validant, vous confirmez que le document reçu par e-mail reflète correctement votre
          besoin de formation tel qu’échangé avec Byound.
        </p>

        {status === "loading" ? (
          <p className="mt-6 text-sm text-[#5C615C]">Vérification du lien…</p>
        ) : null}

        {status === "error" ? (
          <p className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{message}</p>
        ) : null}

        {status === "done" ? (
          <p className="mt-6 rounded-2xl bg-[#CE0058]/10 px-4 py-3 text-sm text-[#0A0F1E]">
            {message}
          </p>
        ) : null}

        {status === "ready" ? (
          <button
            type="button"
            disabled={busy}
            className="mt-6 w-full rounded-full bg-[#CE0058] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            onClick={() => void validate()}
          >
            {busy ? "Enregistrement…" : "Je valide l’analyse du besoin"}
          </button>
        ) : null}
      </section>
    </main>
  );
}
