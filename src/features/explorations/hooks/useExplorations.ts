import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { explorationsApi } from '@/features/explorations/api/explorations.api';
import type { CreateExplorationDto, UpdateExplorationDto, UpdateExplorationStatusDto, DeleteExplorationDto } from '@/features/explorations/api/explorations.api';

const EXPLORATIONS_KEY = ['explorations'] as const;

export function useExplorations() {
  return useQuery({
    queryKey: EXPLORATIONS_KEY,
    queryFn: explorationsApi.getAll,
  });
}

export function useExploration(id: number) {
  return useQuery({
    queryKey: [...EXPLORATIONS_KEY, id] as const,
    queryFn: () => explorationsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateExploration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateExplorationDto) => explorationsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPLORATIONS_KEY });
    },
  });
}

export function useUpdateExploration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateExplorationDto }) =>
      explorationsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPLORATIONS_KEY });
    },
  });
}

export function useUpdateExplorationStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateExplorationStatusDto }) =>
      explorationsApi.updateStatus(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPLORATIONS_KEY });
    },
  });
}

export function useDeleteExploration() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: DeleteExplorationDto }) =>
      explorationsApi.remove(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: EXPLORATIONS_KEY });
    },
  });
}
