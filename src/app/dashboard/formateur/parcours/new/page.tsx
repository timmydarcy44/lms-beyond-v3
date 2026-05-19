import { FormateurPathBuilderWorkspace } from "@/components/formateur/path-builder/formateur-path-builder-workspace";
import { getFormateurContentLibrary, getFormateurOrganizations } from "@/lib/queries/formateur";

export default async function FormateurNewParcoursPage() {
  const [library, organizations] = await Promise.all([
    getFormateurContentLibrary(),
    getFormateurOrganizations(),
  ]);

  return (
    <FormateurPathBuilderWorkspace library={library} organizations={organizations} />
  );
}











