"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

export default function QualiopiSatisfactionPage() {
  const params = useParams();
  const token = String(params?.token ?? "");
  const [status, setStatus] = useState<"loading" | "ready" | "done" | "error">("loading");
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/qualiopi/satisfaction/${token}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Lien invalide");
        setStatus("error");
        return;
      }
      setName(String(json.attendee?.full_name ?? ""));
      setCourse(String(json.attendee?.crm_qualiopi_sessions?.course_name ?? "Formation"));
      if (json.attendee?.satisfaction_at) {
        setStatus("done");
        return;
      }
      setStatus("ready");
    };
    void load();
  }, [token]);

  const submit = async () => {
    setSaving(true);
    const res = await fetch(`/api/qualiopi/satisfaction/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ score, comment }),
    });
    setSaving(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setError(json.error || "Envoi impossible");
      setStatus("error");
      return;
    }
    setStatus("done");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">
          Qualiopi · EDGE
        </p>
        <h1 className="mt-3 text-center text-2xl font-bold">Questionnaire de satisfaction</h1>
        {status === "loading" ? <p className="mt-6 text-center text-white/60">Chargement…</p> : null}
        {status === "error" ? <p className="mt-6 text-center text-red-300">{error}</p> : null}
        {status === "ready" ? (
          <div className="mt-6 space-y-4">
            <p className="text-center text-white/70">
              {name} — {course}
            </p>
            <label className="block text-sm text-white/70">
              Note globale
              <select
                value={score}
                onChange={(event) => setScore(Number(event.target.value))}
                className="mt-1 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white"
              >
                {[1, 2, 3, 4, 5].map((value) => (
                  <option key={value} value={value} className="bg-slate-900">
                    {value} / 5
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm text-white/70">
              Commentaire
              <textarea
                value={comment}
                onChange={(event) => setComment(event.target.value)}
                rows={4}
                className="mt-1 w-full rounded-md border border-white/20 bg-white/10 px-3 py-2 text-white"
              />
            </label>
            <button
              type="button"
              disabled={saving}
              onClick={() => void submit()}
              className="w-full rounded-full bg-indigo-600 px-4 py-3 font-semibold disabled:opacity-50"
            >
              {saving ? "Envoi…" : "Envoyer"}
            </button>
          </div>
        ) : null}
        {status === "done" ? (
          <p className="mt-6 text-center text-emerald-300">Merci, votre avis a bien été enregistré.</p>
        ) : null}
      </div>
    </main>
  );
}
