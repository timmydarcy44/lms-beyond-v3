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
  const { data: pages, error } = await supabase
    .from("cms_pages")
    .select("*")
    .order("updated_at", { ascending: false });

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




