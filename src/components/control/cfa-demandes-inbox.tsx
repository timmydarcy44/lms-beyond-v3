"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Inbox } from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "@/components/control/chrome";
import { looksLikeTestAccount } from "@/lib/control/test-account";
import {
  CFA_STATUS_LABELS,
  getCfaSpecializationLabel,
  type CfaApplication,
} from "@/lib/cfa-applications";

const INCOMING_STATUSES = new Set(["review", "profile", "challenge", "dossier", "interview"]);

export function CfaDemandesInbox() {
  const router = useRouter();
  const [applications, setApplications] = useState<CfaApplication[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/super-admin/crm/cfa", { cache: "no-store" });
      const json = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(json.error || "Chargement impossible");
      setApplications(json.applications ?? []);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const cards = useMemo(
    () =>
      applications.filter((item) => {
        if (!INCOMING_STATUSES.has(item.status)) return false;
        return !looksLikeTestAccount({
          email: item.email,
          name: `${item.first_name} ${item.last_name}`,
        });
      }),
    [applications],
  );

  const reviewCount = cards.filter((item) => item.status === "review").length;

  return (
    <div className="mx-auto max-w-[1100px] space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-[32px] font-extrabold tracking-[-1px] text-white">Demandes entrantes CFA</h1>
          <p className="mt-2 max-w-2xl text-sm text-[#8A93AE]">
            Candidatures à traiter (à relire, dossiers en cours, entretiens). Le pipeline complet reste dans
            Admissions.
          </p>
        </div>
        <Link
          href="/super/crm/cfa"
          className="rounded-full border border-[#3A4668] bg-[#151C33] px-4 py-2 text-sm font-semibold text-[#E8ECF8]"
        >
          Ouvrir Admissions
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-[#1A2340] bg-[#111831] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8A93AE]">À traiter</p>
          <p className="mt-2 text-2xl font-extrabold text-white">{cards.length}</p>
        </div>
        <div className="rounded-2xl border border-[#1A2340] bg-[#111831] p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#8A93AE]">À relire</p>
          <p className="mt-2 text-2xl font-extrabold text-white">{reviewCount}</p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-[#8A93AE]">Chargement…</p>
      ) : cards.length === 0 ? (
        <EmptyState title="Aucune demande CFA en attente." />
      ) : (
        <ul className="space-y-3">
          {cards.map((card) => {
            const name = `${card.first_name} ${card.last_name}`.trim() || "Candidat";
            const specialization = getCfaSpecializationLabel(card.specialization);
            return (
              <li key={card.id}>
                <button
                  type="button"
                  onClick={() => router.push(`/super/crm/cfa/apprenants/${card.id}`)}
                  className="flex w-full flex-col gap-2 rounded-[22px] border border-[#1A2340] bg-[#111831] px-4 py-4 text-left transition hover:border-[#5EDCC3]/40 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          card.status === "review"
                            ? "bg-[#3A3118] text-[#F2CF6B]"
                            : "bg-[#163228] text-[#6BE39B]"
                        }`}
                      >
                        {CFA_STATUS_LABELS[card.status] ?? card.status}
                      </span>
                      {specialization ? (
                        <span className="rounded-full bg-[#0A0F1E] px-2 py-0.5 text-[11px] text-[#8A93AE]">
                          {specialization}
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-2 truncate text-base font-semibold text-white">{name}</p>
                    <p className="mt-0.5 text-sm text-[#8A93AE]">{card.email}</p>
                  </div>
                  <div className="shrink-0 text-left text-xs text-[#8A93AE] sm:text-right">
                    <p>
                      {card.updated_at
                        ? new Date(card.updated_at).toLocaleString("fr-FR", {
                            dateStyle: "short",
                            timeStyle: "short",
                          })
                        : "—"}
                    </p>
                    <p className="mt-2 font-semibold text-[#5EDCC3]">Ouvrir la fiche →</p>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {!loading && cards.length > 0 ? (
        <p className="flex items-center gap-2 text-xs text-[#8A93AE]">
          <Inbox className="h-3.5 w-3.5" />
          Pastille sidebar = candidatures « À relire » uniquement.
        </p>
      ) : null}
    </div>
  );
}
