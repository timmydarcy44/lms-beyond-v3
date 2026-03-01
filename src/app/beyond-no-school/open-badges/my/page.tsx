import { headers } from "next/headers";
import { BnsPrivateHeader } from "@/components/beyond-no-school/bns-private-header";
import MyBadgesView from "./view";

export default async function MyBadgesPage() {
  const requestHeaders = await headers();
  const userId = requestHeaders.get("x-user-id");
  const orgId = requestHeaders.get("x-org-id");
  const role = requestHeaders.get("x-user-role");

  const auth =
    userId && orgId && role
      ? { userId, orgId, role }
      : null;

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0b0b10] pb-24 text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_16%_10%,rgba(255,88,61,0.18),transparent_45%),radial-gradient(circle_at_82%_20%,rgba(80,130,255,0.12),transparent_45%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.08] [background-image:linear-gradient(180deg,rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:2px_2px]" />

      <BnsPrivateHeader />

      <section className="mx-auto max-w-6xl space-y-8 px-6 pb-20 pt-12 sm:px-12 lg:px-24">
        <MyBadgesView auth={auth} />
      </section>
    </main>
  );
}
