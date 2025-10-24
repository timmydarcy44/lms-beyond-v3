import { z } from "zod";

export const createFormationInput = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  cover_url: z.string().url().optional(),
  visibility_mode: z.enum(["private", "org", "public"]).default("private"),
});

export const updateFormationInput = createFormationInput.partial();
