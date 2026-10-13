import { FormateurPathBuilderWorkspace } from "@/components/formateur/path-builder/formateur-path-builder-workspace";
import { mergeLmsCoursesIntoLibrary } from "@/lib/lms/byound-library";
import { getFormateurContentLibrary, getFormateurOrganizations } from "@/lib/queries/formateur";

export const dynamic = "force-dynamic";

export default async function SuperLmsNewParcoursPage() {
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
      />
    </div>
  );
}
