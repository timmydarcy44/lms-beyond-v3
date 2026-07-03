"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { expertReviewStatusLabel } from "@/lib/expert/expert-access";
import type { AdminExpertRow } from "@/lib/expert/admin-expert-types";
import {
  parseExpertDocuments,
  parseExpertInternalNotes,
  parseExpertRegistrationMeta,
} from "@/lib/expert/admin-expert-types";

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

type Props = {
  expert: AdminExpertRow;
  basePath?: string;
};

export function AdminExpertDetailView({ expert, basePath = "/admin/experts" }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const meta = parseExpertRegistrationMeta(expert.references);
  const documents = parseExpertDocuments(expert.references);
  const notes = parseExpertInternalNotes(expert.references);
  const fullName = `${expert.first_name ?? ""} ${expert.last_name ?? ""}`.trim() || "Expert";
  const photo = expert.photo_url || expert.avatar_url;

  const runReview = async (action: "approve" | "reject" | "needs_info") => {
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
      toast.success("Action enregistrée — email envoyé si applicable.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action impossible.");
    } finally {
      setLoading(null);
    }
  };

  const runAction = async (action: string, payload: Record<string, unknown> = {}) => {
    setLoading(action);
    try {
      const res = await fetch(`/api/super/experts/${expert.id}/actions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...payload }),
      });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(out?.error || "Erreur");
      toast.success("Mise à jour enregistrée.");
      router.refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action impossible.");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start gap-6">
        {photo ? (
          <div className="relative h-24 w-24 overflow-hidden rounded-2xl border border-slate-200">
            <Image src={photo} alt={fullName} fill className="object-cover" unoptimized />
          </div>
        ) : null}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[#635BFF]">Fiche expert</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{fullName}</h1>
          <p className="mt-1 text-sm text-slate-600">{expert.email}</p>
          {expert.linkedin_url ? (
            <a
              href={expert.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm text-[#635BFF] hover:underline"
            >
              LinkedIn →
            </a>
          ) : null}
          <p className="mt-3 inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
            {expertReviewStatusLabel(expert.review_status)}
            {expert.is_active ? " · Actif" : " · Inactif"}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Identité</h2>
          <p className="text-sm font-medium text-slate-800">{expert.headline || "—"}</p>
          {expert.bio ? <p className="text-sm text-slate-600">{expert.bio}</p> : null}
          {expert.bio_long ? <p className="text-sm text-slate-500 whitespace-pre-wrap">{expert.bio_long}</p> : null}
          <p className="text-xs text-slate-500">
            Inscrit le {expert.created_at ? new Date(expert.created_at).toLocaleString("fr-FR") : "—"}
          </p>
          {expert.wants_certification ? (
            <p className="text-xs font-medium text-[#635BFF]">Certification EDGE demandée</p>
          ) : (
            <p className="text-xs text-slate-500">Certification EDGE non demandée</p>
          )}
          {expert.is_certified_beyond || expert.certification_status === "certified" ? (
            <p className="text-xs font-medium text-emerald-700">EDGE Certified</p>
          ) : null}
        </section>

        <section className="space-y-5 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Référentiel & inscription</h2>
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
          <ChipList items={(meta?.audiences as string[]) ?? []} title="Publics accompagnés" />
          <ChipList
            items={(meta?.geographic_zones as string[]) ?? (expert.regions as string[]) ?? []}
            title="Zones géographiques"
          />
          <ChipList items={(meta?.languages as string[]) ?? []} title="Langues" />
          <ChipList items={(meta?.availabilities as string[]) ?? []} title="Disponibilités" />
        </section>
      </div>

      {documents.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Documents transmis</h2>
          <ul className="mt-4 space-y-2">
            {documents.map((doc, i) => (
              <li key={i} className="text-sm text-slate-600">
                {String(doc.label ?? doc.name ?? doc.url ?? "Document")}
                {doc.url ? (
                  <a href={String(doc.url)} target="_blank" rel="noopener noreferrer" className="ml-2 text-[#635BFF] hover:underline">
                    Ouvrir
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {notes.length > 0 ? (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-semibold text-slate-900">Notes internes</h2>
          <ul className="mt-4 space-y-3">
            {notes.map((note, i) => (
              <li key={i} className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="font-medium">{note.action}</span>
                {note.at ? <span className="text-xs text-slate-400"> — {new Date(note.at).toLocaleString("fr-FR")}</span> : null}
                <p className="mt-1">{note.message}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

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
            onClick={() => void runReview("approve")}
            className="rounded-xl bg-[#635BFF] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#554ee6] disabled:opacity-60"
          >
            {loading === "approve" ? "Validation…" : "Valider le profil"}
          </button>
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void runReview("needs_info")}
            className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
          >
            Demander des informations
          </button>
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void runReview("reject")}
            className="rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-60"
          >
            Refuser le profil
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <h2 className="font-semibold text-slate-900">Actions complémentaires</h2>
        <div className="mt-4 flex flex-wrap gap-3">
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void runAction("toggle_active")}
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
          >
            {expert.is_active ? "Désactiver le profil" : "Activer le profil"}
          </button>
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void runAction("set_certified", { certified: true })}
            className="rounded-xl border border-[#635BFF]/30 bg-[#635BFF]/8 px-4 py-2 text-sm font-medium text-[#635BFF] hover:bg-[#635BFF]/12 disabled:opacity-60"
          >
            Marquer EDGE Certified
          </button>
        </div>
        <div className="mt-4">
          <textarea
            value={internalNote}
            onChange={(e) => setInternalNote(e.target.value)}
            placeholder="Note interne (non envoyée à l'expert)"
            className="min-h-[80px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#635BFF]"
          />
          <button
            type="button"
            disabled={loading !== null || !internalNote.trim()}
            onClick={() => void runAction("add_note", { note: internalNote.trim() })}
            className="mt-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
          >
            Ajouter une note interne
          </button>
        </div>
      </section>
    </div>
  );
}
