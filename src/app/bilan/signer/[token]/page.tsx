"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

type Summary = {
  title: string;
  document_date: string | null;
  hr_feedback: string;
  employee_feedback: string;
  extra_notes: string;
  signed_at: string | null;
  signed_name: string | null;
};

export default function BilanSignerPage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const res = await fetch(`/api/bilan/signer/${token}`);
      const json = (await res.json()) as Summary & { error?: string };
      if (cancelled) return;
      if (!res.ok) {
        setError(json.error ?? "Lien introuvable");
        return;
      }
      setSummary(json);
      if (json.signed_name) setName(json.signed_name);
      if (json.signed_at) setDone(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const sign = async () => {
    setSaving(true);
    setError("");
    try {
      const res = await fetch(`/api/bilan/signer/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(json.error ?? "Signature impossible");
      setDone(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Signature impossible");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-white px-6 py-16 text-[#111111]">
      <div className="mx-auto max-w-[560px]">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8A8F98]">Byound</p>
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight">Signer la synthèse</h1>
        {error ? <p className="mt-6 text-sm text-[#9B2335]">{error}</p> : null}
        {!summary && !error ? <p className="mt-6 text-[#5C6370]">Chargement…</p> : null}
        {summary ? (
          <div className="mt-8 space-y-6">
            <div>
              <p className="text-lg font-semibold">{summary.title}</p>
              {summary.document_date ? (
                <p className="mt-1 text-sm text-[#5C6370]">
                  {new Date(summary.document_date).toLocaleDateString("fr-FR")}
                </p>
              ) : null}
            </div>
            {summary.hr_feedback ? (
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8A8F98]">Synthèse RH</p>
                <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">{summary.hr_feedback}</p>
              </section>
            ) : null}
            {summary.employee_feedback ? (
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8A8F98]">Votre retour</p>
                <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">{summary.employee_feedback}</p>
              </section>
            ) : null}
            {summary.extra_notes ? (
              <section>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#8A8F98]">Notes</p>
                <p className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed">{summary.extra_notes}</p>
              </section>
            ) : null}
            {done ? (
              <p className="rounded-2xl bg-[#F4F4F6] px-4 py-4 text-sm">
                Signature enregistrée{name ? ` au nom de ${name}` : ""}.
              </p>
            ) : (
              <div className="space-y-3">
                <label className="block text-sm font-medium">
                  Votre nom
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="mt-2 w-full rounded-2xl border border-[#E3E0D8] px-4 py-3 text-base outline-none focus:border-[#111111]"
                  />
                </label>
                <button
                  type="button"
                  disabled={saving}
                  onClick={() => void sign()}
                  className="rounded-full bg-[#111111] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60"
                >
                  {saving ? "Envoi…" : "Je signe cette synthèse"}
                </button>
                <p className="text-xs leading-relaxed text-[#8A8F98]">
                  Cette confirmation atteste que vous avez pris connaissance de la synthèse. Elle n&apos;a pas valeur de signature électronique qualifiée.
                </p>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </main>
  );
}
