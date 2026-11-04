import { loadCompanyDirectory } from "@/lib/control/companies";
import { EntreprisesClient } from "./entreprises-client";

export const dynamic = "force-dynamic";

export default async function EntreprisesPage() {
  const directory = await loadCompanyDirectory();
  return <EntreprisesClient items={directory.items} schemaReady={directory.schemaReady} />;
}
