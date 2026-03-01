import { NextResponse } from "next/server";
import { getServiceRoleClientOrFallback } from "@/lib/supabase/server";

type BootstrapPayload = {
  userId: string;
  email?: string | null;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  roleType?: string | null;
  typeProfil?: string | null;
  posteActuel?: string | null;
  entreprise?: string | null;
  typeContrat?: string | null;
  rythmeTeletravail?: string | null;
  tjm?: string | null;
  expertise?: string | null;
  stackTechnique?: string | null;
  disponibilite?: string | null;
  langues?: string | null;
  ancienMetier?: string | null;
  metierVise?: string | null;
  organismeFormation?: string | null;
  echeance?: string | null;
  ecole?: string | null;
  niveauEtude?: string | null;
  rythmeAlternance?: string | null;
  dateFinContrat?: string | null;
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BootstrapPayload;
    if (!body?.userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    const supabase = await getServiceRoleClientOrFallback();
    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const profilePayload = {
      id: body.userId,
      email: body.email ?? null,
      full_name: body.fullName ?? null,
      first_name: body.firstName ?? null,
      last_name: body.lastName ?? null,
      role_type: body.roleType ?? "particulier",
      type_profil: body.typeProfil ?? null,
      poste_actuel: body.posteActuel ?? null,
      entreprise: body.entreprise ?? null,
      type_contrat: body.typeContrat ?? null,
      rythme_teletravail: body.rythmeTeletravail ?? null,
      tjm: body.tjm ?? null,
      expertise: body.expertise ?? null,
      stack_technique: body.stackTechnique ?? null,
      disponibilite: body.disponibilite ?? null,
      langues: body.langues ?? null,
      ancien_metier: body.ancienMetier ?? null,
      metier_vise: body.metierVise ?? null,
      organisme_formation: body.organismeFormation ?? null,
      echeance: body.echeance ?? null,
      ecole: body.ecole ?? null,
      niveau_etude: body.niveauEtude ?? null,
      rythme_alternance: body.rythmeAlternance ?? null,
      date_fin_contrat: body.dateFinContrat ?? null,
    };

    await supabase.from("profiles").upsert(profilePayload, { onConflict: "id" });

    const slugBase =
      `${body.firstName ?? ""} ${body.lastName ?? ""}`.trim() ||
      String(body.fullName ?? "").trim() ||
      String(body.email ?? "").split("@")[0] ||
      body.userId;
    const publicSlug = slugify(slugBase || "profil");
    await supabase
      .from("user_profile_settings")
      .upsert({ user_id: body.userId, public_slug: publicSlug }, { onConflict: "user_id" });

    return NextResponse.json({ ok: true, publicSlug });
  } catch (error) {
    console.error("[bootstrap-profile] error:", error);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
