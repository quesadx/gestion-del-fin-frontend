import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { professionsApi } from '@/features/professions/api/professions.api';
import type {
  CreateProfessionDto,
  UpdateProfessionDto,
} from '@/features/professions/api/professions.api';

const PROFESSIONS_KEY = ['professions'] as const;

export function useProfessions() {
  return useQuery({
    queryKey: PROFESSIONS_KEY,
    queryFn: professionsApi.getAll,
  });
}

export function useProfession(id: number) {
  return useQuery({
    queryKey: [...PROFESSIONS_KEY, id] as const,
    queryFn: () => professionsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateProfession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateProfessionDto) => professionsApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFESSIONS_KEY });
    },
  });
}

export function useUpdateProfession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateProfessionDto }) =>
      professionsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFESSIONS_KEY });
    },
  });
}

export function useDeleteProfession() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => professionsApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PROFESSIONS_KEY });
    },
  });
}
