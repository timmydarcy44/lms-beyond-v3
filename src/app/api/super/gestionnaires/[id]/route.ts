import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { mapAccountManagerRow } from "@/lib/control/account-managers";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: Ctx) {
  const { id } = await context.params;
  const supabase = await getServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user || !(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const body = (await request.json().catch(() => ({}))) as {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string | null;
    photoUrl?: string | null;
    isActive?: boolean;
  };

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (body.firstName !== undefined) {
    const firstName = String(body.firstName).trim();
    if (!firstName) return NextResponse.json({ error: "Prénom requis." }, { status: 400 });
    patch.first_name = firstName;
  }
  if (body.lastName !== undefined) {
    const lastName = String(body.lastName).trim();
    if (!lastName) return NextResponse.json({ error: "Nom requis." }, { status: 400 });
    patch.last_name = lastName;
  }
  if (body.email !== undefined) {
    const email = String(body.email).trim().toLowerCase();
    if (!email.includes("@")) return NextResponse.json({ error: "E-mail invalide." }, { status: 400 });
    patch.email = email;
  }
  if (body.phone !== undefined) patch.phone = String(body.phone ?? "").trim() || null;
  if (body.photoUrl !== undefined) patch.photo_url = String(body.photoUrl ?? "").trim() || null;
  if (body.isActive !== undefined) patch.is_active = Boolean(body.isActive);

  const updated = await service
    .from("account_managers")
    .update(patch)
    .eq("id", id)
    .select("id, first_name, last_name, email, phone, photo_url, is_active")
    .maybeSingle();

  if (updated.error) {
    if (/unique|duplicate/i.test(updated.error.message)) {
      return NextResponse.json({ error: "Cet e-mail est déjà utilisé pour un gestionnaire." }, { status: 409 });
    }
    return NextResponse.json({ error: updated.error.message }, { status: 400 });
  }
  if (!updated.data) return NextResponse.json({ error: "Gestionnaire introuvable" }, { status: 404 });

  return NextResponse.json({ ok: true, manager: mapAccountManagerRow(updated.data) });
}

export async function DELETE(_request: NextRequest, context: Ctx) {
  const { id } = await context.params;
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  // Soft delete : détache des comptes clients et entreprises d'accueil CFA.
  await service.from("organizations").update({ account_manager_id: null }).eq("account_manager_id", id);
  await service.from("cfa_companies").update({ account_manager_id: null }).eq("account_manager_id", id);

  const removed = await service.from("account_managers").delete().eq("id", id).select("id").maybeSingle();
  if (removed.error) return NextResponse.json({ error: removed.error.message }, { status: 400 });
  if (!removed.data) return NextResponse.json({ error: "Gestionnaire introuvable" }, { status: 404 });

  return NextResponse.json({ ok: true });
}
