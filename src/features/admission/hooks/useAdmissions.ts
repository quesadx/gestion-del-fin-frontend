import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { admissionApi } from '@/features/admission/api/admission.api';
import type {
  CreateAdmissionDto,
  ReviewAdmissionDto,
} from '@/features/admission/api/admission.api';

export function useAdmissions(campId: number) {
  return useQuery({
    queryKey: ['admissions', campId] as const,
    queryFn: () => admissionApi.getAllByCamp(campId),
    enabled: !!campId,
  });
}

export function useAdmission(id: number) {
  return useQuery({
    queryKey: ['admission', id] as const,
    queryFn: () => admissionApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateAdmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campId, payload }: { campId: number; payload: CreateAdmissionDto }) =>
      admissionApi.create(campId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admissions', variables.campId] });
    },
  });
}

export function useReviewAdmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ReviewAdmissionDto }) =>
      admissionApi.review(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admissions'] });
    },
  });
}
