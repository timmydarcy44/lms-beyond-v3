import { z } from 'zod';

export const pathwayMetaInputClient = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  cover_url: z.string().url('URL invalide').optional().or(z.literal('')),
  reading_mode: z.enum(['linear', 'free']).default('linear'),
});

export const pathwayItemsInputClient = z.array(
  z.object({
    type: z.enum(['formation', 'test', 'resource']),
    id: z.string().min(1),
    position: z.number().int().nonnegative(),
  })
);

export const pathwayAssignmentsInputClient = z.object({
  learners: z.array(z.string()).optional(),
  groups: z.array(z.string()).optional(),
});

export type PathwayMetaInputClient = z.infer<typeof pathwayMetaInputClient>;
export type PathwayItemsInputClient = z.infer<typeof pathwayItemsInputClient>;
export type PathwayAssignmentsInputClient = z.infer<typeof pathwayAssignmentsInputClient>;
