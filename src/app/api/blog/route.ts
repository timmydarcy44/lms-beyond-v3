import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getTenantFromHeaders } from "@/lib/tenant/detection-server";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

export async function GET(request: Request) {
  try {
    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase client not available" }, { status: 500 });
    }

    // Détecter le tenant
    const tenant = await getTenantFromHeaders();
    const tenantId = tenant?.id;

    // Récupérer l'ID de Jessica Contentin
    const { data: jessicaProfile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", JESSICA_CONTENTIN_EMAIL)
      .maybeSingle();

    if (profileError || !jessicaProfile) {
      console.error("[api/blog] Error fetching Jessica profile:", profileError);
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    // Récupérer les articles publiés de Jessica Contentin
    const { data: posts, error: postsError } = await supabase
      .from("blog_posts")
      .select("*")
      .eq("creator_id", jessicaProfile.id)
      .eq("is_published", true)
      .order("published_at", { ascending: false });

    if (postsError) {
      console.error("[api/blog] Error fetching posts:", postsError);
      return NextResponse.json({ error: "Error fetching posts" }, { status: 500 });
    }

    console.log(`[api/blog] Found ${posts?.length || 0} published posts`);

    return NextResponse.json({ posts: posts || [] }, { status: 200 });
  } catch (error) {
    console.error("[api/blog] Unexpected error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

