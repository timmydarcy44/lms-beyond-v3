"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type AuthHeaders = {
  userId: string;
  userRole: "SUPER_ADMIN";
};

type Organization = { id: string; name: string };
type BadgeClass = {
  id: string;
  name: string;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  issuer?: { name: string };
  createdAt: string;
  level?: number | null;
  builder?: {
    seriesName?: string | null;
    levelLabel?: string | null;
    linkedCourseId?: string | null;
    linkedCourseUpdatedAt?: string | null;
  } | null;
};

function groupedBadges(badges: BadgeClass[]) {
  const groups = new Map<string, BadgeClass[]>();
  for (const badge of badges) {
    const key = badge.builder?.seriesName?.trim() || "Sans série";
    groups.set(key, [...(groups.get(key) ?? []), badge]);
  }
  return [...groups.entries()]
    .sort((left, right) => left[0].localeCompare(right[0], "fr"))
    .map(([name, rows]) => [name, [...rows].sort((left, right) => (left.level ?? 0) - (right.level ?? 0))] as const);
}

const createHeaders = (auth: AuthHeaders, orgId: string) => ({
  "x-user-id": auth.userId,
  "x-user-role": auth.userRole,
  "x-org-id": orgId,
});

export function BadgeClassList({ auth }: { auth: AuthHeaders }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [badgeClasses, setBadgeClasses] = useState<BadgeClass[]>([]);
  const [courseUpdatedAt, setCourseUpdatedAt] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOrganizations = async () => {
      const res = await fetch("/api/super-admin/organisations?internal_badges_only=1");
      const json = await res.json();
      const orgs = json.organizations ?? [];
      setOrganizations(orgs);
      if (orgs.length && !organizationId) {
        setOrganizationId(orgs[0].id);
      }
    };
    loadOrganizations();
  }, [organizationId]);

  useEffect(() => {
    void fetch("/api/super-admin/open-badges/generate-from-course")
      .then((response) => response.json())
      .then((payload: { courses?: Array<{ id: string; updatedAt?: string | null }> }) => {
        const next: Record<string, string> = {};
        for (const course of payload.courses ?? []) {
          if (course.updatedAt) next[course.id] = course.updatedAt;
        }
        setCourseUpdatedAt(next);
      })
      .catch(() => setCourseUpdatedAt({}));
  }, []);

  useEffect(() => {
    if (!organizationId) return;
    const loadBadgeClasses = async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/admin/badgeclasses?organizationId=${organizationId}`, {
          headers: createHeaders(auth, organizationId),
        });
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error ?? "FETCH_FAILED");
        }
        setBadgeClasses(json.badgeClasses ?? []);
      } catch (error) {
        toast.error("Impossible de charger les badges");
      } finally {
        setLoading(false);
      }
    };
    loadBadgeClasses();
  }, [organizationId, auth]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Badge Classes</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" asChild>
              <Link href="/super/open-badges/domaines">Domaines</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/super/open-badges/competences">Compétences</Link>
            </Button>
            <Button asChild>
              <Link href="/super/open-badges/badgeclasses/new">Créer un badge</Link>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-w-sm">
            <Select value={organizationId} onValueChange={setOrganizationId}>
              <SelectTrigger>
                <SelectValue placeholder="Organisation" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-sm text-slate-500">Chargement...</div>
          ) : badgeClasses.length ? (
            <div className="space-y-6">
              {groupedBadges(badgeClasses).map(([series, rows]) => (
                <div key={series}>
                  <p className="mb-2 text-sm font-semibold text-slate-700">{series}</p>
                  <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
                    {rows.map((badgeClass) => {
                      const linkedId = badgeClass.builder?.linkedCourseId;
                      const baseline = badgeClass.builder?.linkedCourseUpdatedAt;
                      const updated = linkedId ? courseUpdatedAt[linkedId] : undefined;
                      const changed = badgeClass.status === "ACTIVE" && baseline && updated && new Date(updated).getTime() > new Date(baseline).getTime();
                      const levelText = badgeClass.level ? `Niveau ${badgeClass.level}${badgeClass.builder?.levelLabel ? ` · ${badgeClass.builder.levelLabel}` : ""}` : null;
                      return (
                        <div key={badgeClass.id} className="flex items-center justify-between gap-3 px-4 py-3">
                          <div>
                            <div className="font-medium text-slate-900">{badgeClass.name}</div>
                            <div className="text-xs text-slate-500">
                              {levelText ? `${levelText} · ` : ""}{badgeClass.issuer?.name ?? "Issuer"} · {new Date(badgeClass.createdAt).toLocaleDateString()}
                            </div>
                            {changed && linkedId ? (
                              <p className="mt-1 text-xs text-amber-700">
                                La formation liée a changé depuis la publication : vérifiez les critères.{" "}
                                <Link href={`/super/lms/formations/${linkedId}`} className="underline">Voir la formation</Link>
                              </p>
                            ) : null}
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge>{badgeClass.status}</Badge>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/super/open-badges/badgeclasses/${badgeClass.id}/essai`}>Tester</Link>
                            </Button>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/super/open-badges/badgeclasses/${badgeClass.id}/edit`}>Éditer</Link>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-slate-500">Aucun badge pour cette organisation.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
