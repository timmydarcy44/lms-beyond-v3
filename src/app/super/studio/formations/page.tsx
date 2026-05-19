import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getServerClient, getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SuperAdminFormationsPage() {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  const supabase = await getServerClient();
  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const baseSelect =
    "id, title, slug, status, created_at, updated_at, org_id, organizations(name,slug)";

  /**
   * Les politiques RLS sur `courses` authentifient souvent seulement `profiles.role = 'admin'`,
   * pas `super_admin` : avec le client « user », la liste est vide en prod pour un super admin.
   * Même logique que /super/organisations : service role pour lire toutes les lignes.
   */
  const service = await getServiceRoleClientOrFallback();
  const db = service ?? supabase;
  const seeAllCourses = Boolean(service);

  let query = db.from("courses").select(baseSelect).order("updated_at", { ascending: false });
  if (!seeAllCourses) {
    query = query.eq("creator_id", user.id);
  }

  const { data: courses } = await query;

  return (
    <main className="mx-auto max-w-7xl px-6 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 mb-2" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
            Formations
          </h1>
          <p className="text-gray-600 text-sm" style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif' }}>
            Gérez vos formations qui seront disponibles dans les catalogues
          </p>
        </div>
        <Button asChild>
          <Link href="/super/studio/formations/new">
            <Plus className="mr-2 h-4 w-4" />
            Créer une formation
          </Link>
        </Button>
      </div>

      {courses && courses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/super/studio/formations/${course.id}/structure`}
              className="block rounded-lg border border-gray-200 bg-white p-6 hover:shadow-lg transition-shadow"
            >
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{course.title}</h3>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className={course.status === "published" ? "text-green-600" : "text-orange-600"}>
                  {course.status === "published" ? "Publié" : "Brouillon"}
                </span>
                {seeAllCourses ? (
                  <>
                    <span>•</span>
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                      {(course as any)?.organizations?.name ?? "Galaxie inconnue"}
                    </span>
                  </>
                ) : null}
                <span>•</span>
                <span>Modifié le {new Date(course.updated_at).toLocaleDateString("fr-FR")}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center">
          <p className="text-gray-600 mb-4">Aucune formation créée pour le moment</p>
          <Button asChild>
            <Link href="/super/studio/formations/new">
              <Plus className="mr-2 h-4 w-4" />
              Créer votre première formation
            </Link>
          </Button>
        </div>
      )}
    </main>
  );
}

