"use client";

import { useParams } from "next/navigation";
import { useState } from "react";

export default function Page() {
  const { periodId } = useParams<{ periodId: string }>();
  const [message, setMessage] = useState("");

  async function sign() {
    const res = await fetch(`/api/livret/periods/${periodId}/sign`, { method: "POST" });
    const json = await res.json().catch(() => null);
    setMessage(res.ok ? "Période signée." : json?.error || "La signature n'a pas pu être enregistrée.");
  }

  return (
    <main className="mx-auto max-w-xl px-4 py-16">
      <h1 className="text-3xl font-extrabold">Signature du livret</h1>
      <p className="mt-3 text-sm text-neutral-600">En signant, vous validez le contenu de cette période.</p>
      <button type="button" className="mt-6 rounded-full bg-neutral-900 px-4 py-2 text-sm font-bold text-white" onClick={() => void sign()}>Signer</button>
      {message ? <p className="mt-4 text-sm">{message}</p> : null}
    </main>
  );
}