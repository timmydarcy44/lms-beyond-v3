import { getFormateurTests } from "@/lib/queries/formateur";
import { TestsPageClient } from "./tests-page-client";

export default async function FormateurTestsPage() {
  const testsLibrary = await getFormateurTests();

  return <TestsPageClient initialTests={testsLibrary} />;
}
