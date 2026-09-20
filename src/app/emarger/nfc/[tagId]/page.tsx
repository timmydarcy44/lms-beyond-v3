"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function NfcEmargerPage() {
  const params = useParams();
  const tagId = String(params.tagId ?? "");
  const [info, setInfo] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/emarger/nfc/${encodeURIComponent(tagId)}`);
    const json = await res.json();
    if (!res.ok) {
      setError(json.error || "Tag inconnu");
      return;
    }
    setInfo(json);
  }, [tagId]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    const res = await fetch(`/api/emarger/nfc/${encodeURIComponent(tagId)}`, {
      method: "POST",
      credentials: "include",
    });
    const json = await res.json();
    if (res.status === 401) {
      setError("AUTH_REQUIRED");
      return;
    }
    if (!res.ok) {
      setError(json.error || "Échec");
      return;
    }
    setResult(json.phase === "checkout" ? "Sortie enregistrée" : "Entrée enregistrée");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05060a] px-4 text-white">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-center">
        <p className="text-sm font-semibold text-white/45">
          <span className="font-extrabold text-white">EDGE</span> NFC
        </p>
        <h1 className="mt-3 text-2xl font-bold">Émargement salle</h1>
        {info?.room ? (
          <p className="mt-2 text-sm text-white/50">
            {(info.room as { name?: string }).name ?? "Salle"}
          </p>
        ) : null}
        {result ? <p className="mt-6 text-emerald-300">{result}</p> : null}
        {error === "AUTH_REQUIRED" ? (
          <Link
            href={`/login?next=${encodeURIComponent(`/emarger/nfc/${tagId}`)}`}
            className="mt-6 inline-flex rounded-xl bg-[#3D7BFF] px-4 py-2.5 text-sm font-semibold"
          >
            Se connecter
          </Link>
        ) : error ? (
          <p className="mt-4 text-amber-200">{error}</p>
        ) : !result ? (
          <button
            type="button"
            onClick={() => void submit()}
            className="mt-6 w-full rounded-xl bg-[#3D7BFF] py-3 text-sm font-semibold"
          >
            Valider mon émargement
          </button>
        ) : null}
      </div>
    </div>
  );
}
