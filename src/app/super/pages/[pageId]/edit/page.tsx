import { redirect, notFound } from "next/navigation";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { GridPageBuilder } from "@/components/super-admin/cms/grid-page-builder";

type EditPageProps = {
  params: Promise<{ pageId: string }>;
};

export default async function EditPagePage({ params }: EditPageProps) {
  const hasAccess = await isSuperAdmin();

  if (!hasAccess) {
    redirect("/dashboard");
  }

  const { pageId } = await params;
  const supabase = await getServerClient();
  if (!supabase) {
    notFound();
  }
  const { data: page, error } = await supabase
    .from("cms_pages")
    .select("*")
    .eq("id", pageId)
    .single();

  if (error) {
    console.error("[edit-page] Error fetching page:", error);
    redirect("/super/pages");
  }

  if (!page) {
    console.error("[edit-page] Page not found:", pageId);
    redirect("/super/pages");
  }

  console.log("[edit-page] Page loaded:", {
    id: page.id,
    title: page.title,
    content_type: (page as any).content_type,
    content_length: Array.isArray(page.content) ? page.content.length : "not array",
    first_item: Array.isArray(page.content) && page.content[0] ? page.content[0] : null,
  });

  return <GridPageBuilder initialPage={page} />;
}

