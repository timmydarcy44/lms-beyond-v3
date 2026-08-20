import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Pencil, Shield } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrganizationFeaturesManager } from "@/components/super-admin/organization-features-manager";
import { OrganizationLogoCard } from "@/components/super-admin/organization-logo-card";
import { OrganizationManageTabs } from "@/components/super-admin/organization-manage-tabs";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ id: string }>;
};

export default async function OrganizationManagePage({ params }: PageProps) {
  const { id } = await params;
  if (!id) notFound();

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) notFound();

  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id, name, slug, created_at, logo_url, logo")
    .eq("id", id)
    .maybeSingle();

  if (orgError) {
    // Colonnes logo absentes → fallback minimal
    if (orgError.code === "42703" || orgError.message?.includes("logo")) {
      const { data: orgMinimal, error: minimalError } = await supabase
        .from("organizations")
        .select("id, name, slug, created_at")
        .eq("id", id)
        .maybeSingle();
      if (minimalError || !orgMinimal) notFound();
      return renderManagePage({
        org: { ...orgMinimal, logo_url: null, logo: null },
        members: await loadMembers(supabase, id),
      });
    }
    notFound();
  }

  if (!org) notFound();

  return renderManagePage({
    org,
    members: await loadMembers(supabase, id),
  });
}

async function loadMembers(
  supabase: NonNullable<Awaited<ReturnType<typeof getServiceRoleClientOrFallback>>>,
  orgId: string,
) {
  const { data: memberships } = await supabase.from("org_memberships").select("user_id, role").eq("org_id", orgId);

  const userIds = (memberships ?? []).map((m: { user_id: string }) => m.user_id).filter(Boolean);
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, email, full_name").in("id", userIds)
      : { data: [] as Array<{ id: string; email?: string; full_name?: string }> };

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  return (memberships ?? []).map((m: { user_id: string; role: string }) => {
    const p = profileMap.get(m.user_id) ?? {};
    return {
      user_id: m.user_id,
      role: m.role,
      email: (p as { email?: string }).email ?? "",
      full_name: (p as { full_name?: string }).full_name ?? "",
    };
  });
}

function renderManagePage({
  org,
  members,
}: {
  org: {
    id: string;
    name: string | null;
    slug?: string | null;
    created_at?: string | null;
    logo_url?: string | null;
    logo?: string | null;
  };
  members: Array<{ user_id: string; role: string; email: string; full_name: string }>;
}) {
  const logoUrl = String(org.logo_url ?? org.logo ?? "").trim() || null;
  const adminCount = members.filter((m) => m.role === "admin").length;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-12 w-12 rounded-xl border border-slate-200 object-contain bg-white" />
            ) : (
              <Building2 className="h-6 w-6 text-slate-600" />
            )}
            <h1 className="text-2xl font-semibold text-slate-900">{org.name}</h1>
          </div>
          <p className="text-sm text-slate-600">
            Slug: <span className="font-mono">{org.slug ?? ""}</span>
            {adminCount > 0 ? (
              <>
                {" "}
                · <Shield className="inline h-3.5 w-3.5" /> {adminCount} admin
                {adminCount > 1 ? "s" : ""} organisation
              </>
            ) : null}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/super/organisations/${org.id}/edit`}>
            <Button variant="outline" className="rounded-full">
              <Pencil className="mr-2 h-4 w-4" />
              Modifier
            </Button>
          </Link>
          <Link href="/super/organisations">
            <Button variant="ghost" size="icon" className="rounded-full" aria-label="Retour">
              <ArrowLeft className="h-5 w-5 text-slate-600" />
            </Button>
          </Link>
        </div>
      </div>

      <OrganizationLogoCard
        organizationId={org.id}
        organizationName={org.name ?? "Organisation"}
        initialLogoUrl={logoUrl}
      />

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg text-slate-900">Administrateurs & membres</CardTitle>
          <p className="text-sm text-slate-500">
            Pour un admin organisation, choisissez le rôle « Administrateur » : accès dashboard entreprise (
            <span className="font-mono text-xs">admin_hr</span>), sans rattachement école.
          </p>
        </CardHeader>
        <CardContent className="pt-6">
          <OrganizationManageTabs
            organizationId={org.id}
            organizationName={org.name ?? ""}
            members={members}
          />
        </CardContent>
      </Card>

      <div className="space-y-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Accès & licences</h2>
          <p className="text-sm text-slate-500">
            Activez les modules (Beyond Care, diagnostics, etc.) visibles pour l&apos;admin de cette organisation.
          </p>
        </div>
        <OrganizationFeaturesManager orgId={org.id} organizationName={org.name ?? ""} />
      </div>
    </div>
  );
}
