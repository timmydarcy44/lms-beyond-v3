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
  /** Verrouille le parcours sur une organisation (dashboard école / entreprise). */
  lockedOrgId?: string | null;
  returnTo?: string | null;
};

export function FormateurPathBuilderWorkspace({
  library,
  organizations,
  initialData,
  lockedOrgId = null,
  returnTo = null,
}: Props) {
  const orgOptions = useMemo(() => {
    if (lockedOrgId) {
      const locked = (organizations ?? []).filter((o) => o.id === lockedOrgId);
      if (locked.length) return locked;
      return [{ id: lockedOrgId, name: "Mon organisation" } as FormateurOrganization];
    }
    return organizations ?? [];
  }, [organizations, lockedOrgId]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(
    lockedOrgId ?? initialData?.orgId ?? orgOptions[0]?.id ?? null,
  );

  const additionalFields = useCallback(() => {
    return selectedOrgId ? { orgId: selectedOrgId } : {};
  }, [selectedOrgId]);

  const extraHeaderSlot = orgOptions.length ? (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-500">
        {lockedOrgId ? "Organisation" : "Galaxie"}
      </span>
      <Select
        value={selectedOrgId ?? ""}
        onValueChange={(v) => {
          if (lockedOrgId) return;
          setSelectedOrgId(v || null);
        }}
        disabled={Boolean(lockedOrgId)}
      >
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
      returnTo={returnTo}
    />
  );
}

export default FormateurPathBuilderWorkspace;

