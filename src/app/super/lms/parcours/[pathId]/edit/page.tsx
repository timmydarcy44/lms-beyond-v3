import { notFound } from "next/navigation";

import { FormateurPathBuilderWorkspace } from "@/components/formateur/path-builder/formateur-path-builder-workspace";
import { mergeLmsCoursesIntoLibrary } from "@/lib/lms/byound-library";
import { getFormateurContentLibrary, getFormateurOrganizations } from "@/lib/queries/formateur";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SuperLmsParcoursEditPage({ params }: { params: Promise<{ pathId: string }> }) {
  const { pathId } = await params;
  const db = await getServiceRoleClientOrFallback();
  if (!db) notFound();

  const selects = [
    "id, title, description, status, org_id, path_snapshot, cover_image",
    "id, title, description, status, org_id, path_snapshot",
    "id, title, status, org_id, path_snapshot",
    "id, title, org_id, path_snapshot",
    "id, path_snapshot",
  ];
  let path: Record<string, unknown> | null = null;
  for (const select of selects) {
    const res = await db.from("paths").select(select).eq("id", pathId).maybeSingle();
    if (res.error) {
      const code = String((res.error as { code?: string }).code ?? "");
      if (code === "42703" || code === "PGRST204") continue;
      break;
    }
    if (res.data) {
      path = res.data as Record<string, unknown>;
      break;
    }
  }
  if (!path) notFound();

  const snapshot =
    path.path_snapshot && typeof path.path_snapshot === "object"
      ? (path.path_snapshot as Record<string, unknown>)
      : {};
  const steps = Array.isArray(snapshot.steps) ? snapshot.steps : [];
  const idsOf = (kind: string) =>
    steps
      .filter((step) => (step as { content_kind?: string }).content_kind === kind)
      .map((step) => String((step as { content_id?: string }).content_id ?? ""))
      .filter(Boolean);

  const [baseLibrary, organizations] = await Promise.all([
    getFormateurContentLibrary().catch(() => ({ courses: [], tests: [], resources: [] })),
    getFormateurOrganizations().catch(() => []),
  ]);
  const library = await mergeLmsCoursesIntoLibrary(baseLibrary);

  return (
    <div className="super-lms-light min-h-[calc(100vh-5rem)] bg-[#F5F5F7] text-slate-900">
      <FormateurPathBuilderWorkspace
        library={library}
        organizations={organizations}
        byoundOwned
        returnTo="/super/lms/parcours"
        initialData={{
          pathId: String(path.id),
          title: String(snapshot.title ?? path.title ?? ""),
          subtitle: String(snapshot.subtitle ?? path.description ?? ""),
          objective: String(snapshot.objective ?? ""),
          selectedCourses: idsOf("course"),
          selectedTests: idsOf("test"),
          selectedResources: idsOf("resource"),
          status: (path.status === "published" ? "published" : "draft") as "draft" | "published",
          builderSnapshot: {
            ...snapshot,
            presentation: snapshot.presentation ?? path.description ?? "",
            cover_image: snapshot.cover_image ?? path.cover_image ?? "",
            tools: Array.isArray(snapshot.tools) ? snapshot.tools : [],
          },
          orgId: path.org_id ? String(path.org_id) : null,
        }}
      />
    </div>
  );
}
