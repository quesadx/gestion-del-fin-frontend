import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, fetchAllPaginated } from '../../lib/api';
import { useCampStore, useAuthStore } from '../../store';
import { canAccessCamp, hasPermission } from '../../lib/permissions';
import {
  AlertTriangle,
  CheckCircle2,
  ClipboardList,
  Plus,
  Sandwich,
  X,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../../lib/utils';
import { Skeleton } from '../../components/Skeleton';
import { Pagination } from '../../components/Pagination';
import { ActionFeedbackDialog, ActionFeedbackType } from '../../components/ActionFeedbackDialog';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { getApiErrorMessage } from '../../lib/apiErrors';
import {
  InventoryAdjustmentRequest,
  InventoryAdjustmentRequestStatus,
  InventoryAuditEntry,
  Resource,
  UserRole,
} from '../../types';

const RATION_PAGE_SIZE = 15;
const REQUESTS_PAGE_SIZE = 6;
const MAX_RATION_QUANTITY = 9999999999.99;
const RATION_PREFIX = 'RATION:';
const MAX_RATION_NOTE_LENGTH = 255 - RATION_PREFIX.length - 1;

type RationStatusFilter = 'ALL' | InventoryAdjustmentRequestStatus;
type RationSubmissionMode = 'direct' | 'request';

type RationFeedback = {
  type: ActionFeedbackType;
  title: string;
  message: string;
  actionLabel?: string;
};

type PendingRationSubmission = {
  mode: RationSubmissionMode;
  camp_id: number;
  resource_type_id: number;
  resourceName: string;
  quantity: number;
  note: string;
};

type ReviewAction = {
  id: number;
  action: 'approve' | 'reject';
  resourceName: string;
  quantity: string;
};

type ApiLikeError = {
  response?: {
    data?: {
      error?: {
        details?: unknown;
      };
    };
  };
};

function getBackendValidationDetails(error: unknown) {
  const details = (error as ApiLikeError).response?.data?.error?.details;
  if (!Array.isArray(details)) return '';

  return details
    .map((detail) => {
      if (detail && typeof detail === 'object' && 'message' in detail) {
        const message = (detail as { message?: unknown }).message;
        return typeof message === 'string' ? message : '';
      }
      return '';
    })
    .filter(Boolean)
    .join(' ');
}

function getRationErrorMessage(error: unknown, fallback: string) {
  return getBackendValidationDetails(error) || getApiErrorMessage(error, fallback);
}

function getEntryType(entry: InventoryAuditEntry): string {
  const rawType =
    entry.type ??
    (entry as InventoryAuditEntry & { log_type?: string; logType?: string }).log_type ??
    (entry as InventoryAuditEntry & { log_type?: string; logType?: string }).logType ??
    '';

  return String(rawType).trim().toUpperCase().replace(/\s+/g, '_').replace(/-/g, '_');
}

function getEntryQuantity(entry: InventoryAuditEntry): number {
  const fallbackEntry = entry as InventoryAuditEntry & {
    quantity_change?: number;
    log_delta_sum?: number;
  };
  const rawQuantity =
    entry.quantity ?? fallbackEntry.quantity_change ?? fallbackEntry.log_delta_sum ?? 0;
  const quantity = Number(rawQuantity);
  return Number.isFinite(quantity) ? quantity : 0;
}

function hasRationMarker(value: string | null | undefined) {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase();
  return normalized.includes(RATION_PREFIX);
}

function isRationEntry(entry: InventoryAuditEntry) {
  return (
    getEntryType(entry) === 'DAILY_RATION' || hasRationMarker(entry.description || entry.notes)
  );
}

function getRationMovementMeta(entry: InventoryAuditEntry) {
  const entryType = getEntryType(entry);
  const description = String(entry.description ?? entry.notes ?? '').toUpperCase();

  if (entryType === 'DAILY_RATION') {
    return {
      label: 'AUTOMATIC',
      className: 'bg-amber-950/30 text-amber-400 border-amber-500/25',
      actor: 'SYSTEM',
    };
  }

  if (description.includes('APPROVED ADJUSTMENT REQUEST')) {
    return {
      label: 'REQUEST APPROVED',
      className: 'bg-emerald-950/20 text-emerald-400 border-emerald-400/30',
      actor: entry.user?.username ?? entry.username ?? entry.user_id ?? '-',
    };
  }

  return {
    label: 'MANUAL',
    className: 'bg-red-950/40 text-red-400 border-red-500/20',
    actor: entry.user?.username ?? entry.username ?? entry.user_id ?? '-',
  };
}

function getRationDescription(entry: InventoryAuditEntry) {
  const rawDescription = String(entry.description ?? entry.notes ?? '').trim();
  if (!rawDescription) return '-';
  if (getEntryType(entry) === 'DAILY_RATION') return rawDescription;

  const normalized = rawDescription.toUpperCase();
  const markerIndex = normalized.indexOf(RATION_PREFIX);
  if (markerIndex < 0) return rawDescription;

  const requestMatch = rawDescription.match(/#\d+/);
  const rationNote = rawDescription.slice(markerIndex + RATION_PREFIX.length).trim();
  const cleanNote = rationNote || 'No additional notes';

  return requestMatch ? `${requestMatch[0]} - ${cleanNote}` : cleanNote;
}

function formatQuantity(value: number | string | null | undefined) {
  const quantity = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
    Number.isFinite(quantity) ? quantity : 0,
  );
}

function getRequestStatusClasses(status: InventoryAdjustmentRequestStatus) {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-950/20 text-amber-500 border-amber-500/30';
    case 'APPROVED':
      return 'bg-emerald-950/20 text-emerald-400 border-emerald-400/30';
    case 'REJECTED':
      return 'bg-red-950/20 text-red-500 border-red-500/30';
    default:
      return 'bg-zinc-950/40 text-zinc-400 border-zinc-700/50';
  }
}

function buildRationReason(note: string) {
  const cleanNote = note.trim();
  return `${RATION_PREFIX} ${cleanNote || 'No additional notes'}`;
}

export default function RationsPage() {
  const { currentCampId } = useCampStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedResourceId, setSelectedResourceId] = useState<number>(0);
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [requestPage, setRequestPage] = useState(1);
  const [requestStatusFilter, setRequestStatusFilter] = useState<RationStatusFilter>('ALL');
  const [feedback, setFeedback] = useState<RationFeedback | null>(null);
  const [pendingSubmission, setPendingSubmission] = useState<PendingRationSubmission | null>(null);
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null);

  const activeCampSelected = currentCampId != null;
  const canViewActiveCamp = activeCampSelected && canAccessCamp(currentCampId);
  const canReadAudit = hasPermission(user?.permissions, 'inventory.audit.read');
  const canDirectRation =
    hasPermission(user?.permissions, 'inventory.adjust') && user?.role !== UserRole.WORKER;
  const canCreateRationRequest = hasPermission(
    user?.permissions,
    'inventory_adjustment_requests.create',
  );
  const canReadOwnRationRequests = hasPermission(
    user?.permissions,
    'inventory_adjustment_requests.read_own',
  );
  const canReadRationRequests = hasPermission(
    user?.permissions,
    'inventory_adjustment_requests.read',
  );
  const canReviewRationRequests = hasPermission(
    user?.permissions,
    'inventory_adjustment_requests.review',
  );
  const requestWorkflowMatchesActiveCamp =
    activeCampSelected && user?.camp_id != null && Number(user.camp_id) === Number(currentCampId);
  const canOpenRationModal =
    (canDirectRation && canViewActiveCamp) ||
    (canCreateRationRequest && requestWorkflowMatchesActiveCamp);
  const rationSubmissionMode: RationSubmissionMode =
    canCreateRationRequest && !canDirectRation ? 'request' : 'direct';

  const { data: resources, isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ['resources'],
    queryFn: () => fetchAllPaginated<Resource>('/resources'),
    staleTime: 60_000,
    enabled: hasPermission(user?.permissions, 'resources.read'),
  });

  const resourceMap = useMemo(() => {
    const map = new Map<number, Resource>();
    for (const resource of resources ?? []) {
      map.set(resource.id, resource);
    }
    return map;
  }, [resources]);

  const {
    data: auditData,
    isLoading,
    error: auditError,
  } = useQuery<InventoryAuditEntry[]>({
    queryKey: ['inventory-audit', currentCampId, 'all-pages'],
    queryFn: () => fetchAllPaginated<InventoryAuditEntry>(`/inventory/audit/${currentCampId}`),
    enabled: Boolean(currentCampId) && canReadAudit && canViewActiveCamp,
    retry: false,
  });

  const rations = useMemo(() => {
    const entries = Array.isArray(auditData) ? auditData : [];
    return entries.filter(isRationEntry);
  }, [auditData]);

  const totalPages = Math.max(1, Math.ceil(rations.length / RATION_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedRations = rations.slice(
    (currentPage - 1) * RATION_PAGE_SIZE,
    currentPage * RATION_PAGE_SIZE,
  );

  const requestsEndpoint = canReadRationRequests
    ? '/inventory-adjustment-requests'
    : canReadOwnRationRequests
      ? '/inventory-adjustment-requests/my'
      : null;

  const {
    data: adjustmentRequests,
    isLoading: requestsLoading,
    error: requestsError,
  } = useQuery<InventoryAdjustmentRequest[]>({
    queryKey: ['inventory-adjustment-requests', 'rations', requestsEndpoint, currentCampId],
    queryFn: async () => {
      const res = await apiClient.get(requestsEndpoint ?? '/inventory-adjustment-requests/my');
      return Array.isArray(res.data) ? res.data : (res.data?.data ?? []);
    },
    enabled: Boolean(requestsEndpoint) && requestWorkflowMatchesActiveCamp,
    retry: false,
  });

  const rationRequests = useMemo(
    () => (adjustmentRequests ?? []).filter((request) => hasRationMarker(request.reason)),
    [adjustmentRequests],
  );

  const requestCounts = useMemo(
    () =>
      rationRequests.reduce(
        (counts, request) => {
          counts.ALL += 1;
          counts[request.status] += 1;
          return counts;
        },
        { ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 } as Record<RationStatusFilter, number>,
      ),
    [rationRequests],
  );

  const filteredRequests = useMemo(() => {
    if (requestStatusFilter === 'ALL') return rationRequests;
    return rationRequests.filter((request) => request.status === requestStatusFilter);
  }, [rationRequests, requestStatusFilter]);

  const requestTotalPages = Math.max(1, Math.ceil(filteredRequests.length / REQUESTS_PAGE_SIZE));
  const currentRequestPage = Math.min(requestPage, requestTotalPages);
  const paginatedRequests = filteredRequests.slice(
    (currentRequestPage - 1) * REQUESTS_PAGE_SIZE,
    currentRequestPage * REQUESTS_PAGE_SIZE,
  );

  const invalidateRationFlow = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory-audit', currentCampId] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-alerts', currentCampId] });
    queryClient.invalidateQueries({ queryKey: ['inventory-adjustment-requests'] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', currentCampId] });
    queryClient.invalidateQueries({ queryKey: ['resource-metrics', currentCampId] });
  };

  const createMutation = useMutation({
    mutationFn: async (payload: PendingRationSubmission) => {
      const reason = buildRationReason(payload.note);
      const res =
        payload.mode === 'request'
          ? await apiClient.post('/inventory-adjustment-requests', {
              camp_id: payload.camp_id,
              resource_type_id: payload.resource_type_id,
              adjustment_type: 'MANUAL_OUT',
              quantity: payload.quantity,
              reason,
            })
          : await apiClient.post('/inventory/adjustment', {
              camp_id: payload.camp_id,
              resource_type_id: payload.resource_type_id,
              type: 'MANUAL_OUT',
              quantity: payload.quantity,
              description: reason,
            });

      return res.data;
    },
    onSuccess: (_data, variables) => {
      invalidateRationFlow();
      setPendingSubmission(null);
      setIsCreateOpen(false);
      setQuantity('');
      setNote('');
      setSelectedResourceId(0);
      setFormError(null);
      setFeedback(
        variables.mode === 'request'
          ? {
              type: 'success',
              title: 'RATION REQUEST SUBMITTED',
              message:
                'The ration disbursement request is pending resource manager review. Inventory was not changed yet.',
            }
          : {
              type: 'success',
              title: 'RATION RECORDED',
              message: 'The ration disbursement was recorded and deducted from camp inventory.',
            },
      );
    },
    onError: (error) => {
      const message = getRationErrorMessage(error, 'The ration operation could not be completed.');
      setPendingSubmission(null);
      setFormError(message);
      setFeedback({
        type: 'error',
        title: 'RATION OPERATION FAILED',
        message,
      });
    },
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await apiClient.patch(`/inventory-adjustment-requests/${requestId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      invalidateRationFlow();
      setReviewAction(null);
      setFeedback({
        type: 'success',
        title: 'RATION REQUEST APPROVED',
        message: 'The ration request was approved and the inventory deduction was applied.',
      });
    },
    onError: (error) => {
      setReviewAction(null);
      setFeedback({
        type: 'error',
        title: 'APPROVAL FAILED',
        message: getRationErrorMessage(error, 'The ration request could not be approved.'),
      });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await apiClient.patch(`/inventory-adjustment-requests/${requestId}/reject`);
      return res.data;
    },
    onSuccess: () => {
      invalidateRationFlow();
      setReviewAction(null);
      setFeedback({
        type: 'success',
        title: 'RATION REQUEST REJECTED',
        message: 'The ration request was rejected. Inventory was not modified.',
      });
    },
    onError: (error) => {
      setReviewAction(null);
      setFeedback({
        type: 'error',
        title: 'REJECTION FAILED',
        message: getRationErrorMessage(error, 'The ration request could not be rejected.'),
      });
    },
  });

  const resolveResourceName = (
    resourceTypeId?: number | null,
    fallback?: string | null,
  ): string => {
    if (fallback) return fallback;
    const resource = resourceMap.get(resourceTypeId ?? -1);
    return resource?.name ?? `Resource #${resourceTypeId ?? 'unknown'}`;
  };

  const resolveResourceUnit = (
    resourceTypeId?: number | null,
    fallback?: string | null,
  ): string => {
    if (fallback) return fallback;
    return resourceMap.get(resourceTypeId ?? -1)?.unit ?? '';
  };

  const validateForm = () => {
    const parsedQuantity = Number(quantity);
    const cleanNote = note.trim();

    if (!currentCampId) return 'Select a refuge before recording rations.';
    if (!canViewActiveCamp) return 'Your current role cannot manage rations for this refuge.';
    if (!selectedResourceId || selectedResourceId <= 0) return 'Select a valid resource.';
    if (!Number.isFinite(parsedQuantity) || parsedQuantity <= 0) {
      return 'Quantity must be a number greater than zero.';
    }
    if (parsedQuantity > MAX_RATION_QUANTITY) {
      return `Quantity cannot exceed ${MAX_RATION_QUANTITY}.`;
    }
    if (cleanNote.length > MAX_RATION_NOTE_LENGTH) {
      return `Note must be ${MAX_RATION_NOTE_LENGTH} characters or less.`;
    }
    if (rationSubmissionMode === 'request' && !requestWorkflowMatchesActiveCamp) {
      return 'Ration requests can only be created for your assigned refuge.';
    }
    return null;
  };

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    const resource = resourceMap.get(selectedResourceId);
    setPendingSubmission({
      mode: rationSubmissionMode,
      camp_id: Number(currentCampId),
      resource_type_id: selectedResourceId,
      resourceName: resource?.name ?? `Resource #${selectedResourceId}`,
      quantity: Number(quantity),
      note: note.trim(),
    });
  };

  const openCreateModal = () => {
    if (resources && resources.length > 0) {
      setSelectedResourceId(resources[0].id);
    }
    setQuantity('');
    setNote('');
    setFormError(null);
    setIsCreateOpen(true);
  };

  const handleReviewConfirm = () => {
    if (!reviewAction) return;
    if (reviewAction.action === 'approve') {
      approveRequestMutation.mutate(reviewAction.id);
      return;
    }
    rejectRequestMutation.mutate(reviewAction.id);
  };

  const showRequestsPanel =
    (canReadRationRequests || canReadOwnRationRequests) && requestWorkflowMatchesActiveCamp;
  const showFlowPanel = canReadAudit || canOpenRationModal || showRequestsPanel;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-brand-secondary">
            Ration Disbursement
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
            Track and record daily ration distributions
          </p>
        </div>
        {canOpenRationModal && (
          <button
            onClick={openCreateModal}
            disabled={resourcesLoading}
            className="bg-brand-secondary hover:bg-amber-600 text-black font-bold px-4 py-2 rounded-md flex items-center gap-2 text-sm transition-all disabled:opacity-40"
          >
            <Plus size={18} />
            {rationSubmissionMode === 'request' ? 'REQUEST RATION' : 'NEW RATION'}
          </button>
        )}
      </div>

      {showFlowPanel && (
        <div className="p-4 bg-surface-raised/50 border border-zinc-800 rounded-lg flex items-center gap-4">
          <div className="p-2 bg-amber-950/30 rounded-lg border border-amber-500/20 shrink-0">
            <Sandwich size={18} className="text-amber-500" />
          </div>
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {canReadAudit && (
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase">Ration Movements</p>
                <p className="text-xs font-mono text-zinc-300">
                  Automatic daily deductions, direct records, and approved ration requests are
                  listed for the active refuge.
                </p>
              </div>
            )}
            {(canOpenRationModal || showRequestsPanel) && (
              <div>
                <p className="text-[10px] font-bold text-zinc-500 uppercase">Current Flow</p>
                <p className="text-xs font-mono text-zinc-500">
                  {rationSubmissionMode === 'request'
                    ? 'Requests wait for resource manager approval before inventory changes.'
                    : 'Authorized ration records are deducted from inventory immediately.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {!currentCampId ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Sandwich className="h-12 w-12 text-zinc-700" />
          <p className="text-sm font-bold text-zinc-500 uppercase tracking-wider">
            Select a refuge to view ration records
          </p>
        </div>
      ) : !canViewActiveCamp ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <AlertTriangle className="h-12 w-12 text-red-700" />
          <div>
            <p className="text-sm font-bold text-red-400 uppercase tracking-wider">
              Refuge access restricted
            </p>
            <p className="text-xs text-zinc-600 font-mono mt-1">
              Your current role can only view ration data for its assigned refuge.
            </p>
          </div>
        </div>
      ) : canReadAudit ? (
        isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : auditError ? (
          <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-lg">
            <p className="text-xs font-mono text-red-400 leading-relaxed">
              {getRationErrorMessage(auditError, 'Failed to load ration history.')}
            </p>
          </div>
        ) : rations.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <Sandwich className="h-12 w-12 text-zinc-700" />
            <div>
              <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                No ration movements recorded
              </p>
              <p className="text-xs text-zinc-600 font-mono mt-1">
                Automatic daily deductions, direct records, and approved requests will appear here.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto border border-zinc-800 rounded-xl bg-surface-raised/40">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-mono text-[10px] uppercase tracking-wider">
                    <th scope="col" className="py-3 px-4 font-semibold">
                      Date
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold">
                      Resource
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold">
                      Source
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold">
                      Quantity
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold">
                      Description
                    </th>
                    <th scope="col" className="py-3 px-4 font-semibold">
                      Recorded By
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/50">
                  {paginatedRations.map((entry, index) => {
                    const movement = getRationMovementMeta(entry);
                    const quantityValue = Math.abs(getEntryQuantity(entry));
                    const resourceUnit = resolveResourceUnit(entry.resource_type_id, entry.unit);
                    return (
                      <motion.tr
                        key={entry.id ?? `${entry.resource_type_id}-${index}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-zinc-900/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-zinc-300 whitespace-nowrap">
                          {formatDate(entry.created_at ?? entry.timestamp ?? null)}
                        </td>
                        <td className="py-3 px-4 font-medium text-zinc-100">
                          {resolveResourceName(entry.resource_type_id, entry.resource_name)}
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={cn(
                              'inline-block px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider border',
                              movement.className,
                            )}
                          >
                            {movement.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono font-bold text-red-400 whitespace-nowrap">
                          -{formatQuantity(quantityValue)} {resourceUnit}
                        </td>
                        <td className="py-3 px-4 text-zinc-400 max-w-xs truncate">
                          {getRationDescription(entry)}
                        </td>
                        <td className="py-3 px-4 text-zinc-400 font-mono text-[11px]">
                          {movement.actor}
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onPageChange={setPage}
              showEdgeButtons
            />
          </>
        )
      ) : null}

      {showRequestsPanel && (
        <section className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-brand-secondary">
                <ClipboardList size={18} />
                <p className="text-[10px] font-mono uppercase tracking-widest">
                  Ration Authorization Queue
                </p>
              </div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">
                Ration Requests
              </h2>
              <p className="text-xs font-mono text-zinc-500">
                {canReadRationRequests
                  ? 'Pending ration requests for your assigned refuge.'
                  : 'Your ration requests and their review status.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5" aria-label="Ration request status filter">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as RationStatusFilter[]).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setRequestStatusFilter(status);
                      setRequestPage(1);
                    }}
                    className={cn(
                      'px-3 py-2 rounded border text-[10px] font-black uppercase tracking-wider transition-colors touch-target',
                      requestStatusFilter === status
                        ? 'border-brand-secondary text-brand-secondary bg-brand-secondary/10'
                        : 'border-zinc-800 text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300',
                    )}
                  >
                    {status} - {requestCounts[status]}
                  </button>
                ),
              )}
            </div>
          </div>

          {requestsLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, index) => (
                <Skeleton key={index} className="h-16 w-full rounded-lg" />
              ))}
            </div>
          ) : requestsError ? (
            <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-lg">
              <p className="text-xs font-mono text-red-400 leading-relaxed">
                {getRationErrorMessage(requestsError, 'Failed to load ration requests.')}
              </p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center border border-zinc-800 rounded-xl bg-surface-raised/30">
              <ClipboardList className="h-10 w-10 text-zinc-700" />
              <div>
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                  No ration requests found
                </p>
                <p className="text-xs text-zinc-600 font-mono mt-1">
                  {requestStatusFilter === 'ALL'
                    ? 'There are no ration requests for this view.'
                    : `No ${requestStatusFilter.toLowerCase()} ration requests are listed.`}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto border border-zinc-800 rounded-xl bg-surface-raised/40">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-zinc-800 text-zinc-500 font-mono text-[10px] uppercase tracking-wider">
                      <th scope="col" className="py-3 px-4 font-semibold">
                        Requested
                      </th>
                      <th scope="col" className="py-3 px-4 font-semibold">
                        Resource
                      </th>
                      <th scope="col" className="py-3 px-4 font-semibold">
                        Quantity
                      </th>
                      <th scope="col" className="py-3 px-4 font-semibold">
                        Status
                      </th>
                      <th scope="col" className="py-3 px-4 font-semibold">
                        Reason
                      </th>
                      {canReadRationRequests && (
                        <th scope="col" className="py-3 px-4 font-semibold">
                          Worker
                        </th>
                      )}
                      <th scope="col" className="py-3 px-4 font-semibold">
                        Reviewed
                      </th>
                      {canReviewRationRequests && (
                        <th scope="col" className="py-3 px-4 font-semibold text-right">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {paginatedRequests.map((request) => {
                      const resourceName = resolveResourceName(
                        request.resource_type_id,
                        request.resource_type?.name,
                      );
                      const unit = resolveResourceUnit(
                        request.resource_type_id,
                        request.resource_type?.unit,
                      );
                      const quantityLabel = `${formatQuantity(request.quantity)}${unit ? ` ${unit}` : ''}`;
                      const isPending = request.status === 'PENDING';

                      return (
                        <tr key={request.id} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="py-3 px-4 font-mono text-zinc-400 whitespace-nowrap">
                            {formatDate(request.created_at)}
                          </td>
                          <td className="py-3 px-4 font-medium text-zinc-100">{resourceName}</td>
                          <td className="py-3 px-4 font-mono font-bold text-red-400 whitespace-nowrap">
                            -{quantityLabel}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider border',
                                getRequestStatusClasses(request.status),
                              )}
                            >
                              {request.status === 'APPROVED' ? (
                                <CheckCircle2 size={10} />
                              ) : request.status === 'REJECTED' ? (
                                <XCircle size={10} />
                              ) : (
                                <AlertTriangle size={10} />
                              )}
                              {request.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-zinc-400 max-w-xs truncate">
                            {request.reason || '-'}
                          </td>
                          {canReadRationRequests && (
                            <td className="py-3 px-4 text-zinc-400 font-mono">
                              {request.created_by_user?.username ?? request.created_by}
                            </td>
                          )}
                          <td className="py-3 px-4 text-zinc-500 font-mono whitespace-nowrap">
                            {request.reviewed_at
                              ? `${formatDate(request.reviewed_at)}${
                                  request.reviewed_by_user?.username
                                    ? ` - ${request.reviewed_by_user.username}`
                                    : ''
                                }`
                              : '-'}
                          </td>
                          {canReviewRationRequests && (
                            <td className="py-3 px-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={!isPending}
                                  onClick={() =>
                                    setReviewAction({
                                      id: request.id,
                                      action: 'approve',
                                      resourceName,
                                      quantity: quantityLabel,
                                    })
                                  }
                                  className="px-3 py-1.5 rounded border border-emerald-500/30 text-emerald-400 hover:bg-emerald-950/30 disabled:opacity-30 disabled:hover:bg-transparent text-[10px] font-black uppercase transition-colors touch-target"
                                >
                                  Approve
                                </button>
                                <button
                                  type="button"
                                  disabled={!isPending}
                                  onClick={() =>
                                    setReviewAction({
                                      id: request.id,
                                      action: 'reject',
                                      resourceName,
                                      quantity: quantityLabel,
                                    })
                                  }
                                  className="px-3 py-1.5 rounded border border-red-500/30 text-red-400 hover:bg-red-950/30 disabled:opacity-30 disabled:hover:bg-transparent text-[10px] font-black uppercase transition-colors touch-target"
                                >
                                  Reject
                                </button>
                              </div>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <Pagination
                page={currentRequestPage}
                totalPages={requestTotalPages}
                onPageChange={setRequestPage}
                showEdgeButtons
              />
            </>
          )}
        </section>
      )}

      <AnimatePresence>
        {isCreateOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              className="bg-surface-raised brutalist-border p-4 sm:p-6 md:p-8 rounded-xl max-w-lg w-full max-h-[calc(100vh-2rem)] overflow-y-auto space-y-6"
            >
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
                <div>
                  <p className="text-[10px] font-mono text-brand-secondary uppercase tracking-widest leading-none mb-1">
                    DISPENSARY INTERFACE DS-02
                  </p>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    {rationSubmissionMode === 'request'
                      ? 'Request Ration Disbursement'
                      : 'New Ration Disbursement'}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    {rationSubmissionMode === 'request'
                      ? 'Request a ration distribution from the current refuge stockpile.'
                      : 'Record a ration distribution from the current refuge stockpile.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsCreateOpen(false);
                    setFormError(null);
                  }}
                  aria-label="Close new ration modal"
                  title="Close new ration modal"
                  className="p-1 sm:p-2 text-zinc-500 hover:text-white border border-transparent hover:border-zinc-800 rounded transition-colors touch-target"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4" noValidate>
                <div className="rounded border border-zinc-800 bg-zinc-950/40 p-3 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Format requirements
                  </p>
                  <p className="text-[10px] font-mono leading-relaxed text-zinc-500">
                    Resource and quantity are required. Quantity must be greater than zero and no
                    more than {MAX_RATION_QUANTITY}. Note is optional and max{' '}
                    {MAX_RATION_NOTE_LENGTH} characters.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Resource <span className="text-red-500">*</span>
                  </label>
                  <select
                    aria-label="Select resource"
                    value={selectedResourceId}
                    onChange={(event) => {
                      setSelectedResourceId(Number(event.target.value));
                      setFormError(null);
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-secondary cursor-pointer"
                  >
                    {(resources ?? []).map((resource) => (
                      <option key={resource.id} value={resource.id}>
                        {resource.name} ({resource.unit})
                      </option>
                    ))}
                    {(resources ?? []).length === 0 && (
                      <option value={0} disabled>
                        No resources available
                      </option>
                    )}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="number"
                    min="0.01"
                    max={MAX_RATION_QUANTITY}
                    step="0.01"
                    aria-label="Ration quantity"
                    value={quantity}
                    onChange={(event) => {
                      setQuantity(event.target.value);
                      setFormError(null);
                    }}
                    placeholder="e.g. 50"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-secondary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Note (optional)
                  </label>
                  <textarea
                    aria-label="Ration note"
                    value={note}
                    maxLength={MAX_RATION_NOTE_LENGTH}
                    onChange={(event) => {
                      setNote(event.target.value);
                      setFormError(null);
                    }}
                    placeholder="e.g. Breakfast distribution to Sector B survivors"
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-secondary resize-none"
                  />
                  <p className="text-[10px] font-mono text-zinc-600">
                    Optional. {note.trim().length}/{MAX_RATION_NOTE_LENGTH} characters.
                  </p>
                </div>

                {formError && (
                  <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-lg">
                    <p className="text-xs font-mono text-red-400 leading-relaxed">{formError}</p>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateOpen(false);
                      setFormError(null);
                    }}
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || !quantity || !selectedResourceId}
                    className="flex-1 py-2.5 bg-brand-secondary text-black text-xs font-black uppercase rounded hover:bg-amber-500 transition-colors disabled:opacity-30"
                  >
                    {createMutation.isPending
                      ? 'TRANSMITTING...'
                      : rationSubmissionMode === 'request'
                        ? 'SUBMIT REQUEST'
                        : 'AUTHORIZE DISTRIBUTION'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={Boolean(pendingSubmission)}
        title={
          pendingSubmission?.mode === 'request'
            ? 'Submit Ration Request'
            : 'Authorize Ration Distribution'
        }
        description={
          pendingSubmission
            ? pendingSubmission.mode === 'request'
              ? `Submit a request for ${formatQuantity(pendingSubmission.quantity)} of ${
                  pendingSubmission.resourceName
                }. Inventory will not change until approval.`
              : `Deduct ${formatQuantity(pendingSubmission.quantity)} of ${
                  pendingSubmission.resourceName
                } from the active refuge inventory now.`
            : ''
        }
        confirmLabel={pendingSubmission?.mode === 'request' ? 'SUBMIT' : 'AUTHORIZE'}
        cancelLabel="CANCEL"
        variant="warning"
        isPending={createMutation.isPending}
        onConfirm={() => {
          if (pendingSubmission) createMutation.mutate(pendingSubmission);
        }}
        onCancel={() => {
          if (!createMutation.isPending) setPendingSubmission(null);
        }}
      />

      <ConfirmDialog
        isOpen={Boolean(reviewAction)}
        title={reviewAction?.action === 'approve' ? 'Approve Ration Request' : 'Reject Request'}
        description={
          reviewAction?.action === 'approve'
            ? `Approve ${reviewAction.quantity} for ${reviewAction.resourceName}. The backend will deduct this from inventory immediately.`
            : `Reject the request for ${reviewAction?.quantity ?? ''} of ${
                reviewAction?.resourceName ?? 'this resource'
              }. Inventory will not be modified.`
        }
        confirmLabel={reviewAction?.action === 'approve' ? 'APPROVE' : 'REJECT'}
        cancelLabel="CANCEL"
        variant={reviewAction?.action === 'approve' ? 'warning' : 'danger'}
        isPending={approveRequestMutation.isPending || rejectRequestMutation.isPending}
        onConfirm={handleReviewConfirm}
        onCancel={() => {
          if (!approveRequestMutation.isPending && !rejectRequestMutation.isPending) {
            setReviewAction(null);
          }
        }}
      />

      {feedback && (
        <ActionFeedbackDialog
          isOpen={Boolean(feedback)}
          type={feedback.type}
          title={feedback.title}
          message={feedback.message}
          actionLabel={feedback.actionLabel}
          onClose={() => setFeedback(null)}
        />
      )}
    </div>
  );
}
