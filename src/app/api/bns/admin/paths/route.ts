import { NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServiceRoleClientOrFallback, getServerClient } from "@/lib/supabase/server";

export async function GET() {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    return NextResponse.json({ ok: false, errorId: "FORBIDDEN" }, { status: 403 });
  }

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ ok: false, errorId: "SUPABASE_UNAVAILABLE" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("bns_proof_paths")
    .select("id, title, slug, description, trigger_label, is_published")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ ok: false, errorId: "PATHS_FETCH_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, paths: data ?? [] });
}

export async function POST(request: Request) {
  const hasAccess = await isSuperAdmin();
  if (!hasAccess) {
    return NextResponse.json({ ok: false, errorId: "FORBIDDEN" }, { status: 403 });
  }

  const supabase = await getServiceRoleClientOrFallback();
  if (!supabase) {
    return NextResponse.json({ ok: false, errorId: "SUPABASE_UNAVAILABLE" }, { status: 500 });
  }

  const authClient = await getServerClient();
  const { data: authData } = authClient ? await authClient.auth.getUser() : { data: null };
  const actorId = authData?.user?.id ?? null;

  const payload = await request.json();
  const { title, slug, description, trigger_label } = payload ?? {};

  if (!title || !slug) {
    return NextResponse.json({ ok: false, errorId: "MISSING_FIELDS" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("bns_proof_paths")
    .insert({
      title,
      slug,
      description: typeof description === "string" ? description : null,
      trigger_label: typeof trigger_label === "string" ? trigger_label : null,
      created_by: actorId,
    })
    .select("id, title, slug, description, trigger_label, is_published")
    .maybeSingle();

  if (error || !data) {
    return NextResponse.json({ ok: false, errorId: "PATH_CREATE_FAILED" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, path: data });
}

