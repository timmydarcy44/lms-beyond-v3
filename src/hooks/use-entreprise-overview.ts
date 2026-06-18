"use client";

import { useEnterpriseOverviewContext } from "@/components/enterprise/enterprise-overview-provider";

import { invalidateEnterpriseOverviewCache } from "@/components/enterprise/enterprise-overview-provider";

export type { EntrepriseEmployee, EntrepriseOverviewData } from "@/lib/entreprise/overview-types";

/** Hook overview entreprise — lit le cache partagé (1 fetch / 45 s max). */
export function useEntrepriseOverview() {
  const ctx = useEnterpriseOverviewContext();
  return {
    loading: ctx.loading,
    data: ctx.data,
    fetchError: ctx.fetchError,
    organisationId: ctx.organisationId,
    superAdminPreview: ctx.superAdminPreview,
    configurationRequired: ctx.configurationRequired,
    reload: () => {
      invalidateEnterpriseOverviewCache();
      return ctx.reload(true);
    },
  };
}
