import { Metadata } from "next";
import { redirect } from "next/navigation";
import { ConfidenceTestPlayer } from "@/components/jessica-contentin/confidence-test-player";
import { getSession } from "@/lib/auth/session";
import { getUserName } from "@/lib/utils/user-name";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";
const TEST_CONTENT_ID = "test-confiance-en-soi";

export const metadata: Metadata = {
  title: "Test de Confiance en soi – Jessica Contentin",
  description: "Évaluez votre estime de soi, votre auto-efficacité, votre assertivité et vos compétences sociales grâce à un test professionnel et bienveillant.",
  keywords: "test confiance en soi, estime de soi, auto-efficacité, assertivité, compétences sociales, Jessica Contentin, psychopédagogue, TDAH, HPI",
  openGraph: {
    title: "Test de Confiance en soi – Jessica Contentin",
    description: "Évaluez votre estime de soi, votre auto-efficacité, votre assertivité et vos compétences sociales grâce à un test professionnel et bienveillant.",
    type: "website",
  },
};

export default async function ConfidenceTestPage() {
  // Vérifier l'authentification
  const session = await getSession();
  if (!session) {
    redirect("/jessica-contentin/login?next=/test-confiance-en-soi");
  }

  // Vérifier l'accès au test
  const supabase = await getServerClient();
  if (!supabase) {
    redirect("/jessica-contentin/login?next=/test-confiance-en-soi");
  }

  try {
    // Récupérer l'ID de Jessica Contentin
    const serviceClient = getServiceRoleClient();
    const clientToUse = serviceClient || supabase;
    
    const { data: jessicaProfile, error: jessicaError } = await clientToUse
      .from("profiles")
      .select("id")
      .eq("email", JESSICA_CONTENTIN_EMAIL)
      .maybeSingle();

    if (jessicaError) {
      console.error("[ConfidenceTestPage] Error fetching Jessica profile:", jessicaError);
    }

    if (!jessicaProfile) {
      console.error("[ConfidenceTestPage] Jessica profile not found");
      redirect("/jessica-contentin/ressources?error=profile_not_found");
    }

    // Chercher le test dans la table tests par slug
    const { data: test, error: testError } = await clientToUse
      .from("tests")
      .select("id")
      .eq("slug", TEST_CONTENT_ID)
      .maybeSingle();

    if (testError) {
      console.error("[ConfidenceTestPage] Error fetching test:", testError);
      // Si c'est une erreur de requête, rediriger avec un message d'erreur
      redirect("/jessica-contentin/ressources?error=test_not_found");
    }

    if (!test) {
      console.error("[ConfidenceTestPage] Test not found with slug:", TEST_CONTENT_ID);
      redirect("/jessica-contentin/ressources?error=test_not_found");
    }

    // Chercher l'item de catalogue pour le test
    const { data: catalogItem, error: catalogError } = await clientToUse
      .from("catalog_items")
      .select("id, content_id, creator_id, is_free")
      .eq("content_id", test.id) // Utiliser l'UUID du test
      .eq("creator_id", jessicaProfile.id)
      .eq("item_type", "test")
      .maybeSingle();

    if (catalogError) {
      console.error("[ConfidenceTestPage] Error fetching catalog item:", catalogError);
      // Si c'est une erreur de requête, rediriger avec un message d'erreur
      redirect("/jessica-contentin/ressources?error=catalog_item_not_found");
    }

    if (!catalogItem) {
      console.error("[ConfidenceTestPage] Catalog item not found for test:", test.id);
      redirect("/jessica-contentin/ressources?error=catalog_item_not_found");
    }

    // Si l'item est gratuit, l'accès est automatique
    if (!catalogItem.is_free) {
      // Vérifier l'accès de l'utilisateur
      const { data: access, error: accessError } = await clientToUse
        .from("catalog_item_access")
        .select("access_status, access_type")
        .eq("user_id", session.id)
        .eq("catalog_item_id", catalogItem.id)
        .in("access_status", ["purchased", "manually_granted", "free"])
        .maybeSingle();

      if (accessError) {
        console.error("[ConfidenceTestPage] Error checking access:", accessError);
      }

      // Si l'utilisateur n'a pas d'accès, rediriger avec un message
      if (!access) {
        console.log("[ConfidenceTestPage] User", session.id, "does not have access to test", catalogItem.id);
        redirect("/jessica-contentin/ressources?error=no_access&test=confiance-en-soi");
      }
    }

    const firstName = getUserName(session.fullName || session.email || null);
    return <ConfidenceTestPlayer initialFirstName={firstName || undefined} />;
  } catch (error) {
    console.error("[ConfidenceTestPage] Error checking access:", error);
    // Log plus détaillé pour déboguer
    if (error instanceof Error) {
      console.error("[ConfidenceTestPage] Error message:", error.message);
      console.error("[ConfidenceTestPage] Error stack:", error.stack);
    }
    // Rediriger avec un message d'erreur plus spécifique si possible
    redirect("/jessica-contentin/ressources?error=server_error");
  }
}

