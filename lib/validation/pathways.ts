import { z } from "zod";

export const pathwayMetaInput = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  cover_url: z.string().url().optional(),
  reading_mode: z.enum(["linear", "free"]).default("linear"),
});

export const pathwayItemsInput = z.object({
  items: z.array(z.object({
    type: z.enum(["formation","test","resource"]),
    id: z.string().min(1),
    position: z.number().int().nonnegative()
  }))
});

export const pathwayAssignmentsInput = z.object({
  learners: z.array(z.string()).optional(),
  groups: z.array(z.string()).optional(),
});
