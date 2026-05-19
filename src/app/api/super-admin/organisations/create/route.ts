import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient } from "@/lib/supabase/server";
import { getServiceSupabase } from "@/lib/supabase/service";

type CreateOrganizationPayload = {
  name?: string;
  slug?: string;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export async function POST(request: NextRequest) {
  console.log(">>> LA ROUTE API EST BIEN APPELÉE <<<");

  try {
    const allowed = await isSuperAdmin();
    if (!allowed) {
      return NextResponse.json({ ok: false, error: "FORBIDDEN" }, { status: 403 });
    }

    let body: CreateOrganizationPayload | any;
    try {
      body = await request.json();
    } catch (error) {
      console.log("DEBUG API - JSON invalide (400):", error);
      return NextResponse.json({ error: "Invalid JSON", received: null }, { status: 400 });
    }

    console.log("DEBUG API - Body reçu:", body);

    if (!body?.name) {
      console.log("ERREUR : Le champ 'name' est vide ou absent");
      return NextResponse.json({ error: "Name required", received: body }, { status: 400 });
    }

    const name = (body.name ?? "").trim();
    if (!name) {
      console.log("ERREUR API 400:", { reason: "name is missing/empty", received: body });
      return NextResponse.json(
        { ok: false, error: "VALIDATION_ERROR", fieldErrors: { name: "Le nom est obligatoire" } },
        { status: 400 },
      );
    }

    const sessionClient = await getServerClient();
    const { data: authData } = sessionClient ? await sessionClient.auth.getUser() : { data: null as any };
    const currentUserId = authData?.user?.id ?? null;

    const supabase = await getServiceSupabase();

    const baseSlug = body.slug ? slugify(body.slug) : slugify(name);
    const finalSlug = baseSlug;

    const { data: existing, error: slugCheckError } = await supabase
      .from("organizations")
      .select("id")
      .eq("slug", finalSlug)
      .maybeSingle();

    if (slugCheckError) {
      console.error("DEBUG SUPABASE - slug check error:", slugCheckError);
      return NextResponse.json({ error: "SLUG_CHECK_FAILED", details: slugCheckError.message }, { status: 500 });
    }
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "SLUG_ALREADY_EXISTS", details: "Le slug est déjà utilisé. Choisissez-en un autre." },
        { status: 400 },
      );
    }

    console.log("Insertion Org - Colonnes autorisées : name, slug");
    const { data: newOrg, error: orgError } = await supabase
      .from("organizations")
      .insert([{ name, slug: finalSlug }])
      .select()
      .single();

    if (orgError || !newOrg) {
      console.error("[super-admin][organisations/create] insert failed:", orgError);
      return NextResponse.json(
        { error: orgError?.message || "insert organizations failed", details: orgError?.details || orgError?.hint || "" },
        { status: 500 },
      );
    }

    if (currentUserId) {
      try {
        await supabase.from("org_memberships").upsert({
          org_id: newOrg.id,
          user_id: currentUserId,
          role: "admin",
        });
      } catch (e) {
        console.error("[super-admin][organisations/create] org_memberships upsert failed (ignored):", {
          message: e instanceof Error ? e.message : String(e),
        });
      }
    }

    return NextResponse.json({ ok: true, organization: newOrg }, { status: 201 });
  } catch (err: any) {
    const errorMsg = err?.message || "Erreur inconnue";
    console.error("[CRITICAL] Erreur brute:", err);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

