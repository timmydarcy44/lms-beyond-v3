import { getOpcoFromIdcc, getOpcoFromNaf } from "@/lib/ecole/siret-company-helpers";

export type OpcoSource = "cfadock" | "idcc" | "naf" | "manual";

type RegistryRecord = {
  nom_complet?: string;
  nom_raison_sociale?: string;
  activite_principale?: string;
  idcc?: string | number;
  conventions_collectives?: { idcc?: string | number }[];
  convention_collective?: { idcc?: string | number };
  complements?: { liste_idcc?: (string | number)[] };
  siege?: { adresse?: string };
};

function readIdcc(record: RegistryRecord) {
  const raw =
    record.complements?.liste_idcc?.[0] ??
    record.conventions_collectives?.[0]?.idcc ??
    record.convention_collective?.idcc ??
    record.idcc ??
    "";
  const digits = String(raw).replace(/\D/g, "");
  return digits || null;
}

/** Même ordre que la prospection : CFADock, puis l'IDCC, puis le NAF. */
export async function lookupOpcoForSiret(siret: string) {
  const response = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${siret}`, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(8000),
  });
  if (!response.ok) throw new Error("La recherche d'entreprises est indisponible.");
  const payload = (await response.json()) as { results?: RegistryRecord[] };
  const record = payload.results?.[0];
  if (!record) throw new Error("Entreprise non trouvée");

  const idcc = readIdcc(record);
  const naf = record.activite_principale ? String(record.activite_principale) : "";
  let cfadockName: string | null = null;
  try {
    const cfadock = await fetch(`https://www.cfadock.fr/api/opcos?siret=${siret}`, {
      signal: AbortSignal.timeout(3000),
    });
    const rows = (await cfadock.json()) as { opcoName?: string }[];
    cfadockName = rows[0]?.opcoName?.trim() || null;
  } catch {
    cfadockName = null;
  }

  const fromIdcc = getOpcoFromIdcc(idcc);
  const fromNaf = getOpcoFromNaf(naf);
  let opco: string | null = null;
  let source: Exclude<OpcoSource, "manual"> | null = null;
  if (cfadockName && cfadockName !== "À déterminer") {
    opco = cfadockName;
    source = "cfadock";
  } else if (fromIdcc) {
    opco = fromIdcc;
    source = "idcc";
  } else if (!fromNaf.startsWith("À vérifier")) {
    opco = fromNaf;
    source = "naf";
  }

  return {
    raisonSociale: record.nom_complet || record.nom_raison_sociale || "",
    naf,
    idcc,
    address: record.siege?.adresse ?? "",
    opco,
    source,
    opcoName: opco ?? fromNaf,
    opcoFromIdcc: fromIdcc,
  };
}
