import { z } from "zod";
import { CARE_DOMAIN_IDS, type CareDomain } from "@/lib/care/domains";

export const careBookingInputSchema = z
  .object({
    slug: z.string().trim().min(1).max(80),
    serviceId: z.string().uuid(),
    start: z.string().min(10).max(40),
    format: z.enum(["cabinet", "visio"]),
    forWhom: z.enum(["self", "child", "relative"]),
    domain: z.enum([...CARE_DOMAIN_IDS, "unknown"] as [string, ...string[]]),
    message: z.string().trim().max(2000).optional().default(""),
    firstName: z.string().trim().min(1, "Indiquez votre prénom").max(80),
    lastName: z.string().trim().min(1, "Indiquez votre nom").max(80),
    email: z.string().trim().email("E-mail invalide").max(160),
    phone: z.string().trim().min(8, "Téléphone invalide").max(30),
    childFirstName: z.string().trim().max(80).optional().default(""),
    childAge: z.preprocess(
      (value) => (value === "" || value === null || value === undefined ? undefined : value),
      z.coerce.number().int().min(0).max(25).optional(),
    ),
    consent: z.boolean().refine((value) => value === true, "Le consentement est obligatoire."),
    paymentMethod: z.enum(["on_site", "card", "wallet"]),
  })
  .superRefine((value, ctx) => {
    if (Number.isNaN(Date.parse(value.start))) {
      ctx.addIssue({ code: "custom", path: ["start"], message: "Créneau invalide." });
    }
    if (value.forWhom === "child") {
      if (!value.childFirstName?.trim()) {
        ctx.addIssue({ code: "custom", path: ["childFirstName"], message: "Indiquez le prénom de l'enfant." });
      }
      const age = value.childAge;
      if (typeof age !== "number" || !Number.isInteger(age) || age < 0 || age > 25) {
        ctx.addIssue({ code: "custom", path: ["childAge"], message: "Indiquez l'âge de l'enfant." });
      }
    }
    if (value.paymentMethod !== "on_site") {
      ctx.addIssue({ code: "custom", path: ["paymentMethod"], message: "Le paiement en ligne n'est pas encore ouvert." });
    }
  });

export type CareBookingInput = z.infer<typeof careBookingInputSchema>;

export function resolveCareBookingDomain(domain: string, fallback: CareDomain): CareDomain {
  return (CARE_DOMAIN_IDS as readonly string[]).includes(domain) ? (domain as CareDomain) : fallback;
}

export const CARE_FOR_WHOM_LABELS = {
  self: { title: "Moi", text: "Je prends rendez-vous pour moi" },
  child: { title: "Mon enfant", text: "Je suis son parent" },
  relative: { title: "Un proche", text: "Avec son accord" },
} as const;
