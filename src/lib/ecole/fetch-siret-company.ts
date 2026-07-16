/**
 * Enrichissement fiche entreprise depuis l'API recherche-entreprises (gouv) + proxy OPCO optionnel.
 * Usage : prospection / ajout entreprise partenaire (sans persistance).
 */

import { resolveOpcoName } from "@/lib/ecole/siret-company-helpers";

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
    const finalOpco = resolveOpcoName({
      naf: finalNaf,
      idcc: idccCode ? String(idccCode) : null,
      cfadockName: proxyData?.opco_name,
    });
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
