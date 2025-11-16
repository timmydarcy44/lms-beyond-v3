import { redirect } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { TestEditFormSuperAdmin } from "@/components/super-admin/test-edit-form-super-admin";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface TestEditPageProps {
  params: Promise<{ id: string }>;
}

export default async function TestEditPage({ params }: TestEditPageProps) {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  const { id } = await params;
  const supabase = await getServiceRoleClientOrFallback();

  // Récupérer le test avec toutes les données nécessaires
  // Commencer par une requête simple pour éviter les erreurs de colonnes manquantes
  let test: any = null;
  let error: any = null;

  // Essayer d'abord avec toutes les colonnes
  const { data: testData, error: testError } = await supabase
    .from("tests")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (testError) {
    console.error("[super-admin/tests/edit] Error fetching test:", testError);
    console.error("[super-admin/tests/edit] Error code:", testError.code);
    console.error("[super-admin/tests/edit] Error message:", testError.message);
    error = testError;
    
    // Si erreur 42703 (column not found), réessayer avec une sélection minimale
    if (error.code === '42703') {
      // Réessayer avec seulement les colonnes de base
      const { data: testMinimal, error: error2 } = await supabase
        .from("tests")
        .select("id, title, description, price, category, creator_id, created_at, updated_at")
        .eq("id", id)
        .maybeSingle();
      
      if (error2 || !testMinimal) {
        console.error("[super-admin/tests/edit] Could not fetch test even with minimal columns:", error2);
        redirect("/super/studio/tests");
      }
      
      // Enrichir avec valeurs par défaut pour les colonnes manquantes
      test = {
        ...testMinimal,
        evaluation_type: null,
        skills: null,
        cover_image: null,
        hero_image_url: null,
        thumbnail_url: null,
        duration: null,
        timer_enabled: false,
        adaptive_mode: false,
        published: false,
        status: null,
        display_format: null,
        form_url: null,
        questions: null,
      };
      console.log("[super-admin/tests/edit] Test loaded with minimal columns:", test.id);
      
      // Continuer avec le traitement normal (enrichissement de cover_image plus bas)
    } else {
      // Si l'erreur n'est pas une colonne manquante, rediriger
      console.error("[super-admin/tests/edit] Fatal error, redirecting:", error);
      redirect("/super/studio/tests");
    }
  } else {
    // Pas d'erreur, utiliser les données récupérées
    test = testData;
  }

  if (!test) {
    console.error("[super-admin/tests/edit] Test not found for ID:", id);
    redirect("/super/studio/tests");
  }

  console.log("[super-admin/tests/edit] Test loaded:", {
    id: test.id,
    title: test.title,
    hasQuestions: !!test.questions,
    questionsType: typeof test.questions,
    questionsLength: Array.isArray(test.questions) ? test.questions.length : 'N/A'
  });

  // Vérifier si le test est dans le catalogue pour récupérer cover_image
  let coverImage = test.cover_image || test.hero_image_url || test.thumbnail_url;
  
  // Chercher dans catalog_items si le test est référencé
  const { data: catalogItem } = await supabase
    .from("catalog_items")
    .select("hero_image_url, thumbnail_url")
    .eq("content_id", id)
    .eq("item_type", "test")
    .maybeSingle();

  if (catalogItem) {
    coverImage = catalogItem.hero_image_url || catalogItem.thumbnail_url || coverImage;
  }

  // Enrichir test avec cover_image et s'assurer que questions est bien formaté
  const enrichedTest = {
    ...test,
    cover_image: coverImage,
    // S'assurer que questions est un tableau ou null
    questions: test.questions || null,
  };

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <TestEditFormSuperAdmin initialData={enrichedTest} />
    </main>
  );
}

