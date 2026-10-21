"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const LEVELS = ["Non acquis", "En cours", "Acquis", "Maîtrisé"];

export default function Page() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [items, setItems] = useState<Array<{ id: string; label: string; block_code: string | null; self_level: number | null }>>([]);
  const [levels, setLevels] = useState<Record<string, number>>({});
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    void fetch(`/api/apprenant/evaluations/${id}`, { cache: "no-store" }).then(async (res) => {
      if (!res.ok) return;
      const json = await res.json();
      setItems(json.items ?? []);
      setLocked(json.evaluation?.status !== "awaiting_student");
      setLevels(Object.fromEntries((json.items ?? []).filter((item: { self_level: number | null }) => item.self_level != null).map((item: { id: string; self_level: number }) => [item.id, item.self_level])));
    });
  }, [id]);

  const complete = items.length > 0 && items.every((item) => levels[item.id] != null);

  async function send() {
    const res = await fetch(`/api/apprenant/evaluations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ send: true, levels: Object.entries(levels).map(([itemId, selfLevel]) => ({ id: itemId, selfLevel })) }),
    });
    if (res.ok) router.push("/dashboard/apprenant/evaluations");
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Auto-évaluation</h1>
      {items.length === 0 ? <p className="mt-4 text-sm text-neutral-500">Aucun critère n&apos;est disponible.</p> : null}
      <div className="mt-4 space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-2xl border border-neutral-200 p-4">
            <p className="font-bold">{item.label}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {LEVELS.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  disabled={locked}
                  onClick={() => setLevels((current) => ({ ...current, [item.id]: index }))}
                  className={`rounded-full px-3 py-1 text-sm ${levels[item.id] === index ? "bg-neutral-900 text-white" : "bg-neutral-100"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      {!locked ? (
        <button type="button" disabled={!complete} className="mt-4 rounded-full bg-neutral-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-40" onClick={() => void send()}>
          Envoyer mon auto-évaluation
        </button>
      ) : (
        <p className="mt-4 text-sm text-neutral-500">Cette auto-évaluation a déjà été envoyée.</p>
      )}
    </main>
  );
}
