"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { JessicaDashboardStats } from "@/lib/queries/jessica-dashboard";
import { TrendingUp, Calendar } from "lucide-react";

type JessicaDashboardClientProps = {
  stats: JessicaDashboardStats;
};

export function JessicaDashboardClient({ stats }: JessicaDashboardClientProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* CA par période */}
      <Card
        className="rounded-2xl border-2"
        style={{
          borderColor: "#E6D9C6",
          backgroundColor: "#FFFFFF",
        }}
      >
        <CardHeader>
          <CardTitle style={{ color: "#2F2A25" }}>Chiffre d'affaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: "#F8F5F0" }}>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5" style={{ color: "#C6A664" }} />
                <span style={{ color: "#2F2A25" }}>7 derniers jours</span>
              </div>
              <span className="text-xl font-bold" style={{ color: "#C6A664" }}>
                {stats.revenueLast7d.toFixed(2)}€
              </span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: "#F8F5F0" }}>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5" style={{ color: "#C6A664" }} />
                <span style={{ color: "#2F2A25" }}>30 derniers jours</span>
              </div>
              <span className="text-xl font-bold" style={{ color: "#C6A664" }}>
                {stats.revenueLast30d.toFixed(2)}€
              </span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: "#F8F5F0" }}>
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5" style={{ color: "#C6A664" }} />
                <span style={{ color: "#2F2A25" }}>Mois dernier</span>
              </div>
              <span className="text-xl font-bold" style={{ color: "#C6A664" }}>
                {stats.revenueLastMonth.toFixed(2)}€
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Commandes par période */}
      <Card
        className="rounded-2xl border-2"
        style={{
          borderColor: "#E6D9C6",
          backgroundColor: "#FFFFFF",
        }}
      >
        <CardHeader>
          <CardTitle style={{ color: "#2F2A25" }}>Commandes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: "#F8F5F0" }}>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5" style={{ color: "#C6A664" }} />
                <span style={{ color: "#2F2A25" }}>7 derniers jours</span>
              </div>
              <span className="text-xl font-bold" style={{ color: "#2F2A25" }}>
                {stats.ordersLast7d}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: "#F8F5F0" }}>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5" style={{ color: "#C6A664" }} />
                <span style={{ color: "#2F2A25" }}>30 derniers jours</span>
              </div>
              <span className="text-xl font-bold" style={{ color: "#2F2A25" }}>
                {stats.ordersLast30d}
              </span>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg" style={{ backgroundColor: "#F8F5F0" }}>
              <div className="flex items-center gap-3">
                <TrendingUp className="h-5 w-5" style={{ color: "#C6A664" }} />
                <span style={{ color: "#2F2A25" }}>Total</span>
              </div>
              <span className="text-xl font-bold" style={{ color: "#2F2A25" }}>
                {stats.totalOrders}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

