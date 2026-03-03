import { notFound } from "next/navigation";

import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { ScenariosManager } from "@/components/formateur/path-scenarios/scenarios-manager";
import { normalizeScenarioRow } from "@/lib/parcours/scenarios/serializer";
import { getServerClient } from "@/lib/supabase/server";

type PageProps = {
  params: Promise<{ pathId: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PathScenariosPage({ params, searchParams }: PageProps) {
  const { pathId } = await params;
  const resolvedSearchParams = (await searchParams) ?? {};

  if (!pathId) {
    notFound();
  }

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
    .select("id, title, creator_id, owner_id, builder_snapshot, status")
    .eq("id", pathId)
    .single();

  if (pathError || !path) {
    notFound();
  }

  if (path.creator_id !== authData.user.id && path.owner_id !== authData.user.id) {
    notFound();
  }

  const snapshot =
    typeof path.builder_snapshot === "string"
      ? (() => {
          try {
            return JSON.parse(path.builder_snapshot);
          } catch {
            return null;
          }
        })()
      : path.builder_snapshot;

  const [coursesJoin, testsJoin, resourcesJoin] = await Promise.all([
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

  const courseIds =
    coursesJoin.data?.map((item) => (item.course_id ? String(item.course_id) : null)).filter(Boolean) ??
    [];
  const testIds =
    testsJoin.data?.map((item) => (item.test_id ? String(item.test_id) : null)).filter(Boolean) ?? [];
  const resourceIds =
    resourcesJoin.data
      ?.map((item) => (item.resource_id ? String(item.resource_id) : null))
      .filter(Boolean) ?? [];

  const [coursesDetails, testsDetails, resourcesDetails] = await Promise.all([
    courseIds.length > 0
      ? supabase.from("courses").select("id, title, status").in("id", courseIds)
      : Promise.resolve({ data: [], error: null }),
    testIds.length > 0
      ? supabase.from("tests").select("id, title, status").in("id", testIds)
      : Promise.resolve({ data: [], error: null }),
    resourceIds.length > 0
      ? supabase.from("resources").select("id, title, status").in("id", resourceIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  const availableContent = {
    courses:
      (coursesDetails.data || []).map((item: any) => ({
        id: String(item.id),
        title: item.title ?? "Formation",
      })) ?? [],
    tests:
      (testsDetails.data || []).map((item: any) => ({
        id: String(item.id),
        title: item.title ?? "Test",
      })) ?? [],
    resources:
      (resourcesDetails.data || []).map((item: any) => ({
        id: String(item.id),
        title: item.title ?? "Ressource",
      })) ?? [],
  };

  const { data: scenariosData } = await supabase
    .from("parcours_scenarios")
    .select(
      "id, name, is_active, created_at, parcours_scenario_steps(id, step_order, step_type, config, created_at)",
    )
    .eq("parcours_id", pathId)
    .order("created_at", { ascending: true });

  const initialScenarios = scenariosData?.map((scenario) => normalizeScenarioRow(scenario)) ?? [];

  const pathTitle =
    snapshot?.title ?? path.title ?? `Parcours ${path.id.substring(0, 8).toUpperCase()}`;

  const autoOpenBuilder = resolvedSearchParams?.onboarding === "1";

  return (
    <DashboardShell
      title="Scénarios pédagogiques"
      breadcrumbs={[
        { label: "Dashboard", href: "/dashboard/student/studio" },
        { label: "Formateur", href: "/dashboard/student/studio" },
        { label: "Parcours", href: "/dashboard/student/studio/parcours" },
        { label: pathTitle, href: `/dashboard/student/studio/parcours/${path.id}` },
        { label: "Scénarios" },
      ]}
    >
      <ScenariosManager
        pathId={path.id}
        pathTitle={pathTitle}
        initialScenarios={initialScenarios}
        availableContent={availableContent}
        currentUserId={authData.user.id}
        autoOpenBuilder={autoOpenBuilder}
      />
    </DashboardShell>
  );
}


