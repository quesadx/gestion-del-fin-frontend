import { api } from '@/shared/api/axiosInstance'

export interface PersonApiModel {
  id: string
  name: string
  role: string
  condition: string
  location?: string
}

export const peopleApi = {
  getAllByCamp: (campId: string) =>
    api.get<PersonApiModel[]>(`/camps/${campId}/people`).then((response) => response.data),
}
