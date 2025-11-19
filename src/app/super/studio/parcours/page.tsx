import { redirect } from "next/navigation";
import { SuperAdminHeaderApple } from "@/components/super-admin/super-admin-header-apple";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback, getServiceRoleClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, Route, TrendingUp, Calendar } from "lucide-react";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SuperAdminParcoursPage() {
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

  const baseSelect = `
      id,
      title,
      status,
      created_at,
      updated_at,
      owner_id,
      creator_id
    `;

  let query = supabase.from("paths").select(baseSelect).limit(100);

  if (creatorId) {
    query = query.or(`owner_id.eq.${creatorId},creator_id.eq.${creatorId}`).order("updated_at", { ascending: false });
  } else {
    query = query.order("updated_at", { ascending: false });
  }

  let { data: paths, error } = await query;

  if (error?.code === "42703") {
    console.warn("[super-admin/parcours] paths.updated_at missing, retrying with created_at only");
    let fallbackQuery = supabase
      .from("paths")
      .select(`
        id,
        title,
        status,
        created_at,
        owner_id,
        creator_id
      `)
      .order("created_at", { ascending: false })
      .limit(100);

    if (creatorId) {
      fallbackQuery = fallbackQuery.or(`owner_id.eq.${creatorId},creator_id.eq.${creatorId}`);
    }

    const fallback = await fallbackQuery;
    paths = (fallback.data ?? []).map((p: any) => ({ ...p, updated_at: p.updated_at || p.created_at || new Date().toISOString() }));
    error = fallback.error ?? null;
  } else if (error?.code === "22P02") {
    console.warn("[super-admin/parcours] Invalid UUID in filter, fetching without owner filter");
    const fallback = await supabase
      .from("paths")
      .select(baseSelect)
      .order("updated_at", { ascending: false })
      .limit(100);
    paths = fallback.data ?? [];
    error = fallback.error ?? null;
  }

  if (error) {
    console.error("[super-admin/parcours] Error fetching paths:", error);
    paths = [];
  }

  const pathsList = paths || [];
  const publishedCount = pathsList.filter((p: any) => p.status === "published").length;
  const draftCount = pathsList.filter((p: any) => p.status === "draft").length;

  return (
    <div className="min-h-screen bg-[#050506] text-white">
      <main className="mx-auto max-w-7xl px-6 py-12">
        {/* Header avec titre et CTA */}
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 
              className="text-5xl font-semibold bg-gradient-to-r from-blue-600 to-violet-600 bg-clip-text text-transparent mb-3"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
            >
              Parcours
            </h1>
            <p 
              className="text-white/70 text-lg"
              style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
            >
              Gérez vos parcours de formation
            </p>
          </div>
          <Link
            href="/super/studio/parcours/new"
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-violet-600 text-white rounded-lg hover:from-blue-700 hover:to-violet-700 transition-all shadow-lg hover:shadow-xl"
            style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}
          >
            <Plus className="h-5 w-5" />
            <span className="font-medium">Créer un parcours</span>
          </Link>
        </div>

        {/* Stats en cartes modernes */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="rounded-2xl border border-blue-500/25 bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-blue-200 font-medium" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                Total parcours
              </span>
              <Route className="h-6 w-6 text-blue-200" />
            </div>
            <div className="text-4xl font-bold text-white" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
              {pathsList.length}
            </div>
          </div>

          <div className="rounded-2xl border border-emerald-400/25 bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-emerald-200 font-medium" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                Publiés
              </span>
              <TrendingUp className="h-6 w-6 text-emerald-200" />
            </div>
            <div className="text-4xl font-bold text-white" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
              {publishedCount}
            </div>
          </div>

          <div className="rounded-2xl border border-white/15 bg-white/5 p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/70 font-medium" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
                Brouillons
              </span>
              <Calendar className="h-6 w-6 text-white/70" />
            </div>
            <div className="text-4xl font-bold text-white" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
              {draftCount}
            </div>
          </div>
        </div>

        {/* Liste des parcours */}
        {pathsList.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-white/15 bg-white/5">
            <Route className="h-12 w-12 text-white/40 mx-auto mb-4" />
            <p className="text-white font-medium mb-2">Aucun parcours</p>
            <p className="text-white/70 text-sm">Créez votre premier parcours pour commencer</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pathsList.map((path: any) => (
              <div
                key={path.id}
                className="rounded-xl border border-white/10 bg-white/5 p-6 text-white shadow-lg shadow-black/10 hover:border-white/20 transition"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-lg font-semibold">{path.title || "Sans titre"}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    path.status === "published"
                      ? "bg-emerald-500/20 text-emerald-100" 
                      : "bg-white/10 text-white/70"
                  }`}>
                    {path.status === "published" ? "Publié" : "Brouillon"}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-white/60">
                  <Calendar className="h-3 w-3" />
                  <span>
                    Mis à jour {new Date(path.updated_at ?? path.created_at).toLocaleDateString('fr-FR')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

