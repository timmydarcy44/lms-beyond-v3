import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const siret = searchParams.get("siret");

  if (!siret) return NextResponse.json({ error: "SIRET manquant" }, { status: 400 });

  try {
    // 1. On appelle l'API Gouv (ultra fiable pour Nom + NAF)
    const gouvRes = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${siret}`);
    const gouvData = await gouvRes.json();
    const ent = gouvData.results?.[0];

    if (!ent) return NextResponse.json({ error: "Entreprise non trouvée" }, { status: 404 });

    // 2. On tente CFADock pour l'OPCO (mais on ne crash pas si ça échoue)
    let opco = "À déterminer";
    try {
      const cfaRes = await fetch(`https://www.cfadock.fr/api/opcos?siret=${siret}`, {
        signal: AbortSignal.timeout(2000),
      });
      const cfaData = await cfaRes.json();
      opco = cfaData[0]?.opcoName || "À déterminer";
    } catch (e) {
      console.log("CFADock indisponible, passage au fallback");
    }

    // 3. On renvoie un objet propre et unifié
    return NextResponse.json({
      raison_sociale: ent.nom_complet || ent.nom_raison_sociale,
      activite_principale: ent.activite_principale,
      opco_name: opco,
      adresse: ent.siege?.adresse,
    });
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
