import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getTenantFromHeaders } from "@/lib/tenant/detection-server";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client not available" }, { status: 500 });
    }

    const { slug } = await params;

    // Récupérer l'ID de Jessica Contentin
    const { data: jessicaProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", JESSICA_CONTENTIN_EMAIL)
      .maybeSingle();

    if (profileError || !jessicaProfile) {
      console.error("[api/blog/[slug]] Error fetching Jessica profile:", profileError);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Récupérer l'article par slug
    const { data: post, error: postError } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("slug", slug)
      .eq("creator_id", jessicaProfile.id)
      .eq("is_published", true)
      .maybeSingle();

    if (postError) {
      console.error("[api/blog/[slug]] Error fetching post:", postError);
      return NextResponse.json({ error: "Error fetching post" }, { status: 500 });
    }

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post }, { status: 200 });
  } catch (error) {
    console.error("[api/blog/[slug]] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

