import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export default async function OrganizationsPage() {
  const supabase = await getServiceRoleClientOrFallback();
  const { data: organizations } = supabase
    ? await supabase
        .from("organizations")
        .select("id, name, slug, created_at")
        .order("created_at", { ascending: false })
    : { data: [] as any[] };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Organisations</h1>
        <Link href="/super/organisations/new">
          <Button className="rounded-full bg-slate-900 text-white hover:bg-slate-800">
            <Plus className="mr-2 h-4 w-4" />
            Créer
          </Button>
        </Link>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Nom</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Créée le</TableHead>
              <TableHead className="text-right">Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(organizations ?? []).length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-slate-500">
                  Aucune organisation.
                </TableCell>
              </TableRow>
            ) : (
              (organizations ?? []).map((org: any) => (
                <TableRow key={org.id}>
                  <TableCell className="max-w-[240px] truncate font-mono text-xs text-slate-600">
                    {org.id}
                  </TableCell>
                  <TableCell className="font-medium text-slate-900">{org.name ?? "Sans nom"}</TableCell>
                  <TableCell className="text-slate-700">{org.slug ?? ""}</TableCell>
                  <TableCell className="text-slate-700">
                    {org.created_at ? new Date(org.created_at).toLocaleDateString("fr-FR") : ""}
                  </TableCell>
                  <TableCell className="text-right">
                    <Link href={`/super/organisations/${org.id}/manage`}>
                      <Button variant="outline" className="rounded-full">
                        Gérer
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
