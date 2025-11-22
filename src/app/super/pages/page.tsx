import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { PagesListClient } from "@/components/super-admin/cms/pages-list-client";

export default async function PagesPage() {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/dashboard");
  }

  // Récupérer l'utilisateur connecté
  const { data: { user } } = await supabase.auth.getUser();
  const isContentin = user?.email === "contentin.cabinet@gmail.com";

  // Filtrer les pages : contentin ne voit que ses pages, les autres voient toutes les pages
  let query = supabase
    .from("cms_pages")
    .select("*");

  if (isContentin && user?.id) {
    // Pour contentin, filtrer uniquement ses pages (créées par lui OU slug commence par "jessica-contentin")
    query = query.or(`created_by.eq.${user.id},slug.ilike.jessica-contentin%`);
  } else if (!isContentin && user?.id) {
    // Pour les autres super admins, exclure les pages de jessica-contentin
    query = query.not("slug", "ilike", "jessica-contentin%");
  }

  const { data: pages, error } = await query.order("updated_at", { ascending: false });

  if (error) {
    console.error("[pages] Error fetching pages:", error);
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-semibold text-gray-900 mb-2" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
            Gestion des pages
          </h1>
          <p className="text-gray-600" style={{ fontFamily: 'var(--font-geist-sans), system-ui, -apple-system, sans-serif' }}>
            Créez et gérez les pages de votre site avec un éditeur drag and drop
          </p>
        </div>
        <PagesListClient initialPages={pages || []} />
      </div>
    </div>
  );
}




