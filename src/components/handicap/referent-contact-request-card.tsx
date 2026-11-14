"use client";

import { useState } from "react";

/**
 * CTA RQTH / contact référente — espaces salarié & apprenant.
 * Crée/alimente un dossier disability_cases (onglet Demandes /handicap).
 */
export function ReferentContactRequestCard({
  audience = "apprenant",
}: {
  audience?: "apprenant" | "salarie";
}) {
  const [hasRqth, setHasRqth] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <div className="mb-6 rounded-2xl border border-[#CE0058]/25 bg-[#CE0058]/08 px-4 py-3 text-sm text-slate-900">
        Votre message a bien été transmis à la référente handicap, qui vous contactera sous
        72&nbsp;h.
      </div>
    );
  }

  return (
    <form
      className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        if (!hasRqth && !message.trim()) return;
        void (async () => {
          setBusy(true);
          setError(null);
          try {
            const res = await fetch("/api/handicap/request", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                contact_referent: true,
                has_rqth: hasRqth,
                message: message.trim() || null,
                accommodation_needed: true,
                needs_text: message.trim() || null,
              }),
            });
            const json = (await res.json().catch(() => null)) as { error?: string } | null;
            if (!res.ok) throw new Error(json?.error || "Envoi impossible");
            setDone(true);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Erreur");
          } finally {
            setBusy(false);
          }
        })();
      }}
    >
      <p className="text-sm font-bold text-slate-900">Référente handicap</p>
      <p className="mt-1 text-xs text-slate-500">
        {audience === "salarie"
          ? "Confidentiel. Déclarez une RQTH et écrivez un message — sans détail médical."
          : "Facultatif et confidentiel. Déclarez une RQTH et contactez la référente — sans détail médical."}
      </p>
      <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <input
          type="checkbox"
          checked={hasRqth}
          onChange={(e) => setHasRqth(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 accent-[#CE0058]"
        />
        Je dispose d&apos;une RQTH
      </label>
      {(hasRqth || message.length > 0) && (
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          placeholder="Votre message à la référente (besoins, disponibilités…)"
          className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
          required={hasRqth}
        />
      )}
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
      {hasRqth || message.trim() ? (
        <button
          type="submit"
          disabled={busy || (hasRqth && !message.trim())}
          className="mt-3 rounded-full bg-[#CE0058] px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {busy ? "Envoi…" : "Prendre contact avec la référente handicap"}
        </button>
      ) : null}
    </form>
  );
}
