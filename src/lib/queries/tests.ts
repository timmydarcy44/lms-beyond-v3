import { getServerClient } from "@/lib/supabase/server";

/**
 * Récupère un test directement depuis la table tests
 * Utilisé pour l'édition quand le test n'est pas encore dans catalog_items
 */
export async function getTestById(testId: string) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      console.error("[tests] Supabase client not available");
      return null;
    }

    const { data: test, error } = await supabase
      .from("tests")
      .select("*")
      .eq("id", testId)
      .single();

    if (error) {
      console.error("[tests] Error fetching test:", error);
      return null;
    }

    return test;
  } catch (error) {
    console.error("[tests] Error:", error);
    return null;
  }
}

/**
 * Récupère tous les tests d'un créateur
 */
export async function getTestsByCreator(creatorId: string) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      console.error("[tests] Supabase client not available");
      return [];
    }

    const { data: tests, error } = await supabase
      .from("tests")
      .select("*")
      .eq("creator_id", creatorId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[tests] Error fetching tests:", error);
      return [];
    }

    return tests || [];
  } catch (error) {
    console.error("[tests] Error:", error);
    return [];
  }
}








