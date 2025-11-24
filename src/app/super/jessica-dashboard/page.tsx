import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { getJessicaDashboardStats } from "@/lib/queries/jessica-dashboard";
import { JessicaDashboardClient } from "./dashboard-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ShoppingCart, Users, Euro, Eye, AlertCircle, Clock } from "lucide-react";

export const revalidate = 0;

export default async function JessicaDashboardPage() {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    redirect("/dashboard");
  }

  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/dashboard");
  }

  const { data: { user } } = await supabase.auth.getUser();
  const isContentin = user?.email === "contentin.cabinet@gmail.com";

  if (!isContentin) {
    redirect("/super");
  }

  const stats = await getJessicaDashboardStats();

  return (
    <div className="min-h-screen bg-[#F8F5F0]">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 
            className="text-4xl font-bold mb-2"
            style={{ color: "#2F2A25" }}
          >
            Dashboard
          </h1>
          <p 
            className="text-lg"
            style={{ color: "#2F2A25", opacity: 0.7 }}
          >
            Vue d'ensemble de votre activité
          </p>
        </div>

        {/* KPIs Principaux */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* CA Total */}
          <Card
            className="rounded-2xl border-2"
            style={{
              borderColor: "#E6D9C6",
              backgroundColor: "#FFFFFF",
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: "#2F2A25", opacity: 0.7 }}>
                    Chiffre d'affaires total
                  </p>
                  <p className="text-3xl font-bold" style={{ color: "#C6A664" }}>
                    {stats.totalRevenue.toFixed(2)}€
                  </p>
                </div>
                <div
                  className="p-3 rounded-full"
                  style={{ backgroundColor: "#C6A66420" }}
                >
                  <Euro className="h-6 w-6" style={{ color: "#C6A664" }} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4" style={{ color: "#C6A664" }} />
                <span style={{ color: "#2F2A25", opacity: 0.7 }}>
                  {stats.revenueLast30d.toFixed(2)}€ sur 30j
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Visiteurs */}
          <Card
            className="rounded-2xl border-2"
            style={{
              borderColor: "#E6D9C6",
              backgroundColor: "#FFFFFF",
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: "#2F2A25", opacity: 0.7 }}>
                    Visiteurs uniques
                  </p>
                  <p className="text-3xl font-bold" style={{ color: "#2F2A25" }}>
                    {stats.uniqueVisitors}
                  </p>
                </div>
                <div
                  className="p-3 rounded-full"
                  style={{ backgroundColor: "#C6A66420" }}
                >
                  <Eye className="h-6 w-6" style={{ color: "#C6A664" }} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span style={{ color: "#2F2A25", opacity: 0.7 }}>
                  {stats.visitsLast7d} visites (7j)
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Paniers actifs */}
          <Card
            className="rounded-2xl border-2"
            style={{
              borderColor: "#E6D9C6",
              backgroundColor: "#FFFFFF",
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: "#2F2A25", opacity: 0.7 }}>
                    Paniers actifs
                  </p>
                  <p className="text-3xl font-bold" style={{ color: "#2F2A25" }}>
                    {stats.activeCarts}
                  </p>
                </div>
                <div
                  className="p-3 rounded-full"
                  style={{ backgroundColor: "#C6A66420" }}
                >
                  <ShoppingCart className="h-6 w-6" style={{ color: "#C6A664" }} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span style={{ color: "#2F2A25", opacity: 0.7 }}>
                  {stats.cartsInProgress} en cours
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Commandes */}
          <Card
            className="rounded-2xl border-2"
            style={{
              borderColor: "#E6D9C6",
              backgroundColor: "#FFFFFF",
            }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium mb-1" style={{ color: "#2F2A25", opacity: 0.7 }}>
                    Commandes totales
                  </p>
                  <p className="text-3xl font-bold" style={{ color: "#2F2A25" }}>
                    {stats.totalOrders}
                  </p>
                </div>
                <div
                  className="p-3 rounded-full"
                  style={{ backgroundColor: "#C6A66420" }}
                >
                  <Users className="h-6 w-6" style={{ color: "#C6A664" }} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-2 text-sm">
                <span style={{ color: "#2F2A25", opacity: 0.7 }}>
                  {stats.ordersLast7d} cette semaine
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Métriques détaillées */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Paniers abandonnés */}
          <Card
            className="rounded-2xl border-2"
            style={{
              borderColor: "#E6D9C6",
              backgroundColor: "#FFFFFF",
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: "#2F2A25" }}>Paniers abandonnés</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold mb-2" style={{ color: "#C6A664" }}>
                    {stats.abandonedCarts}
                  </p>
                  <p className="text-sm" style={{ color: "#2F2A25", opacity: 0.7 }}>
                    Paniers non modifiés depuis 24h
                  </p>
                </div>
                <AlertCircle className="h-12 w-12" style={{ color: "#C6A664", opacity: 0.3 }} />
              </div>
            </CardContent>
          </Card>

          {/* Panier moyen */}
          <Card
            className="rounded-2xl border-2"
            style={{
              borderColor: "#E6D9C6",
              backgroundColor: "#FFFFFF",
            }}
          >
            <CardHeader>
              <CardTitle style={{ color: "#2F2A25" }}>Panier moyen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-4xl font-bold mb-2" style={{ color: "#C6A664" }}>
                    {stats.averageOrderValue.toFixed(2)}€
                  </p>
                  <p className="text-sm" style={{ color: "#2F2A25", opacity: 0.7 }}>
                    Valeur moyenne par commande
                  </p>
                </div>
                <TrendingUp className="h-12 w-12" style={{ color: "#C6A664", opacity: 0.3 }} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Composant client pour graphiques */}
        <JessicaDashboardClient stats={stats} />
      </div>
    </div>
  );
}

