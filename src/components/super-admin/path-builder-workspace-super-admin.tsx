"use client";

import { useCallback, useMemo, useState } from "react";

import { PathBuilderWorkspace } from "@/components/formateur/path-builder/path-builder-workspace";
import type { FormateurContentLibrary } from "@/lib/queries/formateur";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type OrganizationOption = {
  id: string;
  name: string;
};

type SuperAdminPathBuilderWorkspaceProps = {
  library: FormateurContentLibrary;
  organizations: OrganizationOption[];
  initialData?: {
    pathId?: string;
    title?: string;
    subtitle?: string;
    objective?: string;
    selectedCourses?: string[];
    selectedTests?: string[];
    selectedResources?: string[];
    status?: "draft" | "published";
    price?: number | string | null;
    orgId?: string | null;
  };
};

export function SuperAdminPathBuilderWorkspace({
  library,
  organizations,
  initialData,
}: SuperAdminPathBuilderWorkspaceProps) {
  const orgOptions = useMemo(() => organizations ?? [], [organizations]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(
    initialData?.orgId ?? orgOptions[0]?.id ?? null,
  );

  const handleOrgChange = useCallback((value: string) => {
    setSelectedOrgId(value || null);
  }, []);

  const additionalFields = useCallback(() => {
    return selectedOrgId ? { orgId: selectedOrgId } : {};
  }, [selectedOrgId]);

  const extraHeaderSlot = orgOptions.length ? (
    <div className="flex items-center gap-2 text-white/80">
      <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-white/50">
        Organisation
      </span>
      <Select value={selectedOrgId ?? ""} onValueChange={handleOrgChange}>
        <SelectTrigger className="h-9 min-w-[220px] border-white/25 bg-white/10 text-left text-sm text-white">
          <SelectValue placeholder="Sélectionner une organisation" />
        </SelectTrigger>
        <SelectContent className="bg-slate-900 text-white">
          {orgOptions.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ) : null;

  return (
    <PathBuilderWorkspace
      library={library}
      initialData={initialData}
      additionalFields={additionalFields}
      extraHeaderSlot={extraHeaderSlot}
    />
  );
}



