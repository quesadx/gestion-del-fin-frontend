import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, fetchAllPaginated, unwrapList } from '../../lib/api';
import { useCampStore, useAuthStore } from '../../store';
import { Expedition, Person } from '../../types';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ActionFeedbackDialog, ActionFeedbackType } from '../../components/ActionFeedbackDialog';
import {
  Map,
  MapPin,
  Calendar,
  Users,
  Plus,
  Timer,
  AlertCircle,
  X,
  Edit2,
  Trash2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../../lib/utils';
import { canAccessCamp, hasPermission } from '../../lib/permissions';
import { Skeleton } from '../../components/Skeleton';
import { Pagination } from '../../components/Pagination';
import { getApiErrorMessage } from '../../lib/apiErrors';
import {
  EXPEDITION_MEMBER_STATUS_OPTIONS,
  MemberOutcome,
  ResourceRow,
  buildDefaultMemberOutcomes,
  buildDefaultReturnedAllocatedRows,
  getExpeditionAllocatedResources,
  getExpeditionMemberCount,
  getExpeditionMembers,
  hasDuplicateResourceRows,
  normalizeResourceRows,
} from './expeditionUtils';

const PAGE_SIZE = 10;
const MAX_DESTINATION_LENGTH = 255;
const MAX_RESOURCE_AMOUNT = 9999999999.99;

type ExpeditionStatus = Expedition['status'];

type PaginationMeta = {
  page: number;
  pageSize: number;
  total: number;
  hasNextPage: boolean;
  totalPages: number;
};

type ExpeditionListResponse = {
  data: Expedition[];
  pagination: PaginationMeta;
};

type ExpeditionFeedback = {
  type: ActionFeedbackType;
  title: string;
  message: string;
};

type ExpeditionFieldErrors = {
  destination?: string;
  departureDate?: string;
  expectedReturnDate?: string;
  maxReturnDate?: string;
  members?: string;
  provisions?: string;
  returnDate?: string;
  returnedAllocatedResources?: string;
  foundResources?: string;
  memberOutcomes?: string;
  editDestination?: string;
  editDepartureDate?: string;
  editExpectedReturn?: string;
  editMaxReturn?: string;
};

function normalizeExpeditionListResponse(payload: unknown, page: number): ExpeditionListResponse {
  const data = unwrapList<Expedition>(payload);
  const pagination = (payload as { pagination?: Partial<PaginationMeta> })?.pagination;

  return {
    data,
    pagination: {
      page: pagination?.page ?? page,
      pageSize: pagination?.pageSize ?? PAGE_SIZE,
      total: pagination?.total ?? data.length,
      hasNextPage: pagination?.hasNextPage ?? false,
      totalPages: pagination?.totalPages ?? Math.max(1, Math.ceil(data.length / PAGE_SIZE)),
    },
  };
}

function getExpeditionErrorMessage(error: unknown, fallback: string) {
  return getApiErrorMessage(error, fallback);
}

function isValidIsoDate(value: string) {
  if (!value) return false;
  const time = new Date(value).getTime();
  return Number.isFinite(time);
}

export default function ExpeditionList() {
  const { currentCampId } = useCampStore();
  const { userId, user } = useAuthStore();
  const queryClient = useQueryClient();

  const canCreate = hasPermission(user?.permissions, 'expeditions.create');
  const canRead = hasPermission(user?.permissions, 'expeditions.read');
  const canUpdate = hasPermission(user?.permissions, 'expeditions.update');
  const canUpdateStatus = hasPermission(user?.permissions, 'expeditions.update_status');
  const canDelete = hasPermission(user?.permissions, 'expeditions.delete');
  const canReadResources = hasPermission(user?.permissions, 'resources.read');
  const canReadPeople = hasPermission(user?.permissions, 'people.read');
  const canViewActiveCamp = currentCampId != null && canAccessCamp(currentCampId);

  // --- Confirm dialogs ---
  const [confirmCancelId, setConfirmCancelId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [paginationState, setPaginationState] = useState<{
    campId: number | null;
    page: number;
  }>({ campId: null, page: 1 });
  const [feedback, setFeedback] = useState<ExpeditionFeedback | null>(null);
  const [fieldErrors, setFieldErrors] = useState<ExpeditionFieldErrors>({});

  // --- Create form state ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [destination, setDestination] = useState('');
  const [notes, setNotes] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState('');
  const [maxReturnDate, setMaxReturnDate] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<number[]>([]);
  const [allocatedResources, setAllocatedResources] = useState<
    { resource_type_id: number; amount: number }[]
  >([]);
  const [createError, setCreateError] = useState<string | null>(null);

  // --- Return modal state ---
  const [returningExpedition, setReturningExpedition] = useState<Expedition | null>(null);
  const [returnedAllocatedResources, setReturnedAllocatedResources] = useState<ResourceRow[]>([]);
  const [foundResources, setFoundResources] = useState<ResourceRow[]>([]);
  const [returnMemberStatus, setReturnMemberStatus] = useState<Person['status']>('HEALTHY');
  const [memberOutcomes, setMemberOutcomes] = useState<MemberOutcome[]>([]);

  // --- Edit form state (PUT — no status) ---
  const [editingExpedition, setEditingExpedition] = useState<Expedition | null>(null);
  const [editDestination, setEditDestination] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDepartureDate, setEditDepartureDate] = useState('');
  const [editExpectedReturn, setEditExpectedReturn] = useState('');
  const [editMaxReturn, setEditMaxReturn] = useState('');

  const actorId = userId ?? user?.id ?? 0;
  const page = paginationState.campId === currentCampId ? paginationState.page : 1;

  const handlePageChange = (nextPage: number) => {
    setPaginationState({ campId: currentCampId ?? null, page: nextPage });
  };

  const {
    data: expeditionsResponse,
    isLoading,
    error: expeditionsError,
  } = useQuery<ExpeditionListResponse>({
    queryKey: ['expeditions', currentCampId, page, PAGE_SIZE],
    queryFn: async () => {
      const res = await apiClient.get('/expeditions', {
        params: { camp_id: currentCampId, page, pageSize: PAGE_SIZE },
      });
      return normalizeExpeditionListResponse(res.data, page);
    },
    enabled: !!currentCampId && canRead && canViewActiveCamp,
    retry: false,
  });

  const expeditions = expeditionsResponse?.data ?? [];
  const totalPages = expeditionsResponse?.pagination.totalPages ?? 1;

  const { data: resources } = useQuery<{ id: number; name: string; unit: string }[]>({
    queryKey: ['resources'],
    queryFn: () => fetchAllPaginated<{ id: number; name: string; unit: string }>('/resources'),
    enabled: canReadResources,
  });

  const { data: people } = useQuery<Person[]>({
    queryKey: ['expedition-people', currentCampId],
    queryFn: () => fetchAllPaginated<Person>(`/camps/${currentCampId}/people`),
    enabled: !!currentCampId && canReadPeople && canViewActiveCamp,
  });

  const healthyPeople = useMemo(
    () => (people ?? []).filter((p) => (p.status || '').toUpperCase() === 'HEALTHY'),
    [people],
  );
  const personById = useMemo(
    () => new globalThis.Map((people ?? []).map((person) => [person.id, person])),
    [people],
  );
  const resourceById = useMemo(
    () => new globalThis.Map((resources ?? []).map((resource) => [resource.id, resource])),
    [resources],
  );

  const invalidateExpeditionFlow = (expeditionId?: number) => {
    queryClient.invalidateQueries({ queryKey: ['expeditions'] });
    queryClient.invalidateQueries({ queryKey: ['camp-expeditions', currentCampId] });
    queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', currentCampId] });
    queryClient.invalidateQueries({ queryKey: ['resource-metrics', currentCampId] });
    queryClient.invalidateQueries({ queryKey: ['inventory', currentCampId] });
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['inventory-audit', currentCampId] });
    queryClient.invalidateQueries({ queryKey: ['inventory-alerts', currentCampId] });
    queryClient.invalidateQueries({ queryKey: ['people'] });
    queryClient.invalidateQueries({ queryKey: ['people', currentCampId] });
    queryClient.invalidateQueries({ queryKey: ['expedition-people', currentCampId] });
    if (expeditionId) {
      queryClient.invalidateQueries({ queryKey: ['expedition', expeditionId] });
    }
  };

  // POST /expeditions — all required fields
  const createExpMutation = useMutation({
    mutationFn: async (payload: {
      camp_id: number;
      created_by: number;
      destination: string;
      departure_date: string;
      expected_return_date: string;
      max_return_date: string;
      notes: string;
      status: ExpeditionStatus;
      members?: { person_id: number }[];
      allocated_resources?: ResourceRow[];
    }) => {
      if (!actorId) {
        throw new Error('Session user id is unavailable. Please sign in again.');
      }
      const res = await apiClient.post('/expeditions', payload);
      return res.data;
    },
    onSuccess: (createdExpedition: Expedition | { data?: Expedition }) => {
      const expeditionPayload = createdExpedition as Expedition & { data?: Expedition };
      const expeditionId = expeditionPayload.data?.id ?? expeditionPayload.id;
      invalidateExpeditionFlow(expeditionId);
      setIsModalOpen(false);
      setDestination('');
      setNotes('');
      setDepartureDate('');
      setExpectedReturnDate('');
      setMaxReturnDate('');
      setSelectedMembers([]);
      setAllocatedResources([]);
      setCreateError(null);
      setFieldErrors({});
      setFeedback({
        type: 'success',
        title: 'MISSION CONFIGURED',
        message:
          'The expedition was created. Assigned provisions were deducted from camp inventory when provided.',
      });
    },
    onError: (error: unknown) => {
      const msg = getExpeditionErrorMessage(error, 'The expedition could not be created.');
      setCreateError(msg);
      setFeedback({
        type: 'error',
        title: 'MISSION CREATION FAILED',
        message: msg,
      });
    },
  });

  // PUT /expeditions/:id — fields only, NO status
  const updateDetailsMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Expedition> }) => {
      const res = await apiClient.put(`/expeditions/${id}`, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      invalidateExpeditionFlow(variables.id);
      setEditingExpedition(null);
      setFieldErrors({});
      setFeedback({
        type: 'success',
        title: 'MISSION UPDATED',
        message: 'The expedition details were updated successfully.',
      });
    },
    onError: (error: unknown) => {
      setFeedback({
        type: 'error',
        title: 'MISSION UPDATE FAILED',
        message: getExpeditionErrorMessage(error, 'The expedition details could not be updated.'),
      });
    },
  });

  // PATCH /expeditions/:id/status — status changes only
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      id,
      status,
      actual_return_date,
      returned_allocated_resources,
      found_resources,
      default_member_status,
      member_outcomes,
    }: {
      id: number;
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

      const res = await apiClient.patch(`/expeditions/${id}/status`, body);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      invalidateExpeditionFlow(variables.id);
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
      if (variables.status === 'RETURNED') {
        setReturningExpedition(null);
        setReturnedAllocatedResources([]);
        setFoundResources([]);
        setMemberOutcomes([]);
        setReturnMemberStatus('HEALTHY');
        setFieldErrors({});
      }
    },
    onError: (error: unknown) => {
      setFeedback({
        type: 'error',
        title: 'STATUS UPDATE FAILED',
        message: getExpeditionErrorMessage(error, 'The expedition status could not be updated.'),
      });
    },
  });

  // DELETE /expeditions/:id — changed_by required in body
  const deleteExpMutation = useMutation({
    mutationFn: async (id: number) => {
      if (!actorId) {
        throw new Error('Session user id is unavailable. Please sign in again.');
      }
      const res = await apiClient.delete(`/expeditions/${id}`, {
        data: { changed_by: actorId, default_member_status: 'HEALTHY' },
      });
      return res.data;
    },
    onSuccess: (_data, expeditionId) => {
      invalidateExpeditionFlow(expeditionId);
      setFeedback({
        type: 'warning',
        title: 'EXPEDITION CANCELLED',
        message:
          'The expedition was marked as cancelled. Returned expeditions remain protected by the backend.',
      });
    },
    onError: (error: unknown) => {
      setFeedback({
        type: 'error',
        title: 'CANCEL FAILED',
        message: getExpeditionErrorMessage(error, 'The expedition could not be cancelled.'),
      });
    },
  });

  const today = new Date().toISOString().split('T')[0];
  const [returnDate, setReturnDate] = useState(today);

  const validateDateOrder = (
    departure: string,
    expected: string,
    max: string,
    prefix: 'create' | 'edit' = 'create',
  ) => {
    const errors: ExpeditionFieldErrors = {};
    const departureKey = prefix === 'create' ? 'departureDate' : 'editDepartureDate';
    const expectedKey = prefix === 'create' ? 'expectedReturnDate' : 'editExpectedReturn';
    const maxKey = prefix === 'create' ? 'maxReturnDate' : 'editMaxReturn';

    if (!isValidIsoDate(departure)) errors[departureKey] = 'Required. Use YYYY-MM-DD.';
    if (!isValidIsoDate(expected)) errors[expectedKey] = 'Required. Use YYYY-MM-DD.';
    if (!isValidIsoDate(max)) errors[maxKey] = 'Required. Use YYYY-MM-DD.';

    if (Object.keys(errors).length === 0) {
      const departureTime = new Date(departure).getTime();
      const expectedTime = new Date(expected).getTime();
      const maxTime = new Date(max).getTime();

      if (departureTime > expectedTime) {
        errors[expectedKey] = 'Expected return must be on or after departure.';
      }
      if (expectedTime > maxTime) {
        errors[maxKey] = 'Max return must be on or after expected return.';
      }
    }

    return errors;
  };

  const validateResourceRows = (
    rows: ResourceRow[],
    key: 'provisions' | 'returnedAllocatedResources' | 'foundResources',
  ) => {
    const hasPartialRows = rows.some(
      (row) =>
        !Number.isFinite(row.amount) ||
        (row.resource_type_id > 0 && row.amount <= 0) ||
        (!row.resource_type_id && row.amount !== 0),
    );
    if (hasPartialRows) {
      return {
        [key]: 'Each resource row needs a selected resource and a quantity greater than zero.',
      };
    }
    if (rows.some((row) => row.amount > MAX_RESOURCE_AMOUNT)) {
      return { [key]: `Resource quantities cannot exceed ${MAX_RESOURCE_AMOUNT}.` };
    }
    if (hasDuplicateResourceRows(rows)) {
      return { [key]: 'Duplicate resource selections are not allowed.' };
    }
    return {};
  };

  const validateReturnedAllocatedRows = (
    rows: ResourceRow[],
    expedition: Expedition,
  ): ExpeditionFieldErrors => {
    const baseErrors = validateResourceRows(rows, 'returnedAllocatedResources');
    if (baseErrors.returnedAllocatedResources) return baseErrors;

    const allocatedByResource = new globalThis.Map(
      getExpeditionAllocatedResources(expedition).map((resource) => [
        Number(resource.resource_type_id),
        Number(resource.amount),
      ]),
    );

    for (const row of normalizeResourceRows(rows)) {
      const allocatedAmount = allocatedByResource.get(row.resource_type_id);
      if (allocatedAmount === undefined) {
        return {
          returnedAllocatedResources:
            'Only resources originally allocated to the expedition can be marked as returned.',
        };
      }
      if (row.amount > allocatedAmount) {
        return {
          returnedAllocatedResources:
            'Returned quantity cannot be greater than the originally allocated quantity.',
        };
      }
    }

    return {};
  };

  const handleCreateExpedition = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    const trimmedDestination = destination.trim();
    const nextErrors: ExpeditionFieldErrors = {
      ...validateDateOrder(departureDate, expectedReturnDate, maxReturnDate),
      ...validateResourceRows(allocatedResources, 'provisions'),
    };

    if (!trimmedDestination) {
      nextErrors.destination = 'Required. Destination cannot be empty.';
    } else if (trimmedDestination.length > MAX_DESTINATION_LENGTH) {
      nextErrors.destination = `Destination cannot exceed ${MAX_DESTINATION_LENGTH} characters.`;
    }
    if (!currentCampId || !canViewActiveCamp) {
      setCreateError('Select an accessible refuge before configuring an expedition.');
      return;
    }
    if (!actorId) {
      setCreateError('Session user id is unavailable. Please sign in again.');
      return;
    }
    const healthyPersonIds = new Set(healthyPeople.map((person) => person.id));
    const selectedHealthyMembers = selectedMembers.filter((id) => healthyPersonIds.has(id));
    if (selectedHealthyMembers.length !== selectedMembers.length) {
      nextErrors.members =
        'Only survivors currently marked HEALTHY can be assigned to an expedition.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setCreateError('Review the highlighted format requirements before submitting.');
      return;
    }

    setFieldErrors({});
    createExpMutation.mutate({
      camp_id: currentCampId,
      created_by: actorId,
      destination: trimmedDestination,
      departure_date: departureDate,
      expected_return_date: expectedReturnDate,
      max_return_date: maxReturnDate,
      notes: notes.trim(),
      status: 'PLANNED',
      members: selectedHealthyMembers.map((id) => ({ person_id: id })),
      allocated_resources: normalizeResourceRows(allocatedResources),
    });
  };

  const handleEditExpClick = (exp: Expedition) => {
    setEditingExpedition(exp);
    setFieldErrors({});
    setEditDestination(exp.destination);
    setEditNotes(exp.notes || '');
    setEditDepartureDate(exp.departure_date?.split('T')[0] ?? '');
    setEditExpectedReturn(exp.expected_return_date?.split('T')[0] ?? '');
    setEditMaxReturn(exp.max_return_date?.split('T')[0] ?? '');
  };

  const handleEditExpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpedition) return;

    const trimmedDestination = editDestination.trim();
    const nextErrors: ExpeditionFieldErrors = validateDateOrder(
      editDepartureDate,
      editExpectedReturn,
      editMaxReturn,
      'edit',
    );

    if (!trimmedDestination) {
      nextErrors.editDestination = 'Required. Destination cannot be empty.';
    } else if (trimmedDestination.length > MAX_DESTINATION_LENGTH) {
      nextErrors.editDestination = `Destination cannot exceed ${MAX_DESTINATION_LENGTH} characters.`;
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    updateDetailsMutation.mutate({
      id: editingExpedition.id,
      data: {
        destination: trimmedDestination,
        notes: editNotes.trim(),
        departure_date: editDepartureDate,
        expected_return_date: editExpectedReturn,
        max_return_date: editMaxReturn,
      },
    });
  };

  const handleReturnExpedition = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returningExpedition) return;

    const nextErrors: ExpeditionFieldErrors = {
      ...validateReturnedAllocatedRows(returnedAllocatedResources, returningExpedition),
      ...validateResourceRows(foundResources, 'foundResources'),
    };

    if (!isValidIsoDate(returnDate)) {
      nextErrors.returnDate = 'Required. Use YYYY-MM-DD.';
    } else {
      const returnTime = new Date(returnDate).getTime();
      const departureTime = new Date(returningExpedition.departure_date).getTime();
      if (Number.isFinite(departureTime) && returnTime < departureTime) {
        nextErrors.returnDate = 'Return date must be on or after departure.';
      }
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      return;
    }

    setFieldErrors({});
    updateStatusMutation.mutate({
      id: returningExpedition.id,
      status: 'RETURNED',
      actual_return_date: returnDate,
      returned_allocated_resources: normalizeResourceRows(returnedAllocatedResources),
      found_resources: normalizeResourceRows(foundResources),
      default_member_status: returnMemberStatus,
      member_outcomes: memberOutcomes,
    });
  };

  const returningAllocatedResourceRows = getExpeditionAllocatedResources(returningExpedition);
  const returningMemberRows = getExpeditionMembers(returningExpedition);
  const canAddReturnedAllocatedRow = returningAllocatedResourceRows.some(
    (resource) =>
      !returnedAllocatedResources.some(
        (row) => row.resource_type_id === Number(resource.resource_type_id),
      ),
  );

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-brand-primary">
            Exploration Planning
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
            Critical mission management & tracking logistics
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              setCreateError(null);
              setFieldErrors({});
              setIsModalOpen(true);
            }}
            className="bg-brand-primary hover:bg-brand-primary/95 text-black font-semibold uppercase tracking-wider px-6 py-2 rounded-md flex items-center gap-2 text-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            <Plus size={20} />
            CONFIGURE MISSION
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {!currentCampId ? (
          <div className="py-20 text-center bg-surface-raised brutalist-border rounded-xl">
            <Map size={48} className="mx-auto text-zinc-800 mb-4" />
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
              Select a refuge to review expeditions.
            </p>
          </div>
        ) : !canViewActiveCamp ? (
          <div className="py-20 text-center bg-surface-raised brutalist-border rounded-xl">
            <AlertCircle size={48} className="mx-auto text-red-900/70 mb-4" />
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
              Your role cannot access expeditions for this refuge.
            </p>
          </div>
        ) : expeditionsError ? (
          <div className="py-20 text-center bg-surface-raised brutalist-border rounded-xl">
            <AlertCircle size={48} className="mx-auto text-red-900/70 mb-4" />
            <p className="text-red-400 font-mono text-xs uppercase tracking-widest">
              {getExpeditionErrorMessage(expeditionsError, 'Expeditions could not be loaded.')}
            </p>
          </div>
        ) : isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="p-6 bg-surface-raised/40 brutalist-border rounded-xl space-y-4 animate-pulse flex flex-col lg:flex-row justify-between items-start lg:items-center"
            >
              <div className="space-y-2 flex-1 w-full">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-5 w-24" />
                  <Skeleton className="h-7 w-48" />
                </div>
                <Skeleton className="h-4 w-5/6" />
              </div>
              <div className="flex gap-4 w-full lg:w-auto pt-4 lg:pt-0">
                <Skeleton className="h-8 w-24 rounded" />
                <Skeleton className="h-8 w-24 rounded" />
              </div>
            </div>
          ))
        ) : expeditions.length === 0 ? (
          <div className="py-20 text-center bg-surface-raised brutalist-border rounded-xl">
            <Map size={48} className="mx-auto text-zinc-800 mb-4" />
            <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
              No expeditions registered for this refuge.
            </p>
          </div>
        ) : (
          expeditions.map((exp, i) => (
            <motion.div
              key={exp.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group bg-surface-raised brutalist-border rounded-xl overflow-hidden hover:border-zinc-700 transition-all"
            >
              <div className="flex flex-col lg:flex-row">
                <div
                  className={cn(
                    'w-full lg:w-2 py-4 lg:py-0',
                    exp.status === 'ONGOING'
                      ? 'bg-amber-500 shadow-[2px_0_10px_rgba(245,158,11,0.3)]'
                      : exp.status === 'PLANNED'
                        ? 'bg-zinc-700'
                        : exp.status === 'RETURNED'
                          ? 'bg-emerald-500'
                          : 'bg-red-500 animate-pulse',
                  )}
                />

                <div className="flex-1 p-6 grid grid-cols-1 lg:grid-cols-4 gap-6 items-center">
                  <div className="lg:col-span-2 space-y-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'text-[9px] font-black uppercase px-2 py-0.5 rounded border',
                          exp.status === 'ONGOING'
                            ? 'bg-amber-950/20 text-amber-500 border-amber-500/30'
                            : exp.status === 'RETURNED'
                              ? 'bg-emerald-950/20 text-emerald-500 border-emerald-500/30'
                              : exp.status === 'CANCELLED'
                                ? 'bg-red-950/20 text-red-500 border-red-500/30'
                                : 'bg-zinc-950/20 text-zinc-500 border-zinc-700/50',
                        )}
                      >
                        {exp.status}
                      </span>
                      <span className="text-zinc-600 font-mono text-[10px]">
                        ID: EX-{exp.id.toString().padStart(3, '0')}
                      </span>
                    </div>
                    <h3 className="text-2xl font-black tracking-tighter uppercase italic">
                      {exp.destination}
                    </h3>
                    <div className="flex items-center gap-4 text-xs font-mono text-zinc-500">
                      <div className="flex items-center gap-1.5">
                        <MapPin size={14} className="text-brand-primary" />
                        {exp.destination}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} />
                        START: {formatDate(exp.departure_date)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-8 border-l border-zinc-900 pl-6">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase">
                        <Users size={12} /> Personnel
                      </div>
                      <p className="font-mono font-bold text-xl">
                        {getExpeditionMemberCount(exp)}{' '}
                        <span className="text-xs text-zinc-600">UNITS</span>
                      </p>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase">
                        <Timer size={12} /> Expected Return
                      </div>
                      <p className="font-mono font-bold text-sm text-zinc-400">
                        {exp.expected_return_date ? formatDate(exp.expected_return_date) : '—'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:border-l lg:border-zinc-900 lg:pl-6">
                    {exp.status === 'PLANNED' && canUpdateStatus && (
                      <button
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: exp.id,
                            status: 'ONGOING',
                          })
                        }
                        disabled={updateStatusMutation.isPending}
                        className="px-3 py-1.5 bg-brand-primary text-black font-extrabold text-[10px] uppercase rounded hover:bg-brand-primary/90 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        DEPLOY SQUAD
                      </button>
                    )}
                    {exp.status === 'ONGOING' && canUpdateStatus && (
                      <>
                        <button
                          onClick={() => {
                            setReturnedAllocatedResources(buildDefaultReturnedAllocatedRows(exp));
                            setFoundResources([]);
                            setReturnMemberStatus('HEALTHY');
                            setMemberOutcomes(buildDefaultMemberOutcomes(exp, 'HEALTHY'));
                            setReturnDate(today);
                            setFieldErrors({});
                            setReturningExpedition(exp);
                          }}
                          disabled={updateStatusMutation.isPending}
                          className="px-3 py-1.5 bg-emerald-600 text-white font-extrabold text-[10px] uppercase rounded hover:bg-emerald-500 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          CONFIRM RETURN
                        </button>
                        <button
                          onClick={() => setConfirmCancelId(exp.id)}
                          disabled={updateStatusMutation.isPending}
                          className="px-3 py-1.5 bg-red-600 text-white font-extrabold text-[10px] uppercase rounded hover:bg-red-500 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          MARK LOST
                        </button>
                      </>
                    )}
                    <Link
                      to={`/expeditions/${exp.id}`}
                      className="px-3 py-1.5 text-[10px] font-bold text-brand-primary hover:text-brand-primary/80 uppercase border border-brand-primary/30 hover:border-brand-primary/60 rounded transition-colors"
                    >
                      VIEW DETAILS
                    </Link>
                    {canUpdate && (
                      <button
                        onClick={() => handleEditExpClick(exp)}
                        aria-label="Edit expedition"
                        title="Edit expedition"
                        className="p-1.5 sm:p-2 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white rounded transition-colors cursor-pointer touch-target"
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                    {canDelete && exp.status !== 'RETURNED' && exp.status !== 'CANCELLED' && (
                      <button
                        onClick={() => setConfirmDeleteId(exp.id)}
                        disabled={deleteExpMutation.isPending}
                        aria-label="Cancel expedition"
                        title="Cancel expedition"
                        className="p-1.5 sm:p-2 bg-zinc-950 border border-red-950/40 text-red-500/70 hover:text-red-400 hover:bg-red-950/20 rounded transition-colors cursor-pointer touch-target"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {exp.status === 'ONGOING' && (
                <div className="px-6 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-1 bg-zinc-900 rounded-full overflow-hidden">
                      <motion.div
                        initial={{ x: '-100%' }}
                        animate={{ x: '10%' }}
                        transition={{
                          duration: 3,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                        className="w-1/3 h-full bg-amber-500/50"
                      />
                    </div>
                    <span className="text-[9px] font-mono text-amber-500 animate-pulse">
                      TRANSMISSION IN PROGRESS...
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          ))
        )}

        <div className="pt-6 flex justify-center">
          <Pagination
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            showEdgeButtons
          />
        </div>
      </div>

      <div className="p-6 bg-red-950/10 border border-red-500/20 rounded-xl flex items-start gap-4">
        <AlertCircle className="text-red-500 shrink-0 mt-1" size={20} />
        <div className="space-y-1">
          <p className="text-sm font-bold text-red-500 uppercase">Exploration Emergency Protocol</p>
          <p className="text-xs text-zinc-500 leading-relaxed max-w-2xl font-medium">
            Review missions that exceed their max return date and use the available status actions.
            The backend enforces the allowed expedition transitions.
          </p>
        </div>
      </div>

      <AnimatePresence>
        {/* Create Modal */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-surface-raised brutalist-border p-4 sm:p-6 md:p-8 rounded-xl max-w-xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto space-y-6"
            >
              <div className="border-b border-zinc-900 pb-4 mb-2">
                <p className="text-[10px] font-mono text-brand-primary uppercase tracking-widest leading-none mb-1">
                  TACTICAL INTERFACE EX-10
                </p>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  Configure Scouting Mission
                </h3>
                <p className="text-xs text-zinc-500 font-mono">
                  Deploy a squad to forage supplies or scout hostile territory structures.
                </p>
              </div>

              <form onSubmit={handleCreateExpedition} className="space-y-4" noValidate>
                {createError && (
                  <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-lg flex items-start gap-2">
                    <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-400 font-mono leading-relaxed">{createError}</p>
                  </div>
                )}

                <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                  <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
                    Destination is required, max {MAX_DESTINATION_LENGTH} characters. Dates must
                    follow departure, expected return, then max return. Provisions are optional;
                    selected quantities must be greater than zero and are deducted immediately when
                    the mission is created.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Destination Landmark
                  </label>
                  <input
                    required
                    type="text"
                    maxLength={MAX_DESTINATION_LENGTH}
                    aria-invalid={!!fieldErrors.destination}
                    aria-label="Destination Landmark"
                    value={destination}
                    onChange={(e) => {
                      setDestination(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, destination: undefined }));
                    }}
                    placeholder="e.g. Forgotten Highway Warehouse"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary font-mono uppercase"
                  />
                  {fieldErrors.destination && (
                    <p className="text-[10px] font-mono text-red-400">{fieldErrors.destination}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Departure Date
                    </label>
                    <input
                      required
                      type="date"
                      aria-invalid={!!fieldErrors.departureDate}
                      aria-label="Departure Date"
                      value={departureDate}
                      onChange={(e) => {
                        setDepartureDate(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, departureDate: undefined }));
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                    />
                    {fieldErrors.departureDate && (
                      <p className="text-[10px] font-mono text-red-400">
                        {fieldErrors.departureDate}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Expected Return
                    </label>
                    <input
                      required
                      type="date"
                      aria-invalid={!!fieldErrors.expectedReturnDate}
                      aria-label="Expected Return"
                      value={expectedReturnDate}
                      onChange={(e) => {
                        setExpectedReturnDate(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, expectedReturnDate: undefined }));
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                    />
                    {fieldErrors.expectedReturnDate && (
                      <p className="text-[10px] font-mono text-red-400">
                        {fieldErrors.expectedReturnDate}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Max Return
                    </label>
                    <input
                      required
                      type="date"
                      aria-invalid={!!fieldErrors.maxReturnDate}
                      aria-label="Max Return"
                      value={maxReturnDate}
                      onChange={(e) => {
                        setMaxReturnDate(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, maxReturnDate: undefined }));
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                    />
                    {fieldErrors.maxReturnDate && (
                      <p className="text-[10px] font-mono text-red-400">
                        {fieldErrors.maxReturnDate}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Mission briefings / allocated assets notes
                  </label>
                  <textarea
                    aria-label="Mission briefings / allocated assets notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="e.g. searching dry food caches. Allocating 4 units of 9mm ammo and basic scout gear."
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary resize-none font-mono uppercase"
                  />
                </div>

                <div className="space-y-2 border-t border-zinc-900 pt-4">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Squad Members ({selectedMembers.length} selected)
                  </p>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-1">
                    {healthyPeople.length === 0 && (
                      <p className="col-span-2 text-[11px] text-zinc-600 font-mono text-center py-2">
                        No healthy survivors available.
                      </p>
                    )}
                    {healthyPeople.map((person) => (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => {
                          setFieldErrors((prev) => ({ ...prev, members: undefined }));
                          setSelectedMembers((prev) =>
                            prev.includes(person.id)
                              ? prev.filter((id) => id !== person.id)
                              : [...prev, person.id],
                          );
                        }}
                        className={cn(
                          'p-2 text-left border rounded text-xs transition-all',
                          selectedMembers.includes(person.id)
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
                  {fieldErrors.members && (
                    <p className="text-[10px] font-mono text-red-400">{fieldErrors.members}</p>
                  )}
                </div>

                <div className="space-y-2 border-t border-zinc-900 pt-4">
                  <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                    Allocated Provisions
                  </p>
                  <div className="max-h-44 overflow-y-auto pr-1 space-y-2">
                    {allocatedResources.map((row, idx) => {
                      const selectedIds = new Set(
                        allocatedResources
                          .filter((_, i) => i !== idx)
                          .map((r) => r.resource_type_id)
                          .filter(Boolean),
                      );
                      return (
                        <div key={idx} className="flex gap-2 items-center">
                          <select
                            aria-label="Select resource type"
                            aria-invalid={!!fieldErrors.provisions}
                            value={row.resource_type_id || ''}
                            onChange={(e) => {
                              const updated = [...allocatedResources];
                              updated[idx] = {
                                ...updated[idx],
                                resource_type_id: Number(e.target.value),
                              };
                              setAllocatedResources(updated);
                              setFieldErrors((prev) => ({ ...prev, provisions: undefined }));
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
                            aria-invalid={!!fieldErrors.provisions}
                            aria-label="Provision quantity"
                            value={row.amount || ''}
                            onChange={(e) => {
                              const updated = [...allocatedResources];
                              updated[idx] = {
                                ...updated[idx],
                                amount: Number(e.target.value),
                              };
                              setAllocatedResources(updated);
                              setFieldErrors((prev) => ({ ...prev, provisions: undefined }));
                            }}
                            placeholder="Qty"
                            className="w-20 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setAllocatedResources(allocatedResources.filter((_, i) => i !== idx));
                              setFieldErrors((prev) => ({ ...prev, provisions: undefined }));
                            }}
                            aria-label="Remove allocated provision"
                            title="Remove allocated provision"
                            className="p-1.5 sm:p-2 text-zinc-500 hover:text-red-400 transition-colors touch-target"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  {fieldErrors.provisions && (
                    <p className="text-[10px] font-mono text-red-400">{fieldErrors.provisions}</p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setAllocatedResources([
                        ...allocatedResources,
                        { resource_type_id: 0, amount: 0 },
                      ]);
                      setFieldErrors((prev) => ({ ...prev, provisions: undefined }));
                    }}
                    className="text-[10px] font-bold text-brand-primary uppercase hover:text-brand-primary/80 transition-colors"
                  >
                    + ADD PROVISION
                  </button>
                </div>

                {/* Create modal buttons */}
                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      setCreateError(null);
                      setFieldErrors({});
                    }}
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                  >
                    ABORT CONFIG
                  </button>
                  <button
                    type="submit"
                    disabled={createExpMutation.isPending}
                    className="flex-2 py-2.5 bg-brand-primary text-black text-xs font-bold uppercase rounded hover:bg-brand-primary/90 transition-colors disabled:opacity-30"
                  >
                    {createExpMutation.isPending
                      ? 'ENCRYPTING DISPATCH...'
                      : 'CONFIRM MISSION DISPATCH'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Edit Modal — PUT only, no status */}
        {editingExpedition && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-surface-raised brutalist-border p-4 sm:p-6 md:p-8 rounded-xl max-w-xl w-full max-h-[calc(100vh-2rem)] overflow-y-auto space-y-6"
            >
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4 mb-2">
                <div>
                  <p className="text-[10px] font-mono text-brand-primary uppercase tracking-widest leading-none mb-1">
                    TACTICAL INTERFACE EX-10
                  </p>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    Edit Scouting Mission
                  </h3>
                  <p className="text-[10px] font-mono text-zinc-600 mt-1">
                    To change mission status use the quick-action buttons on the mission card.
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingExpedition(null);
                    setFieldErrors({});
                  }}
                  aria-label="Close edit modal"
                  title="Close edit modal"
                  className="p-1 sm:p-2 text-zinc-500 hover:text-white rounded touch-target"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleEditExpSubmit} className="space-y-4" noValidate>
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                  <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
                    Destination is required, max {MAX_DESTINATION_LENGTH} characters. Dates must
                    follow departure, expected return, then max return. Status changes are handled
                    only through the expedition action buttons.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Destination Landmark
                  </label>
                  <input
                    required
                    type="text"
                    maxLength={MAX_DESTINATION_LENGTH}
                    aria-invalid={!!fieldErrors.editDestination}
                    aria-label="Edit destination landmark"
                    value={editDestination}
                    onChange={(e) => {
                      setEditDestination(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, editDestination: undefined }));
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono uppercase"
                  />
                  {fieldErrors.editDestination && (
                    <p className="text-[10px] font-mono text-red-400">
                      {fieldErrors.editDestination}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Departure Date
                    </label>
                    <input
                      required
                      type="date"
                      aria-invalid={!!fieldErrors.editDepartureDate}
                      aria-label="Edit departure date"
                      value={editDepartureDate}
                      onChange={(e) => {
                        setEditDepartureDate(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, editDepartureDate: undefined }));
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                    />
                    {fieldErrors.editDepartureDate && (
                      <p className="text-[10px] font-mono text-red-400">
                        {fieldErrors.editDepartureDate}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Expected Return
                    </label>
                    <input
                      type="date"
                      aria-invalid={!!fieldErrors.editExpectedReturn}
                      aria-label="Edit expected return date"
                      value={editExpectedReturn}
                      onChange={(e) => {
                        setEditExpectedReturn(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, editExpectedReturn: undefined }));
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                    />
                    {fieldErrors.editExpectedReturn && (
                      <p className="text-[10px] font-mono text-red-400">
                        {fieldErrors.editExpectedReturn}
                      </p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Max Return
                    </label>
                    <input
                      type="date"
                      aria-invalid={!!fieldErrors.editMaxReturn}
                      aria-label="Edit max return date"
                      value={editMaxReturn}
                      onChange={(e) => {
                        setEditMaxReturn(e.target.value);
                        setFieldErrors((prev) => ({ ...prev, editMaxReturn: undefined }));
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                    />
                    {fieldErrors.editMaxReturn && (
                      <p className="text-[10px] font-mono text-red-400">
                        {fieldErrors.editMaxReturn}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Mission briefings / notes
                  </label>
                  <textarea
                    aria-label="Edit mission briefings / notes"
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary resize-none font-mono uppercase"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingExpedition(null);
                      setFieldErrors({});
                    }}
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={updateDetailsMutation.isPending}
                    className="flex-2 py-2.5 bg-brand-primary text-black text-xs font-bold uppercase rounded hover:bg-brand-primary/90 transition-colors disabled:opacity-30"
                  >
                    {updateDetailsMutation.isPending ? 'SAVING CHANGES...' : 'SAVE CHANGES'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* Return Modal */}
        {returningExpedition && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
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
                  <p className="text-[10px] font-mono text-zinc-600 mt-1">
                    {returningExpedition.destination}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setReturningExpedition(null);
                    setFieldErrors({});
                  }}
                  aria-label="Close return modal"
                  title="Close return modal"
                  className="p-1 sm:p-2 text-zinc-500 hover:text-white rounded touch-target"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleReturnExpedition} className="space-y-4" noValidate>
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/50 p-3">
                  <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
                    Returned allocated resources are added back to inventory. Any allocated amount
                    omitted here is treated as consumed or lost during the mission. Found resources
                    are recorded separately as new inventory inflow.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Return Date
                  </label>
                  <input
                    required
                    type="date"
                    aria-invalid={!!fieldErrors.returnDate}
                    aria-label="Return date"
                    value={returnDate}
                    onChange={(e) => {
                      setReturnDate(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, returnDate: undefined }));
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                  />
                  {fieldErrors.returnDate && (
                    <p className="text-[10px] font-mono text-red-400">{fieldErrors.returnDate}</p>
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
                        const selectedAllocation = returningAllocatedResourceRows.find(
                          (resource) => Number(resource.resource_type_id) === row.resource_type_id,
                        );
                        return (
                          <div key={idx} className="flex gap-2 items-center">
                            <select
                              aria-label="Returned allocated resource type"
                              aria-invalid={!!fieldErrors.returnedAllocatedResources}
                              value={row.resource_type_id || ''}
                              onChange={(e) => {
                                const updated = [...returnedAllocatedResources];
                                const nextResourceId = Number(e.target.value);
                                const allocation = returningAllocatedResourceRows.find(
                                  (resource) =>
                                    Number(resource.resource_type_id) === nextResourceId,
                                );
                                updated[idx] = {
                                  resource_type_id: nextResourceId,
                                  amount: Number(allocation?.amount ?? 0),
                                };
                                setReturnedAllocatedResources(updated);
                                setFieldErrors((prev) => ({
                                  ...prev,
                                  returnedAllocatedResources: undefined,
                                }));
                              }}
                              className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                            >
                              <option value="">Select allocated resource...</option>
                              {returningAllocatedResourceRows.map((allocation) => {
                                const resourceId = Number(allocation.resource_type_id);
                                const resource = resourceById.get(resourceId);
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
                              aria-invalid={!!fieldErrors.returnedAllocatedResources}
                              aria-label="Returned allocated resource quantity"
                              value={row.amount || ''}
                              onChange={(e) => {
                                const updated = [...returnedAllocatedResources];
                                updated[idx] = {
                                  ...updated[idx],
                                  amount: Number(e.target.value),
                                };
                                setReturnedAllocatedResources(updated);
                                setFieldErrors((prev) => ({
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
                                setFieldErrors((prev) => ({
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
                  {fieldErrors.returnedAllocatedResources && (
                    <p className="text-[10px] font-mono text-red-400">
                      {fieldErrors.returnedAllocatedResources}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      disabled={!canAddReturnedAllocatedRow}
                      onClick={() => {
                        const nextAllocation = returningAllocatedResourceRows.find(
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
                        setFieldErrors((prev) => ({
                          ...prev,
                          returnedAllocatedResources: undefined,
                        }));
                      }}
                      className="text-[10px] font-bold text-brand-primary uppercase hover:text-brand-primary/80 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      + ADD RETURNED ALLOCATED
                    </button>
                    {returningAllocatedResourceRows.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setReturnedAllocatedResources(
                            buildDefaultReturnedAllocatedRows(returningExpedition),
                          );
                          setFieldErrors((prev) => ({
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
                            aria-invalid={!!fieldErrors.foundResources}
                            value={row.resource_type_id || ''}
                            onChange={(e) => {
                              const updated = [...foundResources];
                              updated[idx] = {
                                ...updated[idx],
                                resource_type_id: Number(e.target.value),
                              };
                              setFoundResources(updated);
                              setFieldErrors((prev) => ({ ...prev, foundResources: undefined }));
                            }}
                            className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                          >
                            <option value="">Select resource...</option>
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
                            aria-invalid={!!fieldErrors.foundResources}
                            aria-label="Found resource quantity"
                            value={row.amount || ''}
                            onChange={(e) => {
                              const updated = [...foundResources];
                              updated[idx] = {
                                ...updated[idx],
                                amount: Number(e.target.value),
                              };
                              setFoundResources(updated);
                              setFieldErrors((prev) => ({ ...prev, foundResources: undefined }));
                            }}
                            placeholder="Qty"
                            className="w-20 bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFoundResources(foundResources.filter((_, i) => i !== idx));
                              setFieldErrors((prev) => ({ ...prev, foundResources: undefined }));
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
                  {fieldErrors.foundResources && (
                    <p className="text-[10px] font-mono text-red-400">
                      {fieldErrors.foundResources}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      setFoundResources([...foundResources, { resource_type_id: 0, amount: 0 }]);
                      setFieldErrors((prev) => ({ ...prev, foundResources: undefined }));
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
                        setMemberOutcomes(
                          buildDefaultMemberOutcomes(returningExpedition, nextStatus),
                        );
                        setFieldErrors((prev) => ({ ...prev, memberOutcomes: undefined }));
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
                    {returningMemberRows.length > 0 ? (
                      returningMemberRows.map((member) => {
                        const personId = Number(member.person_id);
                        const person = personById.get(personId);
                        const currentOutcome =
                          memberOutcomes.find((outcome) => outcome.person_id === personId)
                            ?.status ?? returnMemberStatus;
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
                                setFieldErrors((prev) => ({ ...prev, memberOutcomes: undefined }));
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
                  {fieldErrors.memberOutcomes && (
                    <p className="text-[10px] font-mono text-red-400">
                      {fieldErrors.memberOutcomes}
                    </p>
                  )}
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => {
                      setReturningExpedition(null);
                      setFieldErrors({});
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
      </AnimatePresence>

      {/* Confirm: mark expedition as cancelled */}
      <ConfirmDialog
        isOpen={confirmCancelId !== null}
        title="Mark deployment as lost?"
        description="This will permanently mark the expedition as CANCELLED. The status cannot be reversed."
        confirmLabel="MARK LOST"
        variant="warning"
        isPending={updateStatusMutation.isPending}
        onConfirm={() => {
          if (confirmCancelId !== null) {
            updateStatusMutation.mutate(
              { id: confirmCancelId, status: 'CANCELLED', default_member_status: 'HEALTHY' },
              { onSettled: () => setConfirmCancelId(null) },
            );
          }
        }}
        onCancel={() => setConfirmCancelId(null)}
      />

      {/* Confirm: delete expedition log */}
      <ConfirmDialog
        isOpen={confirmDeleteId !== null}
        title="Cancel expedition record?"
        description="The backend marks the expedition as CANCELLED. Returned or already cancelled expeditions cannot be cancelled again."
        confirmLabel="CANCEL EXPEDITION"
        variant="danger"
        isPending={deleteExpMutation.isPending}
        onConfirm={() => {
          if (confirmDeleteId !== null) {
            deleteExpMutation.mutate(confirmDeleteId, {
              onSettled: () => setConfirmDeleteId(null),
            });
          }
        }}
        onCancel={() => setConfirmDeleteId(null)}
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
