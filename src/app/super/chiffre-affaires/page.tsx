import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DollarSign, TrendingUp, Cpu, Activity, Clock3 } from "lucide-react";

import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

const TABLE_NOT_FOUND_CODE = "42P01";

function formatCurrency(value: number): string {
  return value.toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export const dynamic = 'force-dynamic';

export default async function ChiffreAffairesPage() {
  const supabase = await getServiceRoleClientOrFallback();

  let aiExpensesTotal = 0;
  let aiExpenses30Days = 0;
  let aiExpenses7Days = 0;
  let aiEventsCount = 0;
  let tableMissing = false;
  let latestEvents:
    | Array<{
        id: string;
        created_at: string;
        action: string | null;
        provider: string | null;
        model: string | null;
        cost_eur: number | null;
      }>
    | null = null;

  if (supabase) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [{ data: totalData, error: totalError }, { data: monthData, error: monthError }, { data: weekData, error: weekError }, { count, error: countError }, { data: eventsData, error: eventsError }] =
      await Promise.all([
        supabase.from("ai_usage_events").select("total:sum(cost_eur)").single(),
        supabase.from("ai_usage_events").select("total:sum(cost_eur)").gte("created_at", thirtyDaysAgo).single(),
        supabase.from("ai_usage_events").select("total:sum(cost_eur)").gte("created_at", sevenDaysAgo).single(),
        supabase.from("ai_usage_events").select("id", { count: "exact", head: true }),
        supabase
          .from("ai_usage_events")
          .select("id, created_at, action, provider, model, cost_eur")
          .order("created_at", { ascending: false })
          .limit(8),
      ]);

    const errors = [totalError, monthError, weekError, countError, eventsError].filter(Boolean);
    if (errors.some((err) => err && err.code === TABLE_NOT_FOUND_CODE)) {
      tableMissing = true;
    } else {
      aiExpensesTotal = Number(totalData?.total ?? 0);
      aiExpenses30Days = Number(monthData?.total ?? 0);
      aiExpenses7Days = Number(weekData?.total ?? 0);
      aiEventsCount = count ?? 0;
      latestEvents = eventsData ?? [];
    }
  }

  const averageExpense =
    aiExpenses30Days > 0
      ? aiExpenses30Days / 30
      : aiExpensesTotal > 0
        ? aiExpensesTotal / Math.max(aiEventsCount, 1)
        : 0;

  const hasExpenses = aiExpensesTotal > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center justify-center space-y-4 py-8">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
          Pilotage Financier
        </h1>
        <p className="text-sm text-gray-600 text-center">
          Visualisez vos revenus et maîtrisez vos dépenses IA en temps réel.
        </p>
      </div>

      <Tabs defaultValue="revenu" className="space-y-6">
        <TabsList>
          <TabsTrigger value="revenu">Chiffre d&apos;affaires</TabsTrigger>
          <TabsTrigger value="ai">Dépenses IA</TabsTrigger>
        </TabsList>

        <TabsContent value="revenu" className="space-y-8">
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="border-gray-200 bg-gradient-to-br from-white to-green-50/30 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  CA Total
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-green-700 bg-clip-text text-transparent">
                    €0
                  </div>
                  <p className="text-sm text-gray-500">Tous temps</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-gradient-to-br from-white to-blue-50/30 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  CA Mensuel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-blue-700 bg-clip-text text-transparent">
                    €0
                  </div>
                  <p className="text-sm text-gray-500">Ce mois</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-gradient-to-br from-white to-purple-50/30 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  CA Journalier
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-baseline gap-2">
                  <div className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-purple-700 bg-clip-text text-transparent">
                    €0
                  </div>
                  <p className="text-sm text-gray-500">Aujourd&apos;hui</p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-gradient-to-br from-white to-orange-50/30 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Tendance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold text-gray-900">+0%</p>
                    <p className="text-xs text-gray-500">vs mois précédent</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Évolution du CA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64 text-gray-400">
                  <div className="text-center">
                    <DollarSign className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">Graphique à venir</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Répartition par Organisation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-center h-64 text-gray-400">
                  <div className="text-center">
                    <DollarSign className="h-12 w-12 mx-auto mb-2" />
                    <p className="text-sm">Graphique à venir</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="border-gray-200 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold text-gray-900">Transactions Récentes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center py-16 text-gray-400">
                <div className="text-center">
                  <DollarSign className="h-12 w-12 mx-auto mb-2" />
                  <p className="text-sm">Tableau des transactions à venir</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai" className="space-y-8">
          <div className="grid gap-6 md:grid-cols-4">
            <Card className="border-gray-200 bg-gradient-to-br from-white to-zinc-50 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Dépenses IA (Total)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Cpu className="h-8 w-8 text-zinc-600" />
                  <div className="text-3xl font-bold text-zinc-900">
                    {formatCurrency(aiExpensesTotal)}
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">Cumul depuis la première utilisation</p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-gradient-to-br from-white to-blue-50/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  30 Derniers jours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Activity className="h-8 w-8 text-blue-500" />
                  <div className="text-3xl font-bold text-blue-700">
                    {formatCurrency(aiExpenses30Days)}
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">Coût moyen / jour : {formatCurrency(averageExpense)}</p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-gradient-to-br from-white to-purple-50/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  7 Derniers jours
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-8 w-8 text-purple-500" />
                  <div className="text-3xl font-bold text-purple-700">
                    {formatCurrency(aiExpenses7Days)}
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">Comparaison hebdomadaire</p>
              </CardContent>
            </Card>

            <Card className="border-gray-200 bg-gradient-to-br from-white to-amber-50/40 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  Appels IA Enregistrés
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <Clock3 className="h-8 w-8 text-amber-500" />
                  <div className="text-3xl font-bold text-amber-700">
                    {aiEventsCount}
                  </div>
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Dernier appel enregistré : {latestEvents?.[0]?.created_at ? new Date(latestEvents[0].created_at).toLocaleString("fr-FR") : "n/a"}
                </p>
              </CardContent>
            </Card>
          </div>

          {tableMissing ? (
            <Card className="border-red-200 bg-red-50/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm font-semibold text-red-700">
                  Table `ai_usage_events` introuvable
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-red-700">
                <p>
                  Les dépenses IA ne peuvent pas être calculées tant que la migration{" "}
                  <code className="rounded bg-red-100 px-1.5 py-0.5 text-xs font-semibold">006_create_lesson_ai_transformations.sql</code>{" "}
                  (et la table `ai_usage_events`) n&apos;ont pas été appliquées dans Supabase.
                </p>
                <p className="text-xs text-red-600/80">
                  Exécutez <code>supabase db push</code> ou appliquez la migration depuis le dashboard Supabase, puis actualisez cette page.
                </p>
              </CardContent>
            </Card>
          ) : hasExpenses ? (
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Historique des appels IA</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {latestEvents?.map((event) => (
                  <div
                    key={event.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3 text-sm"
                  >
                    <div className="flex items-center gap-2 font-medium text-gray-800">
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide text-gray-600">
                        {event.action || "inconnue"}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(event.created_at).toLocaleString("fr-FR")}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Modèle : {event.model ?? "—"}</span>
                      <span>Provider : {event.provider ?? "—"}</span>
                      <span className="font-semibold text-gray-800">
                        {formatCurrency(event.cost_eur ?? 0)}
                      </span>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="border-gray-200 bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-gray-900">Aucune dépense IA enregistrée</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-600">
                Les appels IA seront automatiquement comptabilisés ici dès qu&apos;un utilisateur utilisera une fonctionnalité alimentée par OpenAI ou Anthropic.
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

