import { getAdminAssignableCatalog, getSuperAdminId } from "@/lib/queries/admin";
import { PenTool, Sparkles, Users } from "lucide-react";
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
    console.error("[admin/tests] Error fetching org name:", error);
    return null;
  }
}

export default async function AdminTestsPage() {
  const catalog = await getAdminAssignableCatalog();
  const tests = catalog.tests || [];
  const superAdminId = await getSuperAdminId();
  const orgName = await getAdminOrgName();
  const isPSG = orgName?.toLowerCase().includes("paris saint germain") || orgName?.toLowerCase().includes("psg");

  // Séparer les tests Beyond des tests de l'organisation
  const beyondTests = tests.filter((test) => {
    if (!superAdminId) return false;
    const testCreatedBy = test.created_by?.toString();
    const testOwnerId = test.owner_id?.toString();
    const superAdminIdStr = superAdminId.toString();
    return testCreatedBy === superAdminIdStr || testOwnerId === superAdminIdStr;
  });
  
  const orgTests = tests.filter((test) => {
    if (!superAdminId) return true;
    const testCreatedBy = test.created_by?.toString();
    const testOwnerId = test.owner_id?.toString();
    const superAdminIdStr = superAdminId.toString();
    return testCreatedBy !== superAdminIdStr && testOwnerId !== superAdminIdStr;
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
          <h1 className="text-3xl font-semibold text-white mb-2">Tests</h1>
          <p className="text-white/60 text-sm">
            Tests assignés à votre organisation
          </p>
        </div>
      </div>

      {tests.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
          <PenTool className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucun test disponible</h3>
          <p className="text-white/60 text-sm">
            Les tests assignés à votre organisation par le Super Admin apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Tests Beyond */}
          {beyondTests.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={beyondIconClasses}>
                  <Sparkles className="h-5 w-5 text-blue-300" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Tests Beyond</h2>
                  <p className="text-white/60 text-sm">
                    Tests premium assignés par Beyond ({beyondTests.length})
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {beyondTests.map((test) => (
                  <ContentCard
                    key={test.id}
                    content={{
                      id: test.id,
                      title: test.title,
                      status: test.status || null,
                      slug: test.slug || null,
                      cover_image: test.cover_image || null,
                      thumbnail_url: test.thumbnail_url || null,
                    }}
                    contentType="test"
                    isBeyond={true}
                    isPSG={isPSG}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Tests de l'organisation */}
          {orgTests.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                  <Users className="h-5 w-5 text-white/80" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Tests de l'organisation</h2>
                  <p className="text-white/60 text-sm">
                    Tests créés par vos formateurs ({orgTests.length})
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orgTests.map((test) => (
                  <ContentCard
                    key={test.id}
                    content={{
                      id: test.id,
                      title: test.title,
                      status: test.status || null,
                      slug: test.slug || null,
                      cover_image: test.cover_image || null,
                      thumbnail_url: test.thumbnail_url || null,
                    }}
                    contentType="test"
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

