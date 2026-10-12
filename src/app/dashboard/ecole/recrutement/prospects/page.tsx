"use client";

import { CfaPipelineClient } from "@/app/super/crm/cfa/cfa-pipeline-client";

export default function EcoleCfaProspectsPage() {
  return <CfaPipelineClient apiPath="/api/dashboard/ecole/crm/cfa" readOnly />;
}
