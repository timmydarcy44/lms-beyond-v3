import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPathways,
  createPathway,
  getPathway,
  updatePathway,
  deletePathway,
  updatePathwayItems,
  updatePathwayAssignments,
  Pathway,
  CreatePathwayInput,
  UpdatePathwayInput,
  PathwayItemsInput,
  PathwayAssignmentsInput,
} from '@/lib/api/pathways';

// Hook pour la liste des parcours
export function usePathways(orgSlug: string) {
  return useQuery({
    queryKey: ['pathways', orgSlug],
    queryFn: () => getPathways(orgSlug),
    enabled: !!orgSlug,
  });
}

// Hook pour un parcours spécifique
export function usePathway(id: string) {
  return useQuery({
    queryKey: ['pathway', id],
    queryFn: () => getPathway(id),
    enabled: !!id,
  });
}

// Hook pour créer un parcours
export function useCreatePathway(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreatePathwayInput) => createPathway(orgSlug, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pathways', orgSlug] });
    },
  });
}

// Hook pour mettre à jour un parcours
export function useUpdatePathway() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdatePathwayInput }) =>
      updatePathway(id, input),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['pathway', id] });
      queryClient.invalidateQueries({ queryKey: ['pathways'] });
    },
  });
}

// Hook pour supprimer un parcours
export function useDeletePathway(orgSlug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deletePathway(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pathways', orgSlug] });
    },
  });
}

// Hook pour mettre à jour les items d'un parcours (avec optimistic update)
export function useUpdatePathwayItems(pathwayId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PathwayItemsInput) => updatePathwayItems(pathwayId, input),
    onMutate: async (newItems) => {
      // Optimistic update
      await queryClient.cancelQueries({ queryKey: ['pathway', pathwayId] });
      
      const previousPathway = queryClient.getQueryData<Pathway>(['pathway', pathwayId]);
      
      if (previousPathway) {
        queryClient.setQueryData(['pathway', pathwayId], {
          ...previousPathway,
          pathway_items: newItems.items.map((item, index) => ({
            id: `temp-${index}`,
            pathway_id: pathwayId,
            item_type: item.type,
            item_id: item.id,
            position: index,
          })),
        });
      }

      return { previousPathway };
    },
    onError: (_, __, context) => {
      // Rollback en cas d'erreur
      if (context?.previousPathway) {
        queryClient.setQueryData(['pathway', pathwayId], context.previousPathway);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['pathway', pathwayId] });
    },
  });
}

// Hook pour mettre à jour les assignations d'un parcours
export function useUpdatePathwayAssignments(pathwayId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: PathwayAssignmentsInput) => updatePathwayAssignments(pathwayId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pathway', pathwayId] });
    },
  });
}
