import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClient } from "@/lib/supabase/server";

const JESSICA_CONTENTIN_EMAIL = "contentin.cabinet@gmail.com";

export async function POST(request: NextRequest) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const body = await request.json();
    const { title, metaTitle, metaDescription, excerpt, content, coverImageUrl, coverImageAlt, isPublished } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: "Le titre et le contenu sont requis" },
        { status: 400 }
      );
    }

    const supabase = getServiceRoleClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Service indisponible" },
        { status: 503 }
      );
    }

    // Récupérer l'ID de Jessica Contentin
    const { data: jessicaProfile } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", JESSICA_CONTENTIN_EMAIL)
      .maybeSingle();

    if (!jessicaProfile) {
      return NextResponse.json(
        { error: "Profil Jessica Contentin non trouvé" },
        { status: 404 }
      );
    }

    // Générer un slug à partir du titre
    const slug = title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Vérifier l'unicité du slug
    const { data: existingPost } = await supabase
      .from("blog_posts")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();

    let finalSlug = slug;
    if (existingPost) {
      finalSlug = `${slug}-${Date.now()}`;
    }

    // Calculer le temps de lecture estimé (environ 200 mots par minute)
    const wordCount = content.replace(/<[^>]*>/g, "").split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    // Créer l'article
    const { data: post, error } = await supabase
      .from("blog_posts")
      .insert({
        title,
        slug: finalSlug,
        meta_title: metaTitle || title || null,
        meta_description: metaDescription || excerpt || null,
        excerpt: excerpt || null,
        content,
        cover_image_url: coverImageUrl || null,
        cover_image_alt: coverImageAlt || null,
        creator_id: jessicaProfile.id,
        is_published: isPublished || false,
        published_at: isPublished ? new Date().toISOString() : null,
        reading_time: readingTime,
      })
      .select()
      .single();

    if (error) {
      console.error("[api/blog/posts] Error creating post:", error);
      return NextResponse.json(
        { error: "Erreur lors de la création de l'article" },
        { status: 500 }
      );
    }

    return NextResponse.json(post);
  } catch (error: any) {
    console.error("[api/blog/posts] Error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création de l'article" },
      { status: 500 }
    );
  }
}

