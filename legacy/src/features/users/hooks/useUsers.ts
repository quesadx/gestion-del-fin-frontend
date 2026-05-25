import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '@/features/users/api/users.api';
import type { CreateUserDto, UpdateUserDto, RoleItem } from '@/features/users/api/users.api';
import type { User } from '@/features/users/types/user.types';

const USERS_KEY = ['users'] as const;
const ROLES_KEY = ['users', 'roles'] as const;

export function useRoles() {
  return useQuery<RoleItem[]>({
    queryKey: ROLES_KEY,
    queryFn: usersApi.getRoles,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUsers() {
  return useQuery<User[]>({
    queryKey: USERS_KEY,
    queryFn: usersApi.getAll,
  });
}

export function useUser(id: number) {
  return useQuery<User>({
    queryKey: [...USERS_KEY, id] as const,
    queryFn: () => usersApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateUserDto) => usersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UpdateUserDto }) =>
      usersApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => usersApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USERS_KEY });
    },
  });
}
