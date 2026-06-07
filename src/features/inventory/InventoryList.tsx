import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, fetchAllPaginated, unwrapList } from '../../lib/api';
import { useCampStore, useAuthStore } from '../../store';
import { hasPermission, canAccessCamp } from '../../lib/permissions';
import { useDeniedPermissionsStore } from '../../store/deniedPermissions';
import {
  InventoryAdjustmentRequest,
  InventoryAdjustmentRequestStatus,
  InventorySnapshot,
  Resource,
  UserRole,
} from '../../types';
import {
  Package,
  AlertTriangle,
  ArrowDownUp,
  Info,
  History,
  X,
  PlusCircle,
  MinusCircle,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Send,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../../lib/utils';
import { Skeleton } from '../../components/Skeleton';
import { Pagination } from '../../components/Pagination';
import { ActionFeedbackDialog, ActionFeedbackType } from '../../components/ActionFeedbackDialog';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { getApiErrorMessage } from '../../lib/apiErrors';

const PAGE_SIZE = 12;
const REQUESTS_PAGE_SIZE = 6;
const MAX_ADJUSTMENT_QUANTITY = 9999999999.99;
const ADJUSTMENT_REASON_MAX_LENGTH = 255;

type AdjustmentStatusFilter = 'ALL' | InventoryAdjustmentRequestStatus;
type AdjustmentSubmissionMode = 'direct' | 'request';

type InventoryFeedback = {
  type: ActionFeedbackType;
  title: string;
  message: string;
  actionLabel?: string;
};

type ReviewAction = {
  id: number;
  action: 'approve' | 'reject';
  resourceName: string;
  quantity: string;
};

const getRequestStatusClasses = (status: InventoryAdjustmentRequestStatus) => {
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
};

const formatQuantity = (value: number | string | null | undefined) => {
  const quantity = Number(value ?? 0);
  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(
    Number.isFinite(quantity) ? quantity : 0,
  );
};

const getBackendValidationDetails = (error: unknown) => {
  const details = (error as { response?: { data?: { error?: { details?: unknown } } } }).response
    ?.data?.error?.details;
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
};

const getInventoryErrorMessage = (error: unknown, fallback: string) =>
  getBackendValidationDetails(error) || getApiErrorMessage(error, fallback);

export default function InventoryList() {
  const { currentCampId } = useCampStore();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  useDeniedPermissionsStore();

  // Modals
  const [isAdjustOpen, setIsAdjustOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestStatusFilter, setRequestStatusFilter] = useState<AdjustmentStatusFilter>('ALL');
  const [adjustError, setAdjustError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<InventoryFeedback | null>(null);
  const [reviewAction, setReviewAction] = useState<ReviewAction | null>(null);

  // Form states for manual adjustment
  const [selectedResourceId, setSelectedResourceId] = useState<number>(0);
  const [adjustType, setAdjustType] = useState<'MANUAL_IN' | 'MANUAL_OUT'>('MANUAL_IN');
  const [adjustQuantity, setAdjustQuantity] = useState<string>('');
  const [adjustDescription, setAdjustDescription] = useState<string>('');

  const canCreateAdjustmentRequest = hasPermission(
    user?.permissions,
    'inventory_adjustment_requests.create',
  );
  const canReadOwnAdjustmentRequests = hasPermission(
    user?.permissions,
    'inventory_adjustment_requests.read_own',
  );
  const canReadAdjustmentRequests = hasPermission(
    user?.permissions,
    'inventory_adjustment_requests.read',
  );
  const canReviewAdjustmentRequests = hasPermission(
    user?.permissions,
    'inventory_adjustment_requests.review',
  );
  const canDirectAdjust =
    hasPermission(user?.permissions, 'inventory.adjust') && user?.role !== UserRole.WORKER;
  const canAuditRead = hasPermission(user?.permissions, 'inventory.audit.read');
  const requestWorkflowMatchesActiveCamp =
    !!currentCampId && user?.camp_id != null && Number(user.camp_id) === Number(currentCampId);
  const canOpenAdjustment =
    canDirectAdjust || (canCreateAdjustmentRequest && requestWorkflowMatchesActiveCamp);
  const adjustmentSubmissionMode: AdjustmentSubmissionMode =
    canCreateAdjustmentRequest && !canDirectAdjust ? 'request' : 'direct';

  const { data: resources, isLoading: resourcesLoading } = useQuery<Resource[]>({
    queryKey: ['resources'],
    queryFn: () => fetchAllPaginated<Resource>('/resources'),
    enabled: hasPermission(user?.permissions, 'resources.read'),
  });

  const resourceMap = useMemo(() => {
    const map = new Map<number, Resource>();
    for (const resource of resources ?? []) {
      map.set(resource.id, resource);
    }
    return map;
  }, [resources]);

  const { data: inventory, isLoading } = useQuery<InventorySnapshot[]>({
    queryKey: ['inventory', currentCampId],
    queryFn: async () => {
      try {
        const [invRes, resourceTypes] = await Promise.all([
          apiClient.get(`/inventory/${currentCampId}`),
          fetchAllPaginated<Resource>('/resources'),
        ]);
        const items = (invRes.data?.data ?? invRes.data ?? []) as Array<{
          resource_type_id: number;
          quantity?: number;
        }>;
        return items.map((item) => {
          const rt = resourceTypes.find((r) => r.id === item.resource_type_id);
          const qty = Math.floor(Number(item.quantity ?? 0));
          const minStock = Math.floor(Number(rt?.minimum_stock ?? 0));
          return {
            resource_id: item.resource_type_id,
            resource_name: rt?.name ?? `Resource #${item.resource_type_id}`,
            unit: rt?.unit ?? '',
            quantity: qty,
            minimum_stock: minStock,
            daily_ration: Math.floor(Number(rt?.daily_ration ?? 0)),
            daily_usage: 0,
            projection_days: null,
            status: qty < minStock ? (qty < minStock / 2 ? 'CRITICAL' : 'LOW') : 'OK',
          } satisfies InventorySnapshot;
        }) as InventorySnapshot[];
      } catch (err) {
        const status = (err as { response?: { status?: number } })?.response?.status;
        if (status === 403) return [] as InventorySnapshot[];
        throw err;
      }
    },
    enabled:
      !!currentCampId &&
      hasPermission(user?.permissions, 'inventory.read') &&
      canAccessCamp(currentCampId),
    retry: (failureCount, error: unknown) => {
      const status = (error as { response?: { status?: number } })?.response?.status;
      if (status === 403) return false;
      return failureCount < 1;
    },
  });

  const totalPages = Math.max(1, Math.ceil((inventory?.length ?? 0) / PAGE_SIZE));
  const currentInventoryPage = Math.min(page, totalPages);
  const paginatedInventory = (inventory ?? []).slice(
    (currentInventoryPage - 1) * PAGE_SIZE,
    currentInventoryPage * PAGE_SIZE,
  );

  const requestsEndpoint = canReadAdjustmentRequests
    ? '/inventory-adjustment-requests'
    : canReadOwnAdjustmentRequests
      ? '/inventory-adjustment-requests/my'
      : null;

  const {
    data: adjustmentRequests,
    isLoading: requestsLoading,
    error: requestsError,
  } = useQuery<InventoryAdjustmentRequest[]>({
    queryKey: ['inventory-adjustment-requests', requestsEndpoint, currentCampId],
    queryFn: async () => {
      const res = await apiClient.get(requestsEndpoint ?? '/inventory-adjustment-requests/my');
      return unwrapList<InventoryAdjustmentRequest>(res.data);
    },
    enabled:
      Boolean(requestsEndpoint) &&
      requestWorkflowMatchesActiveCamp &&
      canAccessCamp(Number(currentCampId)),
    retry: false,
  });

  const requestCounts = useMemo(
    () =>
      (adjustmentRequests ?? []).reduce(
        (counts, request) => {
          counts.ALL += 1;
          counts[request.status] += 1;
          return counts;
        },
        { ALL: 0, PENDING: 0, APPROVED: 0, REJECTED: 0 } as Record<AdjustmentStatusFilter, number>,
      ),
    [adjustmentRequests],
  );

  const filteredRequests = useMemo(() => {
    const requests = adjustmentRequests ?? [];
    if (requestStatusFilter === 'ALL') return requests;
    return requests.filter((request) => request.status === requestStatusFilter);
  }, [adjustmentRequests, requestStatusFilter]);

  const requestsTotalPages = Math.max(1, Math.ceil(filteredRequests.length / REQUESTS_PAGE_SIZE));
  const currentRequestsPage = Math.min(requestsPage, requestsTotalPages);
  const paginatedRequests = filteredRequests.slice(
    (currentRequestsPage - 1) * REQUESTS_PAGE_SIZE,
    currentRequestsPage * REQUESTS_PAGE_SIZE,
  );

  const invalidateInventoryFlow = () => {
    queryClient.invalidateQueries({ queryKey: ['inventory', currentCampId] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-audit', currentCampId] });
    queryClient.invalidateQueries({ queryKey: ['inventory-alerts', currentCampId] });
    queryClient.invalidateQueries({ queryKey: ['inventory-adjustment-requests'] });
    queryClient.invalidateQueries({
      queryKey: ['dashboard-metrics', currentCampId],
    });
    queryClient.invalidateQueries({
      queryKey: ['resource-metrics', currentCampId],
    });
  };

  const adjustMutation = useMutation({
    mutationFn: async (payload: {
      mode: AdjustmentSubmissionMode;
      camp_id: number;
      resource_type_id: number;
      adjustment_type: 'MANUAL_IN' | 'MANUAL_OUT';
      quantity: number;
      reason?: string;
    }) => {
      const res =
        payload.mode === 'request'
          ? await apiClient.post('/inventory-adjustment-requests', {
              camp_id: payload.camp_id,
              resource_type_id: payload.resource_type_id,
              adjustment_type: payload.adjustment_type,
              quantity: payload.quantity,
              ...(payload.reason ? { reason: payload.reason } : {}),
            })
          : await apiClient.post('/inventory/adjustment', {
              camp_id: payload.camp_id,
              resource_type_id: payload.resource_type_id,
              type: payload.adjustment_type,
              quantity: payload.quantity,
              description:
                payload.reason ||
                `Manual ${payload.adjustment_type === 'MANUAL_IN' ? 'Ingress' : 'Egress'} of resources`,
            });
      return res.data;
    },
    onSuccess: (_data, variables) => {
      invalidateInventoryFlow();
      setIsAdjustOpen(false);
      setSelectedResourceId(0);
      setAdjustQuantity('');
      setAdjustDescription('');
      setAdjustError(null);
      setFeedback(
        variables.mode === 'request'
          ? {
              type: 'success',
              title: 'REQUEST SUBMITTED',
              message:
                'The inventory adjustment request is pending resource manager review. Inventory was not changed yet.',
            }
          : {
              type: 'success',
              title: 'INVENTORY UPDATED',
              message:
                'The manual adjustment was recorded and the camp inventory was updated successfully.',
            },
      );
    },
    onError: (err) => {
      const msg = getInventoryErrorMessage(err, 'Adjustment failed.');
      setAdjustError(msg);
      setFeedback({
        type: 'error',
        title: 'ADJUSTMENT FAILED',
        message: msg,
      });
    },
  });

  const approveRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await apiClient.patch(`/inventory-adjustment-requests/${requestId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      invalidateInventoryFlow();
      setReviewAction(null);
      setFeedback({
        type: 'success',
        title: 'REQUEST APPROVED',
        message: 'The request was approved and the inventory movement was applied.',
      });
    },
    onError: (error) => {
      setReviewAction(null);
      setFeedback({
        type: 'error',
        title: 'APPROVAL FAILED',
        message: getInventoryErrorMessage(error, 'The request could not be approved.'),
      });
    },
  });

  const rejectRequestMutation = useMutation({
    mutationFn: async (requestId: number) => {
      const res = await apiClient.patch(`/inventory-adjustment-requests/${requestId}/reject`);
      return res.data;
    },
    onSuccess: () => {
      invalidateInventoryFlow();
      setReviewAction(null);
      setFeedback({
        type: 'success',
        title: 'REQUEST REJECTED',
        message: 'The request was rejected. Inventory was not modified.',
      });
    },
    onError: (error) => {
      setReviewAction(null);
      setFeedback({
        type: 'error',
        title: 'REJECTION FAILED',
        message: getInventoryErrorMessage(error, 'The request could not be rejected.'),
      });
    },
  });

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(adjustQuantity);
    const reason = adjustDescription.trim();
    if (!currentCampId) {
      setAdjustError('Select a camp before submitting an inventory adjustment.');
      return;
    }
    if (!selectedResourceId || selectedResourceId <= 0) {
      setAdjustError('Select a valid resource type.');
      return;
    }
    if (!Number.isFinite(qty) || qty <= 0) {
      setAdjustError('Quantity must be a number greater than zero.');
      return;
    }
    if (qty > MAX_ADJUSTMENT_QUANTITY) {
      setAdjustError(`Quantity cannot exceed ${MAX_ADJUSTMENT_QUANTITY}.`);
      return;
    }
    if (reason.length > ADJUSTMENT_REASON_MAX_LENGTH) {
      setAdjustError(`Justification must be ${ADJUSTMENT_REASON_MAX_LENGTH} characters or less.`);
      return;
    }
    if (adjustmentSubmissionMode === 'request' && !requestWorkflowMatchesActiveCamp) {
      setAdjustError('Adjustment requests can only be created for your assigned camp.');
      return;
    }

    adjustMutation.mutate({
      mode: adjustmentSubmissionMode,
      camp_id: currentCampId,
      resource_type_id: selectedResourceId,
      adjustment_type: adjustType,
      quantity: qty,
      ...(reason ? { reason } : {}),
    });
  };

  const openAdjustmentModal = () => {
    if (resources && resources.length > 0) {
      setSelectedResourceId(resources[0].id);
    } else if (inventory && inventory.length > 0) {
      setSelectedResourceId(inventory[0].resource_id);
    }
    setAdjustQuantity('');
    setAdjustDescription('');
    setAdjustError(null);
    setIsAdjustOpen(true);
  };

  const getRequestResourceName = (request: InventoryAdjustmentRequest) =>
    request.resource_type?.name ??
    resourceMap.get(request.resource_type_id)?.name ??
    `Resource #${request.resource_type_id}`;

  const getRequestResourceUnit = (request: InventoryAdjustmentRequest) =>
    request.resource_type?.unit ?? resourceMap.get(request.resource_type_id)?.unit ?? '';

  const handleReviewConfirm = () => {
    if (!reviewAction) return;
    if (reviewAction.action === 'approve') {
      approveRequestMutation.mutate(reviewAction.id);
      return;
    }
    rejectRequestMutation.mutate(reviewAction.id);
  };

  const showAdjustmentRequestsPanel =
    (canReadAdjustmentRequests || canReadOwnAdjustmentRequests) && requestWorkflowMatchesActiveCamp;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-brand-secondary">
            Storage Logs
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
            Critical inventory & rationing alerts
          </p>
        </div>
        <div className="flex gap-2">
          {canAuditRead && (
            <button
              onClick={() => navigate('/inventory/audit')}
              className="brutalist-border hover:bg-zinc-900 text-zinc-300 font-bold px-4 py-2 rounded-md flex items-center gap-2 text-sm transition-all"
              aria-label="View inventory audit trail"
            >
              <History size={18} />
              VIEW AUDIT TRAIL
            </button>
          )}
          {canOpenAdjustment && (
            <button
              onClick={openAdjustmentModal}
              disabled={resourcesLoading}
              className="bg-brand-secondary hover:bg-amber-600 text-black font-bold px-4 py-2 rounded-md flex items-center gap-2 text-sm transition-all"
              aria-label={
                adjustmentSubmissionMode === 'request'
                  ? 'Open inventory adjustment request form'
                  : 'Open manual stock adjustment form'
              }
            >
              {adjustmentSubmissionMode === 'request' ? (
                <Send size={18} />
              ) : (
                <ArrowDownUp size={18} />
              )}
              {adjustmentSubmissionMode === 'request' ? 'REQUEST ADJUST' : 'MANUAL ADJUST'}
            </button>
          )}
        </div>
      </div>

      <div className="p-3 sm:p-4 bg-surface-raised/50 border border-zinc-800 rounded-lg flex items-center gap-4">
        <div className="p-2 bg-blue-950/30 rounded-lg border border-blue-500/20 shrink-0">
          <Info size={18} className="text-blue-400" />
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase">Daily Processing</p>
            <p className="text-xs font-mono text-zinc-300">
              {(inventory ?? []).reduce((sum, r) => sum + (r.daily_ration ?? 0), 0)} total daily
              ration units
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase">Resources in Storage</p>
            <p className="text-xs font-mono text-zinc-300">
              {inventory?.length ?? '-'} resource types tracked
            </p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-zinc-500 uppercase">Processing Cycle</p>
            <p className="text-xs font-mono text-zinc-500">
              Daily auto-rations &amp; alerts via server cron
            </p>
          </div>
        </div>
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="p-4 sm:p-6 bg-surface-raised/40 brutalist-border rounded-xl space-y-6 animate-pulse"
              >
                <div className="flex justify-between items-start">
                  <Skeleton className="w-12 h-12 rounded-lg" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-3 w-1/4" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-full" />
                  <div className="flex justify-between">
                    <Skeleton className="h-2 w-8" />
                    <Skeleton className="h-2 w-24" />
                  </div>
                </div>
                <div className="pt-2 flex gap-4">
                  <Skeleton className="h-10 flex-1" />
                  <Skeleton className="h-10 flex-1" />
                </div>
              </div>
            ))
          : paginatedInventory.map((item) => (
              <motion.div
                key={item.resource_id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 sm:p-6 bg-surface-raised brutalist-border rounded-xl space-y-6 relative overflow-hidden group transition-all hover:bg-zinc-900/80 ${
                  item.status === 'CRITICAL'
                    ? 'border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.1)]'
                    : item.status === 'LOW'
                      ? 'border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.1)]'
                      : 'border-zinc-800'
                }`}
              >
                {/* Status Indicator */}
                <div
                  className={`absolute top-0 right-0 w-32 h-32 translate-x-16 -translate-y-16 rotate-45 opacity-10 ${
                    item.status === 'CRITICAL'
                      ? 'bg-red-500'
                      : item.status === 'LOW'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                  }`}
                />

                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-zinc-950 rounded-lg flex items-center justify-center text-zinc-500 border border-zinc-800 group-hover:border-zinc-700 transition-colors">
                    <Package size={24} />
                  </div>
                  <div
                    className={cn(
                      'text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded border flex items-center gap-1',
                      item.status === 'CRITICAL'
                        ? 'bg-red-950/20 text-red-500 border-red-500/30'
                        : item.status === 'LOW'
                          ? 'bg-amber-950/20 text-amber-500 border-amber-500/30'
                          : 'bg-emerald-950/20 text-emerald-500 border-emerald-500/30',
                    )}
                  >
                    {item.status === 'CRITICAL' && <AlertTriangle size={10} />}
                    {item.status}
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-xl font-black tracking-tight flex items-center gap-2">
                    {item.resource_name}
                    <button
                      className="text-zinc-600 hover:text-zinc-400 touch-target"
                      aria-label={`View details for ${item.resource_name}`}
                    >
                      <Info size={14} />
                    </button>
                  </h3>
                  <p className="text-zinc-500 font-mono text-xs uppercase">Unit: {item.unit}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-end">
                    <span className="text-sm font-bold text-zinc-600 uppercase tracking-widest">
                      In Stock
                    </span>
                    <span
                      className={`text-2xl font-black font-mono ${
                        item.status === 'CRITICAL'
                          ? 'text-red-500'
                          : item.status === 'LOW'
                            ? 'text-amber-500'
                            : 'text-zinc-100'
                      }`}
                    >
                      {item.quantity}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{
                        width: `${Math.min((item.quantity / (item.minimum_stock * 2)) * 100, 100)}%`,
                      }}
                      className={`h-full ${
                        item.status === 'CRITICAL'
                          ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]'
                          : item.status === 'LOW'
                            ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]'
                            : 'bg-emerald-500'
                      }`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] font-mono text-zinc-600 uppercase">
                    <span>0</span>
                    <span className="text-zinc-400 font-bold">
                      Reserve Floor: {item.minimum_stock}
                    </span>
                  </div>
                </div>

                <div className="pt-2 flex gap-4">
                  <div className="flex-1 p-2 bg-zinc-950 border border-zinc-900 rounded text-center">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Daily Ration</p>
                    <p className="text-xs font-mono font-bold">
                      {item.daily_ration} {item.unit}/p
                    </p>
                  </div>
                  <div className="flex-1 p-2 bg-zinc-950 border border-zinc-900 rounded text-center">
                    <p className="text-[10px] text-zinc-500 uppercase font-bold">Projection</p>
                    <p
                      className={cn(
                        'text-xs font-mono font-bold text-nowrap',
                        (item.projection_days || 0) < 5
                          ? 'text-red-500'
                          : (item.projection_days || 0) < 10
                            ? 'text-amber-500'
                            : 'text-emerald-500',
                      )}
                    >
                      {item.projection_days !== null ? `${item.projection_days} Days` : 'N/A'}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}

        <div className="pt-6 flex justify-center sm:col-span-2 xl:col-span-3">
          <Pagination page={currentInventoryPage} totalPages={totalPages} onPageChange={setPage} />
        </div>
      </div>

      {showAdjustmentRequestsPanel && (
        <section className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-brand-secondary">
                <ClipboardList size={18} />
                <p className="text-[10px] font-mono uppercase tracking-widest">
                  Inventory Authorization Queue
                </p>
              </div>
              <h2 className="text-2xl font-black uppercase italic tracking-tighter">
                Adjustment Requests
              </h2>
              <p className="text-xs font-mono text-zinc-500">
                {canReadAdjustmentRequests
                  ? 'Requests submitted for your assigned camp. Approvals apply inventory changes.'
                  : 'Your submitted requests. Inventory changes only after resource manager approval.'}
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5" aria-label="Request status filter">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as AdjustmentStatusFilter[]).map(
                (status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => {
                      setRequestStatusFilter(status);
                      setRequestsPage(1);
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
                {getInventoryErrorMessage(requestsError, 'Failed to load adjustment requests.')}
              </p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center border border-zinc-800 rounded-xl bg-surface-raised/30">
              <ClipboardList className="h-10 w-10 text-zinc-700" />
              <div>
                <p className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                  No adjustment requests found
                </p>
                <p className="text-xs text-zinc-600 font-mono mt-1">
                  {requestStatusFilter === 'ALL'
                    ? 'There are no inventory adjustment requests for this view.'
                    : `No ${requestStatusFilter.toLowerCase()} requests are currently listed.`}
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
                        Type
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
                      {canReadAdjustmentRequests && (
                        <th scope="col" className="py-3 px-4 font-semibold">
                          Worker
                        </th>
                      )}
                      <th scope="col" className="py-3 px-4 font-semibold">
                        Reviewed
                      </th>
                      {canReviewAdjustmentRequests && (
                        <th scope="col" className="py-3 px-4 font-semibold text-right">
                          Actions
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/50">
                    {paginatedRequests.map((request) => {
                      const resourceName = getRequestResourceName(request);
                      const unit = getRequestResourceUnit(request);
                      const quantity = `${formatQuantity(request.quantity)}${unit ? ` ${unit}` : ''}`;
                      const isPending = request.status === 'PENDING';

                      return (
                        <tr key={request.id} className="hover:bg-zinc-900/40 transition-colors">
                          <td className="py-3 px-4 font-mono text-zinc-400 whitespace-nowrap">
                            {formatDate(request.created_at)}
                          </td>
                          <td className="py-3 px-4 font-medium text-zinc-100">{resourceName}</td>
                          <td className="py-3 px-4">
                            <span
                              className={cn(
                                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wider border',
                                request.adjustment_type === 'MANUAL_IN'
                                  ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/20'
                                  : 'bg-red-950/40 text-red-400 border-red-500/20',
                              )}
                            >
                              {request.adjustment_type === 'MANUAL_IN' ? (
                                <PlusCircle size={10} />
                              ) : (
                                <MinusCircle size={10} />
                              )}
                              {request.adjustment_type.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-zinc-200 whitespace-nowrap">
                            {quantity}
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
                          {canReadAdjustmentRequests && (
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
                          {canReviewAdjustmentRequests && (
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
                                      quantity,
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
                                      quantity,
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
                page={currentRequestsPage}
                totalPages={requestsTotalPages}
                onPageChange={setRequestsPage}
                showEdgeButtons
              />
            </>
          )}
        </section>
      )}

      <AnimatePresence>
        {/* Inventory adjustment modal */}
        {isAdjustOpen && (
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
                    DISPENSARY INTERFACE CR-08
                  </p>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    {adjustmentSubmissionMode === 'request'
                      ? 'Inventory Adjustment Request'
                      : 'Manual Stock Adjustment'}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    {adjustmentSubmissionMode === 'request'
                      ? 'Submit a pending inventory change for resource manager authorization.'
                      : 'Override stockpile logs due to field discoveries or unplanned rationing.'}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setIsAdjustOpen(false);
                    setAdjustError(null);
                  }}
                  className="p-1 text-zinc-500 hover:text-white border border-transparent hover:border-zinc-800 rounded transition-colors touch-target"
                  aria-label="Close adjustment modal"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleAdjustSubmit} className="space-y-4">
                <div className="rounded border border-zinc-800 bg-zinc-950/40 p-3 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Format requirements
                  </p>
                  <p className="text-[10px] font-mono leading-relaxed text-zinc-500">
                    Resource and quantity are required. Quantity must be greater than zero and no
                    more than {MAX_ADJUSTMENT_QUANTITY}. Justification is optional and max{' '}
                    {ADJUSTMENT_REASON_MAX_LENGTH} characters.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Target Resource
                  </label>
                  <select
                    value={selectedResourceId}
                    onChange={(e) => {
                      setSelectedResourceId(Number(e.target.value));
                      setAdjustError(null);
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-secondary cursor-pointer"
                  >
                    {(resources ?? []).map((resource) => {
                      const inventoryItem = inventory?.find(
                        (item) => item.resource_id === resource.id,
                      );
                      return (
                        <option key={resource.id} value={resource.id}>
                          {resource.name} (Current: {inventoryItem?.quantity ?? 0} {resource.unit})
                        </option>
                      );
                    })}
                    {(resources ?? []).length === 0 && (
                      <option value={0} disabled>
                        No resources available
                      </option>
                    )}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Adjustment Type
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAdjustType('MANUAL_IN')}
                        className={cn(
                          'py-2 text-xs font-bold border rounded flex items-center justify-center gap-1.5 transition-colors',
                          adjustType === 'MANUAL_IN'
                            ? 'bg-emerald-950/20 border-emerald-500 text-emerald-400'
                            : 'border-zinc-800 text-zinc-500 hover:bg-zinc-900',
                        )}
                        aria-label="Set adjustment type to ingress (add)"
                      >
                        <PlusCircle size={14} />
                        INGRESS (ADD)
                      </button>
                      <button
                        type="button"
                        onClick={() => setAdjustType('MANUAL_OUT')}
                        className={cn(
                          'py-2 text-xs font-bold border rounded flex items-center justify-center gap-1.5 transition-colors',
                          adjustType === 'MANUAL_OUT'
                            ? 'bg-red-950/20 border-red-500 text-red-400'
                            : 'border-zinc-800 text-zinc-500 hover:bg-zinc-900',
                        )}
                        aria-label="Set adjustment type to egress (subtract)"
                      >
                        <MinusCircle size={14} />
                        EGRESS (SUB)
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Quantity Change
                    </label>
                    <input
                      required
                      type="number"
                      inputMode="decimal"
                      min="0.01"
                      max={MAX_ADJUSTMENT_QUANTITY}
                      step="0.01"
                      value={adjustQuantity}
                      onChange={(e) => {
                        setAdjustQuantity(e.target.value);
                        setAdjustError(null);
                      }}
                      placeholder="e.g. 50"
                      aria-label="Adjustment quantity"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-secondary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Modification Justification Note
                  </label>
                  <textarea
                    value={adjustDescription}
                    maxLength={ADJUSTMENT_REASON_MAX_LENGTH}
                    onChange={(e) => {
                      setAdjustDescription(e.target.value);
                      setAdjustError(null);
                    }}
                    placeholder="e.g. Discovered 5 crates of canned beans in warehouse basement near Highway 10."
                    rows={3}
                    aria-label="Adjustment reason"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-secondary resize-none"
                  />
                  <p className="text-[10px] font-mono text-zinc-600">
                    Optional. {adjustDescription.trim().length}/{ADJUSTMENT_REASON_MAX_LENGTH}{' '}
                    characters.
                  </p>
                </div>

                {adjustError && (
                  <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-lg">
                    <p className="text-xs font-mono text-red-400 leading-relaxed">{adjustError}</p>
                  </div>
                )}

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdjustOpen(false);
                      setAdjustError(null);
                    }}
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                    aria-label="Cancel and close adjustment form"
                  >
                    ABORT ADJUSTMENT
                  </button>
                  <button
                    type="submit"
                    disabled={adjustMutation.isPending || !adjustQuantity}
                    className="flex-1 py-2.5 bg-brand-secondary text-black text-xs font-black uppercase rounded hover:bg-amber-500 transition-colors disabled:opacity-30"
                    aria-label={
                      adjustmentSubmissionMode === 'request'
                        ? 'Submit inventory adjustment request'
                        : 'Authorize manual stock entry'
                    }
                  >
                    {adjustMutation.isPending
                      ? 'TRANSMITTING ACTION...'
                      : adjustmentSubmissionMode === 'request'
                        ? 'SUBMIT REQUEST'
                        : 'AUTHORIZE STOCK ENTRY'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        isOpen={Boolean(reviewAction)}
        title={reviewAction?.action === 'approve' ? 'Approve Adjustment Request' : 'Reject Request'}
        description={
          reviewAction?.action === 'approve'
            ? `Approve ${reviewAction.quantity} for ${reviewAction.resourceName}. The backend will apply this movement to inventory immediately.`
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
