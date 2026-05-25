import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, unwrapList } from '../../lib/api';
import { useCampStore, useAuthStore } from '../../store';
import { cn, formatDate } from '../../lib/utils';
import { Skeleton, SkeletonList } from '../../components/Skeleton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Pagination } from '../../components/Pagination';
import { motion, AnimatePresence } from 'motion/react';
import { Person } from '../../types';
import {
  ArrowRight,
  Plus,
  X,
  ChevronRight,
  Truck,
  CheckCircle2,
  XCircle,
  Eye,
  Calendar,
  Loader2,
  AlertTriangle,
  Ban,
  CheckCheck,
  Package,
  UserPlus,
} from 'lucide-react';

// ── Local types ───────────────────────────────────────────────────────────────

type TransferStatus = 'PENDING' | 'APPROVED_SOURCE' | 'APPROVED_TARGET' | 'COMPLETED' | 'REJECTED';

interface TransferItem {
  item_type: 'RESOURCE' | 'PERSON';
  resource_type_id?: number | null;
  person_id?: number | null;
  quantity?: number | null;
}

interface Transfer {
  id: number;
  requesting_camp: number;
  target_camp: number;
  requesting_camp_ref?: { id: number; name: string } | null;
  target_camp_ref?: { id: number; name: string } | null;
  status: TransferStatus;
  type: string;
  notes?: string | null;
  requested_by?: number | null;
  items: TransferItem[];
  created_at: string;
  scheduled_delivery_date?: string | null;
}

interface ResourceType {
  id: number;
  name: string;
  unit: string;
}

interface CampRef {
  id: number;
  name: string;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_STEPS: TransferStatus[] = [
  'PENDING',
  'APPROVED_SOURCE',
  'APPROVED_TARGET',
  'COMPLETED',
];

const STATUS_STEP_LABELS = ['PENDING', 'SOURCE\nAPPROVED', 'TARGET\nAPPROVED', 'COMPLETED'];

// ── Helpers ───────────────────────────────────────────────────────────────────

function getStatusBadgeClasses(status: TransferStatus): string {
  switch (status) {
    case 'PENDING':
      return 'bg-amber-950/20 text-amber-500 border-amber-500/30';
    case 'APPROVED_SOURCE':
      return 'bg-blue-950/20 text-blue-400 border-blue-400/30';
    case 'APPROVED_TARGET':
      return 'bg-emerald-950/20 text-emerald-400 border-emerald-400/30';
    case 'COMPLETED':
      return 'bg-green-950/30 text-green-400 border-green-500/40';
    case 'REJECTED':
      return 'bg-red-950/20 text-red-500 border-red-500/30';
    default:
      return 'bg-zinc-800 text-zinc-400 border-zinc-600/30';
  }
}

function getStatusShortLabel(status: TransferStatus): string {
  switch (status) {
    case 'APPROVED_SOURCE':
      return 'SRC APPROVED';
    case 'APPROVED_TARGET':
      return 'TGT APPROVED';
    default:
      return status;
  }
}

function normalizeRole(role: string): string {
  return role.toLowerCase().replace(/[\s-]+/g, '_');
}

function canManageTransfers(role: string | undefined): boolean {
  if (!role) return false;
  const r = normalizeRole(role);
  return (
    r === 'system_admin' || r === 'resource_manager' || r.includes('admin') || r.includes('manager')
  );
}

function canCreateTransfers(role: string | undefined): boolean {
  if (!role) return false;
  const r = normalizeRole(role);
  return canManageTransfers(role) || r === 'travel_coordinator' || r.includes('coordinator');
}

// ── StatusStepper ─────────────────────────────────────────────────────────────

function StatusStepper({ status }: { status: TransferStatus }) {
  const isRejected = status === 'REJECTED';
  const currentStep = isRejected ? -1 : STATUS_STEPS.indexOf(status);

  if (isRejected) {
    return (
      <div className="flex items-center justify-center gap-2 py-2.5 px-4 bg-red-950/20 border border-red-500/25 rounded-lg">
        <Ban size={14} className="text-red-500 shrink-0" />
        <p className="text-xs font-black uppercase text-red-500 tracking-widest">
          Transfer Rejected
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start w-full pt-1">
      {STATUS_STEPS.map((step, idx) => {
        const reached = currentStep >= idx;
        const isCurrent = currentStep === idx;

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1.5 shrink-0">
              <div
                className={cn(
                  'w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300',
                  reached
                    ? isCurrent
                      ? 'bg-brand-primary border-brand-primary text-black shadow-[0_0_12px_rgba(239,68,68,0.45)]'
                      : 'bg-green-600 border-green-600 text-white'
                    : 'bg-zinc-900 border-zinc-700 text-zinc-700',
                )}
              >
                {reached && !isCurrent ? (
                  <CheckCircle2 size={14} />
                ) : (
                  <span className="text-[10px] font-black leading-none">{idx + 1}</span>
                )}
              </div>
              <span
                className={cn(
                  'text-[8px] font-black uppercase tracking-wide text-center leading-tight max-w-[52px] whitespace-pre-line',
                  reached ? (isCurrent ? 'text-brand-primary' : 'text-green-500') : 'text-zinc-700',
                )}
              >
                {STATUS_STEP_LABELS[idx]}
              </span>
            </div>

            {idx < STATUS_STEPS.length - 1 && (
              <div
                className={cn(
                  'h-px flex-1 mt-3.5 mx-1 transition-all duration-300',
                  currentStep > idx ? 'bg-green-600' : 'bg-zinc-800',
                )}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function TransferList() {
  const PAGE_SIZE = 15;
  const { currentCampId } = useCampStore();
  const { user, userId } = useAuthStore();
  const queryClient = useQueryClient();

  // ── UI state ────────────────────────────────────────────────────────────
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [confirmCompleteId, setConfirmCompleteId] = useState<number | null>(null);
  const [confirmRejectId, setConfirmRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Schedule delivery inline state
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  // Create form state
  const [transferType, setTransferType] = useState<'RESOURCE' | 'PERSON'>('RESOURCE');
  const [targetCamp, setTargetCamp] = useState<number | null>(null);
  const [resourceItems, setResourceItems] = useState<
    { resource_type_id: number; amount: number }[]
  >([{ resource_type_id: 0, amount: 0 }]);
  const [personItems, setPersonItems] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: transfers, isLoading } = useQuery<Transfer[]>({
    queryKey: ['transfers', currentCampId],
    queryFn: async () => {
      const res = await apiClient.get(`/transfers?camp_id=${currentCampId}`);
      return unwrapList<Transfer>(res.data);
    },
    enabled: !!currentCampId,
  });

  const totalPages = Math.max(1, Math.ceil((transfers?.length ?? 0) / PAGE_SIZE));
  const paginatedTransfers = (transfers ?? []).slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const { data: detail, isLoading: detailLoading } = useQuery<Transfer>({
    queryKey: ['transfer', selectedId],
    queryFn: async () => {
      const res = await apiClient.get(`/transfers/${selectedId}`);
      return res.data;
    },
    enabled: !!selectedId,
  });

  const { data: camps } = useQuery<CampRef[]>({
    queryKey: ['camps-list'],
    queryFn: async () => {
      const res = await apiClient.get('/camps');
      return unwrapList<CampRef>(res.data);
    },
  });

  const { data: resources } = useQuery<ResourceType[]>({
    queryKey: ['resources-list'],
    queryFn: async () => {
      const res = await apiClient.get('/resources');
      return unwrapList<ResourceType>(res.data);
    },
  });

  const { data: people } = useQuery<Person[]>({
    queryKey: ['transfer-people', currentCampId],
    queryFn: async () => {
      const res = await apiClient.get(`/camps/${currentCampId}/people`);
      return unwrapList<Person>(res.data);
    },
    enabled: !!currentCampId,
  });

  // ── Lookup helpers ───────────────────────────────────────────────────────
  const getResourceName = (id?: number | null): string => {
    if (!id) return '—';
    return resources?.find((r) => r.id === id)?.name ?? `Resource #${id}`;
  };

  const getResourceUnit = (id?: number | null): string => {
    if (!id) return '';
    return resources?.find((r) => r.id === id)?.unit ?? '';
  };

  const getCampName = (id?: number | null): string => {
    if (!id) return 'Unknown Camp';
    return camps?.find((c) => c.id === id)?.name ?? `Camp #${id}`;
  };

  const getPersonName = (id?: number | null): string => {
    if (!id) return 'Unknown';
    return people?.find((p) => p.id === id)?.full_name ?? `Person #${id}`;
  };

  // ── Shared invalidation ──────────────────────────────────────────────────
  const invalidateTransfers = () => {
    queryClient.invalidateQueries({ queryKey: ['transfers'] });
    if (selectedId) {
      queryClient.invalidateQueries({ queryKey: ['transfer', selectedId] });
    }
  };

  // ── Mutations ────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async () => {
      const items: Array<{
        item_type: 'RESOURCE' | 'PERSON';
        resource_type_id?: number;
        quantity?: number;
        person_id?: number;
      }> = [];

      if (transferType === 'RESOURCE') {
        for (const i of resourceItems) {
          if (i.resource_type_id > 0 && i.amount > 0) {
            items.push({
              item_type: 'RESOURCE',
              resource_type_id: i.resource_type_id,
              quantity: i.amount,
            });
          }
        }
      } else {
        for (const pid of personItems) {
          items.push({ item_type: 'PERSON', person_id: pid });
        }
        for (const i of resourceItems) {
          if (i.resource_type_id > 0 && i.amount > 0) {
            items.push({
              item_type: 'RESOURCE',
              resource_type_id: i.resource_type_id,
              quantity: i.amount,
            });
          }
        }
      }

      const body = {
        requesting_camp: currentCampId,
        target_camp: targetCamp,
        type: transferType,
        requested_by: userId,
        items,
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      };
      const res = await apiClient.post('/transfers', body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transfers'] });
      setIsCreateOpen(false);
      setTransferType('RESOURCE');
      setTargetCamp(null);
      setResourceItems([{ resource_type_id: 0, amount: 0 }]);
      setPersonItems([]);
      setNotes('');
      setCreateError(null);
    },
    onError: (error: unknown) => {
      const msg =
        (error as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error
          ?.message ??
        (error as { message?: string })?.message ??
        'Unknown error';
      setCreateError(msg);
    },
  });

  const approveSrcMutation = useMutation({
    mutationFn: async (id: number) => apiClient.patch(`/transfers/${id}/approve-source`, {}),
    onSuccess: invalidateTransfers,
  });

  const approveTgtMutation = useMutation({
    mutationFn: async (id: number) => apiClient.patch(`/transfers/${id}/approve-target`, {}),
    onSuccess: invalidateTransfers,
  });

  const completeMutation = useMutation({
    mutationFn: async (id: number) => apiClient.patch(`/transfers/${id}/complete`, {}),
    onSuccess: () => {
      invalidateTransfers();
      setConfirmCompleteId(null);
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) =>
      apiClient.patch(`/transfers/${id}/reject`, { reason }),
    onSuccess: () => {
      invalidateTransfers();
      setConfirmRejectId(null);
      setRejectReason('');
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async ({ id, date }: { id: number; date: string }) =>
      apiClient.patch(`/transfers/${id}/schedule`, {
        scheduled_delivery_date: date,
      }),
    onSuccess: () => {
      invalidateTransfers();
      setIsScheduling(false);
      setScheduleDate('');
    },
  });

  // ── RBAC ─────────────────────────────────────────────────────────────────
  const canManage = canManageTransfers(user?.role);
  const canCreate = canCreateTransfers(user?.role);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8 h-full">
      {/* Page header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-brand-primary">
            Transfer Operations
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
            Inter-camp resource &amp; personnel logistics
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => setIsCreateOpen(true)}
            aria-label="Create a new inter-camp transfer request"
            className="bg-brand-primary hover:bg-brand-primary/90 text-black font-semibold px-4 py-2 rounded-md flex items-center gap-2 text-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] uppercase tracking-wider"
          >
            <Plus size={18} />
            NEW TRANSFER
          </button>
        )}
      </div>

      {/* Split panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-280px)]">
        {/* ── LEFT: list ───────────────────────────────────────────────── */}
        <div
          className="flex flex-col bg-surface-raised brutalist-border rounded-xl overflow-hidden"
          data-testid="transfer-list"
        >
          <div className="p-3 sm:p-4 bg-black/40 border-b border-zinc-900 flex justify-between items-center shrink-0">
            <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
              Transfer Log
            </h3>
            <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded">
              {transfers?.length ?? 0} RECORDS · PAGE {page}/{totalPages}
            </span>
          </div>

          <div className="flex-1 overflow-auto divide-y divide-zinc-900">
            {isLoading ? (
              <div className="p-3 sm:p-4">
                <SkeletonList count={5} />
              </div>
            ) : !transfers || transfers.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <Truck size={48} className="mx-auto text-zinc-800" />
                <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
                  No transfers on record.
                </p>
                {canCreate && (
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    aria-label="Create the first transfer request"
                    className="text-[10px] font-bold uppercase text-brand-primary hover:underline"
                  >
                    + Initiate first transfer
                  </button>
                )}
              </div>
            ) : (
              paginatedTransfers.map((transfer) => {
                const isSelected = selectedId === transfer.id;
                const reqName =
                  transfer.requesting_camp_ref?.name ?? getCampName(transfer.requesting_camp);
                const tgtName = transfer.target_camp_ref?.name ?? getCampName(transfer.target_camp);

                return (
                  <button
                    key={transfer.id}
                    onClick={() => setSelectedId(transfer.id)}
                    aria-label={`View transfer #${transfer.id} from ${reqName} to ${tgtName}`}
                    className={cn(
                      'w-full p-5 text-left transition-all hover:bg-white/5 border-l-4 group relative',
                      isSelected ? 'bg-white/5 border-brand-primary' : 'border-transparent',
                    )}
                  >
                    <div className="flex justify-between items-start mb-2.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={cn(
                            'text-[9px] font-black uppercase px-2 py-0.5 rounded border',
                            getStatusBadgeClasses(transfer.status),
                          )}
                        >
                          {getStatusShortLabel(transfer.status)}
                        </span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded border bg-zinc-900 text-zinc-500 border-zinc-700/50">
                          {transfer.type}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-600 shrink-0 ml-2">
                        {formatDate(transfer.created_at)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-zinc-300">
                      <span className="truncate max-w-[110px]">{reqName}</span>
                      <ArrowRight size={12} className="shrink-0 text-zinc-600" />
                      <span className="truncate max-w-[110px] text-brand-primary">{tgtName}</span>
                    </div>

                    {transfer.scheduled_delivery_date && (
                      <div className="flex items-center gap-1 mt-1.5 text-[10px] text-zinc-600 font-mono">
                        <Calendar size={10} />
                        ETA: {formatDate(transfer.scheduled_delivery_date)}
                      </div>
                    )}

                    <ChevronRight
                      size={16}
                      className={cn(
                        'absolute right-4 top-1/2 -translate-y-1/2 text-zinc-700 transition-all',
                        isSelected ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2',
                      )}
                    />
                  </button>
                );
              })
            )}
          </div>

          <div className="p-3 border-t border-zinc-900 flex justify-center">
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>

        {/* ── RIGHT: detail ────────────────────────────────────────────── */}
        <div className="bg-surface-raised brutalist-border rounded-xl flex flex-col overflow-hidden relative">
          <AnimatePresence mode="wait">
            {/* Empty state */}
            {!selectedId ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center text-center p-12 space-y-6"
              >
                <div className="w-20 h-20 bg-zinc-900 rounded-full grid place-items-center border border-zinc-800">
                  <Eye size={32} className="text-zinc-700" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                    Transfer Manifest
                  </p>
                  <p className="text-xs font-mono text-zinc-600">
                    Select a transfer from the log to view its status, manifest, and execute field
                    actions.
                  </p>
                </div>
              </motion.div>
            ) : detailLoading ? (
              /* Loading skeleton */
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 p-8 space-y-6"
              >
                <div className="space-y-2">
                  <Skeleton className="h-8 w-2/3" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
                <Skeleton className="h-14 w-full rounded-lg" />
                <Skeleton className="h-16 w-full rounded-lg" />
                <div className="space-y-3 pt-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </motion.div>
            ) : detail ? (
              /* Detail view */
              <motion.div
                key={`detail-${detail.id}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col h-full overflow-hidden"
              >
                {/* Detail header */}
                <div className="p-4 sm:p-6 border-b border-zinc-900 space-y-4 bg-black/30 shrink-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                        Transfer ID
                      </p>
                      <h2 className="text-2xl font-black tracking-tighter uppercase">
                        #TRF-{String(detail.id).padStart(4, '0')}
                      </h2>
                      <p className="text-[10px] font-mono text-zinc-600">
                        Opened {formatDate(detail.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap justify-end">
                      <span
                        className={cn(
                          'text-[10px] font-black uppercase px-3 py-1 rounded border',
                          getStatusBadgeClasses(detail.status),
                        )}
                      >
                        {detail.status.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[10px] font-black uppercase px-3 py-1 rounded border bg-zinc-900 text-zinc-400 border-zinc-700/50">
                        {detail.type}
                      </span>
                    </div>
                  </div>

                  {/* Camp route */}
                  <div className="flex items-center gap-3 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                    <div className="text-center flex-1 min-w-0">
                      <p className="text-[9px] font-black text-zinc-500 uppercase mb-0.5">FROM</p>
                      <p className="text-sm font-bold text-zinc-200 truncate">
                        {detail.requesting_camp_ref?.name ?? getCampName(detail.requesting_camp)}
                      </p>
                    </div>
                    <div className="flex flex-col items-center gap-0.5 shrink-0">
                      <Truck size={16} className="text-brand-primary" />
                      <ArrowRight size={12} className="text-zinc-700" />
                    </div>
                    <div className="text-center flex-1 min-w-0">
                      <p className="text-[9px] font-black text-zinc-500 uppercase mb-0.5">TO</p>
                      <p className="text-sm font-bold text-brand-primary truncate">
                        {detail.target_camp_ref?.name ?? getCampName(detail.target_camp)}
                      </p>
                    </div>
                  </div>

                  {/* Status stepper */}
                  <StatusStepper status={detail.status} />
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-auto p-4 sm:p-6 space-y-6 bg-black/20">
                  {/* Scheduled delivery banner */}
                  {detail.scheduled_delivery_date && (
                    <div className="flex items-center gap-3 p-3 bg-blue-950/15 border border-blue-500/25 rounded-lg">
                      <Calendar size={15} className="text-blue-400 shrink-0" />
                      <div>
                        <p className="text-[10px] font-black text-blue-400 uppercase">
                          Scheduled Delivery
                        </p>
                        <p className="text-xs font-mono text-zinc-300">
                          {formatDate(detail.scheduled_delivery_date)}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Items table */}
                  <div>
                    <p className="text-[10px] font-black text-zinc-500 uppercase tracking-wider mb-3">
                      Transfer Manifest
                    </p>
                    {detail.items && detail.items.length > 0 ? (
                      <div className="brutalist-border rounded-lg overflow-hidden">
                        <table className="w-full text-xs">
                          <thead>
                            <tr className="bg-zinc-900/80">
                              <th
                                scope="col"
                                className="text-left p-3 font-black uppercase text-[10px] tracking-wider text-zinc-500"
                              >
                                Resource
                              </th>
                              <th
                                scope="col"
                                className="text-right p-3 font-black uppercase text-[10px] tracking-wider text-zinc-500"
                              >
                                Quantity
                              </th>
                              <th
                                scope="col"
                                className="text-right p-3 font-black uppercase text-[10px] tracking-wider text-zinc-500"
                              >
                                Unit
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-900">
                            {detail.items.map((item, idx) => (
                              <tr key={idx} className="hover:bg-white/5 transition-colors">
                                <td className="p-3 font-medium text-zinc-200 flex items-center gap-2">
                                  {item.item_type === 'RESOURCE' ? (
                                    <>
                                      <Package size={12} className="text-zinc-600 shrink-0" />
                                      {getResourceName(item.resource_type_id)}
                                    </>
                                  ) : (
                                    <>
                                      <UserPlus size={12} className="text-zinc-600 shrink-0" />
                                      {getPersonName(item.person_id)}
                                    </>
                                  )}
                                </td>
                                <td className="p-3 text-right font-mono font-bold text-zinc-200">
                                  {item.quantity ?? '—'}
                                </td>
                                <td className="p-3 text-right font-mono text-zinc-500 text-[10px] uppercase">
                                  {item.item_type === 'RESOURCE'
                                    ? getResourceUnit(item.resource_type_id)
                                    : 'person'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-xs font-mono text-zinc-600 italic">
                        No items listed in this transfer.
                      </p>
                    )}
                  </div>

                  {/* Notes */}
                  {detail.notes && (
                    <div className="p-3 sm:p-4 bg-zinc-900/40 border border-zinc-800 rounded-lg">
                      <p className="text-[10px] font-black text-zinc-500 uppercase mb-2">Notes</p>
                      <p className="text-xs text-zinc-400 font-mono leading-relaxed">
                        {detail.notes}
                      </p>
                    </div>
                  )}

                  {/* Terminal state banners */}
                  {detail.status === 'COMPLETED' && (
                    <div className="flex items-center gap-3 p-3 sm:p-4 bg-green-950/20 border border-green-500/30 rounded-lg">
                      <CheckCheck size={18} className="text-green-400 shrink-0" />
                      <div>
                        <p className="text-xs font-black text-green-400 uppercase">
                          Transfer Completed
                        </p>
                        <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                          All items have been received and logged at the destination camp.
                        </p>
                      </div>
                    </div>
                  )}

                  {detail.status === 'REJECTED' && (
                    <div className="flex items-center gap-3 p-3 sm:p-4 bg-red-950/20 border border-red-500/30 rounded-lg">
                      <Ban size={18} className="text-red-500 shrink-0" />
                      <div>
                        <p className="text-xs font-black text-red-500 uppercase">
                          Transfer Rejected
                        </p>
                        <p className="text-[10px] font-mono text-zinc-500 mt-0.5">
                          This transfer request was denied and will not proceed.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Read-only notice for restricted roles */}
                  {!canManage && (
                    <div className="flex items-center gap-2 p-3 bg-zinc-900/50 border border-zinc-700/40 rounded-lg">
                      <Eye size={13} className="text-zinc-600 shrink-0" />
                      <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wide">
                        Read-only — insufficient role to execute transfer actions
                      </p>
                    </div>
                  )}
                </div>

                {/* Action footer — only for actionable statuses + authorized roles */}
                {canManage && detail.status !== 'COMPLETED' && detail.status !== 'REJECTED' && (
                  <div className="p-5 border-t border-zinc-900 bg-surface-raised shrink-0 space-y-3">
                    {detail.status === 'PENDING' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => setConfirmRejectId(detail.id)}
                          aria-label="Reject this pending transfer request"
                          className="flex-1 py-3 text-xs font-black uppercase border border-red-500/40 text-red-500 bg-red-950/10 hover:bg-red-950/30 rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle size={15} />
                          REJECT
                        </button>
                        <button
                          onClick={() => approveSrcMutation.mutate(detail.id)}
                          disabled={approveSrcMutation.isPending}
                          aria-label="Approve this transfer at the source camp"
                          className="flex-2 py-3 text-xs font-black uppercase bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40 shadow-[0_0_16px_rgba(59,130,246,0.25)]"
                        >
                          {approveSrcMutation.isPending ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <CheckCircle2 size={15} />
                          )}
                          APPROVE (SOURCE)
                        </button>
                      </div>
                    )}

                    {detail.status === 'APPROVED_SOURCE' && (
                      <div className="space-y-3">
                        {/* Schedule delivery */}
                        <div className="flex items-center gap-2">
                          {isScheduling ? (
                            <>
                              <input
                                type="datetime-local"
                                value={scheduleDate}
                                onChange={(e) => setScheduleDate(e.target.value)}
                                aria-label="Select scheduled delivery date and time"
                                className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                              />
                              <button
                                onClick={() => {
                                  if (scheduleDate) {
                                    scheduleMutation.mutate({
                                      id: detail.id,
                                      date: new Date(scheduleDate).toISOString(),
                                    });
                                  }
                                }}
                                disabled={!scheduleDate || scheduleMutation.isPending}
                                aria-label="Set the scheduled delivery date and time"
                                className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-black uppercase rounded transition-colors disabled:opacity-40 flex items-center gap-1.5"
                              >
                                {scheduleMutation.isPending ? (
                                  <Loader2 size={12} className="animate-spin" />
                                ) : (
                                  'SET'
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  setIsScheduling(false);
                                  setScheduleDate('');
                                }}
                                aria-label="Cancel scheduling and close date picker"
                                className="px-3 py-2 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors text-zinc-500 touch-target"
                              >
                                <X size={13} />
                              </button>
                            </>
                          ) : (
                            <button
                              onClick={() => setIsScheduling(true)}
                              aria-label="Open date picker to schedule delivery date"
                              className="px-4 py-2 text-xs font-bold uppercase border border-zinc-700 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 rounded transition-colors flex items-center gap-2"
                            >
                              <Calendar size={13} />
                              SCHEDULE DELIVERY
                            </button>
                          )}
                        </div>

                        <div className="flex gap-3">
                          <button
                            onClick={() => setConfirmRejectId(detail.id)}
                            aria-label="Reject this source-approved transfer"
                            className="flex-1 py-3 text-xs font-black uppercase border border-red-500/40 text-red-500 bg-red-950/10 hover:bg-red-950/30 rounded-lg transition-all flex items-center justify-center gap-2"
                          >
                            <XCircle size={15} />
                            REJECT
                          </button>
                          <button
                            onClick={() => approveTgtMutation.mutate(detail.id)}
                            disabled={approveTgtMutation.isPending}
                            aria-label="Approve this transfer at the target camp"
                            className="flex-2 py-3 text-xs font-black uppercase bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40 shadow-[0_0_16px_rgba(16,185,129,0.2)]"
                          >
                            {approveTgtMutation.isPending ? (
                              <Loader2 size={15} className="animate-spin" />
                            ) : (
                              <CheckCircle2 size={15} />
                            )}
                            APPROVE (TARGET)
                          </button>
                        </div>
                      </div>
                    )}

                    {detail.status === 'APPROVED_TARGET' && (
                      <div className="flex gap-3">
                        <button
                          onClick={() => setConfirmRejectId(detail.id)}
                          aria-label="Reject this fully approved transfer"
                          className="flex-1 py-3 text-xs font-black uppercase border border-red-500/40 text-red-500 bg-red-950/10 hover:bg-red-950/30 rounded-lg transition-all flex items-center justify-center gap-2"
                        >
                          <XCircle size={15} />
                          REJECT
                        </button>
                        <button
                          onClick={() => setConfirmCompleteId(detail.id)}
                          aria-label="Mark this transfer as completed"
                          className="flex-2 py-3 text-xs font-black uppercase bg-green-700 hover:bg-green-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(34,197,94,0.2)]"
                        >
                          <CheckCheck size={15} />
                          COMPLETE TRANSFER
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Create transfer modal ─────────────────────────────────────────── */}
      <AnimatePresence>
        {isCreateOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
            onClick={() => setIsCreateOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ duration: 0.2 }}
              className="bg-surface-raised brutalist-border p-4 sm:p-6 md:p-8 rounded-xl max-w-lg w-full space-y-6 my-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal header */}
              <div className="border-b border-zinc-900 pb-4">
                <p className="text-[10px] font-mono text-brand-primary uppercase tracking-widest leading-none mb-1">
                  LOGISTICS PROTOCOL v2.1
                </p>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  Initiate Transfer Request
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  Request a resource shipment from your camp to a remote settlement.
                </p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setCreateError(null);
                  createMutation.mutate();
                }}
                className="space-y-5"
              >
                {createError && (
                  <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-lg flex items-start gap-2">
                    <AlertTriangle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-400 font-mono leading-relaxed">{createError}</p>
                  </div>
                )}
                {/* Destination camp */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Destination Camp <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={targetCamp ?? ''}
                    onChange={(e) => setTargetCamp(e.target.value ? Number(e.target.value) : null)}
                    aria-label="Select destination camp for transfer"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-brand-primary"
                  >
                    <option value="">— Select destination camp —</option>
                    {camps
                      ?.filter((c) => c.id !== currentCampId)
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                  </select>
                </div>

                {/* Transfer type toggle */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Transfer Type
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTransferType('RESOURCE');
                        setPersonItems([]);
                      }}
                      aria-label="Switch transfer type to resource items"
                      className={cn(
                        'flex-1 py-2 text-xs font-bold uppercase rounded border transition-all',
                        transferType === 'RESOURCE'
                          ? 'bg-brand-primary/10 border-brand-primary text-brand-primary'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700',
                      )}
                    >
                      <Package size={14} className="inline mr-1.5" />
                      RESOURCE
                    </button>
                    <button
                      type="button"
                      onClick={() => setTransferType('PERSON')}
                      aria-label="Switch transfer type to personnel"
                      className={cn(
                        'flex-1 py-2 text-xs font-bold uppercase rounded border transition-all',
                        transferType === 'PERSON'
                          ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700',
                      )}
                    >
                      <UserPlus size={14} className="inline mr-1.5" />
                      PERSON
                    </button>
                  </div>
                </div>

                {/* Person selector (PERSON type only) */}
                {transferType === 'PERSON' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-[10px] font-bold text-zinc-500 uppercase">
                        People to Transfer <span className="text-red-500">*</span>
                      </label>
                      <span className="text-[10px] font-mono text-zinc-600">
                        {personItems.length} selected
                      </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                      {(people ?? []).length === 0 && (
                        <p className="col-span-2 text-[11px] text-zinc-600 font-mono text-center py-2">
                          No personnel available.
                        </p>
                      )}
                      {(people ?? [])
                        .filter((p) => (p.status || '').toUpperCase() !== 'DEAD')
                        .map((person) => (
                          <button
                            key={person.id}
                            type="button"
                            onClick={() =>
                              setPersonItems((prev) =>
                                prev.includes(person.id)
                                  ? prev.filter((id) => id !== person.id)
                                  : [...prev, person.id],
                              )
                            }
                            aria-label={`Select ${person.full_name} (${person.profession_name || 'UNASSIGNED'}) for transfer`}
                            className={cn(
                              'p-2 text-left border rounded text-xs transition-all touch-target',
                              personItems.includes(person.id)
                                ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400'
                                : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700',
                            )}
                          >
                            <span className="font-bold block truncate">{person.full_name}</span>
                            <span className="text-[10px] font-mono opacity-60">
                              {person.profession_name || 'UNASSIGNED'}
                            </span>
                          </button>
                        ))}
                    </div>
                    <p className="text-[9px] text-zinc-600 font-mono">
                      PERSON transfers require at least one resource item for travel rations.
                    </p>
                  </div>
                )}

                {/* Resource rows (both types) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      {transferType === 'PERSON' ? 'Travel Rations' : 'Resources to Transfer'}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setResourceItems((prev) => [...prev, { resource_type_id: 0, amount: 0 }])
                      }
                      aria-label={`Add another ${transferType === 'PERSON' ? 'ration' : 'resource'} item to the list`}
                      className="text-[10px] font-bold uppercase text-brand-primary hover:text-brand-primary/80 transition-colors flex items-center gap-1 touch-target"
                    >
                      <Plus size={11} />
                      ADD {transferType === 'PERSON' ? 'RATION' : 'RESOURCE'}
                    </button>
                  </div>

                  <div className="space-y-2">
                    {resourceItems.map((item, idx) => {
                      const selectedIds = new Set(
                        resourceItems
                          .filter((_, i) => i !== idx)
                          .map((r) => r.resource_type_id)
                          .filter(Boolean),
                      );
                      return (
                        <div key={idx} className="flex items-center gap-2">
                          <select
                            required
                            value={item.resource_type_id || ''}
                            onChange={(e) => {
                              const updated = [...resourceItems];
                              updated[idx] = {
                                ...updated[idx],
                                resource_type_id: Number(e.target.value),
                              };
                              setResourceItems(updated);
                            }}
                            aria-label={`Select resource type for item ${idx + 1}`}
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-brand-primary min-w-0"
                          >
                            <option value="">— Select resource —</option>
                            {resources?.map((r) => (
                              <option key={r.id} value={r.id} disabled={selectedIds.has(r.id)}>
                                {r.name} ({r.unit})
                              </option>
                            ))}
                          </select>
                          <input
                            required
                            type="number"
                            min={1}
                            value={item.amount || ''}
                            onChange={(e) => {
                              const updated = [...resourceItems];
                              updated[idx] = {
                                ...updated[idx],
                                amount: Number(e.target.value),
                              };
                              setResourceItems(updated);
                            }}
                            placeholder="Qty"
                            className="w-20 shrink-0 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-brand-primary"
                          />
                          {resourceItems.length > 1 && (
                            <button
                              type="button"
                              onClick={() =>
                                setResourceItems((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="p-2 shrink-0 text-zinc-600 hover:text-red-500 transition-colors rounded hover:bg-red-950/20 touch-target"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Additional instructions or context for this transfer..."
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary resize-none font-mono"
                  />
                </div>

                {/* Form actions */}
                <div className="flex gap-4 pt-2 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    aria-label="Cancel and close the transfer creation form"
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={
                      createMutation.isPending ||
                      !targetCamp ||
                      (transferType === 'PERSON' && personItems.length === 0) ||
                      resourceItems.every((i) => !i.resource_type_id || !i.amount)
                    }
                    aria-label="Submit the transfer request for processing"
                    className="flex-2 py-2.5 bg-brand-primary text-black text-xs font-black uppercase rounded hover:bg-brand-primary/90 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                  >
                    {createMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin" />
                    ) : (
                      <Truck size={14} />
                    )}
                    {createMutation.isPending ? 'SUBMITTING...' : 'SUBMIT TRANSFER REQUEST'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Reject reason modal ───────────────────────────────────────────── */}
      <AnimatePresence>
        {confirmRejectId !== null && (
          <div
            className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => {
              setConfirmRejectId(null);
              setRejectReason('');
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 8 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="bg-surface-raised brutalist-border rounded-xl p-4 sm:p-6 max-w-sm w-full space-y-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg shrink-0 bg-red-950/30 text-red-500">
                  <AlertTriangle size={20} />
                </div>
                <div className="space-y-1 pt-0.5">
                  <h3 className="font-black uppercase tracking-tight text-sm text-white">
                    Reject Transfer
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                    Transfer #TRF-
                    {String(confirmRejectId).padStart(4, '0')} will be permanently denied. Provide a
                    rejection reason below.
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="e.g. Insufficient supplies at source camp, critical shortage ongoing..."
                  rows={3}
                  autoFocus
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-red-500 resize-none font-mono"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setConfirmRejectId(null);
                    setRejectReason('');
                  }}
                  disabled={rejectMutation.isPending}
                  aria-label="Cancel and close the rejection dialog"
                  className="flex-1 py-2 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase disabled:opacity-40"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    if (confirmRejectId && rejectReason.trim()) {
                      rejectMutation.mutate({
                        id: confirmRejectId,
                        reason: rejectReason.trim(),
                      });
                    }
                  }}
                  disabled={rejectMutation.isPending || !rejectReason.trim()}
                  aria-label="Confirm the transfer rejection with provided reason"
                  className="flex-1 py-2 text-xs font-black uppercase rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-40 bg-red-600 hover:bg-red-500 text-white"
                >
                  {rejectMutation.isPending ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    'CONFIRM REJECT'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Complete confirm dialog ───────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={confirmCompleteId !== null}
        title="Complete Transfer"
        description={`Mark transfer #TRF-${String(confirmCompleteId ?? 0).padStart(4, '0')} as completed? All listed items will be recorded as received at the destination camp. This action cannot be undone.`}
        confirmLabel="COMPLETE TRANSFER"
        cancelLabel="CANCEL"
        variant="warning"
        isPending={completeMutation.isPending}
        onConfirm={() => {
          if (confirmCompleteId !== null) {
            completeMutation.mutate(confirmCompleteId);
          }
        }}
        onCancel={() => setConfirmCompleteId(null)}
      />
    </div>
  );
}
