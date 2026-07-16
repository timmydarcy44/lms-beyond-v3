import { NextResponse } from "next/server";
import { getOpcoFromIdcc, resolveOpcoName } from "@/lib/ecole/siret-company-helpers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siret = searchParams.get("siret");

  if (!siret) return NextResponse.json({ error: "SIRET manquant" }, { status: 400 });

  try {
    const gouvRes = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${siret}`);
    const gouvData = await gouvRes.json();
    const ent = gouvData.results?.[0];

    if (!ent) return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });

    const idccCode =
      ent?.conventions_collectives?.[0]?.idcc ||
      ent?.convention_collective?.idcc ||
      ent?.idcc ||
      null;

    let cfadockOpco: string | null = null;
    try {
      const cfaRes = await fetch(`https://www.cfadock.fr/api/opcos?siret=${siret}`, {
        signal: AbortSignal.timeout(3000),
      });
      const cfaData = await cfaRes.json();
      cfadockOpco = cfaData[0]?.opcoName || null;
    } catch {
      // CFADock indisponible — fallback IDCC / NAF
    }

    const opco_name = resolveOpcoName({
      naf: ent.activite_principale,
      idcc: idccCode ? String(idccCode) : null,
      cfadockName: cfadockOpco,
    });

    return NextResponse.json({
      raison_sociale: ent.nom_complet || ent.nom_raison_sociale,
      activite_principale: ent.activite_principale,
      opco_name,
      idcc_code: idccCode ? String(idccCode) : null,
      opco_from_idcc: getOpcoFromIdcc(idccCode ? String(idccCode) : null),
      adresse: ent.siege?.adresse,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
