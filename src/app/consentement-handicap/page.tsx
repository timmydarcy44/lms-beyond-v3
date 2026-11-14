"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

function ConsentInner() {
  const params = useSearchParams();
  const token = String(params.get("token") ?? "").trim();
  const [status, setStatus] = useState<"loading" | "ready" | "done" | "error">("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Lien incomplet.");
      return;
    }
    void (async () => {
      const res = await fetch(`/api/handicap/consent?token=${encodeURIComponent(token)}`);
      const json = (await res.json().catch(() => null)) as {
        error?: string;
        consented?: boolean;
      } | null;
      if (!res.ok) {
        setStatus("error");
        setMessage(json?.error || "Lien invalide ou expiré.");
        return;
      }
      if (json?.consented) {
        setStatus("done");
        setMessage("Votre consentement est déjà enregistré. Merci.");
        return;
      }
      setStatus("ready");
    })();
  }, [token]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#F6F4F2] px-4 py-10 text-[#0A0F1E]">
      <section className="w-full max-w-md rounded-[28px] border border-[#E8E4E1] bg-white p-8 shadow-sm">
        <p className="text-[12px] font-bold uppercase tracking-wide text-[#CE0058]">
          Byound Handicap
        </p>
        <h1 className="mt-2 text-2xl font-extrabold tracking-tight">Consentement</h1>
        <p className="mt-3 text-sm leading-relaxed text-[#5C615C]">
          En confirmant, vous autorisez la référente handicap Byound à ouvrir et suivre un
          dossier d’aménagements. Aucune information médicale n’est demandée ici.
        </p>

        {status === "loading" ? (
          <p className="mt-6 text-sm text-[#5C615C]">Vérification du lien…</p>
        ) : null}

        {status === "error" ? (
          <p className="mt-6 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {message}
          </p>
        ) : null}

        {status === "done" ? (
          <p className="mt-6 rounded-2xl bg-[#CE0058]/08 px-4 py-3 text-sm text-[#0A0F1E]">
            {message || "Consentement enregistré. Merci."}
          </p>
        ) : null}

        {status === "ready" ? (
          <button
            type="button"
            disabled={busy}
            className="mt-6 w-full rounded-full bg-[#CE0058] px-4 py-3 text-sm font-bold text-white disabled:opacity-60"
            onClick={() => {
              void (async () => {
                setBusy(true);
                setMessage(null);
                try {
                  const res = await fetch("/api/handicap/consent", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ token }),
                  });
                  const json = (await res.json().catch(() => null)) as { error?: string } | null;
                  if (!res.ok) throw new Error(json?.error || "Échec");
                  setStatus("done");
                  setMessage("Consentement enregistré. Merci.");
                } catch (err) {
                  setMessage(err instanceof Error ? err.message : "Erreur");
                  setStatus("error");
                } finally {
                  setBusy(false);
                }
              })();
            }}
          >
            {busy ? "Enregistrement…" : "Je donne mon consentement"}
          </button>
        ) : null}
      </section>
    </main>
  );
}

export default function ConsentementHandicapPage() {
  return (
    <Suspense
      fallback={
        <main className="grid min-h-screen place-items-center bg-[#F6F4F2] text-sm text-[#5C615C]">
          Chargement…
        </main>
      }
    >
      <ConsentInner />
    </Suspense>
  );
}
