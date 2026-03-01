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
};

const createHeaders = (auth: AuthHeaders, orgId: string) => ({
  "x-user-id": auth.userId,
  "x-user-role": auth.userRole,
  "x-org-id": orgId,
});

export function BadgeClassList({ auth }: { auth: AuthHeaders }) {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [organizationId, setOrganizationId] = useState("");
  const [badgeClasses, setBadgeClasses] = useState<BadgeClass[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadOrganizations = async () => {
      const res = await fetch("/api/super-admin/organizations");
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
          <Button asChild>
            <Link href="/super/open-badges/badgeclasses/new">Créer un badge</Link>
          </Button>
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
            <div className="divide-y divide-slate-200 rounded-lg border border-slate-200">
              {badgeClasses.map((badgeClass) => (
                <div key={badgeClass.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <div className="font-medium text-slate-900">{badgeClass.name}</div>
                    <div className="text-xs text-slate-500">
                      {badgeClass.issuer?.name ?? "Issuer"} · {new Date(badgeClass.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge>{badgeClass.status}</Badge>
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/super/open-badges/badgeclasses/${badgeClass.id}/edit`}>Éditer</Link>
                    </Button>
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
