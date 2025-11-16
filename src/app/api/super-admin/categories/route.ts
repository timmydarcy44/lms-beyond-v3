import { NextResponse } from "next/server";
import { getCategoriesForSuperAdmin } from "@/lib/utils/catalog-categories";

export async function GET() {
  try {
    const { defaultCategories, allowCustom } = await getCategoriesForSuperAdmin();
    return NextResponse.json({
      categories: defaultCategories,
      allowCustom,
    });
  } catch (error) {
    console.error("[api/super-admin/categories] Error:", error);
    // Fallback par défaut
    return NextResponse.json({
      categories: ["TDAH", "DYS", "Guidance parentale", "Apprentissage"],
      allowCustom: true,
    });
  }
}




