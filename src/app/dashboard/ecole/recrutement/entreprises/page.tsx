"use client";

import { CfaCompanyPipelineClient } from "@/app/super/crm/cfa/entreprises/cfa-company-pipeline-client";

export default function EcoleCfaCompaniesPage() {
  return (
    <CfaCompanyPipelineClient apiPath="/api/dashboard/ecole/crm/cfa/companies" readOnly />
  );
}
