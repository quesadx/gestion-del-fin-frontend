import { api } from '@/shared/api/axiosInstance'

export interface PersonCampApiModel {
  id: number
  name: string
  location: string
  status: string
  ai_context_prompt: string
  created_at: string
}

export interface PersonProfessionApiModel {
  id: number
  name: string
  description: string
}

export interface PersonApiModel {
  id: number
  camp_id: number
  profession_id: number
  identification_code: string
  full_name: string
  age: number
  blood_type: string
  skills_summary: string
  photo_url: string | null
  status: string
  admitted_at: string
  camps: PersonCampApiModel
  professions: PersonProfessionApiModel
}

export const peopleApi = {
  getAllByCamp: (campId: string) =>
    api.get<PersonApiModel[]>(`/camps/${campId}/people`).then((response) => response.data),
}
