"use server";

import { getServerClient } from "@/lib/supabase/server";

/**
 * Retourne les catégories personnalisées selon le Super Admin
 */
export async function getCategoriesForSuperAdmin(): Promise<{
  defaultCategories: string[];
  allowCustom: boolean;
}> {
  const supabase = await getServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return {
      defaultCategories: ["Ressources humaines", "Intelligence artificielle", "Business", "Marketing", "Soft skills", "Pédagogie"],
      allowCustom: true,
    };
  }

  // Récupérer l'email du Super Admin
  const { data: profile } = await supabase
    .from("profiles")
    .select("email")
    .eq("id", user.id)
    .single();

  const email = profile?.email;

  // Catégories personnalisées pour contentin.cabinet@gmail.com
  if (email === "contentin.cabinet@gmail.com") {
    return {
      defaultCategories: [
        "TDAH",
        "DYS",
        "Guidance parentale",
        "Apprentissage",
        "Neuropsychologie",
        "Troubles de l'apprentissage",
        "Parentalité",
        "Éducation",
        "Soft skills",
      ],
      allowCustom: true,
    };
  }

  // Catégories par défaut pour timdarcypro@gmail.com et autres
  return {
    defaultCategories: [
      "Ressources humaines",
      "Intelligence artificielle",
      "Business",
      "Marketing",
      "Soft skills",
      "Pédagogie",
    ],
    allowCustom: true,
  };
}

