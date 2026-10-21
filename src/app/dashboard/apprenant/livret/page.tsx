"use client";

import { useEffect, useState } from "react";

type Period = { id: string; index: number; start_date: string; end_date: string; status: string; student_comment: string | null };

export default function Page() {
  const [periods, setPeriods] = useState<Period[]>([]);
  const [comment, setComment] = useState("");
  const [message, setMessage] = useState("");

  async function load() {
    const res = await fetch("/api/apprenant/livret", { cache: "no-store" });
    if (!res.ok) return;
    const json = await res.json();
    setPeriods(json.periods ?? []);
  }

  useEffect(() => { void load(); }, []);

  const current = periods.find((period) => period.status === "awaiting_student") ?? null;

  async function sign() {
    if (!current) return;
    const res = await fetch(`/api/livret/periods/${current.id}/sign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ comment }),
    });
    setMessage(res.ok ? "Période signée." : "La signature n'a pas pu être enregistrée.");
    if (res.ok) await load();
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Livret</h1>
      {periods.length === 0 ? <p className="mt-4 text-sm text-neutral-500">Aucun livret n&apos;est ouvert.</p> : null}
      {current ? (
        <section className="mt-4 rounded-2xl border border-neutral-200 p-4">
          <h2 className="font-bold">Période {current.index}</h2>
          <p className="text-sm text-neutral-500">{current.start_date} – {current.end_date}</p>
          <textarea value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Votre commentaire" className="mt-3 w-full rounded-xl border border-neutral-200 p-3 text-sm" />
          <p className="mt-2 text-sm">En signant, vous validez le contenu de cette période.</p>
          <button type="button" className="mt-3 rounded-full bg-neutral-900 px-4 py-2 text-sm font-bold text-white" onClick={() => void sign()}>Signer</button>
        </section>
      ) : null}
      {message ? <p className="mt-3 text-sm">{message}</p> : null}
    </main>
  );
}
