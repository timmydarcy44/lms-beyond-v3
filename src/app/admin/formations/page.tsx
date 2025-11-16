import { getAdminAssignableCatalog } from "@/lib/queries/admin";
import { GraduationCap, Sparkles, Users } from "lucide-react";
import { getServerClient } from "@/lib/supabase/server";
import { CourseCard } from "@/components/admin/course-card";

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
    console.error("[admin/formations] Error fetching org name:", error);
    return null;
  }
}

export default async function AdminFormationsPage() {
  const catalog = await getAdminAssignableCatalog();
  const courses = catalog.courses || [];

  // Récupérer l'ID du Super Admin via la fonction helper
  const { getSuperAdminId } = await import("@/lib/queries/admin");
  const superAdminId = await getSuperAdminId();

  // Récupérer le nom de l'organisation pour déterminer les couleurs
  const orgName = await getAdminOrgName();
  const isPSG = orgName?.toLowerCase().includes("paris saint germain") || orgName?.toLowerCase().includes("psg");

  // Séparer les formations Beyond des formations de l'organisation
  // Formations Beyond = créées par le Super Admin (même si assignées à l'org via org_id)
  // Formations de l'organisation = créées par les formateurs de l'organisation
  const beyondCourses = courses.filter((course) => {
    if (!superAdminId) return false;
    // Comparer en string pour éviter les problèmes de type
    const courseCreatorId = course.creator_id?.toString();
    const courseOwnerId = course.owner_id?.toString();
    const superAdminIdStr = superAdminId.toString();
    return courseCreatorId === superAdminIdStr || courseOwnerId === superAdminIdStr;
  });
  
  const orgCourses = courses.filter((course) => {
    if (!superAdminId) return true;
    // Comparer en string pour éviter les problèmes de type
    const courseCreatorId = course.creator_id?.toString();
    const courseOwnerId = course.owner_id?.toString();
    const superAdminIdStr = superAdminId.toString();
    return courseCreatorId !== superAdminIdStr && courseOwnerId !== superAdminIdStr;
  });

  // Debug logs détaillés
  console.log("[admin/formations] ===== DEBUG START =====");
  console.log("[admin/formations] superAdminId:", superAdminId);
  console.log("[admin/formations] superAdminId type:", typeof superAdminId);
  console.log("[admin/formations] totalCourses:", courses.length);
  console.log("[admin/formations] orgName:", orgName);
  console.log("[admin/formations] isPSG:", isPSG);
  console.log("[admin/formations] beyondCount:", beyondCourses.length);
  console.log("[admin/formations] orgCount:", orgCourses.length);
  
  courses.forEach((course, index) => {
    const courseCreatorId = course.creator_id?.toString();
    const courseOwnerId = course.owner_id?.toString();
    const superAdminIdStr = superAdminId?.toString();
    const isBeyond = superAdminId && (courseCreatorId === superAdminIdStr || courseOwnerId === superAdminIdStr);
    
    console.log(`[admin/formations] Course ${index + 1}:`, {
      title: course.title,
      id: course.id,
      creator_id: courseCreatorId,
      owner_id: courseOwnerId,
      superAdminId: superAdminIdStr,
      creatorMatch: courseCreatorId === superAdminIdStr,
      ownerMatch: courseOwnerId === superAdminIdStr,
      isBeyond: isBeyond,
    });
  });
  
  console.log("[admin/formations] ===== DEBUG END =====");

  // Classes CSS conditionnelles selon l'organisation
  const beyondCardClasses = isPSG
    ? "rounded-lg border-2 border-blue-500/40 bg-gradient-to-br from-blue-600/20 via-blue-500/15 to-red-600/20 p-6 hover:from-blue-600/30 hover:via-blue-500/25 hover:to-red-600/30 transition-all shadow-lg shadow-blue-500/10"
    : "rounded-lg border border-blue-500/30 bg-gradient-to-br from-blue-500/10 to-purple-500/10 p-6 hover:from-blue-500/20 hover:to-purple-500/20 transition";

  const beyondBadgeClasses = isPSG
    ? "inline-block px-2 py-0.5 rounded text-xs font-medium bg-gradient-to-r from-blue-500/40 to-red-500/40 text-white border border-blue-400/50"
    : "inline-block px-2 py-0.5 rounded text-xs font-medium bg-blue-500/30 text-blue-200 border border-blue-400/40";

  const beyondIconClasses = isPSG
    ? "p-2 rounded-lg bg-gradient-to-br from-blue-500/30 to-red-500/30 border border-blue-500/40"
    : "p-2 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30";

  const beyondIconColor = isPSG ? "text-blue-300" : "text-blue-300";

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-semibold text-white mb-2">Formations</h1>
          <p className="text-white/60 text-sm">
            Formations assignées à votre organisation
          </p>
        </div>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/5 p-12 text-center">
          <GraduationCap className="h-12 w-12 text-white/20 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">Aucune formation disponible</h3>
          <p className="text-white/60 text-sm">
            Les formations assignées à votre organisation par le Super Admin apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Formations Beyond */}
          {beyondCourses.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={beyondIconClasses}>
                  <Sparkles className={`h-5 w-5 ${beyondIconColor}`} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Formations Beyond</h2>
                  <p className="text-white/60 text-sm">
                    Formations premium assignées par Beyond ({beyondCourses.length})
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {beyondCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={{
                      id: course.id,
                      title: course.title,
                      status: course.status || null,
                      slug: course.slug || null,
                      cover_image: course.cover_image || null,
                    }}
                    isBeyond={true}
                    isPSG={isPSG}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Formations de l'organisation */}
          {orgCourses.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-white/10 border border-white/20">
                  <Users className="h-5 w-5 text-white/80" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Formations de l'organisation</h2>
                  <p className="text-white/60 text-sm">
                    Formations créées par vos formateurs ({orgCourses.length})
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {orgCourses.map((course) => (
                  <CourseCard
                    key={course.id}
                    course={{
                      id: course.id,
                      title: course.title,
                      status: course.status || null,
                      slug: course.slug || null,
                      cover_image: course.cover_image || null,
                    }}
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

