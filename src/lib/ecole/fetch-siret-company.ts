/**
 * Enrichissement fiche entreprise depuis l'API recherche-entreprises (gouv) + proxy OPCO optionnel.
 * Usage : prospection / ajout entreprise partenaire (sans persistance).
 */

export type SiretCompanyPayload = {
  name: string;
  company_name: string;
  siret: string;
  siren: string;
  naf_code: string;
  opco_name: string;
  address: string | null;
  city: string | null;
  zip_code: string | null;
  sector: string | null;
  creation_date: string | null;
  tranche_effectif: string | null;
  idcc_code: string | null;
};

const cleanCompanyName = (value: string) => {
  const match = value.match(/\(([^)]+)\)/);
  if (match && match[1].trim().toUpperCase() === "ALTERNANCIA") {
    return "ALTERNANCIA";
  }
  return value.replace(/\s*\([^)]*\)\s*/g, " ").replace(/\s{2,}/g, " ").trim();
};

const getOpcoFromNaf = (naf: string): string => {
  if (!naf) return "À vérifier";
  const prefix2 = naf.substring(0, 2);
  if (["64", "65", "66", "69", "70", "71", "72", "73", "74", "75"].includes(prefix2)) return "ATLAS";
  if (["45", "49", "50", "51", "52", "53"].includes(prefix2)) return "OPCO Mobilités";
  if (["10", "11", "13", "14", "15", "16", "17", "18"].includes(prefix2)) return "OCAPIAT";
  if (["01", "02", "03", "05", "06", "07", "08", "09"].includes(prefix2)) return "OPCO 2i";
  if (["41", "42", "43"].includes(prefix2)) return "Constructys";
  if (["46", "47", "77", "79", "81", "82"].includes(prefix2)) return "L'Opcommerce";
  if (["55", "56", "58", "59", "60", "61", "62", "63"].includes(prefix2)) return "OPCO Santé";
  if (["84", "85", "86", "87", "88", "94"].includes(prefix2)) return "AKTO";
  if (["90", "91", "92", "93"].includes(prefix2)) return "AFDAS";
  if (["95", "96"].includes(prefix2)) return "OPCO Uniformation";
  return `À vérifier (NAF: ${naf})`;
};

export async function fetchSiretCompany(siretRaw: string): Promise<
  { ok: true; data: SiretCompanyPayload } | { ok: false; error: string }
> {
  const siret = siretRaw.replace(/\s/g, "");
  if (siret.length !== 14 || !/^\d{14}$/.test(siret)) {
    return { ok: false, error: "SIRET invalide (14 chiffres attendus)." };
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${siret}`, {
      signal: controller.signal,
    });
    const data = await response.json();
    const first = data?.results?.[0];
    const siege = first?.siege || {};

    let proxyData: {
      raison_sociale?: string;
      activite_principale?: string;
      opco_name?: string;
      adresse?: string;
    } | null = null;
    try {
      const proxyResponse = await fetch(`/api/proxy-opco?siret=${siret}`);
      proxyData = await proxyResponse.json();
    } catch {
      proxyData = null;
    }

    const rawName =
      proxyData?.raison_sociale ||
      first?.nom_raison_sociale ||
      first?.nom_entreprise ||
      first?.denomination ||
      "Entreprise";
    const nextName = String(rawName).replace(/[^\w\s]/gi, "");
    const nextCity = siege?.libelle_commune || "";
    const nextZip = siege?.code_postal || "";
    const apeCode = proxyData?.activite_principale || first?.activite_principale;
    const idccCode =
      first?.conventions_collectives?.[0]?.idcc ||
      first?.convention_collective?.idcc ||
      first?.idcc ||
      "";
    const nextSector =
      first?.activite_principale_libelle ||
      first?.libelle_activite_principale ||
      first?.libelle_activite_principale_entreprise ||
      first?.secteur_activite ||
      "";
    const nextCreationDate = first?.date_creation || null;
    const finalName = cleanCompanyName(proxyData?.raison_sociale || nextName);
    const finalNaf = proxyData?.activite_principale || apeCode || "";
    let finalOpco = getOpcoFromNaf(finalNaf);
    if (proxyData?.opco_name && proxyData.opco_name !== "À déterminer") {
      finalOpco = proxyData.opco_name;
    }
    const addressValue = proxyData?.adresse || siege?.adresse || "";

    if (!finalName) {
      return { ok: false, error: "Nom de l'entreprise introuvable pour ce SIRET." };
    }

    return {
      ok: true,
      data: {
        name: finalName,
        company_name: finalName,
        siret,
        siren: siret.slice(0, 9),
        naf_code: finalNaf,
        opco_name: finalOpco,
        address: addressValue || null,
        city: nextCity || null,
        zip_code: nextZip || null,
        sector: nextSector || null,
        creation_date: nextCreationDate,
        tranche_effectif: first?.tranche_effectif_salarie || null,
        idcc_code: idccCode ? String(idccCode) : null,
      },
    };
  } catch (e) {
    const aborted = (e as { name?: string })?.name === "AbortError";
    return {
      ok: false,
      error: aborted ? "Délai dépassé (API gouv)." : "API entreprises indisponible. Saisissez la fiche à la main.",
    };
  } finally {
    clearTimeout(timeoutId);
  }
}
