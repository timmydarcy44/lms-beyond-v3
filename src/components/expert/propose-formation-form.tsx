"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { FormationProposal } from "@/lib/expert/formation-proposals";

const field =
  "w-full rounded-2xl border border-[#1E2130] bg-[#12141A] px-4 py-3 text-sm text-[#F4F5F7] outline-none placeholder:text-[#6E7482]";

const STATUS_LABEL: Record<FormationProposal["status"], string> = {
  pending: "En attente",
  approved: "Validée",
  rejected: "Refusée",
};

export function ProposeFormationForm({ proposals }: { proposals: FormationProposal[] }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [objectives, setObjectives] = useState("");
  const [prerequisites, setPrerequisites] = useState("");
  const [audience, setAudience] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/expert/formations/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, objectives, prerequisites, audience }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error || "Envoi impossible.");
      setTitle("");
      setObjectives("");
      setPrerequisites("");
      setAudience("");
      toast.success("Proposition envoyée. Elle sera relue par Byound.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-8">
      <form
        className="rounded-[28px] bg-[#12141A] p-6 sm:p-8"
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
      >
        <label className="block text-sm font-semibold text-[#F4F5F7]">
          Titre
          <input className={`${field} mt-2 h-12`} value={title} onChange={(event) => setTitle(event.target.value)} maxLength={160} required />
        </label>
        <label className="mt-5 block text-sm font-semibold text-[#F4F5F7]">
          Objectifs pédagogiques
          <textarea className={`${field} mt-2 min-h-32`} value={objectives} onChange={(event) => setObjectives(event.target.value)} maxLength={4000} required />
        </label>
        <label className="mt-5 block text-sm font-semibold text-[#F4F5F7]">
          Prérequis
          <textarea className={`${field} mt-2 min-h-24`} value={prerequisites} onChange={(event) => setPrerequisites(event.target.value)} maxLength={4000} required />
        </label>
        <label className="mt-5 block text-sm font-semibold text-[#F4F5F7]">
          Public visé
          <textarea className={`${field} mt-2 min-h-24`} value={audience} onChange={(event) => setAudience(event.target.value)} maxLength={2000} required />
        </label>
        <button
          type="submit"
          disabled={busy}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-[#FF4B4B] px-5 text-sm font-extrabold text-[#04140C] disabled:opacity-60"
        >
          {busy ? "Envoi…" : "Proposer"}
        </button>
      </form>

      {proposals.length ? (
        <ul className="space-y-3">
          {proposals.map((item) => (
            <li key={item.id} className="rounded-[24px] border border-[#1E2130] px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <p className="text-base font-extrabold text-[#F4F5F7]">{item.title}</p>
                <span className="shrink-0 text-xs font-bold text-[#B5BAC6]">{STATUS_LABEL[item.status]}</span>
              </div>
              {item.reviewNote ? <p className="mt-2 text-sm text-[#B5BAC6]">{item.reviewNote}</p> : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-[#B5BAC6]">Aucune proposition envoyée.</p>
      )}
    </div>
  );
}
