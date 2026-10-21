"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { decideMission } from "@/app/dashboard/expert/space-actions";
import { ExpertPageFrame, ExpertPageHeader, FilterPills, HeroCard, SegmentBar, StatusPill, TxList, TxRow } from "@/components/expert/expert-ui";
import { dayPhrase, formatEuros, withinJoinWindow, type ExpertMission } from "@/lib/expert/space-model";

const STATUS_PILL = {
  planifiee: { label: "Planifiée", tone: "green" },
  acceptee: { label: "Acceptée", tone: "grey" },
  nouvelle: { label: "Nouvelle", tone: "blue" },
  terminee: { label: "Terminée", tone: "grey" },
  annulee: { label: "Annulée", tone: "alert" },
} as const;

export function MissionsView({ missions, filter }: { missions: ExpertMission[]; filter: "avenir" | "terminees" | "toutes" }) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const now = new Date();
  const active = missions.filter((mission) => mission.status !== "terminee" && mission.status !== "annulee");
  const done = missions.filter((mission) => mission.status === "terminee");
  const requests = active.filter((mission) => mission.status === "nouvelle");
  const next = [...active].filter((mission) => mission.status !== "nouvelle").sort((a, b) => +new Date(a.startsAt) - +new Date(b.startsAt))[0] ?? active[0];
  const visible = filter === "terminees" ? done : filter === "toutes" ? [...active, ...done] : active;

  const decide = async (id: string, decision: "accepted" | "cancelled") => {
    setPending(id);
    try {
      const result = await decideMission({ id, decision });
      if (!result.ok) throw new Error(result.error);
      toast.success(decision === "accepted" ? "Demande acceptée" : "Demande refusée");
      window.dispatchEvent(new Event("expert-nav-refresh"));
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Action impossible");
    } finally {
      setPending(null);
    }
  };

  return (
    <ExpertPageFrame>
      <ExpertPageHeader title="Mes missions" subtitle="Vos interventions à venir, vos demandes et votre historique" />
      <div className="grid gap-4 lg:grid-cols-[1fr_1.25fr]">
        <HeroCard>
          <p className="text-sm font-semibold text-[#B5BAC6]">Missions à venir</p>
          <p className="mt-2 text-[72px] font-extrabold leading-none tracking-[-0.05em]">
            {active.length} <span className="text-[32px] text-[#9096A3]">/ {missions.length}</span>
          </p>
          <div className="mt-4 max-w-xs">
            <SegmentBar total={Math.max(missions.length, 1)} filled={active.length} />
          </div>
          <p className="mt-4 text-sm text-[#B5BAC6]">{done.length} mission{done.length > 1 ? "s" : ""} terminée{done.length > 1 ? "s" : ""} depuis votre inscription</p>
        </HeroCard>
        {next ? (
          <HeroCard tone="green">
            <p className="text-sm font-bold">Prochaine mission · {dayPhrase(next.startsAt, now)}</p>
            <h2 className="mt-2 text-[32px] font-extrabold leading-tight tracking-[-0.04em]">{next.title}</h2>
            <p className="mt-2 text-sm font-semibold">
              {next.client} · {next.format === "visio" ? "Visio" : next.location} · {next.durationLabel} · {formatEuros(next.amountCents)}
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              {next.format === "visio" && withinJoinWindow(next.startsAt, next.endsAt, now) ? (
                <a href={next.visioUrl || "#"} className="inline-flex h-11 items-center rounded-full bg-[#07080B] px-5 text-sm font-extrabold text-[#F4F5F7]">Rejoindre la visio</a>
              ) : (
                <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(next.location)}`} className="inline-flex h-11 items-center rounded-full bg-[#07080B] px-5 text-sm font-extrabold text-[#F4F5F7]">Voir l'itinéraire</a>
              )}
              <a href={`/dashboard/expert/interventions/${next.id}`} className="inline-flex h-11 items-center rounded-full bg-[#04140C]/15 px-5 text-sm font-extrabold text-[#04140C]">Préparer</a>
            </div>
          </HeroCard>
        ) : (
          <HeroCard>
            <p className="text-lg font-extrabold">Aucune mission à venir</p>
            <p className="mt-2 text-sm text-[#B5BAC6]">Les nouvelles demandes apparaîtront ici.</p>
          </HeroCard>
        )}
      </div>
      <div className="mt-4 space-y-3">
        {requests.map((mission, index) => (
          <article key={mission.id} className="flex flex-col gap-3 rounded-[24px] bg-[#132A4D] px-4 py-4 sm:flex-row sm:items-center">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#8DB8FF] text-sm font-extrabold text-[#04140C]">{index + 1}</span>
            <div className="min-w-0 flex-1">
              <p className="font-extrabold text-[#F4F5F7]">Nouvelle demande : {mission.title}</p>
              <p className="text-sm text-[#8DB8FF]">
                {mission.client} · {new Date(mission.startsAt).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "short" })} · {mission.format === "visio" ? "Visio" : mission.location} · {mission.durationLabel} · {formatEuros(mission.amountCents)}
              </p>
            </div>
            <div className="flex gap-2">
              <button type="button" disabled={pending === mission.id} onClick={() => void decide(mission.id, "cancelled")} className="h-10 rounded-full px-4 text-sm font-bold text-[#DADDE4]">Refuser</button>
              <button type="button" disabled={pending === mission.id} onClick={() => void decide(mission.id, "accepted")} className="h-10 rounded-full bg-[#F4F5F7] px-4 text-sm font-extrabold text-[#07080B]">Accepter</button>
            </div>
          </article>
        ))}
      </div>
      <div className="mt-5">
        <FilterPills
          label="Filtrer les missions"
          value={filter}
          onChange={(id) => router.push(id === "avenir" ? "/dashboard/expert/interventions" : `/dashboard/expert/interventions?f=${id}`)}
          options={[{ id: "avenir", label: "À venir" }, { id: "terminees", label: "Terminées" }, { id: "toutes", label: "Toutes" }]}
        />
      </div>
      <div className="mt-4 space-y-4">
        {(["À venir", "Terminées"] as const).map((group) => {
          const rows = group === "À venir" ? visible.filter((mission) => mission.status !== "terminee") : visible.filter((mission) => mission.status === "terminee");
          if (!rows.length) return null;
          return (
            <TxList key={group} title={group} meta={rows.length}>
              {rows.map((mission) => {
                const date = new Date(mission.startsAt);
                const pill = STATUS_PILL[mission.status];
                return (
                  <TxRow
                    key={mission.id}
                    href={`/dashboard/expert/interventions/${mission.id}`}
                    leading={
                      <span className="flex h-[52px] w-12 flex-col items-center justify-center rounded-2xl bg-[#1E2130]">
                        <span className="text-lg font-extrabold leading-none">{date.getDate()}</span>
                        <span className="text-[10px] text-[#9096A3]">{date.toLocaleDateString("fr-FR", { month: "short" })}</span>
                      </span>
                    }
                    title={mission.title}
                    subtitle={`${mission.client} · ${dayPhrase(mission.startsAt, now)} · ${mission.location}`}
                    trailing={
                      <span className="flex flex-col items-end gap-1">
                        <StatusPill tone={pill.tone}>{pill.label}</StatusPill>
                        <span className="text-sm font-extrabold">{formatEuros(mission.amountCents)}</span>
                      </span>
                    }
                  />
                );
              })}
            </TxList>
          );
        })}
      </div>
    </ExpertPageFrame>
  );
}
