import { getAdminAssignableCatalog, getSuperAdminId } from "@/lib/queries/admin";
import { Library, Sparkles, Users } from "lucide-react";
import { ContentCard } from "@/components/admin/content-card";
import { getServerClient } from "@/lib/supabase/server";

async function getAdminOrgName(): Promise<string | null> {
  const supabase = await getServerClient();
  if (!supabase) return null;

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: membership } = await supabase
      .from("org_memberships")
      .select("org_id")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .limit(1)
      .single();

    if (!membership?.org_id) return null;

    const { data: org } = await supabase
      .from("organizations")
      .select("name")
      .eq("id", membership.org_id)
      .single();

    return org?.name || null;
  } catch (error) {
    console.error("[admin/ressources] Error fetching org name:", error);
    return null;
  }
}

export default async function AdminRessourcesPage() {
  const catalog = await getAdminAssignableCatalog();
  const resources = catalog.resources || [];
  const superAdminId = await getSuperAdminId();
  const orgName = await getAdminOrgName();
  const isPSG = orgName?.toLowerCase().includes("paris saint germain") || orgName?.toLowerCase().includes("psg");

  // Séparer les ressources Beyond des ressources de l'organisation
  const beyondResources = resources.filter((resource) => {
    if (!superAdminId) return false;
    const resourceCreatedBy = resource.created_by?.toString();
    const resourceOwnerId = resource.owner_id?.toString();
    const superAdminIdStr = superAdminId.toString();
    return resourceCreatedBy === superAdminIdStr || resourceOwnerId === superAdminIdStr;
  });
  
  const orgResources = resources.filter((resource) => {
    if (!superAdminId) return true;
    const resourceCreatedBy = resource.created_by?.toString();
    const resourceOwnerId = resource.owner_id?.toString();
    const superAdminIdStr = superAdminId.toString();
    return resourceCreatedBy !== superAdminIdStr && resourceOwnerId !== superAdminIdStr;
  });

  const beyondCardClasses = isPSG
    ? "rounded-lg border-2 border-blue-500/40 bg-gradient-to-br from-blue-600/20 via-blue-500/15 to-red-600/20 overflow-hidden hover:from-blue-600/30 hover:via-blue-500/25 hover:to-red-600/30 transition-all shadow-lg shadow-blue-500/10"
    : "rounded-lg border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-purple-500/10 overflow-hidden hover:from-blue-500/20 hover:to-purple-500/20 transition";

  const beyondBadgeClasses = isPSG
    ? "inline-block px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-blue-500/40 to-red-500/40 text-white border border-blue-400/50"
    : "inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-500/30 text-blue-200 border border-blue-400/40";

  const beyondIconClasses = isPSG
    ? "p-2 rounded-lg bg-gradient-to-br from-blue-500/30 to-red-500/30 border border-blue-500/40"
    : "p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">Ressources</h1>
          <p className="text-white/60 text-sm">
            Ressources assignées à votre organisation
          </p>
        </div>
      </div>

      {resources.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
          <Library className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucune ressource disponible</h3>
          <p className="text-white/60 text-sm">
            Les ressources assignées à votre organisation par le Super Admin apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Ressources Beyond */}
          {beyondResources.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={beyondIconClasses}>
                  <Sparkles className="h-5 w-5 text-blue-300" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Ressources Beyond</h2>
                  <p className="text-white/60 text-sm">
                    Ressources premium assignées par Beyond ({beyondResources.length})
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {beyondResources.map((resource) => (
                  <ContentCard
                    key={resource.id}
                    content={{
                      id: resource.id,
                      title: resource.title,
                      status: resource.status || null,
                      slug: resource.slug || null,
                      type: resource.type || null,
                      cover_url: resource.cover_url || null,
                      thumbnail_url: resource.thumbnail_url || null,
                    }}
                    contentType="resource"
                    isBeyond={true}
                    isPSG={isPSG}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Ressources de l'organisation */}
          {orgResources.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                  <Users className="h-5 w-5 text-white/80" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Ressources de l'organisation</h2>
                  <p className="text-white/60 text-sm">
                    Ressources créées par vos formateurs ({orgResources.length})
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orgResources.map((resource) => (
                  <ContentCard
                    key={resource.id}
                    content={{
                      id: resource.id,
                      title: resource.title,
                      status: resource.status || null,
                      slug: resource.slug || null,
                      type: resource.type || null,
                      cover_url: resource.cover_url || null,
                      thumbnail_url: resource.thumbnail_url || null,
                    }}
                    contentType="resource"
                    isBeyond={false}
                    isPSG={isPSG}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

