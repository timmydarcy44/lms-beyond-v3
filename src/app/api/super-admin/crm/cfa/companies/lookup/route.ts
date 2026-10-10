import { NextRequest, NextResponse } from "next/server";

import { isSuperAdmin } from "@/lib/auth/super-admin";

type Siege = {
  siret?: string;
  adresse?: string;
  code_postal?: string;
  libelle_commune?: string;
  geo_adresse?: string;
};

type CompanyHit = {
  nom_complet?: string;
  nom_raison_sociale?: string;
  siege?: Siege;
  matching_etablissements?: Siege[];
};

export async function GET(request: NextRequest) {
  if (!(await isSuperAdmin())) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  }

  const siret = (request.nextUrl.searchParams.get("siret") ?? "").replace(/\s/g, "");
  if (!/^\d{14}$/.test(siret)) {
    return NextResponse.json({ error: "Le SIRET doit contenir 14 chiffres." }, { status: 400 });
  }

  const response = await fetch(
    `https://recherche-entreprises.api.gouv.fr/search?q=${siret}&per_page=5`,
    { headers: { Accept: "application/json" }, next: { revalidate: 0 } },
  );
  if (!response.ok) {
    return NextResponse.json({ error: "La recherche SIRET est indisponible." }, { status: 502 });
  }

  const payload = (await response.json()) as { results?: CompanyHit[] };
  const results = payload.results ?? [];
  const match =
    results.find((item) => item.siege?.siret === siret) ??
    results.find((item) => item.matching_etablissements?.some((site) => site.siret === siret)) ??
    results[0];

  if (!match) {
    return NextResponse.json({ error: "Aucune entreprise trouvée pour ce SIRET." }, { status: 404 });
  }

  const site =
    match.siege?.siret === siret
      ? match.siege
      : match.matching_etablissements?.find((item) => item.siret === siret) ?? match.siege;
  const address = [site?.geo_adresse, site?.adresse, [site?.code_postal, site?.libelle_commune].filter(Boolean).join(" ")]
    .find((value) => Boolean(value && value.trim()));

  return NextResponse.json({
    companyName: match.nom_raison_sociale || match.nom_complet || "",
    address: address ?? "",
    siret,
  });
}
