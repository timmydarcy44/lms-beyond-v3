"use client";

import { ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { TurnHistoryEntry } from "@/modules/beyond-play";

type DebriefPanelProps = {
  previousEntry?: TurnHistoryEntry;
};

type Tone = "neutral" | "positive" | "warning" | "danger";

type Metric = {
  id: string;
  label: string;
  value: string;
  helper?: string;
  tone?: Tone;
};

const METRIC_TONE_CLASSES: Record<Tone, string> = {
  neutral: "border-white/10 bg-white/5",
  positive: "border-emerald-400/40 bg-emerald-500/10",
  warning: "border-amber-400/40 bg-amber-500/10",
  danger: "border-red-400/40 bg-red-500/10",
};

export function DebriefPanel({ previousEntry }: DebriefPanelProps) {
  if (!previousEntry) {
    return null;
  }

  const { result } = previousEntry;
  const feedback = result.feedback;
  const reactions = result.reactions ?? [];
  const kpis = result.nextState.kpis;
  const merch = kpis.merchandising;
  const matchday = kpis.matchday;
  const transverse = kpis.transverse;
  const sponsoring = kpis.sponsoring;
  const pricingFlags = result.pricingFlags ?? {};
  const deals = sponsoring.deals ?? [];

  const insights = [
    feedback.supportersFeedback,
    feedback.managementFeedback,
    feedback.brandFeedback,
  ];

  const merchMetrics: Metric[] = [
    {
      id: "merch-units",
      label: "Maillots vendus",
      value: merch.jerseyUnitsSold.toLocaleString("fr-FR"),
      helper: `Stock restant ${merch.jerseyStockRemaining.toLocaleString("fr-FR")} u.`,
      tone: "neutral" as Tone,
    },
    {
      id: "merch-margin",
      label: "Marge merchandising",
      value: formatEuro(merch.jerseyGrossMargin, { sign: true }),
      helper: `Taux ${formatPercent(merch.jerseyGrossMarginRate)}`,
      tone:
        merch.jerseyGrossMarginRate >= 0.25
          ? "positive"
          : merch.jerseyGrossMarginRate > 0
            ? "warning"
            : "danger",
    },
    {
      id: "merch-inventory",
      label: "Stock immobilisé",
      value: formatEuro(merch.jerseyInventoryValue),
      tone:
        merch.jerseyInventoryValue > transverse.cash * 0.3
          ? "warning"
          : ("neutral" as Tone),
    },
  ];

  const matchdayMetrics: Metric[] = [
    {
      id: "matchday-profit",
      label: "Profit matchday",
      value: formatEuro(matchday.matchdayGrossProfit, { sign: true }),
      helper: `Taux ${formatPercent(matchday.matchdayGrossMarginRate)}`,
      tone: matchday.matchdayGrossProfit >= 0 ? ("positive" as Tone) : ("danger" as Tone),
    },
    {
      id: "vip-profit",
      label: "Profit hospitalités",
      value: formatEuro(matchday.vipGrossProfit, { sign: true }),
      helper: `Revenus ${formatEuro(matchday.vipRevenueTotal)}`,
      tone: matchday.vipGrossProfit >= 0 ? ("positive" as Tone) : ("warning" as Tone),
    },
    {
      id: "attendance",
      label: "Affluence",
      value: `${matchday.attendance.toLocaleString("fr-FR")} spectateurs`,
      helper: `Remplissage ${formatPercent(matchday.fillRate)}`,
      tone: "neutral" as Tone,
    },
  ];

  const sponsorMetrics: Metric[] = [
    {
      id: "sponsor-total",
      label: "CA sponsoring",
      value: formatEuro(sponsoring.totalRevenue),
      tone: "neutral" as Tone,
    },
    {
      id: "sponsor-stadium",
      label: "Ventes stade",
      value: formatEuro(sponsoring.stadiumRevenue),
      helper: formatSalesSummary({
        ledMatches: sponsoring.stadiumSales.ledMatches,
        screenMatches: sponsoring.stadiumSales.screenMatches,
        matchdayPacks: sponsoring.stadiumSales.matchdayPacks,
      }),
      tone: sponsoring.stadiumRevenue > 0 ? ("positive" as Tone) : ("warning" as Tone),
    },
    {
      id: "sponsor-social",
      label: "Ventes digitales",
      value: formatEuro(sponsoring.socialRevenue),
      helper: formatSalesSummary({
        instagramPosts: sponsoring.socialSales.instagramPosts,
        instagramStories: sponsoring.socialSales.instagramStories,
        socialPacks: sponsoring.socialSales.socialPacks,
      }),
      tone: sponsoring.socialRevenue > 0 ? ("positive" as Tone) : ("warning" as Tone),
    },
    {
      id: "sponsor-brand",
      label: "Impact image",
      value: `${formatSignedNumber(sponsoring.brandImpactDelta)} pts`,
      helper: `Positionnement ${formatPercent(sponsoring.pricingPositioningScore)}`,
      tone:
        sponsoring.brandImpactDelta >= 0
          ? sponsoring.brandImpactDelta > 2
            ? ("positive" as Tone)
            : ("neutral" as Tone)
          : ("warning" as Tone),
    },
    {
      id: "cash",
      label: "Cash fin de tour",
      value: formatEuro(transverse.cash),
      helper: `Δ ${formatEuro(transverse.cashDeltaThisTurn, { sign: true })}`,
      tone: transverse.cashDeltaThisTurn >= 0 ? ("positive" as Tone) : ("warning" as Tone),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-white/10 bg-slate-900/70 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Débrief du tour précédent</CardTitle>
          <CardDescription>
            Analyse pédagogique fournie par le Game Master, synthèse KPI et réactions internes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold uppercase tracking-wide text-white/60">
              Synthèse Game Master
            </h4>
            <p className="mt-2 text-base text-white/80">{feedback.summary}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {merchMetrics.map((metric) => (
              <MetricTile key={metric.id} {...metric} />
            ))}
            {matchdayMetrics.map((metric) => (
              <MetricTile key={metric.id} {...metric} />
            ))}
            {sponsorMetrics.map((metric) => (
              <MetricTile key={metric.id} {...metric} />
            ))}
          </div>

          <MarketContext pricingFlags={pricingFlags} />

          <InsightsList insights={insights} />

      <DealsList deals={deals} />

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-wide text-white/60">
              Réactions internes
            </h4>
            {reactions.length === 0 ? (
              <p className="text-sm text-white/70">Aucune réaction notable sur ce tour.</p>
            ) : (
              <div className="space-y-3">
                {reactions.map((reaction) => (
                  <div
                    key={reaction.id}
                    className="rounded-xl border border-white/10 bg-white/5 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs uppercase tracking-wide">
                      <Badge variant="outline" className="border-white/20 bg-white/5 text-white/80">
                        {reactionChannelLabel(reaction.channel)}
                      </Badge>
                      <Badge
                        className={reactionSeverityClass(reaction.severity)}
                      >
                        {reactionSeverityLabel(reaction.severity)}
                      </Badge>
                    </div>
                    <p className="mt-3 text-sm font-semibold text-white">{reaction.title}</p>
                    <p className="mt-2 text-sm text-white/70">{reaction.body}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function MarketContext({ pricingFlags }: { pricingFlags: Record<string, boolean> }) {
  const notes: ReactNode[] = [];

  if (pricingFlags.stadiumAdvertisingExtreme) {
    notes.push(
      <span>
        Les partenaires comparent vos tarifs stade à ceux des clubs voisins (basket Pro&nbsp;B,
        rugby). Votre grille se démarque fortement, d’où des ventes plus contrastées.
      </span>,
    );
  }
  if (pricingFlags.socialAdvertisingExtreme) {
    notes.push(
      <span>
        Sur les packs digitaux, l’écart avec les benchmarks concurrents (comptes à portée plus forte
        ou plus faible) est perceptible. Les agences médias s’y réfèrent lors des arbitrages.
      </span>,
    );
  }
  if (pricingFlags.ticketPriceExtreme || pricingFlags.vipPriceExtreme) {
    notes.push(
      <span>
        La politique billetterie/hospitalités reste scrutée : un prix trop éloigné du marché impacte
        l’attractivité globale du matchday.
      </span>,
    );
  }
  if (pricingFlags.jerseyPriceExtreme) {
    notes.push(
      <span>
        Les prix maillot très disruptifs rejaillissent sur la perception marketing de vos offres
        partenaires.
      </span>,
    );
  }

  if (notes.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-white/60">
        Lecture marché
      </h4>
      <ul className="space-y-2">
        {notes.map((note, index) => (
          <li
            key={`market-note-${index}`}
            className="rounded-lg border border-blue-400/20 bg-blue-500/10 p-3 text-sm text-white/75"
          >
            {note}
          </li>
        ))}
      </ul>
    </div>
  );
}

function MetricTile({
  label,
  value,
  helper,
  tone = "neutral",
}: {
  label: string;
  value: string;
  helper?: string;
  tone?: Tone;
}) {
  return (
    <div className={`rounded-xl border p-4 text-sm text-white ${METRIC_TONE_CLASSES[tone]}`}>
      <p className="text-xs uppercase tracking-wide text-white/50">{label}</p>
      <p className="mt-2 text-xl font-semibold text-white">{value}</p>
      {helper ? <p className="text-xs text-white/60">{helper}</p> : null}
    </div>
  );
}

function InsightsList({ insights }: { insights: string[] }) {
  const filtered = insights.filter(Boolean);
  if (filtered.length === 0) {
    return null;
  }
  return (
    <div>
      <h4 className="text-sm font-semibold uppercase tracking-wide text-white/60">
        Points pédagogiques
      </h4>
      <ul className="mt-3 space-y-2">
        {filtered.map((line, idx) => (
          <li key={idx} className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/75">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function formatEuro(
  value: number,
  options?: { decimals?: number; sign?: boolean },
): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  const { decimals = 0, sign = false } = options ?? {};
  const formatter = new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: sign ? "exceptZero" : "auto",
  });
  return formatter.format(value);
}

function formatPercent(value: number, options?: { decimals?: number }): string {
  if (!Number.isFinite(value)) {
    return "—";
  }
  const { decimals = 0 } = options ?? {};
  const formatter = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return `${formatter.format(value * 100)} %`;
}

function formatSignedNumber(value: number, decimals = 1): string {
  if (!Number.isFinite(value)) {
    return "0";
  }
  const formatter = new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
    signDisplay: "exceptZero",
  });
  return formatter.format(value);
}

function reactionSeverityLabel(severity: "LOW" | "MEDIUM" | "HIGH"): string {
  switch (severity) {
    case "HIGH":
      return "Sévérité haute";
    case "MEDIUM":
      return "Sévérité moyenne";
    default:
      return "Sévérité basse";
  }
}

function reactionSeverityClass(severity: "LOW" | "MEDIUM" | "HIGH"): string {
  switch (severity) {
    case "HIGH":
      return "border-red-400/40 bg-red-500/10 text-red-100";
    case "MEDIUM":
      return "border-amber-400/40 bg-amber-500/10 text-amber-100";
    default:
      return "border-emerald-400/40 bg-emerald-500/10 text-emerald-100";
  }
}

function reactionChannelLabel(channel: string): string {
  switch (channel) {
    case "FANS":
      return "Supporters";
    case "BOARD":
      return "Direction";
    case "MEDIA":
      return "Médias";
    case "OPERATIONS":
      return "Opérations";
    default:
      return channel;
  }
}

function formatSalesSummary(entries: {
  ledMatches?: number;
  screenMatches?: number;
  matchdayPacks?: number;
  instagramPosts?: number;
  instagramStories?: number;
  socialPacks?: number;
}): string {
  const parts: string[] = [];
  if (entries.ledMatches) {
    parts.push(`${entries.ledMatches} LED`);
  }
  if (entries.screenMatches) {
    parts.push(`${entries.screenMatches} écrans`);
  }
  if (entries.matchdayPacks) {
    parts.push(`${entries.matchdayPacks} packs matchday`);
  }
  if (entries.instagramPosts) {
    parts.push(`${entries.instagramPosts} posts`);
  }
  if (entries.instagramStories) {
    parts.push(`${entries.instagramStories} stories`);
  }
  if (entries.socialPacks) {
    parts.push(`${entries.socialPacks} packs social`);
  }
  if (parts.length === 0) {
    return "Aucune vente";
  }
  return parts.join(" · ");
}

function DealsList({ deals }: { deals: Array<{ channel: "STADIUM" | "SOCIAL"; product: string; outcome: "WON" | "LOST"; reason: string }> }) {
  if (!deals || deals.length === 0) {
    return null;
  }
  return (
    <div className="space-y-2">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-white/60">
        Deals significatifs
      </h4>
      <ul className="space-y-1">
        {deals.slice(0, 3).map((deal, index) => (
          <li
            key={`deal-${index}`}
            className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-white/80"
          >
            <span className="font-semibold text-white">
              {deal.channel === "STADIUM" ? "Stade" : "Digital"} · {deal.product}
            </span>{" "}
            — {deal.outcome === "WON" ? "Deal conclu" : "Deal perdu"} : {deal.reason}
          </li>
        ))}
      </ul>
    </div>
  );
}

