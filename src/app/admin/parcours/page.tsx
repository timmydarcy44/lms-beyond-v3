import { getAdminAssignableCatalog, getSuperAdminId } from "@/lib/queries/admin";
import { Route, Sparkles, Users } from "lucide-react";
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
    console.error("[admin/parcours] Error fetching org name:", error);
    return null;
  }
}

export default async function AdminParcoursPage() {
  const catalog = await getAdminAssignableCatalog();
  const paths = catalog.paths || [];
  const superAdminId = await getSuperAdminId();
  const orgName = await getAdminOrgName();
  const isPSG = orgName?.toLowerCase().includes("paris saint germain") || orgName?.toLowerCase().includes("psg");

  // Séparer les parcours Beyond des parcours de l'organisation
  const beyondPaths = paths.filter((path) => {
    if (!superAdminId) return false;
    const pathCreatorId = path.creator_id?.toString();
    const pathOwnerId = path.owner_id?.toString();
    const superAdminIdStr = superAdminId.toString();
    return pathCreatorId === superAdminIdStr || pathOwnerId === superAdminIdStr;
  });
  
  const orgPaths = paths.filter((path) => {
    if (!superAdminId) return true;
    const pathCreatorId = path.creator_id?.toString();
    const pathOwnerId = path.owner_id?.toString();
    const superAdminIdStr = superAdminId.toString();
    return pathCreatorId !== superAdminIdStr && pathOwnerId !== superAdminIdStr;
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
          <h1 className="text-3xl font-semibold text-white mb-2">Parcours</h1>
          <p className="text-white/60 text-sm">
            Parcours assignés à votre organisation
          </p>
        </div>
      </div>

      {paths.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
          <Route className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucun parcours disponible</h3>
          <p className="text-white/60 text-sm">
            Les parcours assignés à votre organisation par le Super Admin apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Parcours Beyond */}
          {beyondPaths.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={beyondIconClasses}>
                  <Sparkles className="h-5 w-5 text-blue-300" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Parcours Beyond</h2>
                  <p className="text-white/60 text-sm">
                    Parcours premium assignés par Beyond ({beyondPaths.length})
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {beyondPaths.map((path) => (
                  <ContentCard
                    key={path.id}
                    content={{
                      id: path.id,
                      title: path.title,
                      status: path.status || null,
                      slug: path.slug || null,
                      thumbnail_url: path.thumbnail_url || null,
                      hero_url: path.hero_url || null,
                    }}
                    contentType="path"
                    isBeyond={true}
                    isPSG={isPSG}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Parcours de l'organisation */}
          {orgPaths.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                  <Users className="h-5 w-5 text-white/80" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Parcours de l'organisation</h2>
                  <p className="text-white/60 text-sm">
                    Parcours créés par vos formateurs ({orgPaths.length})
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orgPaths.map((path) => (
                  <ContentCard
                    key={path.id}
                    content={{
                      id: path.id,
                      title: path.title,
                      status: path.status || null,
                      slug: path.slug || null,
                      thumbnail_url: path.thumbnail_url || null,
                      hero_url: path.hero_url || null,
                    }}
                    contentType="path"
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

