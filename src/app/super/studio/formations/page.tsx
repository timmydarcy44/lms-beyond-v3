import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server";

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

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Récupérer toutes les formations créées par les super admins
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, slug, status, created_at, updated_at")
    .eq("creator_id", user.id)
    .order("updated_at", { ascending: false });

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

