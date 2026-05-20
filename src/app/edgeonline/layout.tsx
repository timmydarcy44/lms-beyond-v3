import { EdgeOnlineLayoutClient } from "./edge-online-layout-client";
import { getEdgeOnlineHrefPrefixServer } from "@/lib/edge-online-public-path.server";

export default async function EdgeOnlineLayout({ children }: { children: React.ReactNode }) {
  const hrefPrefix = await getEdgeOnlineHrefPrefixServer();
  return (
    <div className="min-h-screen bg-white text-[#0a0a0a]">
      <EdgeOnlineLayoutClient hrefPrefix={hrefPrefix}>{children}</EdgeOnlineLayoutClient>
    </div>
  );
}
