import { api } from '@/shared/api/axiosInstance';
import type { PersonStatus } from '@/shared/api/types';

export type TransferStatus =
  | 'PENDING'
  | 'APPROVED_SOURCE'
  | 'APPROVED_TARGET'
  | 'COMPLETED'
  | 'REJECTED';
export type TransferType = 'RESOURCE' | 'PERSON' | 'MIXED';
export type TransferItemType = 'RESOURCE' | 'PERSON';

export interface TransferItem {
  item_type: TransferItemType;
  resource_type_id?: number;
  person_id?: number;
  quantity?: number;
}

export interface CreateTransferDto {
  requesting_camp: number;
  target_camp: number;
  type: TransferType;
  notes?: string;
  requested_by: number;
  leader_person_id?: number;
  scheduled_delivery_date?: string;
  items: TransferItem[];
}

export interface ScheduleTransferDeliveryDto {
  scheduled_delivery_date: string;
}

export interface ApproveTransferSourceDto {
  notes?: string;
  scheduled_delivery_date?: string;
}

export interface ApproveTransferTargetDto {
  notes?: string;
}

export interface CompleteTransferDto {
  notes?: string;
  person_status?: PersonStatus;
}

export interface RejectTransferDto {
  reason: string;
}

export const transfersApi = {
  getAll: () => api.get('/transfers').then((res) => res.data.data),
  getById: (id: number) => api.get(`/transfers/${id}`).then((res) => res.data),
  create: (payload: CreateTransferDto) => api.post('/transfers', payload).then((res) => res.data),
  scheduleDelivery: (id: number, payload: ScheduleTransferDeliveryDto) =>
    api.patch(`/transfers/${id}/schedule`, payload).then((res) => res.data),
  approveSource: (id: number, payload: ApproveTransferSourceDto) =>
    api.patch(`/transfers/${id}/approve-source`, payload).then((res) => res.data),
  approveTarget: (id: number, payload: ApproveTransferTargetDto) =>
    api.patch(`/transfers/${id}/approve-target`, payload).then((res) => res.data),
  complete: (id: number, payload: CompleteTransferDto) =>
    api.patch(`/transfers/${id}/complete`, payload).then((res) => res.data),
  reject: (id: number, payload: RejectTransferDto) =>
    api.patch(`/transfers/${id}/reject`, payload).then((res) => res.data),
};
