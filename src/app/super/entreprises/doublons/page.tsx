import { findDuplicatePairs, loadCompanyDirectory } from "@/lib/control/companies";
import { DoublonsClient } from "./doublons-client";

export const dynamic = "force-dynamic";

export default async function DoublonsPage() {
  const directory = await loadCompanyDirectory();
  const pairs = findDuplicatePairs(directory.items.filter((item) => !item.isDemo));
  return <DoublonsClient pairs={pairs} schemaReady={directory.schemaReady} />;
}
