import { notFound } from "next/navigation";
import { getServerClient } from "@/lib/supabase/server";
import { GridPageRenderer } from "@/components/super-admin/cms/grid-page-renderer";
import { CMSPageRenderer } from "@/components/cms/cms-page-renderer";
import { Metadata } from "next";

type PageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await getServerClient();
  
  const { data: page } = await supabase
    .from("cms_pages")
    .select("meta_title, meta_description, title, content_type")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (!page) {
    return {
      title: "Page non trouvée",
    };
  }

  return {
    title: page.meta_title || page.title,
    description: page.meta_description || undefined,
  };
}

export default async function CMSPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await getServerClient();

  const { data: page, error } = await supabase
    .from("cms_pages")
    .select("*")
    .eq("slug", slug)
    .eq("is_published", true)
    .single();

  if (error || !page) {
    notFound();
  }

  // Si c'est une page avec structure de grille, utiliser GridPageRenderer
  if (page.content_type === "grid" || (Array.isArray(page.content) && page.content[0]?.type === "section")) {
    return <GridPageRenderer page={page} />;
  }

  // Sinon, utiliser le renderer legacy
  return <CMSPageRenderer page={page} />;
}
