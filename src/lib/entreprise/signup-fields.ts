import { z } from "zod";

const DOMAIN_TYPOS: Record<string, string> = {
  gmial: "gmail",
  gmal: "gmail",
  gamil: "gmail",
  gnail: "gmail",
  gmaill: "gmail",
  hotmial: "hotmail",
  hotmal: "hotmail",
  hotamil: "hotmail",
  hotmaill: "hotmail",
  outlok: "outlook",
  outloo: "outlook",
  outllok: "outlook",
  yahooo: "yahoo",
  yaho: "yahoo",
};

const TLD_TYPOS: Record<string, string> = {
  col: "com",
  con: "com",
  cm: "com",
  cpm: "com",
  comm: "com",
  coom: "com",
  ocm: "com",
};

const CONSUMER_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "outlook.com",
  "outlook.fr",
  "hotmail.com",
  "hotmail.fr",
  "live.com",
  "live.fr",
  "yahoo.com",
  "yahoo.fr",
  "icloud.com",
  "me.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "orange.fr",
  "wanadoo.fr",
  "free.fr",
  "sfr.fr",
  "laposte.net",
  "bbox.fr",
  "gmx.com",
  "gmx.fr",
]);

export const CONSUMER_EMAIL_WARNING = "Utilisez de préférence votre email professionnel";

export function capitalizeFirstName(value: string): string {
  return value
    .trim()
    .split(/(\s+|-)/)
    .map((part) => {
      if (!part || part === "-" || /^\s+$/.test(part)) return part;
      return part.charAt(0).toLocaleUpperCase("fr") + part.slice(1);
    })
    .join("");
}

/** Suggestion cliquable si le domaine ressemble à une faute de frappe. */
export function suggestProfessionalEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  const at = email.lastIndexOf("@");
  if (at < 1 || email.indexOf("@") !== at) return null;
  const local = email.slice(0, at);
  let domain = email.slice(at + 1);
  if (!local || !domain || local.includes(" ")) return null;
  const hadTrailingDot = domain.endsWith(".");
  domain = domain.replace(/\.+$/, "");
  const parts = domain.split(".").filter(Boolean);
  if (parts.length < 2) return null;
  const tld = parts[parts.length - 1] ?? "";
  const name = parts[parts.length - 2] ?? "";
  const fixedName = DOMAIN_TYPOS[name] ?? name;
  const fixedTld = TLD_TYPOS[tld] ?? tld;
  const nextDomain = [...parts.slice(0, -2), fixedName, fixedTld].join(".");
  const suggestion = `${local}@${nextDomain}`;
  if (!hadTrailingDot && suggestion === `${local}@${domain}`) return null;
  return suggestion;
}

export function isConsumerEmail(raw: string): boolean {
  const email = raw.trim().toLowerCase();
  const domain = email.split("@")[1]?.replace(/\.+$/, "") ?? "";
  return CONSUMER_DOMAINS.has(domain);
}

export const entrepriseSignupSchema = z.object({
  company_name: z.string().trim().min(1, "Indiquez le nom de l'entreprise."),
  first_name: z
    .string()
    .trim()
    .min(1, "Indiquez votre prénom.")
    .transform(capitalizeFirstName),
  last_name: z.string().trim().min(1, "Indiquez votre nom."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Cette adresse email n'est pas valide.")
    .superRefine((value, ctx) => {
      if (suggestProfessionalEmail(value)) {
        ctx.addIssue({
          code: "custom",
          message: "Cette adresse semble contenir une faute de frappe.",
        });
      }
    }),
});

export type EntrepriseSignupInput = z.infer<typeof entrepriseSignupSchema>;

export type SignupField = "company_name" | "first_name" | "last_name" | "email";

export function signupFieldErrors(error: z.ZodError): Partial<Record<SignupField, string>> {
  const fields: Partial<Record<SignupField, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (key === "company_name" || key === "first_name" || key === "last_name" || key === "email") {
      if (!fields[key]) fields[key] = issue.message;
    }
  }
  return fields;
}
