import { NextRequest, NextResponse } from "next/server";

import { getOrganizationNavBrandingForUser } from "@/lib/queries/organization-nav";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const slug = (searchParams.get("slug") ?? "").trim() || null;
  const branding = await getOrganizationNavBrandingForUser({ slug });
  return NextResponse.json({ success: true, branding });
}

