import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { campsApi } from '@/features/camps/api/camps.api';
import type { CreateCampDto, UpdateCampDto } from '@/features/camps/api/camps.api';

const CAMPS_KEY = ['camps'] as const;

export function useCamps() {
  return useQuery({
    queryKey: CAMPS_KEY,
    queryFn: campsApi.getAll,
  });
}

export function useCamp(id: number) {
  return useQuery({
    queryKey: [...CAMPS_KEY, id] as const,
    queryFn: () => campsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateCamp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateCampDto) => campsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPS_KEY });
    },
  });
}

export function useUpdateCamp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateCampDto }) =>
      campsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPS_KEY });
    },
  });
}

export function useDeleteCamp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => campsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CAMPS_KEY });
    },
  });
}
