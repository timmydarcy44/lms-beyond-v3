import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { getJessicaDashboardStats } from "@/lib/queries/jessica-dashboard";
import { JessicaDashboardClient } from "./dashboard-client";
import { JessicaSuperPage, JessicaSuperStatCard } from "@/components/jessica-contentin/super/jessica-super-ui";
import { TrendingUp, ShoppingCart, Users, Euro, Eye, AlertCircle } from "lucide-react";

export const revalidate = 0;

export default async function JessicaDashboardPage() {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) redirect("/dashboard");

  const supabase = await getServerClient();
  if (!supabase) redirect("/dashboard");

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user?.email !== "contentin.cabinet@gmail.com") redirect("/super");

  const stats = await getJessicaDashboardStats();

  return (
    <JessicaSuperPage title="Dashboard" subtitle="Vue d'ensemble de votre activité">
      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <JessicaSuperStatCard
          label="Chiffre d'affaires total"
          value={`${stats.totalRevenue.toFixed(2)}€`}
          accent
          icon={<Euro className="h-5 w-5" />}
          hint={
            <span className="flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5" />
              {stats.revenueLast30d.toFixed(2)}€ sur 30j
            </span>
          }
        />
        <JessicaSuperStatCard
          label="Visiteurs uniques"
          value={stats.uniqueVisitors}
          icon={<Eye className="h-5 w-5" />}
          hint={`${stats.visitsLast7d} visites (7j)`}
        />
        <JessicaSuperStatCard
          label="Paniers actifs"
          value={stats.activeCarts}
          icon={<ShoppingCart className="h-5 w-5" />}
          hint={`${stats.cartsInProgress} en cours`}
        />
        <JessicaSuperStatCard
          label="Commandes totales"
          value={stats.totalOrders}
          icon={<Users className="h-5 w-5" />}
          hint={`${stats.ordersLast7d} cette semaine`}
        />
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        <JessicaSuperStatCard
          label="Paniers abandonnés"
          value={stats.abandonedCarts}
          accent
          icon={<AlertCircle className="h-5 w-5" />}
          hint="Paniers non modifiés depuis 24h"
        />
        <JessicaSuperStatCard
          label="Panier moyen"
          value={`${stats.averageOrderValue.toFixed(2)}€`}
          accent
          icon={<TrendingUp className="h-5 w-5" />}
          hint="Valeur moyenne par commande"
        />
      </div>

      <JessicaDashboardClient stats={stats} />
    </JessicaSuperPage>
  );
}
