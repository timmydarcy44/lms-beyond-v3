import { useQuery } from '@tanstack/react-query';
import { getFormationsList, getResourcesList, getTestsList, getLearnersList, getGroupsList } from '@/lib/api/lists';

// Hook pour la liste des formations
export function useFormationsList(orgSlug: string) {
  return useQuery({
    queryKey: ['lists', 'formations', orgSlug],
    queryFn: () => getFormationsList(orgSlug),
    enabled: !!orgSlug,
  });
}

// Hook pour la liste des ressources
export function useResourcesList(orgSlug: string) {
  return useQuery({
    queryKey: ['lists', 'resources', orgSlug],
    queryFn: () => getResourcesList(orgSlug),
    enabled: !!orgSlug,
  });
}

// Hook pour la liste des tests
export function useTestsList(orgSlug: string) {
  return useQuery({
    queryKey: ['lists', 'tests', orgSlug],
    queryFn: () => getTestsList(orgSlug),
    enabled: !!orgSlug,
  });
}

// Hook pour la liste des apprenants
export function useLearnersList(orgSlug: string) {
  return useQuery({
    queryKey: ['lists', 'learners', orgSlug],
    queryFn: () => getLearnersList(orgSlug),
    enabled: !!orgSlug,
  });
}

// Hook pour la liste des groupes
export function useGroupsList(orgSlug: string) {
  return useQuery({
    queryKey: ['lists', 'groups', orgSlug],
    queryFn: () => getGroupsList(orgSlug),
    enabled: !!orgSlug,
  });
}
