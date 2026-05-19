"use client";

import { useCallback, useMemo, useState } from "react";

import { PathBuilderWorkspace } from "@/components/formateur/path-builder/path-builder-workspace";
import type { FormateurContentLibrary, FormateurOrganization } from "@/lib/queries/formateur";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Props = {
  library: FormateurContentLibrary;
  organizations: FormateurOrganization[];
  initialData?: {
    pathId?: string;
    title?: string;
    subtitle?: string;
    objective?: string;
    selectedCourses?: string[];
    selectedTests?: string[];
    selectedResources?: string[];
    status?: "draft" | "published";
    builderSnapshot?: unknown;
    orgId?: string | null;
  };
};

export function FormateurPathBuilderWorkspace({ library, organizations, initialData }: Props) {
  const orgOptions = useMemo(() => organizations ?? [], [organizations]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(
    initialData?.orgId ?? orgOptions[0]?.id ?? null,
  );

  const additionalFields = useCallback(() => {
    return selectedOrgId ? { orgId: selectedOrgId } : {};
  }, [selectedOrgId]);

  const extraHeaderSlot = orgOptions.length ? (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
        Galaxie
      </span>
      <Select value={selectedOrgId ?? ""} onValueChange={(v) => setSelectedOrgId(v || null)}>
        <SelectTrigger className="h-9 min-w-[220px] rounded-full border-slate-200 bg-white text-left text-sm text-slate-900">
          <SelectValue placeholder="Sélectionner une galaxie" />
        </SelectTrigger>
        <SelectContent className="border border-slate-200 bg-white text-slate-900">
          {orgOptions.map((org) => (
            <SelectItem key={org.id} value={org.id}>
              {org.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  ) : null;

  const builderSnapshot = useMemo(() => {
    const raw = (initialData as any)?.builderSnapshot;
    const base = raw && typeof raw === "object" ? raw : {};
    return selectedOrgId ? { ...base, orgId: selectedOrgId } : base;
  }, [initialData, selectedOrgId]);

  return (
    <PathBuilderWorkspace
      library={library}
      initialData={initialData ? { ...initialData, builderSnapshot } : undefined}
      additionalFields={additionalFields}
      extraHeaderSlot={extraHeaderSlot}
    />
  );
}

export default FormateurPathBuilderWorkspace;

