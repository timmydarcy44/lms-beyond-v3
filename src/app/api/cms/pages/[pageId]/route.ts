import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";

type RouteParams = {
  params: Promise<{ pageId: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageId } = await params;
    const supabase = await getServerClient();
    const { data, error } = await supabase
      .from("cms_pages")
      .select("*")
      .eq("id", pageId)
      .single();

    if (error) {
      console.error("[cms/pages] Error fetching page:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Page not found" }, { status: 404 });
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

export async function PUT(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageId } = await params;
    const body = await request.json();
    const { slug, title, meta_title, meta_description, h1, h2, content, content_type, is_published } = body;

    if (!slug || !title) {
      return NextResponse.json(
        { error: "Slug and title are required" },
        { status: 400 }
      );
    }

    const supabase = await getServerClient();
    const { data, error } = await supabase
      .from("cms_pages")
      .update({
        slug,
        title,
        meta_title,
        meta_description,
        h1,
        h2,
        content,
        content_type: content_type || "legacy",
        is_published: is_published || false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pageId)
      .select()
      .single();

    if (error) {
      console.error("[cms/pages] Error updating page:", error);
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

export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageId } = await params;
    const body = await request.json();

    const supabase = await getServerClient();
    const { data, error } = await supabase
      .from("cms_pages")
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq("id", pageId)
      .select()
      .single();

    if (error) {
      console.error("[cms/pages] Error patching page:", error);
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

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { pageId } = await params;
    const supabase = await getServerClient();
    const { error } = await supabase
      .from("cms_pages")
      .delete()
      .eq("id", pageId);

    if (error) {
      console.error("[cms/pages] Error deleting page:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[cms/pages] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

