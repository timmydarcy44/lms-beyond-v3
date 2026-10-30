import { z } from "zod";
import { CFA_APPLICATION_STATUSES } from "@/lib/cfa-applications";

const dossierId = z.string().trim().min(1, "Dossier requis.").max(80, "Dossier invalide.");

const feeMethods = ["cheque", "transfer", "card", "cash", "covered"] as const;

export function zodMessage(error: z.ZodError, fallback = "Requête invalide."): string {
  const issue = error.issues[0];
  if (!issue?.message) return fallback;
  if (/^invalid\b/i.test(issue.message) || issue.message === "Required") return fallback;
  return issue.message;
}

export function parseInput<T>(schema: z.ZodType<T>, value: unknown, fallback = "Requête invalide.") {
  const parsed = schema.safeParse(value);
  if (!parsed.success) return { ok: false as const, error: zodMessage(parsed.error, fallback) };
  return { ok: true as const, data: parsed.data };
}

export const saveCerfaSchema = z.object({
  action: z.literal("save_cerfa"),
  id: dossierId,
  cerfa: z.record(z.string(), z.string(), { error: "Les informations d'inscription sont incomplètes." }),
});

export const markFeeSchema = z.object({
  action: z.literal("mark_fee"),
  id: dossierId,
  method: z.enum(feeMethods, { error: "Choisissez un moyen de paiement." }),
});

export const revealFieldSchema = z.object({
  action: z.literal("audit_reveal"),
  id: dossierId,
  field: z.enum(["socialSecurityNumber", "rqth"], { error: "Champ sensible inconnu." }),
});

export const reviewDocumentSchema = z.object({
  action: z.literal("review_document"),
  id: dossierId,
  kind: z.string().trim().min(1, "Pièce requise.").max(80, "Pièce inconnue."),
  review: z.enum(["received", "validated", "refused"], { error: "Revue invalide." }),
  note: z.string().max(400, "Le motif est trop long.").optional(),
});

export const statusSchema = z.object({
  id: dossierId,
  status: z.enum(CFA_APPLICATION_STATUSES, { error: "Statut invalide." }),
  interviewAt: z
    .union([
      z.string().refine((value) => !Number.isNaN(new Date(value).getTime()), "Date d'entretien invalide."),
      z.null(),
    ])
    .optional(),
  interviewNotes: z.string().max(8000, "Le message est trop long.").optional(),
  decisionNotes: z.string().max(4000, "Le motif est trop long.").optional(),
});

export const fichePatchSchema = z.union([
  saveCerfaSchema,
  markFeeSchema,
  revealFieldSchema,
  reviewDocumentSchema,
  statusSchema,
]);

const optionalText = (max: number) => z.string().trim().max(max).optional();

export const placementSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create_company"),
    applicationId: dossierId,
    companyName: z.string().trim().min(1, "Le nom de l'entreprise est requis.").max(160, "Le nom de l'entreprise est trop long."),
    siret: z
      .string()
      .trim()
      .max(20)
      .refine((value) => !value || /^\d{14}$/.test(value.replace(/\s/g, "")), "Le SIRET doit contenir 14 chiffres.")
      .optional(),
    city: optionalText(120),
  }),
  z.object({
    action: z.literal("set_company"),
    applicationId: dossierId,
    companyId: z.string().trim().min(1, "Entreprise requise.").max(80, "Entreprise invalide."),
  }),
  z.object({
    action: z.literal("create_tutor"),
    applicationId: dossierId,
    firstName: z.string().trim().min(1, "Le prénom du tuteur est requis.").max(80),
    lastName: z.string().trim().min(1, "Le nom du tuteur est requis.").max(80),
    email: z.string().trim().toLowerCase().email("L'e-mail professionnel n'est pas valide.").max(240),
    jobTitle: optionalText(120),
  }),
  z.object({
    action: z.literal("set_tutor"),
    applicationId: dossierId,
    tutorId: z.string().trim().min(1, "Tuteur requis.").max(80, "Tuteur invalide."),
  }),
  z.object({
    action: z.literal("resend_code"),
    applicationId: dossierId,
    tutorId: z.string().trim().min(1, "Tuteur requis.").max(80, "Tuteur invalide."),
  }),
]);

export const accountMutationSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("link"),
    applicationId: dossierId,
    profileId: z.string().trim().min(1, "Compte requis.").max(80, "Compte invalide."),
    confirmNoMatch: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("unlink"),
    applicationId: dossierId,
  }),
]);

export const accountSearchSchema = z.object({
  applicationId: dossierId,
  q: z.string().trim().min(2, "Saisissez au moins 2 caractères.").max(80),
});

export const documentUploadSchema = z.object({
  id: dossierId,
  label: z.string().trim().min(1, "Nom de pièce requis.").max(240, "Le nom de la pièce est trop long."),
  kind: z.string().trim().max(80).optional(),
  fileName: z.string().trim().min(1, "Fichier requis.").max(240),
  fileSize: z.number().int().positive("Fichier requis.").max(10 * 1024 * 1024, "Fichier supérieur à 10 Mo."),
  fileType: z.enum(["application/pdf", "image/jpeg", "image/png"], {
    error: "Formats acceptés : PDF, JPG, PNG.",
  }),
});

export const ACCESS_CODE_DIGITS = 8;
