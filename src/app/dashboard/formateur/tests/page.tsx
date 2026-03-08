import { getFormateurTests } from "@/lib/queries/formateur";
import { FormateurSidebar } from "@/components/formateur/formateur-sidebar";
import { TestsPageClient } from "./tests-page-client";

export default async function FormateurTestsPage() {
  const testsLibrary = await getFormateurTests();

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <FormateurSidebar activeItem="Tests" />
      <main className="ml-[236px] px-10 py-10">
        <TestsPageClient initialTests={testsLibrary} />
      </main>
    </div>
  );
}
