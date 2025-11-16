import { DashboardShell } from "./dashboard-shell";
import { getUserOrganizationLogo } from "@/lib/queries/organization";
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
  const organizationLogo = await getUserOrganizationLogo();
  
  return <DashboardShell {...props} organizationLogo={organizationLogo} />;
}


