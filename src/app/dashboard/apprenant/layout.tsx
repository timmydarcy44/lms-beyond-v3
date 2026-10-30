import type { ReactNode } from "react";
import { Suspense } from "react";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import "@/styles/edge-connect.css";
import "@/styles/jessica-connect.css";
import { PaywallConnect } from "@/components/paywalls/paywall-connect";
import { ApprenantConnectShell } from "@/components/apprenant/apprenant-connect-shell";
import { JadeInternalFill } from "@/components/demo/jade-internal-fill";
import { isByoundBusinessManager } from "@/lib/auth/byound-business-manager";
import { getCurrentProfileWithAccess } from "@/lib/auth/profile";
import { isUniversalAdminRole } from "@/lib/auth/is-admin-role";
import { getSession } from "@/lib/auth/session";
import type { ApprenantConnectVariant } from "@/lib/apprenant/connect-theme";
import {
  isJessicaLmsHostname,
  isJessicaStudioProfile,
} from "@/lib/jessica-contentin/studio-config";

function resolveApprenantVariant(
  hostname: string | null,
  profile: { email?: string | null; school_id?: string | null; company_id?: string | null } | null,
): ApprenantConnectVariant {
  if (isJessicaLmsHostname(hostname)) return "jessica";
  if (isJessicaStudioProfile(profile)) return "jessica";
  return "edge";
}

function ApprenantShellWithSuspense({
  variant,
  children,
}: {
  variant: ApprenantConnectVariant;
  children: ReactNode;
}) {
  return (
    <Suspense fallback={null}>
      <ApprenantConnectShell variant={variant}>
        <JadeInternalFill>{children}</JadeInternalFill>
      </ApprenantConnectShell>
    </Suspense>
  );
}

export default async function ApprenantSuiteLayout({ children }: { children: ReactNode }) {
  const headerStore = await headers();
  const hostname = headerStore.get("host");

  let session: Awaited<ReturnType<typeof getSession>> = null;
  try {
    session = await getSession();
  } catch (error) {
    const digest = typeof error === "object" && error && "digest" in error ? String((error as { digest?: unknown }).digest) : "";
    if (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND")) throw error;
    console.error("[dashboard/apprenant/layout] session", error);
  }
  if (session?.role === "demo") {
    const variant = resolveApprenantVariant(hostname, null);
    return <ApprenantShellWithSuspense variant={variant}>{children}</ApprenantShellWithSuspense>;
  }

  let user: Awaited<ReturnType<typeof getCurrentProfileWithAccess>>["user"] = null;
  let profile: Awaited<ReturnType<typeof getCurrentProfileWithAccess>>["profile"] = null;
  try {
    const current = await getCurrentProfileWithAccess();
    user = current.user;
    profile = current.profile;
  } catch (error) {
    const digest = typeof error === "object" && error && "digest" in error ? String((error as { digest?: unknown }).digest) : "";
    if (digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND")) throw error;
    console.error("[dashboard/apprenant/layout] profile", error);
  }
  if (!user?.id) {
    redirect("/login?from=connect");
  }

  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const pathname = headerStore.get("x-url-pathname") ?? "";
  const applicationTest =
    pathname.startsWith("/dashboard/apprenant/disc/test") ||
    pathname.startsWith("/dashboard/apprenant/idmc/test");
  if (meta.needs_password_setup === true && !applicationTest) {
    const role = String(profile?.role ?? "").toLowerCase();
    const roleType = String(profile?.role_type ?? "").toLowerCase();
    const isCollaborator =
      Boolean(meta.employee_id) ||
      ["employee", "salarie", "collaborateur", "collaborator"].includes(role) ||
      ["employee", "salarie", "collaborateur", "collaborator"].includes(roleType);
    if (isCollaborator) {
      redirect(`/auth/set-password?next=${encodeURIComponent("/dashboard/salarie")}&flow=invite`);
    }
    const isEntreprise =
      role === "entreprise" ||
      roleType === "entreprise" ||
      roleType === "admin_hr" ||
      String(meta.account_type ?? "") === "entreprise" ||
      String(meta.signup_source ?? "") === "edge_entreprises";
    const fallback = isEntreprise ? "/dashboard/entreprise" : "/dashboard/apprenant";
    const next = encodeURIComponent(pathname.startsWith("/dashboard/") ? pathname : fallback);
    const flow = isEntreprise ? "entreprise" : "particulier";
    redirect(`/auth/set-password?next=${next}&flow=${flow}`);
  }

  const variant = resolveApprenantVariant(hostname, profile);

  if (
    isUniversalAdminRole(profile?.role) ||
    isByoundBusinessManager(user.email) ||
    isByoundBusinessManager(profile?.email)
  ) {
    return <ApprenantShellWithSuspense variant={variant}>{children}</ApprenantShellWithSuspense>;
  }

  if (profile?.access_connect === false) {
    return <PaywallConnect />;
  }

  return <ApprenantShellWithSuspense variant={variant}>{children}</ApprenantShellWithSuspense>;
}
