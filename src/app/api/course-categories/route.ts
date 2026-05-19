import { NextResponse } from "next/server";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(req: Request) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ categories: [] }, { status: 500 });
    }

    const url = new URL(req.url);
    const orgIdParam = String(url.searchParams.get("orgId") ?? "").trim();
    const orgSlug = String(url.searchParams.get("orgSlug") ?? "").trim();
    if (!orgIdParam && !orgSlug) {
      return NextResponse.json({ categories: [] }, { status: 400 });
    }

    let orgId: string | null = orgIdParam || null;
    let organizationSlugOut: string | null = orgSlug ? orgSlug : null;
    const orgClient = getServiceRoleClient() ?? supabase;
    if (!orgId) {
      const { data: org, error: orgErr } = await orgClient
        .from("organizations")
        .select("id, slug")
        .eq("slug", orgSlug)
        .maybeSingle();
      if (orgErr || !org?.id) {
        return NextResponse.json({ categories: [], organizationSlug: null }, { status: 200 });
      }
      orgId = String(org.id);
      organizationSlugOut = (org as { slug?: string | null }).slug
        ? String((org as { slug?: string | null }).slug)
        : organizationSlugOut;
    } else {
      const { data: orgRow } = await orgClient
        .from("organizations")
        .select("slug")
        .eq("id", orgId)
        .maybeSingle();
      organizationSlugOut = orgRow?.slug ? String(orgRow.slug) : null;
    }

    const { data: rows, error: catErr } = await supabase
      .from("course_categories")
      .select("id, name")
      .eq("organization_id", String(orgId))
      .order("name", { ascending: true });
    if (catErr) {
      return NextResponse.json({ categories: [], organizationSlug: organizationSlugOut }, { status: 200 });
    }

    const categories = (rows ?? [])
      .map((r: any) => ({
        id: String(r?.id ?? "").trim(),
        name: String(r?.name ?? "").trim(),
      }))
      .filter((c: { id: string; name: string }) => c.id && c.name);

    return NextResponse.json({ categories, organizationSlug: organizationSlugOut }, { status: 200 });
  } catch {
    return NextResponse.json({ categories: [] }, { status: 200 });
  }
}

