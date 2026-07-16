import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";
import { JESSICA_CONTENTIN_EMAIL } from "@/lib/jessica-contentin/studio-config";

async function assertJessicaAdmin() {
  if (!(await isSuperAdmin())) return null;
  const auth = await getServerClient();
  if (!auth) return null;
  const {
    data: { user },
  } = await auth.auth.getUser();
  if (!user || user.email?.toLowerCase() !== JESSICA_CONTENTIN_EMAIL) return null;
  return user;
}

export async function POST(req: NextRequest) {
  const user = await assertJessicaAdmin();
  if (!user) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const supabase = getServiceRoleClient();
  if (!supabase) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const firstName = String(body?.first_name ?? body?.firstName ?? "").trim();
  const lastName = String(body?.last_name ?? body?.lastName ?? "").trim();
  const email = String(body?.email ?? "").trim().toLowerCase() || null;
  const phone = String(body?.phone ?? "").trim() || null;

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Prénom et nom sont requis" }, { status: 400 });
  }

  const externalId = `manual-${crypto.randomUUID()}`;

  const { data, error } = await supabase
    .from("jessica_cabinet_patients")
    .insert({
      external_id: externalId,
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      notes: "Créé manuellement depuis /super",
      raw_import: { source: "manual_super", created_by: user.id },
    })
    .select("id, first_name, last_name, email, phone")
    .single();

  if (error) {
    console.error("[jessica-crm/create-client]", error);
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({
    success: true,
    client: data,
    clientId: data.id,
  });
}
