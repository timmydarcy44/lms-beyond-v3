"use client";

import type { JessicaDashboardStats } from "@/lib/queries/jessica-dashboard";
import { JessicaSuperCard } from "@/components/jessica-contentin/super/jessica-super-ui";
import { jessicaSuper } from "@/lib/jessica-contentin/super-theme";
import { TrendingUp, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

type JessicaDashboardClientProps = {
  stats: JessicaDashboardStats;
};

function PeriodRow({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Calendar;
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className={cn(jessicaSuper.rowMuted, "flex items-center justify-between")}>
      <div className="flex items-center gap-3 text-black">
        <Icon className="h-5 w-5 text-neutral-400" />
        <span>{label}</span>
      </div>
      <span className={cn("text-xl font-semibold", accent ? "text-transparent bg-clip-text bg-gradient-to-r from-[#1E1B4B] to-[#7C3AED]" : "text-black")}>
        {value}
      </span>
    </div>
  );
}

export function JessicaDashboardClient({ stats }: JessicaDashboardClientProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <JessicaSuperCard title="Chiffre d'affaires">
        <div className="space-y-3">
          <PeriodRow icon={Calendar} label="7 derniers jours" value={`${stats.revenueLast7d.toFixed(2)}€`} accent />
          <PeriodRow icon={Calendar} label="30 derniers jours" value={`${stats.revenueLast30d.toFixed(2)}€`} accent />
          <PeriodRow icon={Calendar} label="Mois dernier" value={`${stats.revenueLastMonth.toFixed(2)}€`} accent />
        </div>
      </JessicaSuperCard>

      <JessicaSuperCard title="Commandes">
        <div className="space-y-3">
          <PeriodRow icon={TrendingUp} label="7 derniers jours" value={String(stats.ordersLast7d)} />
          <PeriodRow icon={TrendingUp} label="30 derniers jours" value={String(stats.ordersLast30d)} />
          <PeriodRow icon={TrendingUp} label="Total" value={String(stats.totalOrders)} />
        </div>
      </JessicaSuperCard>
    </div>
  );
}
