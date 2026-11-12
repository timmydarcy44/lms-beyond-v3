import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { mapAccountManagerRow } from "@/lib/control/account-managers";
import { notifyAccountManagerWelcome } from "@/lib/email/account-manager-assigned";
import { getServerClient, getServiceRoleClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Réservé au staff Byound" }, { status: 403 });
  }
  const service = getServiceRoleClient();
  if (!service) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const { data, error } = await service
    .from("account_managers")
    .select("id, first_name, last_name, email, phone, photo_url, is_active, created_at, updated_at")
    .order("last_name", { ascending: true })
    .order("first_name", { ascending: true });

  if (error) {
    if (/account_managers|42P01/i.test(error.message)) {
      return NextResponse.json({
        managers: [],
        schemaMissing: true,
        error: "Appliquez la migration account_managers.",
      });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    managers: (data ?? []).map(mapAccountManagerRow),
  });
}

export async function POST(request: NextRequest) {
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

  const firstName = String(body.firstName ?? "").trim();
  const lastName = String(body.lastName ?? "").trim();
  const email = String(body.email ?? "").trim().toLowerCase();
  const phone = String(body.phone ?? "").trim() || null;
  const photoUrl = String(body.photoUrl ?? "").trim() || null;

  if (!firstName || !lastName) {
    return NextResponse.json({ error: "Prénom et nom requis." }, { status: 400 });
  }
  if (!email.includes("@")) {
    return NextResponse.json({ error: "E-mail invalide." }, { status: 400 });
  }

  const inserted = await service
    .from("account_managers")
    .insert({
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      photo_url: photoUrl,
      is_active: body.isActive !== false,
      updated_at: new Date().toISOString(),
    })
    .select("id, first_name, last_name, email, phone, photo_url, is_active")
    .maybeSingle();

  if (inserted.error) {
    if (/unique|duplicate/i.test(inserted.error.message)) {
      return NextResponse.json({ error: "Cet e-mail est déjà utilisé pour un gestionnaire." }, { status: 409 });
    }
    if (/account_managers|42P01/i.test(inserted.error.message)) {
      return NextResponse.json({ error: "Appliquez la migration account_managers." }, { status: 503 });
    }
    return NextResponse.json({ error: inserted.error.message }, { status: 400 });
  }

  const welcome = await notifyAccountManagerWelcome({
    firstName,
    lastName,
    email,
  });

  return NextResponse.json({
    ok: true,
    manager: mapAccountManagerRow(inserted.data!),
    emailSent: welcome.sent,
  });
}
