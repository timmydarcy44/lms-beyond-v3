import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFormations,
  createFormation,
  getFormation,
  updateFormation,
  deleteFormation,
  Formation,
  CreateFormationInput,
  UpdateFormationInput,
} from '@/lib/api/formations';

// Hook pour la liste des formations
export function useFormations(orgSlug: string) {
  return useQuery({
    queryKey: ['formations', orgSlug],
    queryFn: () => getFormations(orgSlug),
    enabled: !!orgSlug,
  });
}

// Hook pour une formation spécifique
export function useFormation(id: string) {
  return useQuery({
    queryKey: ['formation', id],
    queryFn: () => getFormation(id),
    enabled: !!id,
  });
}

// Hook pour créer une formation
export function useCreateFormation(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateFormationInput) => createFormation(orgSlug, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formations', orgSlug] });
    },
  });
}

// Hook pour mettre à jour une formation
export function useUpdateFormation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateFormationInput }) =>
      updateFormation(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['formation', id] });
      queryClient.invalidateQueries({ queryKey: ['formations'] });
    },
  });
}

// Hook pour supprimer une formation
export function useDeleteFormation(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteFormation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['formations', orgSlug] });
    },
  });
}
