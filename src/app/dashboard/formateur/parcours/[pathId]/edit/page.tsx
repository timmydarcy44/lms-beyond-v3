import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { PathBuilderWorkspace } from "@/components/formateur/path-builder/path-builder-workspace";
import { getFormateurContentLibrary } from "@/lib/queries/formateur";
import { getServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ pathId: string }>;
};

export default async function FormateurPathEditPage({ params }: PageProps) {
  const { pathId } = await params;

  if (!pathId) {
    notFound();
  }

  // Vérifier que le parcours existe et appartient au formateur
  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }

  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user?.id) {
    notFound();
  }

  const { data: path, error: pathError } = await supabase
    .from("paths")
    .select("id, title, description, status, creator_id, owner_id, builder_snapshot")
    .eq("id", pathId)
    .single();

  if (pathError || !path) {
    notFound();
  }

  // Vérifier que l'utilisateur est propriétaire du parcours
  if (path.creator_id !== authData.user.id && path.owner_id !== authData.user.id) {
    notFound();
  }

  // Récupérer les contenus associés au parcours
  const [coursesData, testsData, resourcesData] = await Promise.all([
    supabase
      .from("path_courses")
      .select("course_id, order")
      .eq("path_id", pathId)
      .order("order", { ascending: true }),
    supabase
      .from("path_tests")
      .select("test_id, order")
      .eq("path_id", pathId)
      .order("order", { ascending: true }),
    supabase
      .from("path_resources")
      .select("resource_id, order")
      .eq("path_id", pathId)
      .order("order", { ascending: true }),
  ]);

  const selectedCourses = coursesData.data?.map((item) => String(item.course_id)) ?? [];
  const selectedTests = testsData.data?.map((item) => String(item.test_id)) ?? [];
  const selectedResources = resourcesData.data?.map((item) => String(item.resource_id)) ?? [];

  // Extraire les données initiales du builder_snapshot si disponible
  const snapshot = path.builder_snapshot as any;
  const initialTitle = snapshot?.title || path.title || "";
  const initialSubtitle = snapshot?.subtitle || path.description || "";
  const initialObjective = snapshot?.objective || "";

  const library = await getFormateurContentLibrary();

  return (
    <DashboardShell
      title="Modifier le parcours"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/formateur" },
        { label: "Formateur", href: "/dashboard/formateur" },
        { label: "Parcours", href: "/dashboard/formateur/parcours" },
        { label: "Modifier" },
      ]}
    >
      <PathBuilderWorkspace
        library={library}
        initialData={{
          pathId: path.id,
          title: initialTitle,
          subtitle: initialSubtitle,
          objective: initialObjective,
          selectedCourses,
          selectedTests,
          selectedResources,
          status: path.status as "draft" | "published",
        }}
      />
    </DashboardShell>
  );
}



