import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { peopleApi } from '@/features/people/api/people.api';
import type { CreatePersonDto, UpdatePersonDto, CreatePersonStatusLogDto, CreateProfessionReassignmentDto, CreateContributionOverrideDto } from '@/features/people/api/people.api';
import type { PaginationQuery } from '@/shared/api/types';

export function usePeople(campId: number, query?: PaginationQuery) {
  return useQuery({
    queryKey: ['camps', campId, 'people', query] as const,
    queryFn: () => peopleApi.getAllByCamp(campId, query),
    enabled: !!campId,
  });
}

export function usePerson(campId: number, id: number) {
  return useQuery({
    queryKey: ['camps', campId, 'people', id] as const,
    queryFn: () => peopleApi.getById(campId, id),
    enabled: !!campId && !!id,
  });
}

export function useCreatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campId, payload }: { campId: number; payload: CreatePersonDto }) =>
      peopleApi.create(campId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['camps', variables.campId, 'people'] });
    },
  });
}

export function useUpdatePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campId, id, payload }: { campId: number; id: number; payload: UpdatePersonDto }) =>
      peopleApi.update(campId, id, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['camps', variables.campId, 'people'] });
    },
  });
}

export function useDeletePerson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campId, id }: { campId: number; id: number }) =>
      peopleApi.remove(campId, id),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['camps', variables.campId, 'people'] });
    },
  });
}

export function useAddPersonStatusLog() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campId, payload }: { campId: number; payload: CreatePersonStatusLogDto }) =>
      peopleApi.addStatusLog(campId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['camps', variables.campId, 'people'] });
    },
  });
}

export function useCreateProfessionReassignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campId, payload }: { campId: number; payload: CreateProfessionReassignmentDto }) =>
      peopleApi.createProfessionReassignment(campId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['camps', variables.campId, 'people'] });
    },
  });
}

export function useCreateContributionOverride() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campId, payload }: { campId: number; payload: CreateContributionOverrideDto }) =>
      peopleApi.createContributionOverride(campId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['camps', variables.campId, 'people'] });
    },
  });
}
