import { api } from '@/shared/api/axiosInstance';

export interface Admission {
  id: string;
  camp_id?: number | string;
  applicant_name?: string;
  status?: string;
  submitted_at?: string;
  request_type?: string;
  notes?: string;
}

export const admissionsApi = {
  getByCamp: (campId: string) =>
    api.get<Admission[]>(`/admission/camps/${campId}`).then((response) => response.data),
};
