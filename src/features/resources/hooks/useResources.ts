import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resourcesApi } from '@/features/resources/api/resources.api';
import type { CreateResourceDto, UpdateResourceDto } from '@/features/resources/api/resources.api';

const RESOURCES_KEY = ['resources'] as const;

export function useResources(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: RESOURCES_KEY,
    queryFn: () => resourcesApi.getAll(),
    ...options,
  });
}

export function useResource(id: number) {
  return useQuery({
    queryKey: [...RESOURCES_KEY, id] as const,
    queryFn: () => resourcesApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateResourceDto) => resourcesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESOURCES_KEY });
    },
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateResourceDto }) =>
      resourcesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESOURCES_KEY });
    },
  });
}

export function useDeleteResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => resourcesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: RESOURCES_KEY });
    },
  });
}
