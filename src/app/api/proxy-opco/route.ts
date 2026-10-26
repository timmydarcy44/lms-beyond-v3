import { NextResponse } from "next/server";
import { lookupOpcoForSiret } from "@/lib/cfa/lookup-opco";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siret = (searchParams.get("siret") ?? "").replace(/\s/g, "");

  if (!/^\d{14}$/.test(siret)) return NextResponse.json({ error: "SIRET manquant" }, { status: 400 });

  try {
    const found = await lookupOpcoForSiret(siret);
    return NextResponse.json({
      raison_sociale: found.raisonSociale,
      activite_principale: found.naf,
      opco_name: found.opcoName,
      opco_source: found.source,
      idcc_code: found.idcc,
      opco_from_idcc: found.opcoFromIdcc,
      adresse: found.address,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur serveur";
    const status = message === "Entreprise non trouvée" ? 404 : 500;
    return NextResponse.json({ error: status === 404 ? message : "Erreur serveur" }, { status });
  }
}
