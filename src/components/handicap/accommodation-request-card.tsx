"use client";

import { useState } from "react";

/** Demande d'aménagement — espace apprenant (profil connecté). */
export function AccommodationRequestCard() {
  const [needed, setNeeded] = useState(false);
  const [needs, setNeeds] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        Votre demande a bien été transmise à la référente handicap, qui vous contactera sous
        72&nbsp;h.
      </div>
    );
  }

  return (
    <form
      className="mb-6 rounded-2xl border border-slate-200 bg-white px-4 py-4 shadow-sm"
      onSubmit={(e) => {
        e.preventDefault();
        if (!needed) return;
        void (async () => {
          setBusy(true);
          setError(null);
          try {
            const res = await fetch("/api/handicap/request", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                accommodation_needed: true,
                needs_text: needs.trim() || null,
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
      <p className="text-sm font-bold text-slate-900">Aménagements pédagogiques</p>
      <p className="mt-1 text-xs text-slate-500">
        Facultatif et confidentiel. Décrivez le besoin, jamais la situation médicale.
      </p>
      <label className="mt-3 flex items-center gap-2 text-sm font-semibold text-slate-800">
        <input
          type="checkbox"
          checked={needed}
          onChange={(e) => setNeeded(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        J&apos;ai besoin d&apos;un aménagement
      </label>
      {needed ? (
        <textarea
          value={needs}
          onChange={(e) => setNeeds(e.target.value)}
          rows={3}
          placeholder="Précisez votre besoin (optionnel)"
          className="mt-3 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
        />
      ) : null}
      {error ? <p className="mt-2 text-xs text-rose-600">{error}</p> : null}
      {needed ? (
        <button
          type="submit"
          disabled={busy}
          className="mt-3 rounded-full bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-60"
        >
          {busy ? "Envoi…" : "Transmettre à la référente"}
        </button>
      ) : null}
    </form>
  );
}
