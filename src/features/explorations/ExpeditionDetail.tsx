import React, { useMemo, useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, fetchAllPaginated } from '../../lib/api';
import { Expedition, ResourceAllocation, Resource, Person } from '../../types';
import { useAuthStore, useCampStore } from '../../store';
import { canAccessCamp, hasPermission } from '../../lib/permissions';
import { cn, formatDate } from '../../lib/utils';
import {
  MapPin,
  Calendar,
  Users,
  Package,
  Gift,
  ArrowLeft,
  AlertCircle,
  Timer,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Skeleton, SkeletonCard } from '../../components/Skeleton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ActionFeedbackDialog, ActionFeedbackType } from '../../components/ActionFeedbackDialog';
import { getApiErrorMessage } from '../../lib/apiErrors';
import {
  EXPEDITION_MEMBER_STATUS_OPTIONS,
  MemberOutcome,
  ResourceRow,
  buildDefaultMemberOutcomes,
  buildDefaultReturnedAllocatedRows,
  getConsumedAllocatedResources,
  getExpeditionAllocatedResources,
  getExpeditionFoundResources,
  getExpeditionMembers,
  getExpeditionReturnedResources,
  hasDuplicateResourceRows,
  normalizeResourceRows,
} from './expeditionUtils';

const MAX_RESOURCE_AMOUNT = 9999999999.99;

type ExpeditionStatus = Expedition['status'];
type ExpeditionFeedback = {
  type: ActionFeedbackType;
  title: string;
  message: string;
};

type ReturnErrors = {
  returnDate?: string;
  returnedAllocatedResources?: string;
  foundResources?: string;
  memberOutcomes?: string;
};

function isValidIsoDate(value: string) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time);
}

function validateResourceRows(rows: ResourceRow[]) {
  const hasPartialRows = rows.some(
    (row) =>
      !Number.isFinite(row.amount) ||
      (row.resource_type_id > 0 && row.amount <= 0) ||
      (!row.resource_type_id && row.amount !== 0),
  );
  if (hasPartialRows) {
    return 'Each resource row needs a selected resource and a quantity greater than zero.';
  }
  if (rows.some((row) => row.amount > MAX_RESOURCE_AMOUNT)) {
    return `Resource quantities cannot exceed ${MAX_RESOURCE_AMOUNT}.`;
  }
  if (hasDuplicateResourceRows(rows)) {
    return 'Duplicate resource selections are not allowed.';
  }
  return undefined;
}

function validateReturnedAllocatedRows(
  rows: ResourceRow[],
  allocatedResources: ResourceAllocation[],
) {
  const baseError = validateResourceRows(rows);
  if (baseError) return baseError;

  const allocatedByResource = new Map(
    allocatedResources.map((resource) => [
      Number(resource.resource_type_id),
      Number(resource.amount),
    ]),
  );

  for (const row of normalizeResourceRows(rows)) {
    const allocatedAmount = allocatedByResource.get(row.resource_type_id);
    if (allocatedAmount === undefined) {
      return 'Only resources originally allocated to the expedition can be marked as returned.';
    }
    if (row.amount > allocatedAmount) {
      return 'Returned quantity cannot be greater than the originally allocated quantity.';
    }
  }

  return undefined;
}

type ExpeditionResponse = Expedition & {
  expedition_members?: Expedition['members'];
  expedition_allocated_resources?: ResourceAllocation[];
  expedition_returned_resources?: ResourceAllocation[];
  expedition_found_resources?: ResourceAllocation[];
};

export default function ExpeditionDetail() {
  const { id } = useParams();
  const expeditionId = Number(id);
  const navigate = useNavigate();
  const { user, userId } = useAuthStore();
  const { currentCampId } = useCampStore();
  const queryClient = useQueryClient();

  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
  const [returnedAllocatedResources, setReturnedAllocatedResources] = useState<ResourceRow[]>([]);
  const [foundResources, setFoundResources] = useState<ResourceRow[]>([]);
  const [returnMemberStatus, setReturnMemberStatus] = useState<Person['status']>('HEALTHY');
  const [memberOutcomes, setMemberOutcomes] = useState<MemberOutcome[]>([]);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [feedback, setFeedback] = useState<ExpeditionFeedback | null>(null);
  const [returnErrors, setReturnErrors] = useState<ReturnErrors>({});

  const actorId = userId ?? user?.id ?? 0;
  const canRead = hasPermission(user?.permissions, 'expeditions.read');
  const canUpdateStatus = hasPermission(user?.permissions, 'expeditions.update_status');
  const canReadResources = hasPermission(user?.permissions, 'resources.read');
  const canReadPeople = hasPermission(user?.permissions, 'people.read');

  // Fetch expedition detail
  const {
    data: expedition,
    isLoading,
    isError,
  } = useQuery<ExpeditionResponse>({
    queryKey: ['expedition', expeditionId],
    queryFn: async () => {
      const res = await apiClient.get(`/expeditions/${expeditionId}`);
      return res.data?.data ?? res.data;
    },
    enabled: canRead && !isNaN(expeditionId),
  });

  // Fetch resources list for resource name resolution
  const { data: resources } = useQuery<Resource[]>({
    queryKey: ['resources'],
    queryFn: () => fetchAllPaginated<Resource>('/resources'),
    enabled: canRead && canReadResources,
  });

  const { data: people } = useQuery<Person[]>({
    queryKey: ['expedition-people', expedition?.camp_id],
    queryFn: () => fetchAllPaginated<Person>(`/camps/${expedition!.camp_id}/people`),
    enabled: !!expedition?.camp_id && canRead && canReadPeople && canAccessCamp(expedition.camp_id),
  });

  // Map of resource_type_id -> { name, unit }
  const resourceMap = useMemo(() => {
    const map = new Map<number, { name: string; unit: string }>();
    (resources ?? []).forEach((r) => map.set(r.id, { name: r.name, unit: r.unit }));
    return map;
  }, [resources]);

  const personById = useMemo(
    () => new Map((people ?? []).map((person) => [person.id, person])),
    [people],
  );

  const expeditionMembers = getExpeditionMembers(expedition);
  const expeditionAllocatedResources = getExpeditionAllocatedResources(expedition);
  const expeditionReturnedResources = getExpeditionReturnedResources(expedition);
  const expeditionFoundResources = getExpeditionFoundResources(expedition);
  const expeditionConsumedResources = getConsumedAllocatedResources(
    expeditionAllocatedResources,
    expeditionReturnedResources,
  );
  const canAddReturnedAllocatedRow = expeditionAllocatedResources.some(
    (resource) =>
      !returnedAllocatedResources.some(
        (row) => row.resource_type_id === Number(resource.resource_type_id),
      ),
  );

  const formatAmount = (value: string | number | null | undefined) => {
    if (value == null || value === '') return '0';
    return Number(value).toLocaleString();
  };

  const invalidateExpeditionFlow = () => {
    queryClient.invalidateQueries({ queryKey: ['expedition', expeditionId] });
    queryClient.invalidateQueries({ queryKey: ['expeditions'] });
    queryClient.invalidateQueries({
      queryKey: ['camp-expeditions', expedition?.camp_id ?? currentCampId],
    });
    queryClient.invalidateQueries({
      queryKey: ['dashboard-metrics', expedition?.camp_id ?? currentCampId],
    });
    queryClient.invalidateQueries({
      queryKey: ['resource-metrics', expedition?.camp_id ?? currentCampId],
    });
    queryClient.invalidateQueries({
      queryKey: ['inventory', expedition?.camp_id ?? currentCampId],
    });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({
      queryKey: ['inventory-audit', expedition?.camp_id ?? currentCampId],
    });
    queryClient.invalidateQueries({
      queryKey: ['inventory-alerts', expedition?.camp_id ?? currentCampId],
    });
    queryClient.invalidateQueries({ queryKey: ['people'] });
    queryClient.invalidateQueries({ queryKey: ['people', expedition?.camp_id ?? currentCampId] });
    queryClient.invalidateQueries({
      queryKey: ['expedition-people', expedition?.camp_id ?? currentCampId],
    });
  };

  // Status mutation (deploy squad, return, cancel)
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      status,
      actual_return_date,
      returned_allocated_resources,
      found_resources,
      default_member_status,
      member_outcomes,
    }: {
      status: ExpeditionStatus;
      actual_return_date?: string;
      returned_allocated_resources?: ResourceRow[];
      found_resources?: ResourceRow[];
      default_member_status?: Person['status'];
      member_outcomes?: MemberOutcome[];
    }) => {
      if (!actorId) {
        throw new Error('Session user id is unavailable. Please sign in again.');
      }

      const body: Record<string, number | string | ResourceRow[] | MemberOutcome[] | undefined> = {
        status,
        changed_by: actorId,
      };
      if (actual_return_date) body.actual_return_date = actual_return_date;
      if (returned_allocated_resources?.length) {
        body.returned_allocated_resources = returned_allocated_resources;
      }
      if (found_resources?.length) body.found_resources = found_resources;
      if (default_member_status) body.default_member_status = default_member_status;
      if (member_outcomes?.length) body.member_outcomes = member_outcomes;

      const res = await apiClient.patch(`/expeditions/${expeditionId}/status`, body);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      invalidateExpeditionFlow();
      const messages: Record<ExpeditionStatus, ExpeditionFeedback> = {
        PLANNED: {
          type: 'success',
          title: 'MISSION STATUS UPDATED',
          message: 'The expedition status was updated.',
        },
        ONGOING: {
          type: 'success',
          title: 'SQUAD DEPLOYED',
          message: 'The expedition is now ongoing and assigned members were marked away.',
        },
        RETURNED: {
          type: 'success',
          title: 'EXPEDITION RETURNED',
          message:
            'The expedition return was recorded. Returned resources and member statuses were applied by the backend.',
        },
        CANCELLED: {
          type: 'warning',
          title: 'EXPEDITION CANCELLED',
          message:
            'The expedition was cancelled and assigned members were released by the backend.',
        },
      };
      setFeedback(messages[variables.status]);
      setShowReturnModal(false);
      setConfirmCancelOpen(false);
      setReturnErrors({});
      if (variables.status === 'RETURNED') {
        setReturnedAllocatedResources([]);
        setFoundResources([]);
        setMemberOutcomes([]);
        setReturnMemberStatus('HEALTHY');
      }
    },
    onError: (error: unknown) => {
      setFeedback({
        type: 'error',
        title: 'STATUS UPDATE FAILED',
        message: getApiErrorMessage(error, 'The expedition status could not be updated.'),
      });
    },
  });

  const handleReturnSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expedition) return;

    const nextErrors: ReturnErrors = {};
    const returnedError = validateReturnedAllocatedRows(
      returnedAllocatedResources,
      expeditionAllocatedResources,
    );
    if (returnedError) nextErrors.returnedAllocatedResources = returnedError;
    const resourceError = validateResourceRows(foundResources);
    if (resourceError) nextErrors.foundResources = resourceError;

    if (!isValidIsoDate(returnDate)) {
      nextErrors.returnDate = 'Required. Use YYYY-MM-DD.';
    } else {
      const returnTime = new Date(returnDate).getTime();
      const departureTime = new Date(expedition.departure_date).getTime();
      if (Number.isFinite(departureTime) && returnTime < departureTime) {
        nextErrors.returnDate = 'Return date must be on or after departure.';
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setReturnErrors(nextErrors);
      return;
    }

    setReturnErrors({});
    updateStatusMutation.mutate({
      status: 'RETURNED',
      actual_return_date: returnDate,
      returned_allocated_resources: normalizeResourceRows(returnedAllocatedResources),
      found_resources: normalizeResourceRows(foundResources),
      default_member_status: returnMemberStatus,
      member_outcomes: memberOutcomes,
    });
  };

  if (!canRead) {
    return <Navigate to="/" replace />;
  }

  // ── Loading ────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-8 w-40" />
        <div className="p-6 bg-surface-raised/40 brutalist-border rounded-xl space-y-4">
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-24 w-full rounded" />
        </div>
        <div className="grid grid-cols-1 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ── Not found / error ──────────────────────────────────────────────────

  if (isNaN(expeditionId) || isError || !expedition) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle size={48} className="text-zinc-800" />
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Expedition Not Found</h2>
          <p className="text-zinc-500 text-sm max-w-sm">
            The expedition with ID "{id}" does not exist or has been decommissioned.
          </p>
        </div>
        <button
          onClick={() => navigate('/expeditions')}
          className="bg-brand-primary hover:bg-brand-primary/95 text-black font-semibold uppercase tracking-wider px-6 py-2 rounded-md inline-flex items-center gap-2 text-sm transition-all"
        >
          <ArrowLeft size={16} />
          BACK TO EXPEDITIONS
        </button>
      </div>
    );
  }

  if (!canAccessCamp(expedition.camp_id)) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle size={48} className="text-red-900/70" />
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Expedition Access Restricted</h2>
          <p className="text-zinc-500 text-sm max-w-sm">
            Your role cannot access expedition records for this refuge.
          </p>
        </div>
        <button
          onClick={() => navigate('/expeditions')}
          className="bg-brand-primary hover:bg-brand-primary/95 text-black font-semibold uppercase tracking-wider px-6 py-2 rounded-md inline-flex items-center gap-2 text-sm transition-all"
        >
          <ArrowLeft size={16} />
          BACK TO EXPEDITIONS
        </button>
      </div>
    );
  }

  const isOngoing = expedition.status === 'ONGOING';
  const isPlanned = expedition.status === 'PLANNED';
  const isReturned = expedition.status === 'RETURNED';
  const isCancelled = expedition.status === 'CANCELLED';
  const isReadonly = isReturned || isCancelled;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <button
        onClick={() => navigate('/expeditions')}
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-600 rounded-lg px-3 py-2 transition-all hover:-translate-x-0.5 hover:shadow-[0_0_12px_rgba(255,255,255,0.04)] group"
      >
        <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
        BACK TO EXPEDITIONS
      </button>

      {/* Expedition info card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-raised brutalist-border p-4 sm:p-6 md:p-8 rounded-xl space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-white">
              {expedition.destination}
            </h1>
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono flex-wrap">
              <span className="inline-flex items-center gap-1">
                <MapPin size={12} />
                {expedition.destination}
              </span>
              <span className="text-zinc-800 select-none">|</span>
              <span className="inline-flex items-center gap-1">
                <Calendar size={12} />
                {formatDate(expedition.departure_date)}
              </span>
            </div>
          </div>

          {/* Status badge */}
          <span
            className={cn(
              'px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider border shrink-0 self-start',
              isOngoing
                ? 'bg-amber-950/20 text-amber-500 border-amber-500/30'
                : isReturned
                  ? 'bg-emerald-950/20 text-emerald-500 border-emerald-500/30'
                  : isCancelled
                    ? 'bg-red-950/20 text-red-500 border-red-500/30'
                    : 'bg-zinc-950/20 text-zinc-500 border-zinc-700/50',
            )}
          >
            {expedition.status}
          </span>
        </div>

        {/* Date grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-zinc-950/60 rounded border border-zinc-900">
            <p className="text-[9px] font-black uppercase text-zinc-600 tracking-wider mb-1">
              Departure
            </p>
            <p className="font-mono text-sm text-zinc-300">
              {formatDate(expedition.departure_date)}
            </p>
          </div>
          <div className="p-4 bg-zinc-950/60 rounded border border-zinc-900">
            <p className="text-[9px] font-black uppercase text-zinc-600 tracking-wider mb-1">
              Expected Return
            </p>
            <p className="font-mono text-sm text-zinc-300">
              {expedition.expected_return_date ? formatDate(expedition.expected_return_date) : '—'}
            </p>
          </div>
          <div className="p-4 bg-zinc-950/60 rounded border border-zinc-900">
            <p className="text-[9px] font-black uppercase text-zinc-600 tracking-wider mb-1">
              Max Return
            </p>
            <p className="font-mono text-sm text-zinc-300">
              {expedition.max_return_date ? formatDate(expedition.max_return_date) : '—'}
            </p>
          </div>
          <div className="p-4 bg-zinc-950/60 rounded border border-zinc-900">
            <p className="text-[9px] font-black uppercase text-zinc-600 tracking-wider mb-1">
              Actual Return
            </p>
            <p className="font-mono text-sm text-zinc-300">
              {expedition.actual_return_date
                ? formatDate(expedition.actual_return_date)
                : isReturned
                  ? 'Recorded'
                  : 'Not yet returned'}
            </p>
          </div>
        </div>

        {/* Notes */}
        {expedition.notes && (
          <div className="p-4 bg-zinc-950/60 rounded border border-zinc-900 font-mono text-[11px] leading-relaxed text-zinc-400">
            <p className="text-[9px] font-black uppercase text-zinc-600 tracking-wider mb-1.5">
              Mission Briefing
            </p>
            <p className="italic whitespace-pre-wrap">"{expedition.notes}"</p>
          </div>
        )}

        {/* Action buttons */}
        {!isReadonly && canUpdateStatus && (
          <div className="flex flex-wrap items-center gap-3 border-t border-zinc-900/50 pt-4">
            {isPlanned && (
              <button
                onClick={() => updateStatusMutation.mutate({ status: 'ONGOING' })}
                disabled={updateStatusMutation.isPending}
                className="px-4 py-2 bg-brand-primary text-black font-extrabold text-xs uppercase rounded hover:bg-brand-primary/90 transition-colors cursor-pointer disabled:opacity-50"
              >
                {updateStatusMutation.isPending ? 'DEPLOYING...' : 'DEPLOY SQUAD'}
              </button>
            )}
            {isOngoing && (
              <>
                <button
                  onClick={() => {
                    setReturnedAllocatedResources(buildDefaultReturnedAllocatedRows(expedition));
                    setFoundResources([]);
                    setReturnMemberStatus('HEALTHY');
                    setMemberOutcomes(buildDefaultMemberOutcomes(expedition, 'HEALTHY'));
                    setReturnErrors({});
                    setReturnDate(new Date().toISOString().split('T')[0]);
                    setShowReturnModal(true);
                  }}
                  disabled={updateStatusMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 text-white font-extrabold text-xs uppercase rounded hover:bg-emerald-500 transition-colors cursor-pointer disabled:opacity-50"
                >
                  CONFIRM RETURN
                </button>
                <button
                  onClick={() => setConfirmCancelOpen(true)}
                  disabled={updateStatusMutation.isPending}
                  className="px-4 py-2 bg-red-600 text-white font-extrabold text-xs uppercase rounded hover:bg-red-500 transition-colors cursor-pointer disabled:opacity-50"
                >
                  MARK LOST
                </button>
              </>
            )}
          </div>
        )}

        {/* Footer meta */}
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 border-t border-zinc-900/50 pt-4">
          <span>
            EXPEDITION SIGNATURE ID // EX-
            {expedition.id.toString().padStart(3, '0')}
          </span>
          {isOngoing && (
            <span className="inline-flex items-center gap-1">
              <Timer size={10} className="text-amber-500 animate-pulse" />
              IN PROGRESS
            </span>
          )}
        </div>
      </motion.div>

      {/* Members section */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
          <Users size={16} />
          Expedition Members
        </h2>
        <div className="bg-surface-raised brutalist-border rounded-xl overflow-hidden">
          {expeditionMembers && expeditionMembers.length > 0 ? (
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-500">
                  <th
                    scope="col"
                    className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]"
                  >
                    Person ID
                  </th>
                  <th
                    scope="col"
                    className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]"
                  >
                    Role
                  </th>
                </tr>
              </thead>
              <tbody>
                {expeditionMembers.map((m, i: number) => (
                  <tr
                    key={m.person_id ?? i}
                    className="border-b border-zinc-900/50 last:border-0 hover:bg-zinc-900/20 transition-colors"
                  >
                    <td className="py-3 px-4 text-zinc-300">{m.person_id ?? '—'}</td>
                    <td className="py-3 px-4 text-zinc-500">
                      {(m as { role?: string }).role ?? 'Assigned'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center gap-2 py-6 px-4 text-xs text-zinc-500 font-mono">
              <Users size={14} />
              {expedition?.expedition_members === undefined && expedition?.members === undefined
                ? 'Member data not included in response'
                : 'No members assigned'}
            </div>
          )}
        </div>
      </div>

      {/* Allocated resources */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
          <Package size={16} />
          Allocated Resources
        </h2>
        <div className="bg-surface-raised brutalist-border rounded-xl overflow-hidden">
          {expeditionAllocatedResources && expeditionAllocatedResources.length > 0 ? (
            <table className="w-full text-left font-mono text-xs">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-500">
                  <th
                    scope="col"
                    className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]"
                  >
                    Resource
                  </th>
                  <th
                    scope="col"
                    className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-right"
                  >
                    Quantity
                  </th>
                </tr>
              </thead>
              <tbody>
                {expeditionAllocatedResources.map((r, i: number) => (
                  <tr
                    key={r.resource_type_id ?? i}
                    className="border-b border-zinc-900/50 last:border-0 hover:bg-zinc-900/20 transition-colors"
                  >
                    <td className="py-3 px-4 text-zinc-300">
                      {resourceMap.get(r.resource_type_id)?.name ??
                        `Resource #${r.resource_type_id}`}
                    </td>
                    <td className="py-3 px-4 text-zinc-300 text-right font-bold">
                      {formatAmount(r.amount)}{' '}
                      <span className="text-zinc-600 font-normal">
                        {resourceMap.get(r.resource_type_id)?.unit ?? ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="flex items-center gap-2 py-6 px-4 text-xs text-zinc-500 font-mono">
              <Package size={14} />
              {expedition?.expedition_allocated_resources === undefined &&
              expedition?.allocated_resources === undefined
                ? 'Allocated resource data not included in response'
                : 'No allocated resources'}
            </div>
          )}
        </div>
      </div>

      {/* Returned allocated resources */}
      {isReturned && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
            <Package size={16} />
            Returned Allocated Resources
          </h2>
          <div className="bg-surface-raised brutalist-border rounded-xl overflow-hidden">
            {expeditionReturnedResources.length > 0 ? (
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500">
                    <th
                      scope="col"
                      className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]"
                    >
                      Resource
                    </th>
                    <th
                      scope="col"
                      className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-right"
                    >
                      Quantity Returned
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expeditionReturnedResources.map((r, i: number) => (
                    <tr
                      key={r.resource_type_id ?? i}
                      className="border-b border-zinc-900/50 last:border-0 hover:bg-zinc-900/20 transition-colors"
                    >
                      <td className="py-3 px-4 text-zinc-300">
                        {resourceMap.get(r.resource_type_id)?.name ??
                          `Resource #${r.resource_type_id}`}
                      </td>
                      <td className="py-3 px-4 text-zinc-300 text-right font-bold">
                        {formatAmount(r.amount)}{' '}
                        <span className="text-zinc-600 font-normal">
                          {resourceMap.get(r.resource_type_id)?.unit ?? ''}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex items-center gap-2 py-6 px-4 text-xs text-zinc-500 font-mono">
                <Package size={14} />
                No allocated resources were returned.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Consumed allocated resources */}
      {isReturned && expeditionAllocatedResources.length > 0 && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
            <Package size={16} />
            Consumed Or Lost Allocated Resources
          </h2>
          <div className="bg-surface-raised brutalist-border rounded-xl overflow-hidden">
            {expeditionConsumedResources.length > 0 ? (
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500">
                    <th
                      scope="col"
                      className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]"
                    >
                      Resource
                    </th>
                    <th
                      scope="col"
                      className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-right"
                    >
                      Quantity Consumed
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expeditionConsumedResources.map((r, i: number) => (
                    <tr
                      key={r.resource_type_id ?? i}
                      className="border-b border-zinc-900/50 last:border-0 hover:bg-zinc-900/20 transition-colors"
                    >
                      <td className="py-3 px-4 text-zinc-300">
                        {resourceMap.get(r.resource_type_id)?.name ??
                          `Resource #${r.resource_type_id}`}
                      </td>
                      <td className="py-3 px-4 text-zinc-300 text-right font-bold">
                        {formatAmount(r.amount)}{' '}
                        <span className="text-zinc-600 font-normal">
                          {resourceMap.get(r.resource_type_id)?.unit ?? ''}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex items-center gap-2 py-6 px-4 text-xs text-zinc-500 font-mono">
                <Package size={14} />
                All allocated resources were recorded as returned.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Found resources */}
      {isReturned && (
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-2">
            <Gift size={16} />
            Found Resources
          </h2>
          <div className="bg-surface-raised brutalist-border rounded-xl overflow-hidden">
            {expeditionFoundResources && expeditionFoundResources.length > 0 ? (
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="border-b border-zinc-900 text-zinc-500">
                    <th
                      scope="col"
                      className="py-3 px-4 font-bold uppercase tracking-wider text-[10px]"
                    >
                      Resource
                    </th>
                    <th
                      scope="col"
                      className="py-3 px-4 font-bold uppercase tracking-wider text-[10px] text-right"
                    >
                      Quantity Found
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {expeditionFoundResources.map((r, i: number) => (
                    <tr
                      key={r.resource_type_id ?? i}
                      className="border-b border-zinc-900/50 last:border-0 hover:bg-zinc-900/20 transition-colors"
                    >
                      <td className="py-3 px-4 text-zinc-300">
                        {resourceMap.get(r.resource_type_id)?.name ??
                          `Resource #${r.resource_type_id}`}
                      </td>
                      <td className="py-3 px-4 text-zinc-300 text-right font-bold">
                        {formatAmount(r.amount)}{' '}
                        <span className="text-zinc-600 font-normal">
                          {resourceMap.get(r.resource_type_id)?.unit ?? ''}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="flex items-center gap-2 py-6 px-4 text-xs text-zinc-500 font-mono">
                <Gift size={14} />
                {expedition?.expedition_found_resources === undefined &&
                expedition?.found_resources === undefined
                  ? 'Found resource data not included in response'
                  : 'No found resources recorded'}
              </div>
            )}
          </div>
        </div>
      )}
      {/* ── Return Modal ─────────────────────────────────────────────────── */}
      {showReturnModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-surface-raised brutalist-border p-4 sm:p-6 md:p-8 rounded-xl max-w-xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto space-y-6"
          >
            <div className="flex justify-between items-start border-b border-zinc-900 pb-4 mb-2">
              <div>
                <p className="text-[10px] font-mono text-brand-primary uppercase tracking-widest leading-none mb-1">
                  TACTICAL INTERFACE EX-10
                </p>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  CONFIRM EXPEDITION RETURN
                </h3>
                <p className="text-[10px] font-mono text-zinc-600 mt-1">{expedition.destination}</p>
              </div>
              <button
                onClick={() => {
                  setShowReturnModal(false);
                  setReturnErrors({});
                }}
                aria-label="Close return modal"
                title="Close return modal"
                className="p-1 sm:p-2 text-zinc-500 hover:text-white rounded touch-target"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReturnSubmit} className="space-y-4" noValidate>
              <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
                  Returned allocated resources are added back to inventory. Any allocated amount
                  omitted here is treated as consumed or lost during the mission. Found resources
                  are recorded separately as new inventory inflow.
                </p>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">Return Date</label>
                <input
                  required
                  type="date"
                  aria-invalid={!!returnErrors.returnDate}
                  aria-label="Return date"
                  value={returnDate}
                  onChange={(e) => {
                    setReturnDate(e.target.value);
                    setReturnErrors((prev) => ({ ...prev, returnDate: undefined }));
                  }}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                />
                {returnErrors.returnDate && (
                  <p className="text-[10px] font-mono text-red-400">{returnErrors.returnDate}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">
                  ALLOCATED RESOURCES RETURNED
                </label>
                <div className="max-h-44 overflow-y-auto pr-1 space-y-2">
                  {returnedAllocatedResources.length > 0 ? (
                    returnedAllocatedResources.map((row, idx) => {
                      const selectedIds = new Set(
                        returnedAllocatedResources
                          .filter((_, i) => i !== idx)
                          .map((r) => r.resource_type_id)
                          .filter(Boolean),
                      );
                      const selectedAllocation = expeditionAllocatedResources.find(
                        (resource) => Number(resource.resource_type_id) === row.resource_type_id,
                      );

                      return (
                        <div key={idx} className="flex gap-2 items-center">
                          <select
                            aria-label="Returned allocated resource type"
                            aria-invalid={!!returnErrors.returnedAllocatedResources}
                            value={row.resource_type_id || ''}
                            onChange={(e) => {
                              const updated = [...returnedAllocatedResources];
                              const nextResourceId = Number(e.target.value);
                              const allocation = expeditionAllocatedResources.find(
                                (resource) => Number(resource.resource_type_id) === nextResourceId,
                              );
                              updated[idx] = {
                                resource_type_id: nextResourceId,
                                amount: Number(allocation?.amount ?? 0),
                              };
                              setReturnedAllocatedResources(updated);
                              setReturnErrors((prev) => ({
                                ...prev,
                                returnedAllocatedResources: undefined,
                              }));
                            }}
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                          >
                            <option value="">Select allocated resource...</option>
                            {expeditionAllocatedResources.map((allocation) => {
                              const resourceId = Number(allocation.resource_type_id);
                              const resource = resourceMap.get(resourceId);

                              return (
                                <option
                                  key={resourceId}
                                  value={resourceId}
                                  disabled={selectedIds.has(resourceId)}
                                >
                                  {resource?.name ?? `Resource #${resourceId}`} (
                                  {resource?.unit ?? 'units'})
                                </option>
                              );
                            })}
                          </select>
                          <input
                            type="number"
                            min={1}
                            max={Number(selectedAllocation?.amount ?? MAX_RESOURCE_AMOUNT)}
                            step="0.01"
                            aria-invalid={!!returnErrors.returnedAllocatedResources}
                            aria-label="Returned allocated resource quantity"
                            value={row.amount || ''}
                            onChange={(e) => {
                              const updated = [...returnedAllocatedResources];
                              updated[idx] = {
                                ...updated[idx],
                                amount: Number(e.target.value),
                              };
                              setReturnedAllocatedResources(updated);
                              setReturnErrors((prev) => ({
                                ...prev,
                                returnedAllocatedResources: undefined,
                              }));
                            }}
                            placeholder="Qty"
                            className="w-20 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setReturnedAllocatedResources(
                                returnedAllocatedResources.filter((_, i) => i !== idx),
                              );
                              setReturnErrors((prev) => ({
                                ...prev,
                                returnedAllocatedResources: undefined,
                              }));
                            }}
                            aria-label="Remove returned allocated resource"
                            title="Remove returned allocated resource"
                            className="p-1.5 sm:p-2 text-zinc-500 hover:text-red-400 transition-colors touch-target"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[10px] font-mono text-zinc-600">
                      No allocated resources marked as returned.
                    </p>
                  )}
                </div>
                {returnErrors.returnedAllocatedResources && (
                  <p className="text-[10px] font-mono text-red-400">
                    {returnErrors.returnedAllocatedResources}
                  </p>
                )}
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={!canAddReturnedAllocatedRow}
                    onClick={() => {
                      const nextAllocation = expeditionAllocatedResources.find(
                        (allocation) =>
                          !returnedAllocatedResources.some(
                            (row) => row.resource_type_id === Number(allocation.resource_type_id),
                          ),
                      );
                      if (!nextAllocation) return;
                      setReturnedAllocatedResources([
                        ...returnedAllocatedResources,
                        {
                          resource_type_id: Number(nextAllocation.resource_type_id),
                          amount: Number(nextAllocation.amount),
                        },
                      ]);
                      setReturnErrors((prev) => ({
                        ...prev,
                        returnedAllocatedResources: undefined,
                      }));
                    }}
                    className="text-[10px] font-bold text-brand-primary uppercase hover:text-brand-primary/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    + ADD RETURNED ALLOCATED
                  </button>
                  {expeditionAllocatedResources.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setReturnedAllocatedResources(
                          buildDefaultReturnedAllocatedRows(expedition),
                        );
                        setReturnErrors((prev) => ({
                          ...prev,
                          returnedAllocatedResources: undefined,
                        }));
                      }}
                      className="text-[10px] font-bold text-zinc-500 uppercase hover:text-zinc-300 transition-colors"
                    >
                      RESET FULL RETURN
                    </button>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">
                  NEW RESOURCES FOUND
                </label>
                <div className="max-h-44 overflow-y-auto pr-1 space-y-2">
                  {foundResources.map((row, idx) => {
                    const selectedIds = new Set(
                      foundResources
                        .filter((_, i) => i !== idx)
                        .map((r) => r.resource_type_id)
                        .filter(Boolean),
                    );
                    return (
                      <div key={idx} className="flex gap-2 items-center">
                        <select
                          aria-label="Found resource type"
                          aria-invalid={!!returnErrors.foundResources}
                          value={row.resource_type_id || ''}
                          onChange={(e) => {
                            const updated = [...foundResources];
                            updated[idx] = {
                              ...updated[idx],
                              resource_type_id: Number(e.target.value),
                            };
                            setFoundResources(updated);
                            setReturnErrors((prev) => ({
                              ...prev,
                              foundResources: undefined,
                            }));
                          }}
                          className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                        >
                          <option value="">Select resource…</option>
                          {(resources ?? []).map((r) => (
                            <option key={r.id} value={r.id} disabled={selectedIds.has(r.id)}>
                              {r.name} ({r.unit})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          min={1}
                          max={MAX_RESOURCE_AMOUNT}
                          step="0.01"
                          aria-invalid={!!returnErrors.foundResources}
                          aria-label="Found resource quantity"
                          value={row.amount || ''}
                          onChange={(e) => {
                            const updated = [...foundResources];
                            updated[idx] = {
                              ...updated[idx],
                              amount: Number(e.target.value),
                            };
                            setFoundResources(updated);
                            setReturnErrors((prev) => ({
                              ...prev,
                              foundResources: undefined,
                            }));
                          }}
                          placeholder="Qty"
                          className="w-20 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setFoundResources(foundResources.filter((_, i) => i !== idx));
                            setReturnErrors((prev) => ({
                              ...prev,
                              foundResources: undefined,
                            }));
                          }}
                          aria-label="Remove found resource"
                          title="Remove found resource"
                          className="p-1.5 sm:p-2 text-zinc-500 hover:text-red-400 transition-colors touch-target"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    );
                  })}
                </div>
                {returnErrors.foundResources && (
                  <p className="text-[10px] font-mono text-red-400">
                    {returnErrors.foundResources}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setFoundResources([...foundResources, { resource_type_id: 0, amount: 0 }]);
                    setReturnErrors((prev) => ({ ...prev, foundResources: undefined }));
                  }}
                  className="text-[10px] font-bold text-brand-primary uppercase hover:text-brand-primary/80 transition-colors"
                >
                  + ADD FOUND RESOURCE
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-zinc-500 uppercase">
                  MEMBER OUTCOMES
                </label>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-600 uppercase">
                    Default status
                  </label>
                  <select
                    aria-label="Default member status on return"
                    value={returnMemberStatus}
                    onChange={(e) => {
                      const nextStatus = e.target.value as Person['status'];
                      setReturnMemberStatus(nextStatus);
                      setMemberOutcomes(buildDefaultMemberOutcomes(expedition, nextStatus));
                      setReturnErrors((prev) => ({ ...prev, memberOutcomes: undefined }));
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono uppercase"
                  >
                    {EXPEDITION_MEMBER_STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="max-h-44 overflow-y-auto pr-1 space-y-2">
                  {expeditionMembers.length > 0 ? (
                    expeditionMembers.map((member) => {
                      const personId = Number(member.person_id);
                      const person = personById.get(personId);
                      const currentOutcome =
                        memberOutcomes.find((outcome) => outcome.person_id === personId)?.status ??
                        returnMemberStatus;

                      return (
                        <div
                          key={personId}
                          className="grid grid-cols-1 sm:grid-cols-[1fr_160px] gap-2 items-center"
                        >
                          <span className="text-[10px] font-mono text-zinc-500 truncate">
                            {person?.full_name ?? `Person #${personId}`}
                          </span>
                          <select
                            aria-label={`Final status for person ${personId}`}
                            value={currentOutcome}
                            onChange={(e) => {
                              const nextStatus = e.target.value as Person['status'];
                              setMemberOutcomes((prev) => {
                                const existing = prev.filter(
                                  (outcome) => outcome.person_id !== personId,
                                );
                                return [...existing, { person_id: personId, status: nextStatus }];
                              });
                              setReturnErrors((prev) => ({ ...prev, memberOutcomes: undefined }));
                            }}
                            className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono uppercase"
                          >
                            {EXPEDITION_MEMBER_STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-[10px] font-mono text-zinc-600">
                      No assigned members were included in this expedition response.
                    </p>
                  )}
                </div>
                {returnErrors.memberOutcomes && (
                  <p className="text-[10px] font-mono text-red-400">
                    {returnErrors.memberOutcomes}
                  </p>
                )}
              </div>

              <div className="flex gap-4 pt-4 border-t border-zinc-900">
                <button
                  type="button"
                  onClick={() => {
                    setShowReturnModal(false);
                    setReturnErrors({});
                  }}
                  className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                >
                  CANCEL
                </button>
                <button
                  type="submit"
                  disabled={updateStatusMutation.isPending}
                  className="flex-2 py-2.5 bg-emerald-600 text-white text-xs font-bold uppercase rounded hover:bg-emerald-500 transition-colors disabled:opacity-30"
                >
                  {updateStatusMutation.isPending ? 'PROCESSING...' : 'CONFIRM RETURN'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmCancelOpen}
        title="Mark deployment as lost?"
        description="This will mark the expedition as CANCELLED. The backend releases assigned members and terminal statuses cannot be reversed."
        confirmLabel="MARK LOST"
        variant="warning"
        isPending={updateStatusMutation.isPending}
        onConfirm={() =>
          updateStatusMutation.mutate({ status: 'CANCELLED', default_member_status: 'HEALTHY' })
        }
        onCancel={() => setConfirmCancelOpen(false)}
      />

      {feedback && (
        <ActionFeedbackDialog
          isOpen={!!feedback}
          type={feedback.type}
          title={feedback.title}
          message={feedback.message}
          onClose={() => setFeedback(null)}
        />
      )}
    </div>
  );
}
