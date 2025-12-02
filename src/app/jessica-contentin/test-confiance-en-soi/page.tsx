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
    
    const { data: jessicaProfile } = await clientToUse
      .from("profiles")
      .select("id")
      .eq("email", JESSICA_CONTENTIN_EMAIL)
      .maybeSingle();

    if (!jessicaProfile) {
      redirect("/jessica-contentin/ressources");
    }

    // Chercher le test dans la table tests par slug
    const { data: test } = await clientToUse
      .from("tests")
      .select("id")
      .eq("slug", TEST_CONTENT_ID)
      .maybeSingle();

    if (!test) {
      redirect("/jessica-contentin/ressources?test=confiance-en-soi");
    }

    // Chercher l'item de catalogue pour le test
    const { data: catalogItem } = await clientToUse
      .from("catalog_items")
      .select("id, content_id, creator_id, is_free")
      .eq("content_id", test.id) // Utiliser l'UUID du test
      .eq("creator_id", jessicaProfile.id)
      .eq("item_type", "test")
      .maybeSingle();

    if (!catalogItem) {
      // Si l'item n'existe pas, rediriger vers les ressources
      redirect("/jessica-contentin/ressources?test=confiance-en-soi");
    }

    // Si l'item est gratuit, l'accès est automatique
    if (!catalogItem.is_free) {
      // Vérifier l'accès de l'utilisateur
      const { data: access } = await clientToUse
        .from("catalog_item_access")
        .select("access_status, access_type")
        .eq("user_id", session.id)
        .eq("catalog_item_id", catalogItem.id)
        .in("access_status", ["purchased", "manually_granted", "free"])
        .maybeSingle();

      // Si l'utilisateur n'a pas d'accès, rediriger
      if (!access) {
        redirect("/jessica-contentin/ressources?test=confiance-en-soi");
      }
    }

    const firstName = getUserName(session.fullName || session.email || null);
    return <ConfidenceTestPlayer initialFirstName={firstName || undefined} />;
  } catch (error) {
    console.error("[ConfidenceTestPage] Error checking access:", error);
    redirect("/jessica-contentin/ressources");
  }
}

