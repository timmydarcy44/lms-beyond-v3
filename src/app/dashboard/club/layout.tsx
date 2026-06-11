import type { ReactNode } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { canAccessClubDashboardFromProfile } from "@/lib/auth/club-access";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { getSession } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function ClubDashboardLayout({ children }: { children: ReactNode }) {
  const headerStore = await headers();
  const host = headerStore.get("host")?.split(":")[0] ?? "";
  const isLocalDev =
    process.env.NODE_ENV === "development" && (host === "localhost" || host === "127.0.0.1");

  if (isLocalDev) {
    return <>{children}</>;
  }

  const session = await getSession();
  if (!session?.id) {
    redirect("/login");
  }

  const { profile } = await getCurrentProfileWithAccess();
  if (!canAccessClubDashboardFromProfile(profile, session.email)) {
    // Ne pas rediriger vers /dashboard : le middleware renvoie les comptes club-only sur /dashboard/club.
    redirect("/unauthorized");
  }

  return <>{children}</>;
}
