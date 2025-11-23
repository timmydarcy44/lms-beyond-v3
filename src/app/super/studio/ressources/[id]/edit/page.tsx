import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { ResourceEditFormSuperAdmin } from "@/components/super-admin/resource-edit-form-super-admin";
import { getServiceRoleClientOrFallback, getServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ResourceEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function ResourceEditPage({ params }: ResourceEditPageProps) {
  // Vérifier l'authentification
  const sessionClient = await getServerClient();
  if (!sessionClient) {
    redirect("/login");
  }

  const { data: { user } } = await sessionClient.auth.getUser();
  if (!user?.id) {
    redirect("/login");
  }

  const { id } = await params;
  const supabase = await getServiceRoleClientOrFallback();

  // Récupérer la ressource
  if (!supabase) {
    redirect("/dashboard");
  }
  const { data: resource, error } = await supabase
    .from("resources")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !resource) {
    redirect("/super/studio/ressources");
  }

  // Vérifier l'accès : super admin OU créateur du contenu
  const isSuper = await isSuperAdmin();
  const isCreator = resource.creator_id === user.id;

  if (!isSuper && !isCreator) {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Modifier la ressource</h1>
      <ResourceEditFormSuperAdmin initialData={resource} />
    </div>
  );
}





