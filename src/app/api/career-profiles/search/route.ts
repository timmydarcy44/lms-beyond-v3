import { NextRequest, NextResponse } from "next/server";
import {
  getCareerProfileBySlug,
  listCareerProfiles,
  searchCareerProfilesLocal,
} from "@/lib/career-profiles/career-profiles-repo";

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q") ?? "";
  const slug = request.nextUrl.searchParams.get("slug");

  if (slug) {
    const profile = await getCareerProfileBySlug(slug);
    if (!profile) {
      return NextResponse.json({ error: "Métier introuvable" }, { status: 404 });
    }
    return NextResponse.json({ profile });
  }

  const profiles = await listCareerProfiles();
  const results = searchCareerProfilesLocal(profiles, q, 12);
  return NextResponse.json({ profiles: results });
}
