import { getFormateurContentLibrary } from "@/lib/queries/formateur";
import { FormateurSidebar } from "@/components/formateur/formateur-sidebar";
import { RessourcesPageClient } from "./ressources-page-client";

export default async function FormateurRessourcesPage() {
  const library = await getFormateurContentLibrary();
  const resources = library.resources;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <FormateurSidebar activeItem="Ressources" />
      <main className="ml-[236px] px-10 py-10">
        <RessourcesPageClient initialResources={resources} />
      </main>
    </div>
  );
}


