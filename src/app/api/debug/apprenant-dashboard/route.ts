import { NextResponse } from "next/server";
import { getApprenantDashboardData } from "@/lib/queries/apprenant";

export async function GET() {
  try {
    const data = await getApprenantDashboardData();
    return NextResponse.json({
      parcoursCount: Array.isArray(data?.parcours) ? data.parcours.length : null,
      parcoursSample: Array.isArray(data?.parcours)
        ? data.parcours.slice(0, 5).map((p: any) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            href: p.href,
          }))
        : null,
      formationsCount: Array.isArray(data?.formations) ? data.formations.length : null,
      orgSlug: data?.organizationSlug ?? null,
    });
  } catch (e) {
    return NextResponse.json(
      {
        error: "debug failed",
        details: e instanceof Error ? e.message : String(e),
      },
      { status: 500 },
    );
  }
}

