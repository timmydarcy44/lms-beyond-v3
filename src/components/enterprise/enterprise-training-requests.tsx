"use client";

import { useEffect, useState } from "react";

type Row = { id: string; label: string; status: string; created_at: string; urgency: string };

export function EnterpriseTrainingRequests() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    void fetch("/api/dashboard/entreprise/training-requests", { credentials: "include" })
      .then((res) => (res.ok ? res.json() : { requests: [] }))
      .then((json: { requests?: Row[] }) => setRows(json.requests ?? []))
      .catch(() => setRows([]));
  }, []);

  if (!rows.length) return null;

  return (
    <section className="mb-8 rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="text-base font-bold text-gray-900">Demandes des collaborateurs</h2>
      <ul className="mt-3 divide-y divide-gray-100">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-3 py-3 text-sm">
            <span className="font-semibold text-gray-900">{row.label}</span>
            <span className="text-gray-500">{row.status} · {row.urgency}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
