import { api } from '@/shared/api/axiosInstance';

export type AdmissionDecision = 'ACCEPTED' | 'REJECTED';

export interface CreateAdmissionDto {
  applicant_name: string;
  applicant_age?: number;
  applicant_skills?: string;
  health_notes?: string;
  background_notes?: string;
  photo_url?: string;
  id_card_url?: string;
}

export interface ReviewAdmissionDto {
  final_decision: AdmissionDecision;
}

export const admissionApi = {
  getAllByCamp: (campId: number) =>
    api.get(`/admission/camps/${campId}`).then((res) => res.data.data),
  getById: (id: number) => api.get(`/admission/${id}`).then((res) => res.data),
  create: (campId: number, payload: CreateAdmissionDto) =>
    api.post(`/admission/camps/${campId}`, payload).then((res) => res.data),
  review: (id: number, payload: ReviewAdmissionDto) =>
    api.patch(`/admission/${id}/review`, payload).then((res) => res.data),
};
