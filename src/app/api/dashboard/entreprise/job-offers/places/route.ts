import { NextRequest, NextResponse } from "next/server";
import { resolveEntrepriseOverviewAccess } from "@/lib/entreprise/overview-route";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const access = await resolveEntrepriseOverviewAccess();
  if (!access.ok) return NextResponse.json({ error: access.error }, { status: access.status });

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2) return NextResponse.json({ places: [] });

  const url = `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(query)}&type=municipality&limit=6`;
  const response = await fetch(url, { next: { revalidate: 0 } });
  if (!response.ok) return NextResponse.json({ places: [] });

  const json = (await response.json()) as {
    features?: Array<{ properties?: { city?: string; name?: string; context?: string } }>;
  };
  const places = (json.features ?? []).map((feature) => {
    const city = feature.properties?.city || feature.properties?.name || "";
    const department = String(feature.properties?.context ?? "").split(",")[0]?.trim() ?? "";
    const label = department ? `${city} (${department})` : city;
    return { label };
  }).filter((place) => place.label);

  return NextResponse.json({ places });
}
