export const DEFAULT_CATALOGUE_EMAIL_BODY = `Nous avons le plaisir de vous transmettre le catalogue de formation 2027 de EDGE.
Nous restons à votre disposition pour échanger ensemble sur vos besoins en formation.
Cordialement`;

export const DEFAULT_CATALOGUE_EMAIL_SUBJECT = "Catalogue des formations EDGE 2027";

type CatalogueGreetingInput = {
  contact_first_name?: string | null;
  contact_last_name?: string | null;
  contact_civility?: string | null;
};

export function buildCatalogueGreeting(deal: CatalogueGreetingInput): string {
  const civility = deal.contact_civility?.trim();
  const lastName = deal.contact_last_name?.trim();
  const firstName = deal.contact_first_name?.trim();

  if (civility && lastName) return `Bonjour ${civility} ${lastName},`;
  if (civility) return `Bonjour ${civility},`;
  if (firstName) return `Bonjour ${firstName},`;
  return "Bonjour,";
}

export function stripCatalogueGreetingLine(bodyText: string): string {
  const lines = bodyText.split("\n");
  if (lines[0]?.trim().toLowerCase().startsWith("bonjour")) {
    return lines.slice(1).join("\n").trimStart();
  }
  return bodyText;
}

export function buildCatalogueEmailPreview(bodyText: string, deal: CatalogueGreetingInput): string {
  const greeting = buildCatalogueGreeting(deal);
  const bodyLines = stripCatalogueGreetingLine(bodyText)
    .split("\n")
    .map((l) => l.trimEnd())
    .filter((l, i, arr) => l.trim() !== "" || (i > 0 && i < arr.length - 1));

  return [greeting, ...bodyLines.filter((l) => l.trim())].join("\n");
}
