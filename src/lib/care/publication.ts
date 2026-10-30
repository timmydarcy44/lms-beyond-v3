import { isCarePlaceholderText } from "@/lib/care/profile-format";

export type CarePublicationService = {
  name: string;
  active: boolean;
  price_cents: number;
};

export type CarePublicationInput = {
  published: boolean;
  is_care: boolean;
  is_test?: boolean | null;
  email?: string | null;
  review_status?: string | null;
  care_active?: boolean | null;
  avatar_url?: string | null;
  tagline?: string | null;
  bio?: string | null;
  approach?: string | null;
  domains?: unknown[] | null;
  city?: string | null;
  offers_cabinet?: boolean | null;
  offers_visio?: boolean | null;
  services?: CarePublicationService[] | null;
};

export type CarePublicationCheck = {
  id: "photo" | "tagline" | "presentation" | "service" | "domain" | "place";
  label: string;
  ok: boolean;
};

const TEST_EMAILS = new Set([
  "anais.care.demo@byound.fr",
  "timmydarcy44+expertpro@gmail.com",
  "timmydarcy44+testexpertlol@gmail.com",
]);

export function isCareTestEmail(email: string | null | undefined) {
  return TEST_EMAILS.has(String(email ?? "").trim().toLowerCase());
}

export function carePresentationText(input: { bio?: string | null; approach?: string | null }) {
  return [input.bio, input.approach]
    .map((value) => value?.replace(/\s+/g, " ").trim() ?? "")
    .filter((value) => value && !isCarePlaceholderText(value))
    .join("\n")
    .trim();
}

export function carePublicServices(services: CarePublicationService[] | null | undefined) {
  return (services ?? []).filter((item) => item.active !== false && !isCarePlaceholderText(item.name));
}

export function careContentChecks(input: CarePublicationInput): CarePublicationCheck[] {
  const tagline = input.tagline?.replace(/\s+/g, " ").trim() ?? "";
  const presentation = carePresentationText(input);
  const city = input.city?.replace(/\s+/g, " ").trim() ?? "";
  const visioOnly = input.offers_visio === true && input.offers_cabinet !== true;
  const placeOk = visioOnly || (Boolean(city) && !isCarePlaceholderText(city));
  return [
    { id: "photo", label: "Photo", ok: Boolean(input.avatar_url?.trim()) },
    {
      id: "tagline",
      label: "Accroche (20 à 140 caractères)",
      ok: tagline.length >= 20 && tagline.length <= 140 && !isCarePlaceholderText(tagline),
    },
    {
      id: "presentation",
      label: "Présentation (au moins 200 caractères)",
      ok: presentation.length >= 200,
    },
    { id: "domain", label: "Au moins un domaine", ok: (input.domains ?? []).length >= 1 },
    { id: "service", label: "Au moins une prestation", ok: carePublicServices(input.services).length >= 1 },
    { id: "place", label: "Ville ou visio uniquement", ok: placeOk },
  ];
}

export function careContentReady(input: CarePublicationInput) {
  return careContentChecks(input).every((item) => item.ok);
}

/** Visible dès que le praticien publie. Le score de contenu est un conseil, pas une condition. Les comptes de test restent hors annuaire. */
export function isCareListingPublic(input: CarePublicationInput) {
  if (input.published !== true || input.is_care !== true) return false;
  if (input.is_test === true || isCareTestEmail(input.email)) return false;
  return true;
}

const SESSION_NAME = /accompagnement|s[ée]ance|consultation|suivi/i;

/** Le prix affiché suit l'accompagnement. Un test ou un bilan ne fixe pas le tarif de la séance. */
export function careQuotedServices(services: CarePublicationService[] | null | undefined) {
  const rows = carePublicServices(services);
  const sessions = rows.filter((item) => SESSION_NAME.test(item.name));
  return sessions.length ? sessions : rows;
}

export function carePriceLine(services: CarePublicationService[] | null | undefined) {
  const rows = careQuotedServices(services);
  const freeIntro = rows.find((item) => item.price_cents <= 0 && /premier|1er/i.test(item.name));
  if (freeIntro) return { main: "Offert", hint: "1er échange" };
  const priced = rows.filter((item) => item.price_cents > 0);
  if (!priced.length) return { main: "Sur devis", hint: "la séance" };
  const amounts = [...new Set(priced.map((item) => item.price_cents))];
  const min = Math.min(...amounts);
  const cheapest = priced.find((item) => item.price_cents === min);
  const hint = cheapest && /bilan/i.test(cheapest.name) ? "bilan complet" : "la séance";
  const euros = `${Math.round(min / 100)} €`;
  return { main: amounts.length > 1 ? `dès ${euros}` : euros, hint };
}

export function carePlaceLine(input: { city?: string | null; offers_cabinet?: boolean | null; offers_visio?: boolean | null }) {
  const city = input.city?.replace(/\s+/g, " ").trim() ?? "";
  const cityOk = Boolean(city) && !isCarePlaceholderText(city);
  if (input.offers_visio && !input.offers_cabinet) return { main: "Visio", hint: "uniquement" };
  if (input.offers_cabinet && input.offers_visio) return { main: cityOk ? city : "Cabinet", hint: cityOk ? "+ visio" : "cabinet" };
  return { main: cityOk ? city : "Cabinet", hint: "cabinet" };
}
