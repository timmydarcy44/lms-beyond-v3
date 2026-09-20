import { getFormateurContentLibrary } from "@/lib/queries/formateur";
import { RessourcesPageClient } from "./ressources-page-client";

export default async function FormateurRessourcesPage() {
  const library = await getFormateurContentLibrary();
  const resources = library.resources;

  return (
    <div className="text-white">
      <RessourcesPageClient initialResources={resources} />
    </div>
  );
}


