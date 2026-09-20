"use client";

import { useState } from "react";
import Link from "next/link";

export default function EmargerCodePage() {
  const [code, setCode] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setMessage(null);
    const res = await fetch("/api/emarger/code", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ code, method: "session_code" }),
    });
    const json = await res.json();
    if (res.status === 401) {
      setError("AUTH_REQUIRED");
      return;
    }
    if (!res.ok) {
      setError(json.error || "Code invalide");
      return;
    }
    setMessage(json.status || "Émargement enregistré");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05060a] px-4 text-white">
      <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/[0.03] p-6">
        <p className="text-center text-sm text-white/45">
          <span className="font-extrabold text-white">EDGE</span> Code session
        </p>
        <h1 className="mt-3 text-center text-xl font-bold">Saisir le code</h1>
        <input
          className="mt-6 w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3 text-center text-2xl tracking-[0.35em]"
          maxLength={6}
          inputMode="numeric"
          placeholder="••••••"
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
        />
        {error === "AUTH_REQUIRED" ? (
          <Link href="/login?next=/emarger/code" className="mt-4 block text-center text-sm text-[#3D7BFF]">
            Connectez-vous pour valider
          </Link>
        ) : error ? (
          <p className="mt-3 text-center text-sm text-amber-200">{error}</p>
        ) : null}
        {message ? <p className="mt-3 text-center text-sm text-emerald-300">{message}</p> : null}
        <button
          type="button"
          onClick={() => void submit()}
          className="mt-4 w-full rounded-xl bg-[#3D7BFF] py-3 text-sm font-semibold"
        >
          Valider
        </button>
      </div>
    </div>
  );
}
