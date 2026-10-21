"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const TYPE: Record<string, string> = {
  quarterly: "Évaluation trimestrielle",
  trial_period: "Bilan de fin de période d'essai",
  final: "Évaluation finale",
};

export default function Page() {
  const [rows, setRows] = useState<Array<{ id: string; type: string; status: string; due_date: string | null }>>([]);
  useEffect(() => {
    void fetch("/api/apprenant/evaluations", { cache: "no-store" }).then(async (res) => {
      if (res.ok) setRows((await res.json()).evaluations ?? []);
    });
  }, []);
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="text-3xl font-extrabold">Auto-évaluations</h1>
      {rows.length === 0 ? <p className="mt-4 text-sm text-neutral-500">Aucune auto-évaluation pour le moment.</p> : null}
      <ul className="mt-4 space-y-3">
        {rows.map((row) => (
          <li key={row.id}>
            <Link href={`/dashboard/apprenant/evaluations/${row.id}`} className="block rounded-2xl border border-neutral-200 p-4">
              <span className="font-bold">{TYPE[row.type] ?? "Évaluation"}</span>
              <span className="mt-1 block text-sm text-neutral-500">{row.status === "awaiting_student" ? "À remplir" : "Envoyée"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
