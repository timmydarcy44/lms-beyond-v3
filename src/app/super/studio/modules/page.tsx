import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import Link from "next/link";
import { Plus, BookOpen, Calendar, TrendingUp } from "lucide-react";
import { ModulesListClient } from "@/components/super-admin/modules-list-client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ModuleSummary = {
  id: string;
  title: string;
  status: string;
  cover_image?: string | null;
  created_at: string;
  updated_at: string;
  creator_id: string;
};

export default async function SuperAdminModulesPage() {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    redirect("/dashboard");
  }

  let supabase = getServiceRoleClient() ?? (await getServiceRoleClientOrFallback());
  if (!supabase) {
    return (
      <div className="min-h-screen bg-[#050506] text-white flex items-center justify-center">
        <p className="text-sm text-white/70">Impossible de se connecter à la base de données.</p>
      </div>
    );
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Filtrer uniquement les modules créés par cet utilisateur (pas ceux d'autres super admins)
  const { data: modulesData } = await supabase
    .from("courses")
    .select("id, title, status, cover_image, created_at, updated_at, creator_id")
    .or(`creator_id.eq.${user.id},owner_id.eq.${user.id}`)
    .order("updated_at", { ascending: false })
    .limit(100);

  const modules = (modulesData ?? []) as ModuleSummary[];
  const moduleIds = modules.map((module) => module.id);

  const [pathRelationsResult, pathsResult, organizationsResult] = await Promise.all([
    moduleIds.length
      ? supabase.from("path_courses").select("path_id, course_id").in("course_id", moduleIds)
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("paths")
      .select("id, title")
      .eq("creator_id", user.id)
      .order("title"),
    supabase.from("organizations").select("id, name").order("name"),
  ]);

  const { data: catalogItemsData } = moduleIds.length
    ? await supabase
        .from("catalog_items")
        .select("id, content_id, is_active, item_type")
        .eq("item_type", "module")
        .in("content_id", moduleIds)
    : { data: [] };

  const catalogItems = catalogItemsData ?? [];
  const catalogItemIds = catalogItems.map((item) => item.id);

  const { data: catalogAccessData } = catalogItemIds.length
    ? await supabase
        .from("catalog_access")
        .select("catalog_item_id, organization_id, access_status")
        .in("catalog_item_id", catalogItemIds)
    : { data: [] };

  const publishedCount = modules.filter((module) => module.status === "published").length;
  const draftCount = modules.filter((module) => module.status === "draft").length;

  return (
    <div className="min-h-screen bg-[#050506] text-white">
      <main className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-12 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-semibold text-white">Modules</h1>
            <p className="text-sm text-white/60">
              Créez vos formations, assignez-les aux parcours et aux organisations, puis poussez-les dans No School.
            </p>
          </div>
          <Link
            href="/super/studio/modules/new/choose"
            className="flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/20"
          >
            <Plus className="h-4 w-4" />
            Nouveau module
          </Link>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between text-sm text-white/70">
              <span>Total modules</span>
              <BookOpen className="h-5 w-5" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-white">{modules.length}</p>
          </div>
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-6">
            <div className="flex items-center justify-between text-sm text-emerald-200">
              <span>Publiés</span>
              <TrendingUp className="h-5 w-5" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-white">{publishedCount}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between text-sm text-white/60">
              <span>Brouillons</span>
              <Calendar className="h-5 w-5" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-white">{draftCount}</p>
          </div>
        </div>

        <ModulesListClient
          modules={modules}
          paths={pathsResult.data ?? []}
          pathRelations={pathRelationsResult.data ?? []}
          organizations={organizationsResult.data ?? []}
          catalogItems={catalogItems}
          catalogAccess={catalogAccessData ?? []}
        />
      </main>
    </div>
  );
}



