import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";

export default async function DebugPagesPage() {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  const supabase = await getServerClient();
  const { data: pages, error } = await supabase
    .from("cms_pages")
    .select("*")
    .order("updated_at", { ascending: false });

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-2xl font-bold mb-4">Debug - Pages CMS</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          <p className="font-bold">Erreur:</p>
          <pre className="mt-2">{JSON.stringify(error, null, 2)}</pre>
        </div>
      )}

      <div className="mb-4">
        <p className="text-sm text-gray-600">
          Nombre de pages: {pages?.length || 0}
        </p>
      </div>

      {pages && pages.length > 0 ? (
        <div className="space-y-4">
          {pages.map((page) => (
            <div key={page.id} className="border border-gray-200 rounded p-4">
              <h2 className="font-semibold text-lg mb-2">{page.title}</h2>
              <div className="text-sm space-y-1">
                <p><strong>ID:</strong> {page.id}</p>
                <p><strong>Slug:</strong> {page.slug}</p>
                <p><strong>Content Type:</strong> {(page as any).content_type || "legacy"}</p>
                <p><strong>Content:</strong> {Array.isArray(page.content) ? `Array(${page.content.length})` : typeof page.content}</p>
                {Array.isArray(page.content) && page.content.length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-blue-600">Voir le contenu</summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-96">
                      {JSON.stringify(page.content, null, 2)}
                    </pre>
                  </details>
                )}
                <p><strong>Published:</strong> {page.is_published ? "Oui" : "Non"}</p>
                <a
                  href={`/super/pages/${page.id}/edit`}
                  className="inline-block mt-2 text-blue-600 hover:underline"
                >
                  Éditer →
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded">
          <p>Aucune page trouvée. Exécutez les migrations SQL pour créer la page landing.</p>
        </div>
      )}
    </div>
  );
}


