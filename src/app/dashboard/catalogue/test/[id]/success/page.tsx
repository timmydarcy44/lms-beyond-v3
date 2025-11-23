import { redirect } from "next/navigation";
import { getCatalogItemById } from "@/lib/queries/catalogue";
import { getServerClient } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

type PageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ session_id?: string }>;
};

export default async function TestSuccessPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { session_id } = await searchParams;

  if (!id || !session_id) {
    redirect("/dashboard/catalogue");
  }

  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/dashboard/catalogue");
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Récupérer l'item du catalogue
  const { data: profile } = await supabase
    .from("profiles")
    .select("org_id")
    .eq("id", user.id)
    .single();

  const organizationId = profile?.org_id || undefined;
  const catalogItem = await getCatalogItemById(id, organizationId);

  if (!catalogItem || catalogItem.item_type !== "test") {
    redirect("/dashboard/catalogue");
  }

  // Récupérer les détails du test
  const { data: testData } = await supabase
    .from("tests")
    .select("id, slug, builder_snapshot")
    .eq("id", catalogItem.content_id || id)
    .single();

  if (!testData) {
    redirect("/dashboard/catalogue");
  }

  // Vérifier si c'est un test mental_health (questionnaire)
  const builderSnapshot = testData.builder_snapshot as any;
  const questionnaireId = builderSnapshot?.questionnaireId;

  if (questionnaireId) {
    // Rediriger vers la page du questionnaire mental_health
    redirect(`/dashboard/apprenant/questionnaires/${questionnaireId}`);
  }

  // Sinon, rediriger vers la page de test classique
  const testSlug = testData.slug;
  if (testSlug) {
    redirect(`/dashboard/tests/${testSlug}`);
  }

  // Fallback vers l'ID du test
  redirect(`/dashboard/tests/${testData.id}`);
}

