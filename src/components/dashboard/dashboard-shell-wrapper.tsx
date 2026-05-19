import { DashboardShell } from "./dashboard-shell";
import { getOrganizationNavBrandingForUser } from "@/lib/queries/organization-nav";
import type { DashboardBreadcrumb } from "@/components/layout/header";

type DashboardShellWrapperProps = {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  breadcrumbs?: DashboardBreadcrumb[];
  initialCollapsed?: boolean;
  firstName?: string | null;
  email?: string | null;
  compactHeader?: boolean;
};

export async function DashboardShellWrapper(props: DashboardShellWrapperProps) {
  const { logoUrl, name } = await getOrganizationNavBrandingForUser();

  return <DashboardShell {...props} organizationLogo={logoUrl} organizationName={name} />;
}








