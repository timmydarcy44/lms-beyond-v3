import { EdgeOnlineLayoutClient } from "./edge-online-layout-client";

export default function EdgeOnlineLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_70%_50%_at_20%_0%,rgba(59,130,246,0.10),transparent_56%),radial-gradient(ellipse_55%_45%_at_100%_30%,rgba(180,255,100,0.06),transparent_55%)]" />

      <EdgeOnlineLayoutClient>{children}</EdgeOnlineLayoutClient>
    </div>
  );
}
