"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { FormationProposal } from "@/lib/expert/formation-proposals";

const STATUS: Record<FormationProposal["status"], string> = {
  pending: "En attente",
  approved: "Validée",
  rejected: "Refusée",
};

export function FormationProposalsReview({ proposals }: { proposals: FormationProposal[] }) {
  const router = useRouter();
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  const decide = async (id: string, action: "approve" | "reject") => {
    setBusy(id);
    try {
      const res = await fetch(`/api/super/formation-proposals/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note: notes[id] ?? "" }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Décision impossible.");
      toast.success(action === "approve" ? "Proposition validée." : "Proposition refusée.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Décision impossible.");
    } finally {
      setBusy(null);
    }
  };

  if (!proposals.length) {
    return <p className="text-sm text-slate-500">Aucune proposition pour le moment.</p>;
  }

  return (
    <ul className="space-y-4">
      {proposals.map((item) => (
        <li key={item.id} className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-lg font-extrabold text-slate-900">{item.title}</p>
              <p className="mt-1 text-sm text-slate-500">{item.expertName || "Expert"} · {STATUS[item.status]}</p>
            </div>
          </div>
          <dl className="mt-4 space-y-3 text-sm text-slate-700">
            <div>
              <dt className="font-semibold text-slate-900">Objectifs pédagogiques</dt>
              <dd className="mt-1 whitespace-pre-wrap">{item.objectives}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Prérequis</dt>
              <dd className="mt-1 whitespace-pre-wrap">{item.prerequisites}</dd>
            </div>
            <div>
              <dt className="font-semibold text-slate-900">Public visé</dt>
              <dd className="mt-1 whitespace-pre-wrap">{item.audience}</dd>
            </div>
          </dl>
          {item.status === "pending" ? (
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end">
              <label className="block flex-1 text-sm">
                Note interne
                <input
                  className="mt-1 h-11 w-full rounded-xl border border-slate-200 px-3"
                  value={notes[item.id] ?? ""}
                  onChange={(event) => setNotes((current) => ({ ...current, [item.id]: event.target.value }))}
                />
              </label>
              <button
                type="button"
                disabled={busy === item.id}
                onClick={() => void decide(item.id, "approve")}
                className="h-11 rounded-full bg-slate-900 px-4 text-sm font-bold text-white disabled:opacity-60"
              >
                Valider
              </button>
              <button
                type="button"
                disabled={busy === item.id}
                onClick={() => void decide(item.id, "reject")}
                className="h-11 rounded-full border border-slate-300 px-4 text-sm font-bold text-slate-800 disabled:opacity-60"
              >
                Refuser
              </button>
            </div>
          ) : item.reviewNote ? (
            <p className="mt-3 text-sm text-slate-500">{item.reviewNote}</p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
