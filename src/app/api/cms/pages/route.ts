import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth/session";
import { isSuperAdmin } from "@/lib/auth/super-admin";

export async function POST(request: NextRequest) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { slug, title, meta_title, meta_description, h1, h2, content, content_type, is_published } = body;

    if (!slug || !title) {
      return NextResponse.json(
        { error: "Slug and title are required" },
        { status: 400 }
      );
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }
    const { data, error } = await supabase
      .from("cms_pages")
      .insert({
        slug,
        title,
        meta_title,
        meta_description,
        h1,
        h2,
        content,
        content_type: content_type || "legacy",
        is_published: is_published || false,
        created_by: session.id,
      })
      .select()
      .single();

    if (error) {
      console.error("[cms/pages] Error creating page:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[cms/pages] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const supabase = await getServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Service indisponible" }, { status: 503 });
    }

    // Récupérer l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser();
    const isContentin = user?.email === "contentin.cabinet@gmail.com";

    // Filtrer les pages : contentin ne voit que ses pages, les autres voient toutes les pages
    let query = supabase
      .from("cms_pages")
      .select("*");

    if (isContentin && user?.id) {
      // Pour contentin, filtrer uniquement ses pages (créées par lui OU slug commence par "jessica-contentin")
      query = query.or(`created_by.eq.${user.id},slug.ilike.jessica-contentin%`);
    } else if (!isContentin && user?.id) {
      // Pour les autres super admins, exclure les pages de jessica-contentin
      query = query.not("slug", "ilike", "jessica-contentin%");
    }

    const { data, error } = await query.order("updated_at", { ascending: false });

    if (error) {
      console.error("[cms/pages] Error fetching pages:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("[cms/pages] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

