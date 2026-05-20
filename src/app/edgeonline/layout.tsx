import { EdgeOnlineLayoutClient } from "./edge-online-layout-client";

export default function EdgeOnlineLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-white text-[#0a0a0a]">
      <EdgeOnlineLayoutClient>{children}</EdgeOnlineLayoutClient>
    </div>
  );
}
