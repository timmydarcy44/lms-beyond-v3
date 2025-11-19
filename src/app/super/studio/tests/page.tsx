import { redirect } from "next/navigation";
import { SuperAdminHeaderApple } from "@/components/super-admin/super-admin-header-apple";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback, getServiceRoleClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, ClipboardCheck, TrendingUp, Calendar } from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SuperAdminTestsPage() {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  const supabase = getServiceRoleClient() || await getServiceRoleClientOrFallback();
  
  if (!supabase) {
    return (
      <div className="min-h-screen bg-white">
        <SuperAdminHeaderApple />
        <main className="mx-auto max-w-7xl px-6 py-8">
          <div className="text-center py-12">
            <p className="text-gray-600">Erreur de connexion à la base de données</p>
          </div>
        </main>
      </div>
    );
  }

  // Récupérer l'utilisateur actuel
  const { data: { user } } = await supabase.auth.getUser();
  const creatorId = user?.id;

  // Récupérer les tests créés par le Super Admin
  let { data: tests, error } = await supabase
    .from("tests")
    .select(`
      id,
      title,
      published,
      created_at,
      updated_at,
      creator_id
    `)
    .eq("creator_id", creatorId)
    .order("updated_at", { ascending: false })
    .limit(100);

  if (error) {
    if ((error as any)?.code === "42P01") {
      console.warn("[super-admin/tests] Table tests absente, affichage masqué pour l'instant.");
      tests = [];
    } else {
      console.error("[super-admin/tests] Error fetching tests:", error);
      tests = [];
    }
  }

  const testsList = tests || [];
  const publishedCount = testsList.filter((t: any) => t.published).length;
  const draftCount = testsList.filter((t: any) => !t.published).length;

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Header avec titre et CTA */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 
              className="text-5xl font-semibold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent mb-3"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
            >
              Tests
            </h1>
            <p 
              className="text-gray-600 text-lg"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
            >
              Gérez vos tests et évaluations
            </p>
          </div>
          <Link
            href="/super/studio/tests/new"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg hover:from-blue-700 hover:to-violet-700 transition-all shadow-lg hover:shadow-xl"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Créer un test</span>
          </Link>
        </div>

        {/* Stats en cartes modernes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-600 font-medium" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                Total tests
              </span>
              <ClipboardCheck className="h-6 w-6 text-blue-600" />
            </div>
            <div className="text-4xl font-bold text-blue-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
              {testsList.length}
            </div>
          </div>

          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-600 font-medium" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                Publiés
              </span>
              <TrendingUp className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="text-4xl font-bold text-emerald-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
              {publishedCount}
            </div>
          </div>

          <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 border border-gray-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 font-medium" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                Brouillons
              </span>
              <Calendar className="h-6 w-6 text-gray-600" />
            </div>
            <div className="text-4xl font-bold text-gray-900" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
              {draftCount}
            </div>
          </div>
        </div>

        {/* Liste des tests */}
        {testsList.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 rounded-2xl">
            <ClipboardCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 font-medium mb-2">Aucun test</p>
            <p className="text-gray-500 text-sm">Créez votre premier test pour commencer</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {testsList.map((test: any) => (
              <div
                key={test.id}
                className="bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">{test.title || "Sans titre"}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    test.published 
                      ? "bg-emerald-100 text-emerald-700" 
                      : "bg-gray-100 text-gray-600"
                  }`}>
                    {test.published ? "Publié" : "Brouillon"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400 mb-4">
                  <Calendar className="h-3 w-3" />
                  <span>Mis à jour {new Date(test.updated_at).toLocaleDateString('fr-FR')}</span>
                </div>
                <div className="flex gap-2">
                  <Link
                    href={`/super/studio/tests/${test.id}/edit`}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-violet-600 text-white text-sm font-medium rounded-lg hover:from-blue-700 hover:to-violet-700 transition-all text-center"
                  >
                    Modifier
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
    </main>
  );
}

