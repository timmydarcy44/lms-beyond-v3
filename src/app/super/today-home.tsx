"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Linkedin, Mail, Phone, Users } from "lucide-react";
import { KpiCard, SegmentedFilter } from "@/components/control/chrome";
import { SectionCard } from "@/components/control/ui";
import type { TodayAction, TodayChannel, TodayHome } from "@/lib/control/today";

function formatDay(date: string) {
  return new Date(`${date}T12:00:00`).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

function euros(cents: number) {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(cents / 100);
}

function channelIcon(channel: TodayChannel) {
  if (channel === "linkedin") return <Linkedin className="h-4 w-4" />;
  if (channel === "call") return <Phone className="h-4 w-4" />;
  if (channel === "email") return <Mail className="h-4 w-4" />;
  return <Mail className="h-4 w-4" />;
}

function actionLink(action: TodayAction) {
  if (action.channel === "call" && action.phone) return { label: "Appeler", href: `tel:${action.phone}` };
  if (action.channel === "email" && action.email) return { label: "Écrire", href: `mailto:${action.email}` };
  if (action.channel === "linkedin" && action.linkedin) return { label: "Écrire", href: action.linkedin };
  if (action.email) return { label: "Écrire", href: `mailto:${action.email}` };
  return { label: "Ouvrir", href: `/super/crm/pipeline-btob/${action.id}` };
}

export function TodayHome({ data }: { data: TodayHome }) {
  const router = useRouter();
  const [scope, setScope] = useState<"me" | "team">(
    data.prospects.includes(data.email) || data.actions.some((action) => action.ownerEmail === data.email) ? "me" : "team",
  );
  const [bucket, setBucket] = useState<"late" | "today" | "week">("late");
  const [busy, setBusy] = useState("");
  const today = new Date();
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  const weekEnd = new Date(today);
  weekEnd.setDate(today.getDate() + (7 - (today.getDay() || 7)));
  const weekKey = weekEnd.toISOString().slice(0, 10);
  const mine = (owner: string) => scope === "team" || owner === data.email;

  const actions = data.actions.filter((action) => mine(action.ownerEmail));
  const late = actions.filter((action) => action.date < todayKey);
  const dueToday = actions.filter((action) => action.date === todayKey);
  const week = actions.filter((action) => action.date > todayKey && action.date <= weekKey);
  const shown = (bucket === "late" ? late : bucket === "today" ? dueToday : week).slice(0, 5);
  const prospects = data.prospects.filter(mine).length;
  const opens = data.opens.filter((row) => mine(row.ownerEmail));
  const opened = opens.filter((row) => row.opened).length;
  const maxStage = Math.max(1, ...data.stages.map((stage) => stage.owners.filter(mine).length));

  const dateLabel = today.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

  async function markDone(id: string) {
    setBusy(id);
    await fetch("/api/super/control/today/done", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    setBusy("");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-[1240px] space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm capitalize text-[#9AA3BD]">{dateLabel}</p>
          <h1 className="text-[32px] font-extrabold tracking-[-0.6px]">Bonjour {data.firstName}</h1>
        </div>
        <div className="flex rounded-full border border-[#26304F] p-1">
          {([
            ["me", "Moi"],
            ["team", "Toute l'équipe"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setScope(id)}
              className="rounded-full px-4 py-1.5 text-sm font-semibold"
              style={{ background: scope === id ? "#6E5BFF" : "transparent", color: scope === id ? "#fff" : "#9AA3BD" }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="CA du mois"
          value={data.revenueCents == null ? "—" : euros(data.revenueCents)}
          hint={data.revenueCents == null ? "Relié aux factures" : "Factures du mois"}
          tone="#6E5BFF"
        />
        <KpiCard label="Prospects" value={String(prospects)} icon={<Users className="h-4 w-4" />} />
        <KpiCard label="Actions en retard" value={String(late.length)} valueColor="#FF5C7A" tone="#FF5C7A" hint="À reprogrammer ou traiter" icon={<AlertTriangle className="h-4 w-4" />} />
        <KpiCard label="E-mails ouverts" value={opens.length ? `${opened} / ${opens.length}` : "—"} hint="Catalogues envoyés" tone="#8DB8FF" icon={<Mail className="h-4 w-4" />} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
        <SectionCard
          color="#6E5BFF"
          title="Mes actions"
          subtitle="Les cinq prochaines du filtre"
          action={<Link href="/super/crm/pipeline" className="text-sm text-[#C4BAFF]">Tout voir</Link>}
        >
          <SegmentedFilter
            value={bucket}
            onChange={(id) => setBucket(id as typeof bucket)}
            items={[
              { id: "late", label: "En retard", count: late.length },
              { id: "today", label: "Aujourd'hui", count: dueToday.length },
              { id: "week", label: "Cette semaine", count: week.length },
            ]}
          />
          <ul className="mt-4 divide-y divide-[#1A2340]">
            {shown.length === 0 ? <li className="py-6 text-sm text-[#9AA3BD]">Aucune action dans ce filtre.</li> : null}
            {shown.map((action) => {
              const link = actionLink(action);
              const lateRow = action.date < todayKey;
              return (
                <li key={action.id} className="flex items-center gap-3 py-3">
                  <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[#1A2340] text-[#C9D2E8]">{channelIcon(action.channel)}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{action.title}</span>
                    <span className="block truncate text-[12px] text-[#9AA3BD]">{[action.company, action.contact].filter(Boolean).join(" · ")}</span>
                  </span>
                  <span className="text-sm" style={{ color: lateRow ? "#FF5C7A" : "#C4BAFF" }}>{formatDay(action.date)}</span>
                  <a href={link.href} className="rounded-full border border-[#26304F] px-3 py-1 text-sm">{link.label}</a>
                  <button type="button" disabled={busy === action.id} onClick={() => void markDone(action.id)} className="grid h-8 w-8 place-items-center rounded-full bg-[#163228] text-[#6BE39B]" title="Marquer faite">
                    ✓
                  </button>
                </li>
              );
            })}
          </ul>
        </SectionCard>

        <div className="space-y-4">
          <SectionCard color="#8B7BFF" title="Pipeline B2B" subtitle="Prospects par étape" action={<Link href="/super/crm/pipeline" className="text-sm text-[#C4BAFF]">Ouvrir le pipeline</Link>}>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {data.stages.map((stage) => {
                const count = stage.owners.filter(mine).length;
                return (
                  <div key={stage.slug} className="rounded-2xl border border-[#1A2340] bg-[#0B1122] px-3 py-3">
                    <p className="text-[12px] text-[#9AA3BD]">{stage.label}</p>
                    <p className="mt-1 text-xl font-extrabold">{count}</p>
                    <span className="mt-2 block h-1 overflow-hidden rounded-full bg-[#1A2340]">
                      <span className="block h-full rounded-full bg-[#6E5BFF]" style={{ width: `${Math.round((count / maxStage) * 100)}%` }} />
                    </span>
                  </div>
                );
              })}
            </div>
          </SectionCard>
          <SectionCard color="#F2CF6B" title="Alertes" subtitle="À traiter">
            {data.alerts.length === 0 ? <p className="text-sm text-[#9AA3BD]">Aucune alerte.</p> : null}
            <ul className="space-y-2">
              {data.alerts.map((alert) => (
                <li key={alert.id}>
                  <Link href={alert.href} className="flex items-center justify-between rounded-xl bg-[#0B1122] px-3 py-2 text-sm">
                    <span>{alert.count} {alert.label}</span>
                    <span className="text-[#9AA3BD]">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          </SectionCard>
          <SectionCard color="#5EDCC3" title="CFA · Byound School" subtitle="Admissions">
            <div className="grid grid-cols-3 gap-2">
              <KpiCard label="Candidats" value={String(data.cfa.candidates)} tone="#5EDCC3" />
              <KpiCard label="Actifs" value={String(data.cfa.active)} tone="#5EDCC3" />
              <KpiCard label="À relire" value={String(data.cfa.review)} tone="#F2CF6B" />
            </div>
            <ul className="mt-3 space-y-2 text-sm">
              {data.cfa.withoutCompany > 0 ? (
                <li><Link href="/super/crm/cfa" className="text-[#5EDCC3]">{data.cfa.withoutCompany} candidats sans entreprise d'accueil</Link></li>
              ) : null}
            </ul>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
