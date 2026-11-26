"use client";

import { useState } from "react";
import { toast } from "sonner";
import { AXES_LABELS, IDMC_AXIS_KEYS, resolveIdmcAxisMasteryLevel } from "@/lib/idmc/idmc-display";
import type { EmployeeTestResults } from "@/lib/entreprise/employee-profile-diagnostics";
import { hasAnyTestResults } from "@/lib/entreprise/employee-profile-diagnostics";
import { EXPERT_MAIL_TEMPLATES, fillExpertMail } from "@/lib/expert/expert-mail-templates";
import { SectionCard, SectionHeader, TintPill } from "@/components/super-admin/expert-fiche-ui";
import { Award, Brain, Download, Loader2, Mail, Sparkles, Target } from "lucide-react";

const DISC_LABELS: Record<"D" | "I" | "S" | "C", string> = {
  D: "Décisionnel",
  I: "Relationnel",
  S: "Stable",
  C: "Structuré",
};

const TESTS_TEMPLATE = EXPERT_MAIL_TEMPLATES.find((item) => item.id === "tests")!;
const BILANS_HREF = "https://www.byound.fr/dashboard/expert/bilans";

function formatDay(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export function ExpertCrmTestResults({
  results,
  expertId,
  expertFirstName = "",
  expertEmail = "",
}: {
  results: EmployeeTestResults;
  expertId: string;
  expertFirstName?: string;
  expertEmail?: string;
}) {
  const [sending, setSending] = useState<"test" | "live" | null>(null);
  const disc = results.disc;
  const discEntries = disc
    ? (["D", "I", "S", "C"] as const)
        .map((key) => ({ key, score: Number(disc[key] ?? 0), label: DISC_LABELS[key] }))
        .sort((a, b) => b.score - a.score)
    : [];
  const axes = IDMC_AXIS_KEYS.map((key) => {
    const score = Math.round(Number(results.idmc_axes?.[key] ?? 0));
    return { key, label: AXES_LABELS[key], score, mastery: resolveIdmcAxisMasteryLevel(score) };
  }).sort((a, b) => b.score - a.score);
  const soft = [...results.soft_skills].sort((a, b) => b.score - a.score).slice(0, 8);
  const hasAny = hasAnyTestResults(results);

  function openPdf() {
    window.open(`/api/super/experts/${expertId}/bilan-pdf?autoprint=1`, "_blank");
  }

  async function sendTestsRequest(mode: "test" | "live") {
    if (!expertEmail.trim()) {
      toast.error("Aucune adresse e-mail sur ce profil");
      return;
    }
    setSending(mode);
    try {
      const prenom = expertFirstName.trim() || "bonjour";
      const message = fillExpertMail(TESTS_TEMPLATE.message, {
        prenom,
        lien_espace: BILANS_HREF,
      });
      const res = await fetch("/api/super-admin/crm/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          expertId,
          test: mode === "test",
          subject: TESTS_TEMPLATE.subject,
          title: TESTS_TEMPLATE.title,
          html: message,
          templateLabel: TESTS_TEMPLATE.label,
          ctaLabel: "Faire mes tests",
          ctaHref: BILANS_HREF,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Envoi impossible");
      toast.success(
        mode === "test"
          ? "Copie envoyée dans ta boîte mail"
          : "Demande envoyée au formateur (copie BCC)",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Envoi impossible");
    } finally {
      setSending(null);
    }
  }

  const requestActions = (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        disabled={sending !== null}
        onClick={() => void sendTestsRequest("test")}
        className="inline-flex items-center gap-1.5 rounded-full border border-[#26304F] px-3 py-1.5 text-xs font-bold text-[#C9D2E8] disabled:opacity-60"
      >
        {sending === "test" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
        M’envoyer le mail
      </button>
      <TintPill
        color="#6E5BFF"
        onClick={() => {
          if (sending) return;
          void sendTestsRequest("live");
        }}
      >
        {sending === "live" ? "Envoi…" : "Envoyer une demande pour faire les tests"}
      </TintPill>
    </div>
  );

  if (!hasAny) {
    return (
      <SectionCard color="#9AA3BD">
        <SectionHeader
          icon={Brain}
          color="#9AA3BD"
          title="Bilans & tests"
          subtitle="Soft skills, DISC et IDMC passés depuis l’espace expert"
          action={requestActions}
        />
        <div className="space-y-3 px-6 pb-6 pt-4">
          <p className="text-sm text-[#9AA3BD]">
            Aucun résultat pour l’instant. Dès qu’il passe les tests dans Mes bilans, ils apparaissent ici.
          </p>
        </div>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-semibold text-[#9AA3BD]">
          Soft skills, DISC et IDMC — export PDF haute qualité
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {requestActions}
          <button
            type="button"
            onClick={openPdf}
            className="inline-flex items-center gap-1.5 rounded-full border border-[#26304F] bg-[#111831] px-4 py-2 text-sm font-extrabold text-[#F2F4FA] hover:border-[#6E5BFF]/40"
          >
            <Download className="h-3.5 w-3.5" /> Exporter le PDF
          </button>
        </div>
      </div>
    <div className="grid gap-6 xl:grid-cols-3">
      <SectionCard color="#8B7BFF">
        <SectionHeader
          icon={Target}
          color="#8B7BFF"
          title="DISC"
          subtitle={formatDay(results.disc_at) ? `Passé le ${formatDay(results.disc_at)}` : "Profil comportemental"}
        />
        <div className="space-y-3 px-6 pb-6 pt-4">
          {discEntries.length === 0 ? (
            <p className="text-sm text-[#9AA3BD]">Non passé</p>
          ) : (
            discEntries.map((item) => (
              <div key={item.key}>
                <div className="mb-1 flex justify-between text-sm">
                  <span className="font-extrabold text-white">
                    {item.key} · {item.label}
                  </span>
                  <span className="text-[#C9C2FF]">{Math.round(item.score)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-[#1A2340]">
                  <div
                    className="h-full rounded-full bg-[#8B7BFF]"
                    style={{ width: `${Math.max(4, Math.min(100, item.score))}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </SectionCard>

      <SectionCard color="#5EDCC3">
        <SectionHeader
          icon={Award}
          color="#5EDCC3"
          title="IDMC"
          subtitle={
            results.idmc_score != null
              ? `Score global ${Math.round(results.idmc_score)}${formatDay(results.idmc_at) ? ` · ${formatDay(results.idmc_at)}` : ""}`
              : formatDay(results.idmc_at)
                ? `Passé le ${formatDay(results.idmc_at)}`
                : "Motivations"
          }
        />
        <ul className="space-y-2 px-6 pb-6 pt-4">
          {axes.every((a) => a.score <= 0) ? (
            <li className="text-sm text-[#9AA3BD]">Non passé</li>
          ) : (
            axes.slice(0, 5).map((axis) => (
              <li key={axis.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-semibold text-white">{axis.label}</span>
                <span className="shrink-0 text-[#5EDCC3]">
                  {axis.score} · {axis.mastery.replace(/^Maîtrise\s+/i, "")}
                </span>
              </li>
            ))
          )}
        </ul>
      </SectionCard>

      <SectionCard color="#F5C85C">
        <SectionHeader
          icon={Sparkles}
          color="#F5C85C"
          title="Soft skills"
          subtitle={
            formatDay(results.soft_skills_at)
              ? `Passé le ${formatDay(results.soft_skills_at)}`
              : "Compétences transverses"
          }
        />
        <ul className="space-y-2 px-6 pb-6 pt-4">
          {soft.length === 0 ? (
            <li className="text-sm text-[#9AA3BD]">Non passé</li>
          ) : (
            soft.map((item) => (
              <li key={item.skill} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate font-semibold text-white">{item.skill}</span>
                <span className="shrink-0 text-[#F5C85C]">{Math.round(item.score)}/15</span>
              </li>
            ))
          )}
        </ul>
      </SectionCard>
    </div>
    </div>
  );
}
