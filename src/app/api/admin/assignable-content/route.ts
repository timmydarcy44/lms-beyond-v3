import { NextResponse } from "next/server";
import { getAdminAssignableCatalog } from "@/lib/queries/admin";

export async function GET() {
  try {
    const catalog = await getAdminAssignableCatalog();
    
    return NextResponse.json({
      courses: catalog.courses.map(c => ({
        id: c.id,
        title: c.title,
        status: c.status || "draft",
      })),
      paths: catalog.paths.map(p => ({
        id: p.id,
        title: p.title,
        status: p.status || "draft",
      })),
      resources: catalog.resources.map(r => ({
        id: r.id,
        title: r.title,
        published: r.status === "published",
      })),
      tests: catalog.tests.map(t => ({
        id: t.id,
        title: t.title,
        status: t.status || "draft",
      })),
    });
  } catch (error) {
    console.error("[api/admin/assignable-content] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la récupération du contenu" },
      { status: 500 }
    );
  }
}







