import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transfersApi } from '@/features/transfers/api/transfers.api';
import type {
  CreateTransferDto,
  ScheduleTransferDeliveryDto,
  ApproveTransferSourceDto,
  ApproveTransferTargetDto,
  CompleteTransferDto,
  RejectTransferDto,
} from '@/features/transfers/api/transfers.api';
import type { Transfer } from '@/features/transfers/types/transfer.types';

const TRANSFERS_KEY = ['transfers'] as const;

export function useTransfers() {
  return useQuery<Transfer[]>({
    queryKey: TRANSFERS_KEY,
    queryFn: transfersApi.getAll,
  });
}

export function useTransfer(id: number) {
  return useQuery<Transfer>({
    queryKey: [...TRANSFERS_KEY, id] as const,
    queryFn: () => transfersApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateTransferDto) => transfersApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSFERS_KEY });
    },
  });
}

export function useScheduleTransferDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ScheduleTransferDeliveryDto }) =>
      transfersApi.scheduleDelivery(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSFERS_KEY });
    },
  });
}

export function useApproveTransferSource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ApproveTransferSourceDto }) =>
      transfersApi.approveSource(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSFERS_KEY });
    },
  });
}

export function useApproveTransferTarget() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: ApproveTransferTargetDto }) =>
      transfersApi.approveTarget(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSFERS_KEY });
    },
  });
}

export function useCompleteTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: CompleteTransferDto }) =>
      transfersApi.complete(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSFERS_KEY });
    },
  });
}

export function useRejectTransfer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: { id: number; payload: RejectTransferDto }) =>
      transfersApi.reject(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TRANSFERS_KEY });
    },
  });
}
