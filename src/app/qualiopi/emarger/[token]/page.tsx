"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { formatSignedAt } from "@/lib/crm/qualiopi-shared";

export default function QualiopiEmargerPage() {
  const params = useParams();
  const token = String(params?.token ?? "");
  const [status, setStatus] = useState<"loading" | "ready" | "done" | "error">("loading");
  const [name, setName] = useState("");
  const [course, setCourse] = useState("");
  const [signedLabel, setSignedLabel] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      const res = await fetch(`/api/qualiopi/emarger/${token}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Lien invalide");
        setStatus("error");
        return;
      }
      setName(String(json.attendee?.full_name ?? ""));
      setCourse(String(json.attendee?.crm_qualiopi_sessions?.course_name ?? "Formation"));
      const signed = formatSignedAt(json.attendee?.signed_at);
      if (signed) {
        setSignedLabel(signed.label);
        setStatus("done");
      } else {
        setStatus("ready");
      }
    };
    void load();
  }, [token]);

  const sign = async () => {
    setSaving(true);
    const res = await fetch(`/api/qualiopi/emarger/${token}`, { method: "POST" });
    const json = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(json.error || "Signature impossible");
      setStatus("error");
      return;
    }
    const signed = formatSignedAt(json.attendee?.signed_at);
    setSignedLabel(signed?.label ?? "Enregistré");
    setStatus("done");
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-12 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/5 p-8 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-300">Qualiopi · EDGE</p>
        <h1 className="mt-3 text-2xl font-bold">Feuille d’émargement</h1>
        {status === "loading" ? <p className="mt-6 text-white/60">Chargement…</p> : null}
        {status === "error" ? <p className="mt-6 text-red-300">{error}</p> : null}
        {status === "ready" ? (
          <>
            <p className="mt-4 text-white/70">
              {name} — {course}
            </p>
            <p className="mt-2 text-sm text-white/50">
              En signant, l’heure et le jour sont enregistrés pour le dossier Qualiopi.
            </p>
            <button
              type="button"
              disabled={saving}
              onClick={() => void sign()}
              className="mt-6 w-full rounded-full bg-indigo-600 px-4 py-3 font-semibold disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : "Je signe l’émargement"}
            </button>
          </>
        ) : null}
        {status === "done" ? (
          <p className="mt-6 text-emerald-300">Présence enregistrée{signedLabel ? ` : ${signedLabel}` : "."}</p>
        ) : null}
      </div>
    </main>
  );
}
