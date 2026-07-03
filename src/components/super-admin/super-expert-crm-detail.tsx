"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Award,
  BadgeCheck,
  Calendar,
  ChevronDown,
  Clock,
  FileText,
  Linkedin,
  Mail,
  MessageSquare,
  MoreHorizontal,
  Shield,
  User,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { expertReviewStatusLabel } from "@/lib/expert/expert-access";
import type { AdminExpertRow } from "@/lib/expert/admin-expert-types";
import {
  parseExpertDocuments,
  parseExpertInternalNotes,
  parseExpertRegistrationMeta,
} from "@/lib/expert/admin-expert-types";
import {
  buildExpertTimeline,
  computeExpertProfileProgress,
  getExpertDomains,
} from "@/lib/expert/expert-crm-utils";

function statusStyles(status: string | null | undefined) {
  switch (status) {
    case "approved":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "rejected":
      return "bg-red-50 text-red-700 border-red-200";
    case "needs_info":
      return "bg-amber-50 text-amber-800 border-amber-200";
    default:
      return "bg-slate-100 text-slate-600 border-slate-200";
  }
}

function TagGroup({ label, items }: { label: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div>
      <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <div className="mt-2.5 flex flex-wrap gap-2">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-lg border border-slate-200/80 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-sm"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function CrmCard({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon?: typeof User;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.04)]", className)}>
      <div className="flex items-center gap-2 border-b border-slate-100 px-5 py-4">
        {Icon ? <Icon className="h-4 w-4 text-slate-400" strokeWidth={1.5} /> : null}
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}

type Props = {
  expert: AdminExpertRow;
  basePath?: string;
};

export function SuperExpertCrmDetail({ expert, basePath = "/super/experts" }: Props) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [internalNote, setInternalNote] = useState("");
  const [loading, setLoading] = useState<string | null>(null);
  const [showActions, setShowActions] = useState(false);

  const meta = parseExpertRegistrationMeta(expert.references);
  const documents = parseExpertDocuments(expert.references);
  const notes = parseExpertInternalNotes(expert.references);
  const timeline = useMemo(() => buildExpertTimeline(expert), [expert]);
  const progress = useMemo(() => computeExpertProfileProgress(expert, meta), [expert, meta]);
  const domains = getExpertDomains(meta, expert);
  const photo = expert.photo_url || expert.avatar_url;
  const firstName = expert.first_name ?? "";
  const lastName = expert.last_name ?? "";

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
      toast.success("Action enregistrée — email envoyé.");
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
    <div className="mx-auto max-w-[1280px] space-y-6">
      <Link href={basePath} className="inline-flex text-sm text-slate-500 transition hover:text-slate-800">
        ← Retour à la liste
      </Link>

      {/* Hero CRM */}
      <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
        <div className="h-28 bg-gradient-to-r from-[#0d1f3c] via-[#152a4a] to-[#1a3358]" aria-hidden />
        <div className="relative px-6 pb-6 sm:px-8">
          <div className="-mt-14 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-end gap-5">
              <div className="relative h-[108px] w-[108px] shrink-0 overflow-hidden rounded-2xl border-4 border-white bg-slate-100 shadow-lg">
                {photo ? (
                  <Image src={photo} alt={`${firstName} ${lastName}`} fill className="object-cover" unoptimized />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-3xl font-semibold text-slate-300">
                    {(firstName[0] ?? "?").toUpperCase()}
                  </div>
                )}
              </div>
              <div className="pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex rounded-full border px-3 py-1 text-xs font-semibold",
                      statusStyles(expert.review_status),
                    )}
                  >
                    {expertReviewStatusLabel(expert.review_status)}
                  </span>
                  {expert.is_active ? (
                    <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                      Actif
                    </span>
                  ) : (
                    <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
                      Inactif
                    </span>
                  )}
                  {expert.is_certified_beyond || expert.certification_status === "certified" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#635BFF]/10 px-2.5 py-1 text-xs font-semibold text-[#635BFF]">
                      <BadgeCheck className="h-3 w-3" />
                      EDGE Certified
                    </span>
                  ) : null}
                </div>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                  {firstName} {lastName}
                </h1>
                <p className="mt-1 text-base text-slate-600">{expert.headline || "—"}</p>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                  {expert.email ? (
                    <a href={`mailto:${expert.email}`} className="inline-flex items-center gap-1.5 hover:text-[#635BFF]">
                      <Mail className="h-3.5 w-3.5" />
                      {expert.email}
                    </a>
                  ) : null}
                  {expert.linkedin_url ? (
                    <a
                      href={expert.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 hover:text-[#635BFF]"
                    >
                      <Linkedin className="h-3.5 w-3.5" />
                      LinkedIn
                    </a>
                  ) : null}
                  {expert.created_at ? (
                    <span className="inline-flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      Inscrit le {new Date(expert.created_at).toLocaleDateString("fr-FR")}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                disabled={loading !== null}
                onClick={() => void runReview("approve")}
                className="rounded-xl bg-[#635BFF] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[#554ee6] disabled:opacity-60"
              >
                {loading === "approve" ? "…" : "Valider"}
              </button>
              <button
                type="button"
                onClick={() => setShowActions((v) => !v)}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
                aria-label="Plus d'actions"
              >
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Progression profil */}
          <div className="mt-8">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-slate-700">Complétude du profil</span>
              <span className="font-semibold text-[#635BFF]">{progress}%</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full rounded-full bg-gradient-to-r from-[#635BFF] to-[#3B82F6] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <CrmCard title="Compétences & référentiel" icon={Shield}>
            <div className="grid gap-6 sm:grid-cols-2">
              <TagGroup label="Domaines" items={domains} />
              <TagGroup label="Spécialités" items={(expert.specialties as string[]) ?? []} />
              <TagGroup label="Formats" items={(expert.formats_supported as string[]) ?? []} />
              <TagGroup label="Publics" items={(meta?.audiences as string[]) ?? []} />
              <TagGroup
                label="Zones géographiques"
                items={(meta?.geographic_zones as string[]) ?? (expert.regions as string[]) ?? []}
              />
              <TagGroup label="Langues" items={(meta?.languages as string[]) ?? []} />
              <TagGroup label="Disponibilités" items={(meta?.availabilities as string[]) ?? []} />
            </div>
          </CrmCard>

          {(expert.bio || expert.bio_long) && (
            <CrmCard title="Présentation" icon={User}>
              {expert.bio ? <p className="text-sm leading-relaxed text-slate-700">{expert.bio}</p> : null}
              {expert.bio_long ? (
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-slate-500">{expert.bio_long}</p>
              ) : null}
            </CrmCard>
          )}

          <CrmCard title="Documents transmis" icon={FileText}>
            {documents.length === 0 ? (
              <p className="text-sm text-slate-400">Aucun document transmis.</p>
            ) : (
              <ul className="space-y-3">
                {documents.map((doc, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/50 px-4 py-3"
                  >
                    <span className="text-sm font-medium text-slate-700">
                      {String(doc.label ?? doc.name ?? "Document")}
                    </span>
                    {doc.url ? (
                      <a
                        href={String(doc.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs font-semibold text-[#635BFF] hover:underline"
                      >
                        Ouvrir
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
          </CrmCard>

          <CrmCard title="Historique & timeline" icon={Clock}>
            <ol className="relative space-y-0">
              {timeline.map((event, i) => (
                <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
                  {i < timeline.length - 1 ? (
                    <span className="absolute left-[11px] top-6 h-full w-px bg-slate-200" aria-hidden />
                  ) : null}
                  <span
                    className={cn(
                      "relative z-10 mt-0.5 h-[22px] w-[22px] shrink-0 rounded-full border-2 border-white",
                      event.type === "approved"
                        ? "bg-emerald-500"
                        : event.type === "rejected"
                          ? "bg-red-400"
                          : event.type === "needs_info"
                            ? "bg-amber-400"
                            : event.type === "certified"
                              ? "bg-[#635BFF]"
                              : "bg-slate-300",
                    )}
                  />
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{event.label}</p>
                    {event.message ? (
                      <p className="mt-1 text-sm leading-relaxed text-slate-500">{event.message}</p>
                    ) : null}
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(event.at).toLocaleString("fr-FR")}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </CrmCard>
        </div>

        <aside className="space-y-6">
          <CrmCard title="Badges EDGE" icon={Award}>
            <div className="space-y-3">
              {expert.wants_certification ? (
                <div className="flex items-center gap-3 rounded-xl bg-[#635BFF]/8 px-4 py-3">
                  <Award className="h-5 w-5 text-[#635BFF]" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">Certification demandée</p>
                    <p className="text-xs text-slate-500">Parcours EDGE Certified souhaité</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400">Certification non demandée</p>
              )}
              {expert.is_certified_beyond || expert.certification_status === "certified" ? (
                <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                  <BadgeCheck className="h-5 w-5 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-800">EDGE Certified</p>
                </div>
              ) : null}
            </div>
          </CrmCard>

          <CrmCard title="Notes internes" icon={MessageSquare}>
            {notes.filter((n) => n.action === "internal_note").length === 0 ? (
              <p className="text-sm text-slate-400">Aucune note interne.</p>
            ) : (
              <ul className="max-h-48 space-y-3 overflow-y-auto">
                {notes
                  .filter((n) => n.action === "internal_note")
                  .map((note, i) => (
                    <li key={i} className="rounded-xl bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
                      <p>{note.message}</p>
                      {note.at ? (
                        <p className="mt-1 text-xs text-slate-400">{new Date(note.at).toLocaleString("fr-FR")}</p>
                      ) : null}
                    </li>
                  ))}
              </ul>
            )}
            <textarea
              value={internalNote}
              onChange={(e) => setInternalNote(e.target.value)}
              placeholder="Ajouter une note…"
              className="mt-4 min-h-[72px] w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#635BFF]/40"
            />
            <button
              type="button"
              disabled={loading !== null || !internalNote.trim()}
              onClick={() => void runAction("add_note", { note: internalNote.trim() })}
              className="mt-2 w-full rounded-xl border border-slate-200 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Enregistrer la note
            </button>
          </CrmCard>

          <button
            type="button"
            onClick={() => setShowActions((v) => !v)}
            className="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Actions de validation
            <ChevronDown className={cn("h-4 w-4 transition", showActions && "rotate-180")} />
          </button>

          {showActions ? (
            <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Message pour refus ou demande d'infos"
                className="min-h-[100px] w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#635BFF]"
              />
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  disabled={loading !== null}
                  onClick={() => void runReview("needs_info")}
                  className="rounded-xl border border-amber-200 bg-amber-50 py-2.5 text-sm font-semibold text-amber-900 hover:bg-amber-100 disabled:opacity-60"
                >
                  Demander des informations
                </button>
                <button
                  type="button"
                  disabled={loading !== null}
                  onClick={() => void runReview("reject")}
                  className="rounded-xl border border-red-200 bg-red-50 py-2.5 text-sm font-semibold text-red-800 hover:bg-red-100 disabled:opacity-60"
                >
                  Refuser le profil
                </button>
                <button
                  type="button"
                  disabled={loading !== null}
                  onClick={() => void runAction("toggle_active")}
                  className="rounded-xl border border-slate-200 py-2.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-60"
                >
                  {expert.is_active ? "Désactiver le profil" : "Activer le profil"}
                </button>
                <button
                  type="button"
                  disabled={loading !== null}
                  onClick={() => void runAction("set_certified", { certified: true })}
                  className="rounded-xl border border-[#635BFF]/25 bg-[#635BFF]/8 py-2.5 text-sm font-semibold text-[#635BFF] hover:bg-[#635BFF]/12 disabled:opacity-60"
                >
                  Marquer EDGE Certified
                </button>
              </div>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
