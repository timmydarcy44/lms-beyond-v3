"use client";

import { useRouter } from "next/navigation";
import { Download, FileText, Landmark, Plus } from "lucide-react";

import { ExpertPageFrame, ExpertPageHeader, ExpertPrimaryButton, QuickActions, StatusPill, TxList, TxRow } from "@/components/expert/expert-ui";
import { formatEuros, formatSignedEuros, monthKey, monthLabel, recentMonthKeys, revenueForMonth, revenueLinesFromMissions, type ExpertMission } from "@/lib/expert/space-model";

export function RevenusView({ missions, month, invoiceId }: { missions: ExpertMission[]; month: string; invoiceId?: string }) {
  const router = useRouter();
  const now = new Date();
  const keys = recentMonthKeys(now, 3);
  const selected = /^\d{4}-\d{2}$/.test(month) ? month : monthKey(now);
  const report = revenueForMonth(revenueLinesFromMissions(missions), selected);
  const paidShare = report.totalCents ? (report.paidCents / report.totalCents) * 100 : 0;
  const latest = report.toInvoice[0];
  const invoice = missions.find((mission) => mission.id === invoiceId);

  return (
    <ExpertPageFrame>
      <ExpertPageHeader title="Mes revenus" subtitle="Ce que vous avez gagné, ce qui arrive et ce qu'il reste à facturer" action={<ExpertPrimaryButton href={`/dashboard/expert/revenus?facture=${latest?.id ?? ""}`}>Créer une facture</ExpertPrimaryButton>} />
      <section className="relative overflow-hidden rounded-[32px] bg-[#12141A] px-5 py-8 text-center">
        <span className="pointer-events-none absolute left-1/2 top-0 h-48 w-[70%] -translate-x-1/2 bg-[radial-gradient(circle,rgba(255,75,75,0.35),transparent_70%)]" aria-hidden />
        <div className="relative">
          <div className="flex flex-wrap items-center justify-center gap-2">
            {keys.map((key) => {
              const [year, monthIndex] = key.split("-").map(Number);
              const short = new Date(year, (monthIndex || 1) - 1, 1).toLocaleDateString("fr-FR", { month: "short" }).replace(".", "");
              const label = short.charAt(0).toUpperCase() + short.slice(1);
              return (
              <button key={key} type="button" aria-pressed={key === selected} onClick={() => router.push(`/dashboard/expert/revenus?m=${key}`)} className={`h-9 rounded-full px-4 text-sm font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#FFB4B8] ${key === selected ? "bg-[#F4F5F7] text-[#07080B]" : "bg-[#1E2130] text-[#DADDE4]"}`}>
                {label}
              </button>
              );
            })}
            <label className="h-9 rounded-full bg-[#1E2130] px-4 text-sm font-bold leading-9 text-[#DADDE4]">
              Plus
              <input aria-label="Autre mois" type="month" className="sr-only" onChange={(event) => event.target.value && router.push(`/dashboard/expert/revenus?m=${event.target.value}`)} />
            </label>
          </div>
          <p className="mt-6 text-sm text-[#B5BAC6]">Gagné en {monthLabel(selected).toLowerCase()}</p>
          <p className="mt-2 text-[72px] font-extrabold leading-none tracking-[-0.05em] sm:text-[84px]">{formatEuros(report.totalCents)}</p>
          <div className="mx-auto mt-5 h-2 max-w-md overflow-hidden rounded-full bg-white/80">
            <div className="h-full bg-[#FF4B4B]" style={{ width: `${paidShare}%` }} />
          </div>
          <p className="mt-3 text-sm text-[#B5BAC6]">
            <span className="mr-3 inline-block h-2 w-2 rounded-full bg-[#FF4B4B]" />
            {formatEuros(report.paidCents)} versés
            <span className="ml-4 mr-3 inline-block h-2 w-2 rounded-full bg-white" />
            {formatEuros(report.upcomingCents)} à venir
          </p>
          <div className="mt-6 flex justify-center">
            <QuickActions
              actions={[
                { label: "Créer une facture", icon: Plus, href: `/dashboard/expert/revenus?facture=${latest?.id ?? ""}`, tone: "green" },
                { label: "Mes factures", icon: FileText, href: "/dashboard/expert/documents?folder=contrat" },
                { label: "Coordonnées bancaires", icon: Landmark, href: "/dashboard/expert/settings" },
                { label: "Exporter", icon: Download, href: `/api/expert/revenus/export?m=${selected}` },
              ]}
            />
          </div>
        </div>
      </section>
      {invoice ? (
        <article className="mt-4 rounded-[24px] bg-[#12141A] p-5">
          <p className="text-sm text-[#B5BAC6]">Facture préremplie</p>
          <h2 className="mt-1 text-2xl font-extrabold">{invoice.title}</h2>
          <p className="mt-1 text-sm text-[#DADDE4]">{invoice.client} · {formatEuros(invoice.amountCents)}</p>
          <a className="mt-4 inline-flex h-11 items-center rounded-full bg-[#FF4B4B] px-5 text-sm font-extrabold text-[#04140C]" href={`/api/expert/revenus/export?m=${selected}`}>Exporter cette ligne</a>
        </article>
      ) : null}
      {report.toInvoice.length ? (
        <article className="mt-4 flex flex-col gap-3 rounded-[24px] bg-[#3A1418] px-4 py-4 sm:flex-row sm:items-center">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF4B4B] text-sm font-extrabold text-[#04140C]">€</span>
          <div className="min-w-0 flex-1">
            <p className="font-extrabold text-[#FFB4B8]">{report.toInvoice.length} mission{report.toInvoice.length > 1 ? "s" : ""} à facturer · {formatEuros(report.toInvoice.reduce((sum, line) => sum + line.amountCents, 0))}</p>
            {latest ? <p className="text-sm text-[#FFB4B8]">{latest.title} · {latest.client} · aujourd'hui</p> : null}
          </div>
          <ExpertPrimaryButton href={`/dashboard/expert/revenus?facture=${latest?.id ?? ""}`}>Créer la facture</ExpertPrimaryButton>
        </article>
      ) : null}
      <div className="mt-4 space-y-4">
        <TxList title="À venir" meta={formatEuros(report.upcomingCents)}>
          {report.upcoming.map((line) => (
            <TxRow key={line.id} leading={<Dot />} title={line.title} subtitle={line.detail} trailing={<Amount line={line} />} />
          ))}
        </TxList>
        <TxList title="Versé" meta={formatEuros(report.paidCents)}>
          {report.paid.map((line) => (
            <TxRow key={line.id} leading={<Dot soft />} title={line.title} subtitle={line.detail} trailing={<Amount line={line} />} />
          ))}
        </TxList>
      </div>
    </ExpertPageFrame>
  );
}

function Dot({ soft = false }: { soft?: boolean }) {
  return <span className={`flex h-11 w-11 items-center justify-center rounded-full text-xs font-extrabold ${soft ? "bg-[#3A1418] text-[#FFB4B8]" : "bg-[#1E2130] text-[#DADDE4]"}`}>€</span>;
}

function Amount({ line }: { line: { amountCents: number; pill: "paid" | "upcoming" | "to_invoice"; title: string } }) {
  return (
    <span className="flex flex-col items-end gap-1">
      <span className={`text-sm font-extrabold ${line.pill === "paid" ? "text-[#FFB4B8]" : "text-[#F4F5F7]"}`}>{formatSignedEuros(line.amountCents)}</span>
      <StatusPill tone={line.pill === "paid" ? "green" : line.pill === "to_invoice" ? "solid" : "grey"}>
        {line.pill === "paid" ? "Versé" : line.pill === "to_invoice" ? "À facturer" : "À venir"}
      </StatusPill>
    </span>
  );
}
