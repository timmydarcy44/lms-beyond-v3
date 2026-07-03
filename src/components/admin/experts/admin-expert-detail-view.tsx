"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { expertReviewStatusLabel } from "@/lib/expert/expert-access";
import type { AdminExpertRow } from "@/lib/expert/admin-expert-types";
import { parseExpertRegistrationMeta } from "@/lib/expert/admin-expert-types";

function ChipList({ items, title }: { items: string[]; title: string }) {
  if (items.length === 0) return null;
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{title}</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {items.map((item) => (
          <span key={item} className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs text-slate-700">
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

export function AdminExpertDetailView({ expert }: { expert: AdminExpertRow }) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const meta = parseExpertRegistrationMeta(expert.references);
  const fullName = `${expert.first_name ?? ""} ${expert.last_name ?? ""}`.trim() || "Expert";

  const runAction = async (action: "approve" | "reject" | "needs_info") => {
    if ((action === "reject" || action === "needs_info") && !message.trim()) {
      toast.error("Veuillez saisir un message.");
      return;
    }
    setLoading(action);
    try {
      const res = await fetch(`/api/admin/experts/${expert.id}/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, message: message.trim() || undefined }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out?.error || "Erreur");
      toast.success(
        action === "approve"
          ? "Profil validé — email envoyé."
          : action === "reject"
            ? "Profil refusé — email envoyé."
            : "Demande d'informations envoyée.",
      );
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action impossible.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#635BFF]">Fiche expert</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-900">{fullName}</h1>
        <p className="mt-1 text-sm text-slate-600">{expert.email}</p>
        <p className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
          {expertReviewStatusLabel(expert.review_status)}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
          <h2 className="font-semibold text-slate-900">Identité</h2>
          <p className="text-sm text-slate-600">{expert.headline || "—"}</p>
          <p className="text-xs text-slate-500">
            Soumis le{" "}
            {expert.created_at ? new Date(expert.created_at).toLocaleString("fr-FR") : "—"}
          </p>
          {expert.wants_certification ? (
            <p className="text-xs font-medium text-[#635BFF]">Souhaite la certification EDGE</p>
          ) : null}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6 space-y-5">
          <h2 className="font-semibold text-slate-900">Référentiel EDGE</h2>
          <ChipList
            items={
              Array.isArray(meta?.domains)
                ? (meta.domains as string[])
                : meta?.primary_domain
                  ? [String(meta.primary_domain)]
                  : []
            }
            title="Domaines"
          />
          <ChipList items={(expert.specialties as string[]) ?? []} title="Spécialités" />
          <ChipList items={(expert.formats_supported as string[]) ?? []} title="Formats" />
          <ChipList items={(meta?.audiences as string[]) ?? []} title="Public accompagné" />
          <ChipList items={(meta?.geographic_zones as string[]) ?? (expert.regions as string[]) ?? []} title="Zones" />
          <ChipList items={(meta?.languages as string[]) ?? []} title="Langues" />
          <ChipList items={(meta?.availabilities as string[]) ?? []} title="Disponibilités" />
        </section>
      </div>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Décision</h2>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Motif de refus ou éléments à compléter (obligatoire pour refus / demande d'infos)"
          className="mt-4 min-h-[120px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#635BFF]"
        />
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void runAction("approve")}
            className="rounded-xl bg-[#635BFF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#554ee6] disabled:opacity-60"
          >
            {loading === "approve" ? "Validation…" : "Valider"}
          </button>
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void runAction("needs_info")}
            className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
          >
            {loading === "needs_info" ? "Envoi…" : "Demander des informations"}
          </button>
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void runAction("reject")}
            className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-60"
          >
            {loading === "reject" ? "Envoi…" : "Refuser"}
          </button>
        </div>
      </section>
    </div>
  );
}
