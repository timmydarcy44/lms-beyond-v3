import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";
import { OrganizationManageTabs } from "@/components/super-admin/organization-manage-tabs";

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
    .select("id, name, slug, created_at")
    .eq("id", id)
    .maybeSingle();

  if (orgError || !org) notFound();

  const { data: memberships } = await supabase.from("org_memberships").select("user_id, role").eq("org_id", id);

  const userIds = (memberships ?? []).map((m: any) => m.user_id).filter(Boolean);
  const { data: profiles } =
    userIds.length > 0
      ? await supabase.from("profiles").select("id, email, full_name").in("id", userIds)
      : { data: [] as any[] };

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
  const members = (memberships ?? []).map((m: any) => {
    const p = profileMap.get(m.user_id) ?? {};
    return {
      user_id: m.user_id,
      role: m.role,
      email: p.email ?? "",
      full_name: p.full_name ?? "",
    };
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-slate-600" />
            <h1 className="text-2xl font-semibold text-slate-900">{org.name}</h1>
          </div>
          <p className="text-sm text-slate-600">
            Slug: <span className="font-mono">{org.slug ?? ""}</span>
          </p>
        </div>
        <Link href="/super/organisations">
          <span className="sr-only">Retour</span>
          <ArrowLeft className="h-5 w-5 text-slate-600" />
        </Link>
      </div>

      <Card className="border-slate-200 bg-white shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg text-slate-900">Membres</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <OrganizationManageTabs organizationId={org.id} organizationName={org.name ?? ""} members={members as any} />
        </CardContent>
      </Card>
    </div>
  );
}

