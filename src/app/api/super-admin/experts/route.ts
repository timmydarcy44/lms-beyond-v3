import { NextRequest, NextResponse } from "next/server";
import { isSuperAdmin } from "@/lib/auth/super-admin";
import { CFA_SPECIALIZATIONS } from "@/lib/cfa-applications";
import { isContributorRole, withContributorProfile, type ContributorRole } from "@/lib/expert/contributor-profile";
import { provisionExpertAuthUser } from "@/lib/expert/provision-expert-auth";
import { getServiceRoleClient } from "@/lib/supabase/server";

const BUCKETS = ["Public", "public", "avatars"] as const;
const CURSUS = new Map(CFA_SPECIALIZATIONS.map((item) => [item.value, item.label]));

function clean(value: FormDataEntryValue | null): string {
  return String(value ?? "").trim();
}

async function uploadPhoto(userId: string, file: File): Promise<string | null> {
  if (!file || file.size === 0) return null;
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    throw new Error("La photo doit être un JPEG, PNG ou WebP.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("La photo dépasse 5 Mo.");
  }
  const db = getServiceRoleClient();
  if (!db) throw new Error("Service indisponible");
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `experts/${userId}/photo.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  let lastError = "Aucun espace de stockage disponible.";
  for (const bucket of BUCKETS) {
    const { error } = await db.storage.from(bucket).upload(path, buffer, {
      contentType: file.type,
      upsert: true,
    });
    if (!error) {
      const { data } = db.storage.from(bucket).getPublicUrl(path);
      return data.publicUrl || null;
    }
    lastError = error.message;
    if (!/bucket not found|not found/i.test(error.message)) break;
  }
  throw new Error(lastError);
}

export async function GET() {
  try {
    const hasAccess = await isSuperAdmin();
    if (!hasAccess) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const serviceClient = getServiceRoleClient();
    if (!serviceClient) {
      return NextResponse.json(
        { error: "SUPABASE_SERVICE_ROLE_KEY manquante." },
        { status: 503 },
      );
    }

    const { data: experts, error } = await serviceClient
      .from("experts")
      .select("id, first_name, last_name, specialty")
      .order("last_name", { ascending: true });

    if (error) {
      console.error("[api/super-admin/experts]", error);
      return NextResponse.json({ error: "Erreur lors de la récupération des experts" }, { status: 500 });
    }

    return NextResponse.json({ experts: experts ?? [] });
  } catch (error) {
    console.error("[api/super-admin/experts]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }
  const db = getServiceRoleClient();
  if (!db) return NextResponse.json({ error: "Service indisponible" }, { status: 503 });

  const form = await request.formData();
  const firstName = clean(form.get("firstName"));
  const lastName = clean(form.get("lastName"));
  const email = clean(form.get("email")).toLowerCase();
  const cursus = form.getAll("cursus").map((value) => String(value)).filter((value) => CURSUS.has(value));
  const badgeIds = form.getAll("badges").map((value) => String(value));
  const roles = form.getAll("roles").map((value) => String(value)).filter(isContributorRole);
  const jobTitle = clean(form.get("jobTitle"));
  const photo = form.get("photo");

  if (!firstName || !lastName || !email.includes("@")) {
    return NextResponse.json({ error: "Prénom, nom et email sont requis." }, { status: 400 });
  }
  if (roles.length === 0) {
    return NextResponse.json({ error: "Choisissez Expert, Formateur, ou les deux." }, { status: 400 });
  }

  const auth = await provisionExpertAuthUser(db, {
    email,
    firstName,
    lastName,
    redirectTo: new URL("/super/experts", request.url).origin,
  });
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: 400 });
  }
  await db.auth.admin.updateUserById(auth.userId, { email_confirm: true });

  let photoUrl: string | null = null;
  if (photo instanceof File && photo.size > 0) {
    try {
      photoUrl = await uploadPhoto(auth.userId, photo);
    } catch (error) {
      return NextResponse.json(
        { error: error instanceof Error ? error.message : "Photo impossible" },
        { status: 400 },
      );
    }
  }

  let openBadges: { id: string; name: string }[] = [];
  if (badgeIds.length > 0) {
    const { data } = await db.from("open_badges").select("id,name").in("id", badgeIds);
    openBadges = (data ?? []).map((badge) => ({
      id: String(badge.id),
      name: String(badge.name ?? "Open badge"),
    }));
  }

  const row = {
    id: auth.userId,
    email,
    first_name: firstName,
    last_name: lastName,
    headline: jobTitle || null,
    photo_url: photoUrl,
    avatar_url: photoUrl,
    specialties: cursus.map((value) => CURSUS.get(value) ?? value),
    open_badges: openBadges,
    review_status: "approved",
    is_active: true,
    wants_certification: false,
    references: withContributorProfile([], { roles: roles as ContributorRole[], jobTitle }),
  };

  let { error } = await db.from("experts").upsert(row, { onConflict: "id" });
  if (error && /open_badges/i.test(error.message)) {
    const withoutBadges = { ...row };
    delete withoutBadges.open_badges;
    ({ error } = await db.from("experts").upsert(withoutBadges, { onConflict: "id" }));
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: auth.userId });
}
