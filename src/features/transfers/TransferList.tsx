import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, fetchAllPaginated, unwrapList } from '../../lib/api';
import { useCampStore, useAuthStore } from '../../store';
import { canAccessCamp, hasPermission } from '../../lib/permissions';
import { cn, formatDate } from '../../lib/utils';
import { Skeleton, SkeletonList } from '../../components/Skeleton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { Pagination } from '../../components/Pagination';
import { ActionFeedbackDialog, ActionFeedbackType } from '../../components/ActionFeedbackDialog';
import { getApiErrorMessage } from '../../lib/apiErrors';
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
type TransferType = 'RESOURCE' | 'PERSON' | 'MIXED';
type PersonStatus = Person['status'];

interface TransferItem {
  id?: number;
  item_type: 'RESOURCE' | 'PERSON';
  resource_type_id?: number | null;
  person_id?: number | null;
  quantity?: number | null;
  person?: Pick<Person, 'id' | 'full_name' | 'status'> | null;
  resource_type?: ResourceType | null;
}

interface Transfer {
  id: number;
  requesting_camp: number;
  target_camp: number;
  requesting_camp_ref?: { id: number; name: string } | null;
  target_camp_ref?: { id: number; name: string } | null;
  status: TransferStatus;
  type: TransferType;
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

interface TransferApiRecord extends Omit<Transfer, 'items'> {
  items?: TransferItem[] | null;
  camp_transfer_items?: TransferItem[] | null;
}

interface TransferPage {
  data: Transfer[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
  };
}

type TransferFeedback = {
  type: ActionFeedbackType;
  title: string;
  message: string;
  actionLabel?: string;
};

// ── Constants ─────────────────────────────────────────────────────────────────

const STATUS_STEPS: TransferStatus[] = [
  'PENDING',
  'APPROVED_SOURCE',
  'APPROVED_TARGET',
  'COMPLETED',
];

const STATUS_STEP_LABELS = ['PENDING', 'SOURCE\nAPPROVED', 'TARGET\nAPPROVED', 'COMPLETED'];
const PEOPLE_TRANSFER_STATUSES: PersonStatus[] = ['HEALTHY', 'SICK', 'INJURED', 'AWAY', 'DEAD'];
const RATION_RESOURCE_TYPE_NAME = 'FOOD_RATION';
const RATION_PER_PERSON_PER_DAY = 2;
const RATION_TRAVEL_DAYS = 3;
const RATIONS_PER_PERSON_FOR_TRAVEL = RATION_PER_PERSON_PER_DAY * RATION_TRAVEL_DAYS;

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Build a date input compatible "min" string (YYYY-MM-DD) for today. */
function getLocalMinDate(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Convert a datetime-local value (YYYY-MM-DDTHH:MM, local time) into an
 * ISO-8601 UTC string that the backend expects.
 *
 * Uses the Date constructor with numeric parts to avoid browser-parsing
 * inconsistencies with timezoneless strings.
 */
function datetimeLocalToUTCISO(value: string): string {
  const [datePart, timePart] = value.split('T');
  const [y, m, d] = datePart.split('-').map(Number);
  const [hh, mm] = (timePart || '00:00').split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm).toISOString();
}

function normalizeTransfer(raw: TransferApiRecord): Transfer {
  return {
    ...raw,
    type: raw.type as TransferType,
    items: Array.isArray(raw.items)
      ? raw.items
      : Array.isArray(raw.camp_transfer_items)
        ? raw.camp_transfer_items
        : [],
  };
}

function unwrapTransfer(responseData: unknown): Transfer {
  const maybeWrapped =
    responseData &&
    typeof responseData === 'object' &&
    !Array.isArray(responseData) &&
    !('id' in responseData) &&
    'data' in responseData
      ? (responseData as { data?: TransferApiRecord }).data
      : responseData;

  return normalizeTransfer(maybeWrapped as TransferApiRecord);
}

function unwrapTransferPage(responseData: unknown, fallbackPage: number, fallbackPageSize: number) {
  const data = unwrapList<TransferApiRecord>(responseData).map(normalizeTransfer);
  const pagination = (responseData as { pagination?: Partial<TransferPage['pagination']> })
    ?.pagination;

  return {
    data,
    pagination: {
      page: Number(pagination?.page) || fallbackPage,
      pageSize: Number(pagination?.pageSize) || fallbackPageSize,
      total: Number(pagination?.total) || data.length,
      totalPages: Math.max(1, Number(pagination?.totalPages) || 1),
      hasNextPage: Boolean(pagination?.hasNextPage),
    },
  };
}

function isHealthy(person: Person) {
  return String(person.status).toUpperCase() === 'HEALTHY';
}

function isPositiveQuantity(value: number) {
  return Number.isFinite(value) && value > 0;
}

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
  const [selectedState, setSelectedState] = useState<{ campId: number | null; id: number | null }>({
    campId: null,
    id: null,
  });
  const [pageState, setPageState] = useState<{ campId: number | null; page: number }>({
    campId: null,
    page: 1,
  });
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [confirmCompleteId, setConfirmCompleteId] = useState<number | null>(null);
  const [confirmRejectId, setConfirmRejectId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [completionPersonStatus, setCompletionPersonStatus] = useState<PersonStatus>('HEALTHY');
  const [feedback, setFeedback] = useState<TransferFeedback | null>(null);

  // Schedule delivery inline state
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleError, setScheduleError] = useState<string | null>(null);

  // Approve-source inline date picker
  const [isApprovingSource, setIsApprovingSource] = useState(false);
  const [approveSourceDate, setApproveSourceDate] = useState('');
  const [approveSourceError, setApproveSourceError] = useState<string | null>(null);

  // Create form state
  const [transferType, setTransferType] = useState<TransferType>('RESOURCE');
  const [targetCamp, setTargetCamp] = useState<number | null>(null);
  const [resourceItems, setResourceItems] = useState<
    { resource_type_id: number; amount: number }[]
  >([{ resource_type_id: 0, amount: 0 }]);
  const [personItems, setPersonItems] = useState<number[]>([]);
  const [notes, setNotes] = useState('');
  const [createError, setCreateError] = useState<string | null>(null);
  const canReadTransfers = hasPermission(user?.permissions, 'transfers.read');
  const canCreate = hasPermission(user?.permissions, 'transfers.create');
  const canApproveSource = hasPermission(user?.permissions, 'transfers.approve_source');
  const canApproveTarget = hasPermission(user?.permissions, 'transfers.approve_target');
  const canComplete = hasPermission(user?.permissions, 'transfers.complete');
  const canReject = hasPermission(user?.permissions, 'transfers.reject');
  const canSchedule = hasPermission(user?.permissions, 'transfers.schedule');
  const actorCampId = user?.camp_id ?? null;
  const canViewCurrentCamp = currentCampId != null && canAccessCamp(currentCampId);
  const selectedId = selectedState.campId === currentCampId ? selectedState.id : null;
  const selectTransfer = (id: number | null) => setSelectedState({ campId: currentCampId, id });
  const page = pageState.campId === currentCampId ? pageState.page : 1;
  const setTransferPage = (nextPage: number) =>
    setPageState({ campId: currentCampId, page: nextPage });

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: transferPage, isLoading } = useQuery<TransferPage>({
    queryKey: ['transfers', currentCampId, page, PAGE_SIZE],
    queryFn: async () => {
      const res = await apiClient.get('/transfers', {
        params: { camp_id: currentCampId, page, pageSize: PAGE_SIZE },
      });
      return unwrapTransferPage(res.data, page, PAGE_SIZE);
    },
    enabled: Boolean(currentCampId) && canReadTransfers && canViewCurrentCamp,
  });

  const transfers = transferPage?.data ?? [];
  const totalPages = transferPage?.pagination.totalPages ?? 1;
  const totalRecords = transferPage?.pagination.total ?? transfers.length;
  const paginatedTransfers = transfers;

  const { data: detail, isLoading: detailLoading } = useQuery<Transfer>({
    queryKey: ['transfer', selectedId],
    queryFn: async () => {
      const res = await apiClient.get(`/transfers/${selectedId}`);
      return unwrapTransfer(res.data);
    },
    enabled: !!selectedId && canReadTransfers,
  });

  const { data: camps } = useQuery<CampRef[]>({
    queryKey: ['camps-catalog'],
    queryFn: async () => {
      const res = await apiClient.get('/camps/catalog');
      return unwrapList<CampRef>(res.data);
    },
    enabled: hasPermission(user?.permissions, 'camps.read'),
  });

  const { data: resources } = useQuery<ResourceType[]>({
    queryKey: ['resources-list'],
    queryFn: () => fetchAllPaginated<ResourceType>('/resources'),
    enabled: hasPermission(user?.permissions, 'resources.read'),
  });

  const { data: people } = useQuery<Person[]>({
    queryKey: ['transfer-people', currentCampId],
    queryFn: async () => {
      const res = await apiClient.get(`/camps/${currentCampId}/people`);
      return unwrapList<Person>(res.data);
    },
    enabled: !!currentCampId && hasPermission(user?.permissions, 'people.read'),
  });

  const healthyPeople = useMemo(() => (people ?? []).filter(isHealthy), [people]);

  const rationResource = useMemo(
    () =>
      resources?.find(
        (resource) => resource.name.trim().toUpperCase() === RATION_RESOURCE_TYPE_NAME,
      ),
    [resources],
  );

  const minimumTravelRations = personItems.length * RATIONS_PER_PERSON_FOR_TRAVEL;
  const isPeopleTransfer = transferType === 'PERSON' || transferType === 'MIXED';
  const activeDetailHasPeople = Boolean(detail?.items.some((item) => item.item_type === 'PERSON'));

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

  const getPersonName = (id?: number | null, item?: TransferItem): string => {
    if (item?.person?.full_name) return item.person.full_name;
    if (!id) return 'Unknown';
    return people?.find((p) => p.id === id)?.full_name ?? `Person #${id}`;
  };

  const getErrorMessage = (error: unknown, fallback: string) =>
    error instanceof Error && !(error as { response?: unknown }).response
      ? error.message
      : getApiErrorMessage(error, fallback);

  const buildTransferPayload = () => {
    if (!currentCampId) {
      return { ok: false as const, message: 'Select an origin camp before creating a transfer.' };
    }

    if (!canViewCurrentCamp) {
      return { ok: false as const, message: 'This role cannot create transfers for this camp.' };
    }

    if (!targetCamp) {
      return { ok: false as const, message: 'Destination camp is required.' };
    }

    if (targetCamp === currentCampId) {
      return {
        ok: false as const,
        message: 'Destination camp must be different from origin camp.',
      };
    }

    if (!userId) {
      return { ok: false as const, message: 'Current user could not be resolved.' };
    }

    const resourcePayload = resourceItems
      .filter((item) => item.resource_type_id > 0 || item.amount > 0)
      .map((item) => ({
        item_type: 'RESOURCE' as const,
        resource_type_id: item.resource_type_id,
        quantity: item.amount,
      }));

    if (transferType === 'RESOURCE' && resourcePayload.length === 0) {
      return { ok: false as const, message: 'At least one resource item is required.' };
    }

    for (const item of resourcePayload) {
      if (!item.resource_type_id) {
        return { ok: false as const, message: 'Every resource row must include a resource type.' };
      }
      if (!isPositiveQuantity(item.quantity)) {
        return { ok: false as const, message: 'Resource quantities must be greater than zero.' };
      }
    }

    const duplicateResourceIds = new Set<number>();
    for (const item of resourcePayload) {
      if (duplicateResourceIds.has(item.resource_type_id)) {
        return { ok: false as const, message: 'Duplicate resource types are not allowed.' };
      }
      duplicateResourceIds.add(item.resource_type_id);
    }

    const personPayload = personItems.map((personId) => ({
      item_type: 'PERSON' as const,
      person_id: personId,
    }));

    if (isPeopleTransfer && personPayload.length === 0) {
      return { ok: false as const, message: 'Select at least one healthy person to transfer.' };
    }

    const healthyPersonIds = new Set(healthyPeople.map((person) => person.id));
    if (isPeopleTransfer && personPayload.some((item) => !healthyPersonIds.has(item.person_id))) {
      return {
        ok: false as const,
        message: 'Only people with HEALTHY status can be included in a transfer.',
      };
    }

    if (transferType === 'PERSON' && resourcePayload.length === 0) {
      return {
        ok: false as const,
        message: 'PERSON transfers require RESOURCE items for travel rations.',
      };
    }

    if (transferType === 'MIXED' && (resourcePayload.length === 0 || personPayload.length === 0)) {
      return {
        ok: false as const,
        message: 'MIXED transfers must include both resources and people.',
      };
    }

    if (isPeopleTransfer && rationResource) {
      const rationItem = resourcePayload.find(
        (item) => item.resource_type_id === rationResource.id,
      );

      if (!rationItem) {
        return {
          ok: false as const,
          message: `Person transfers must include ${RATION_RESOURCE_TYPE_NAME} travel rations.`,
        };
      }

      if (rationItem.quantity < minimumTravelRations) {
        return {
          ok: false as const,
          message: `Minimum travel rations required: ${minimumTravelRations} (${personItems.length} people x ${RATION_PER_PERSON_PER_DAY} rations/day x ${RATION_TRAVEL_DAYS} days).`,
        };
      }
    }

    return {
      ok: true as const,
      payload: {
        requesting_camp: currentCampId,
        target_camp: targetCamp,
        type: transferType,
        requested_by: userId,
        items: [...personPayload, ...resourcePayload],
        ...(notes.trim() ? { notes: notes.trim() } : {}),
      },
    };
  };

  // ── Shared invalidation ──────────────────────────────────────────────────
  const invalidateTransfers = () => {
    queryClient.invalidateQueries({ queryKey: ['transfers'] });
    if (selectedId) {
      queryClient.invalidateQueries({ queryKey: ['transfer', selectedId] });
    }
  };

  const invalidateTransferRelatedData = (transfer?: Transfer | null) => {
    invalidateTransfers();

    const campIds = new Set(
      [currentCampId, transfer?.requesting_camp, transfer?.target_camp].filter(
        (campId): campId is number => typeof campId === 'number',
      ),
    );

    campIds.forEach((campId) => {
      queryClient.invalidateQueries({ queryKey: ['inventory', campId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-audit', campId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-alerts', campId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics', campId] });
      queryClient.invalidateQueries({ queryKey: ['resource-metrics', campId] });
      queryClient.invalidateQueries({ queryKey: ['people', campId] });
      queryClient.invalidateQueries({ queryKey: ['transfer-people', campId] });
    });
  };

  // ── Mutations ────────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: async () => {
      const validation = buildTransferPayload();
      if (!validation.ok) {
        throw new Error(validation.message);
      }

      const res = await apiClient.post('/transfers', validation.payload);
      return unwrapTransfer(res.data);
    },
    onSuccess: (createdTransfer) => {
      invalidateTransferRelatedData(createdTransfer);
      setIsCreateOpen(false);
      setTransferType('RESOURCE');
      setTargetCamp(null);
      setResourceItems([{ resource_type_id: 0, amount: 0 }]);
      setPersonItems([]);
      setNotes('');
      setCreateError(null);
      selectTransfer(createdTransfer.id);
      setFeedback({
        type: 'success',
        title: 'TRANSFER REQUESTED',
        message: `Transfer #TRF-${String(createdTransfer.id).padStart(4, '0')} was created successfully.`,
      });
    },
    onError: (error: unknown) => {
      const msg = getErrorMessage(error, 'The transfer request could not be created.');
      setCreateError(msg);
      setFeedback({
        type: 'error',
        title: 'TRANSFER FAILED',
        message: msg,
      });
    },
  });

  const approveSrcMutation = useMutation({
    mutationFn: async ({
      id,
      scheduled_delivery_date,
    }: {
      id: number;
      scheduled_delivery_date: string;
    }) => {
      const res = await apiClient.patch(`/transfers/${id}/approve-source`, {
        scheduled_delivery_date,
      });
      return unwrapTransfer(res.data);
    },
    onSuccess: (updatedTransfer) => {
      invalidateTransferRelatedData(updatedTransfer);
      setIsApprovingSource(false);
      setApproveSourceDate('');
      setApproveSourceError(null);
      setFeedback({
        type: 'success',
        title: 'SOURCE APPROVED',
        message: `Transfer #TRF-${String(updatedTransfer.id).padStart(4, '0')} was approved by the source camp.`,
      });
    },
    onError: (error: unknown) => {
      const msg = getErrorMessage(error, 'Source approval failed.');
      setApproveSourceError(msg);
      setFeedback({
        type: 'error',
        title: 'APPROVAL FAILED',
        message: msg,
      });
    },
  });

  const approveTgtMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.patch(`/transfers/${id}/approve-target`, {});
      return unwrapTransfer(res.data);
    },
    onSuccess: (updatedTransfer) => {
      invalidateTransferRelatedData(updatedTransfer);
      setFeedback({
        type: 'success',
        title: 'TARGET APPROVED',
        message: `Transfer #TRF-${String(updatedTransfer.id).padStart(4, '0')} was approved by the destination camp.`,
      });
    },
    onError: (error: unknown) => {
      setFeedback({
        type: 'error',
        title: 'APPROVAL FAILED',
        message: getErrorMessage(error, 'Target approval failed.'),
      });
    },
  });

  const completeMutation = useMutation({
    mutationFn: async ({ id, person_status }: { id: number; person_status?: PersonStatus }) => {
      const res = await apiClient.patch(`/transfers/${id}/complete`, {
        ...(person_status ? { person_status } : {}),
      });
      return unwrapTransfer(res.data);
    },
    onSuccess: (updatedTransfer) => {
      invalidateTransferRelatedData(updatedTransfer);
      setConfirmCompleteId(null);
      setCompletionPersonStatus('HEALTHY');
      setFeedback({
        type: 'success',
        title: 'TRANSFER COMPLETED',
        message: `Transfer #TRF-${String(updatedTransfer.id).padStart(4, '0')} was completed. Inventory and personnel records were updated by the backend.`,
      });
    },
    onError: (error: unknown) => {
      setFeedback({
        type: 'error',
        title: 'COMPLETION FAILED',
        message: getErrorMessage(error, 'The transfer could not be completed.'),
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, reason }: { id: number; reason: string }) =>
      apiClient
        .patch(`/transfers/${id}/reject`, { reason })
        .then((res) => unwrapTransfer(res.data)),
    onSuccess: (updatedTransfer) => {
      invalidateTransferRelatedData(updatedTransfer);
      setConfirmRejectId(null);
      setRejectReason('');
      setRejectError(null);
      setFeedback({
        type: 'success',
        title: 'TRANSFER REJECTED',
        message: `Transfer #TRF-${String(updatedTransfer.id).padStart(4, '0')} was rejected and will not modify inventory.`,
      });
    },
    onError: (error: unknown) => {
      const msg = getErrorMessage(error, 'The transfer could not be rejected.');
      setRejectError(msg);
      setFeedback({
        type: 'error',
        title: 'REJECTION FAILED',
        message: msg,
      });
    },
  });

  const scheduleMutation = useMutation({
    mutationFn: async ({ id, date }: { id: number; date: string }) =>
      apiClient
        .patch(`/transfers/${id}/schedule`, {
          scheduled_delivery_date: date,
        })
        .then((res) => unwrapTransfer(res.data)),
    onSuccess: (updatedTransfer) => {
      invalidateTransferRelatedData(updatedTransfer);
      setIsScheduling(false);
      setScheduleDate('');
      setScheduleError(null);
      setFeedback({
        type: 'success',
        title: 'DELIVERY UPDATED',
        message: `Transfer #TRF-${String(updatedTransfer.id).padStart(4, '0')} delivery date was updated.`,
      });
    },
    onError: (error: unknown) => {
      const msg = getErrorMessage(error, 'The delivery date could not be updated.');
      setScheduleError(msg);
      setFeedback({
        type: 'error',
        title: 'SCHEDULE FAILED',
        message: msg,
      });
    },
  });

  // ── RBAC ─────────────────────────────────────────────────────────────────
  const detailActorAtSource =
    detail && actorCampId != null ? Number(detail.requesting_camp) === Number(actorCampId) : false;
  const detailActorAtTarget =
    detail && actorCampId != null ? Number(detail.target_camp) === Number(actorCampId) : false;
  const detailActorInRoute = detailActorAtSource || detailActorAtTarget;
  const canApproveSourceForDetail = Boolean(detail && canApproveSource && detailActorAtSource);
  const canApproveTargetForDetail = Boolean(detail && canApproveTarget && detailActorAtTarget);
  const canScheduleForDetail = Boolean(detail && canSchedule && detailActorAtSource);
  const canCompleteForDetail = Boolean(detail && canComplete && detailActorInRoute);
  const canRejectForDetail = Boolean(detail && canReject && detailActorInRoute);
  const detailCanActNow = Boolean(
    detail &&
    detail.status !== 'COMPLETED' &&
    detail.status !== 'REJECTED' &&
    ((detail.status === 'PENDING' && (canApproveSourceForDetail || canRejectForDetail)) ||
      (detail.status === 'APPROVED_SOURCE' &&
        (canScheduleForDetail || canApproveTargetForDetail || canRejectForDetail)) ||
      (detail.status === 'APPROVED_TARGET' && (canCompleteForDetail || canRejectForDetail))),
  );

  // ── Render ────────────────────────────────────────────────────────────────
  const openRejectDialog = (transferId: number) => {
    setRejectReason('');
    setRejectError(null);
    setConfirmRejectId(transferId);
  };

  const openCompleteDialog = (transferId: number) => {
    setCompletionPersonStatus('HEALTHY');
    setConfirmCompleteId(transferId);
  };

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
        {canCreate && currentCampId && canViewCurrentCamp && (
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
              {totalRecords} RECORDS · PAGE {page}/{totalPages}
            </span>
          </div>

          <div className="flex-1 overflow-auto divide-y divide-zinc-900">
            {isLoading ? (
              <div className="p-3 sm:p-4">
                <SkeletonList count={5} />
              </div>
            ) : !canViewCurrentCamp ? (
              <div className="p-12 text-center space-y-4">
                <Ban size={48} className="mx-auto text-zinc-800" />
                <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
                  Camp access unavailable.
                </p>
              </div>
            ) : !transfers || transfers.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <Truck size={48} className="mx-auto text-zinc-800" />
                <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
                  No transfers on record.
                </p>
                {canCreate && currentCampId && canViewCurrentCamp && (
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
                    onClick={() => selectTransfer(transfer.id)}
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
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={setTransferPage}
              showEdgeButtons
            />
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
                                      {getPersonName(item.person_id, item)}
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

                  {/* Read-only notice for restricted roles or non-actionable camp stages */}
                  {detail.status !== 'COMPLETED' &&
                    detail.status !== 'REJECTED' &&
                    !detailCanActNow && (
                      <div className="flex items-center gap-2 p-3 bg-zinc-900/50 border border-zinc-700/40 rounded-lg">
                        <Eye size={13} className="text-zinc-600 shrink-0" />
                        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-wide">
                          Read-only at this stage for your current camp role
                        </p>
                      </div>
                    )}
                </div>

                {/* Action footer — only for actionable statuses + authorized roles */}
                {detailCanActNow && (
                  <div className="p-5 border-t border-zinc-900 bg-surface-raised shrink-0 space-y-3">
                    {/* ── PENDING: approve source ─────────────────────────────── */}
                    {detail.status === 'PENDING' && (
                      <div className="space-y-3">
                        {canApproveSourceForDetail &&
                          (isApprovingSource ? (
                            <div className="space-y-3 p-4 bg-blue-950/10 border border-blue-500/20 rounded-lg">
                              <div className="space-y-1">
                                <p className="text-xs font-black text-blue-400 uppercase tracking-wider">
                                  Scheduled Delivery
                                </p>
                                <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                                  Set the estimated date and time the shipment will arrive at{' '}
                                  <span className="text-blue-400">
                                    {detail.target_camp_ref?.name ??
                                      getCampName(detail.target_camp)}
                                  </span>
                                  .
                                </p>
                              </div>

                              <div className="flex items-stretch gap-2">
                                <input
                                  type="date"
                                  value={approveSourceDate}
                                  min={getLocalMinDate()}
                                  onChange={(e) => {
                                    setApproveSourceDate(e.target.value);
                                    setApproveSourceError(null);
                                  }}
                                  aria-label="Select scheduled delivery date"
                                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 font-mono"
                                />
                                <button
                                  onClick={() => {
                                    if (approveSourceDate) {
                                      approveSrcMutation.mutate({
                                        id: detail.id,
                                        scheduled_delivery_date: datetimeLocalToUTCISO(
                                          `${approveSourceDate}T12:00`,
                                        ),
                                      });
                                    }
                                  }}
                                  disabled={!approveSourceDate || approveSrcMutation.isPending}
                                  aria-label="Confirm source approval with scheduled delivery date"
                                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase rounded transition-colors disabled:opacity-40 flex items-center gap-1.5 shadow-[0_0_16px_rgba(59,130,246,0.25)]"
                                >
                                  {approveSrcMutation.isPending ? (
                                    <Loader2 size={12} className="animate-spin" />
                                  ) : (
                                    'CONFIRM'
                                  )}
                                </button>
                                <button
                                  onClick={() => {
                                    setIsApprovingSource(false);
                                    setApproveSourceDate('');
                                    setApproveSourceError(null);
                                  }}
                                  aria-label="Cancel source approval"
                                  className="px-3 py-2 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors text-zinc-500 touch-target"
                                >
                                  <X size={13} />
                                </button>
                              </div>

                              {approveSourceError && (
                                <div className="flex items-center gap-2 text-red-400">
                                  <AlertTriangle size={12} className="shrink-0" />
                                  <p className="text-[10px] font-mono">{approveSourceError}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <button
                              onClick={() => setIsApprovingSource(true)}
                              disabled={approveSrcMutation.isPending}
                              aria-label="Approve this transfer at the source camp — requires delivery date"
                              className="w-full py-3 text-xs font-black uppercase bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-40 shadow-[0_0_16px_rgba(59,130,246,0.25)]"
                            >
                              <CheckCircle2 size={15} />
                              APPROVE (SOURCE)
                            </button>
                          ))}

                        {canRejectForDetail && (
                          <div className="flex gap-3">
                            <button
                              onClick={() => openRejectDialog(detail.id)}
                              aria-label="Reject this pending transfer request"
                              className="flex-1 py-3 text-xs font-black uppercase border border-red-500/40 text-red-500 bg-red-950/10 hover:bg-red-950/30 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                              <XCircle size={15} />
                              REJECT
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── APPROVED_SOURCE: edit delivery date ────────────────── */}
                    {detail.status === 'APPROVED_SOURCE' && (
                      <div className="space-y-3">
                        {canScheduleForDetail && (
                          <>
                            {isScheduling ? (
                              <div className="space-y-3 p-4 bg-zinc-900/60 border border-zinc-700/50 rounded-lg">
                                <div className="space-y-1">
                                  <p className="text-xs font-black text-zinc-300 uppercase tracking-wider">
                                    Update Delivery ETA
                                  </p>
                                  <p className="text-[10px] text-zinc-500 font-mono leading-relaxed">
                                    Change the estimated arrival date for this transfer.
                                  </p>
                                </div>

                                <div className="flex items-stretch gap-2">
                                  <input
                                    type="date"
                                    value={scheduleDate}
                                    min={getLocalMinDate()}
                                    onChange={(e) => {
                                      setScheduleDate(e.target.value);
                                      setScheduleError(null);
                                    }}
                                    aria-label="Select updated delivery date"
                                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary font-mono"
                                  />
                                  <button
                                    onClick={() => {
                                      if (scheduleDate) {
                                        scheduleMutation.mutate({
                                          id: detail.id,
                                          date: datetimeLocalToUTCISO(`${scheduleDate}T12:00`),
                                        });
                                      }
                                    }}
                                    disabled={!scheduleDate || scheduleMutation.isPending}
                                    aria-label="Update the scheduled delivery date"
                                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white text-xs font-black uppercase rounded transition-colors disabled:opacity-40 flex items-center gap-1.5"
                                  >
                                    {scheduleMutation.isPending ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      'UPDATE'
                                    )}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setIsScheduling(false);
                                      setScheduleDate('');
                                      setScheduleError(null);
                                    }}
                                    aria-label="Cancel scheduling and close date picker"
                                    className="px-3 py-2 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors text-zinc-500 touch-target"
                                  >
                                    <X size={13} />
                                  </button>
                                </div>
                                {scheduleError && (
                                  <div className="flex items-center gap-2 text-red-400">
                                    <AlertTriangle size={12} className="shrink-0" />
                                    <p className="text-[10px] font-mono">{scheduleError}</p>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <button
                                onClick={() => setIsScheduling(true)}
                                aria-label="Open date picker to update or set the delivery date"
                                className="px-4 py-2 text-xs font-bold uppercase border border-zinc-700 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 rounded transition-colors flex items-center gap-2"
                              >
                                <Calendar size={13} />
                                {detail.scheduled_delivery_date
                                  ? 'EDIT DELIVERY DATE'
                                  : 'SET DELIVERY DATE'}
                              </button>
                            )}
                          </>
                        )}

                        <div className="flex gap-3">
                          {canRejectForDetail && (
                            <button
                              onClick={() => openRejectDialog(detail.id)}
                              aria-label="Reject this source-approved transfer"
                              className="flex-1 py-3 text-xs font-black uppercase border border-red-500/40 text-red-500 bg-red-950/10 hover:bg-red-950/30 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                              <XCircle size={15} />
                              REJECT
                            </button>
                          )}
                          {canApproveTargetForDetail && (
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
                          )}
                        </div>
                      </div>
                    )}

                    {detail.status === 'APPROVED_TARGET' && (
                      <div className="space-y-3">
                        {activeDetailHasPeople && canCompleteForDetail && (
                          <div className="space-y-1.5 p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                            <label className="text-[10px] font-bold text-zinc-500 uppercase">
                              Personnel arrival status
                            </label>
                            <select
                              value={completionPersonStatus}
                              onChange={(e) =>
                                setCompletionPersonStatus(e.target.value as PersonStatus)
                              }
                              aria-label="Select status for transferred personnel after completion"
                              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 font-mono focus:outline-none focus:border-green-500"
                            >
                              {PEOPLE_TRANSFER_STATUSES.map((status) => (
                                <option key={status} value={status}>
                                  {status}
                                </option>
                              ))}
                            </select>
                            <p className="text-[9px] text-zinc-600 font-mono">
                              Applied by the backend when the people are registered at the
                              destination.
                            </p>
                          </div>
                        )}

                        <div className="flex gap-3">
                          {canRejectForDetail && (
                            <button
                              onClick={() => openRejectDialog(detail.id)}
                              aria-label="Reject this fully approved transfer"
                              className="flex-1 py-3 text-xs font-black uppercase border border-red-500/40 text-red-500 bg-red-950/10 hover:bg-red-950/30 rounded-lg transition-all flex items-center justify-center gap-2"
                            >
                              <XCircle size={15} />
                              REJECT
                            </button>
                          )}
                          {canCompleteForDetail && (
                            <button
                              onClick={() => openCompleteDialog(detail.id)}
                              aria-label="Mark this transfer as completed"
                              className="flex-2 py-3 text-xs font-black uppercase bg-green-700 hover:bg-green-600 text-white rounded-lg transition-all flex items-center justify-center gap-2 shadow-[0_0_16px_rgba(34,197,94,0.2)]"
                            >
                              <CheckCheck size={15} />
                              COMPLETE TRANSFER
                            </button>
                          )}
                        </div>
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
              className="bg-surface-raised brutalist-border p-4 sm:p-6 md:p-8 rounded-xl max-w-lg w-full max-h-[calc(100vh-2rem)] overflow-y-auto space-y-6 my-auto"
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
                    onChange={(e) => {
                      setTargetCamp(e.target.value ? Number(e.target.value) : null);
                      setCreateError(null);
                    }}
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
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setTransferType('RESOURCE');
                        setPersonItems([]);
                        setCreateError(null);
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
                      onClick={() => {
                        setTransferType('PERSON');
                        setCreateError(null);
                      }}
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
                    <button
                      type="button"
                      onClick={() => {
                        setTransferType('MIXED');
                        setCreateError(null);
                      }}
                      aria-label="Switch transfer type to mixed resources and personnel"
                      className={cn(
                        'flex-1 py-2 text-xs font-bold uppercase rounded border transition-all',
                        transferType === 'MIXED'
                          ? 'bg-blue-950/20 border-blue-500/30 text-blue-400'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-zinc-700',
                      )}
                    >
                      <Truck size={14} className="inline mr-1.5" />
                      MIXED
                    </button>
                  </div>
                </div>

                {/* Person selector (PERSON and MIXED transfers) */}
                {isPeopleTransfer && (
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
                      {(people ?? []).length > 0 && healthyPeople.length === 0 && (
                        <p className="col-span-2 text-[11px] text-zinc-600 font-mono text-center py-2">
                          No healthy personnel available.
                        </p>
                      )}
                      {healthyPeople.map((person) => (
                        <button
                          key={person.id}
                          type="button"
                          onClick={() => {
                            setCreateError(null);
                            setPersonItems((prev) =>
                              prev.includes(person.id)
                                ? prev.filter((id) => id !== person.id)
                                : [...prev, person.id],
                            );
                          }}
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
                            {person.profession_name || 'UNASSIGNED'} · {person.status}
                          </span>
                        </button>
                      ))}
                    </div>
                    <p className="text-[9px] text-zinc-600 font-mono">
                      PERSON and MIXED transfers require travel rations as resource items.
                    </p>
                  </div>
                )}

                {/* Resource rows (both types) */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      {transferType === 'PERSON'
                        ? 'Travel Rations'
                        : transferType === 'MIXED'
                          ? 'Resources and Travel Rations'
                          : 'Resources to Transfer'}{' '}
                      <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() =>
                        setResourceItems((prev) => [...prev, { resource_type_id: 0, amount: 0 }])
                      }
                      aria-label={`Add another ${isPeopleTransfer ? 'ration/resource' : 'resource'} item to the list`}
                      className="text-[10px] font-bold uppercase text-brand-primary hover:text-brand-primary/80 transition-colors flex items-center gap-1 touch-target"
                    >
                      <Plus size={11} />
                      ADD {isPeopleTransfer ? 'ITEM' : 'RESOURCE'}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
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
                              setCreateError(null);
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
                            min={0.01}
                            step={0.01}
                            value={item.amount || ''}
                            onChange={(e) => {
                              const updated = [...resourceItems];
                              updated[idx] = {
                                ...updated[idx],
                                amount: Number(e.target.value),
                              };
                              setResourceItems(updated);
                              setCreateError(null);
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
                  {isPeopleTransfer && (
                    <p className="text-[9px] text-zinc-600 font-mono">
                      Minimum travel ration rule: {RATIONS_PER_PERSON_FOR_TRAVEL} per person when{' '}
                      {RATION_RESOURCE_TYPE_NAME} is available in resources.
                    </p>
                  )}
                </div>

                {/* Notes */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Notes (optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => {
                      setNotes(e.target.value);
                      setCreateError(null);
                    }}
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
                      (isPeopleTransfer && personItems.length === 0) ||
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
              setRejectError(null);
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
                  onChange={(e) => {
                    setRejectReason(e.target.value);
                    setRejectError(null);
                  }}
                  placeholder="e.g. Insufficient supplies at source camp, critical shortage ongoing..."
                  rows={3}
                  maxLength={500}
                  autoFocus
                  className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-red-500 resize-none font-mono"
                />
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[9px] text-zinc-600 font-mono">
                    Required. Max 500 characters.
                  </p>
                  <p className="text-[9px] text-zinc-600 font-mono">{rejectReason.length}/500</p>
                </div>
                {rejectError && (
                  <div className="flex items-center gap-2 text-red-400">
                    <AlertTriangle size={12} className="shrink-0" />
                    <p className="text-[10px] font-mono">{rejectError}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setConfirmRejectId(null);
                    setRejectReason('');
                    setRejectError(null);
                  }}
                  disabled={rejectMutation.isPending}
                  aria-label="Cancel and close the rejection dialog"
                  className="flex-1 py-2 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase disabled:opacity-40"
                >
                  CANCEL
                </button>
                <button
                  onClick={() => {
                    if (
                      confirmRejectId &&
                      rejectReason.trim() &&
                      rejectReason.trim().length <= 500
                    ) {
                      rejectMutation.mutate({
                        id: confirmRejectId,
                        reason: rejectReason.trim(),
                      });
                    } else {
                      setRejectError(
                        'Rejection reason is required and must be 500 characters or less.',
                      );
                    }
                  }}
                  disabled={
                    rejectMutation.isPending ||
                    !rejectReason.trim() ||
                    rejectReason.trim().length > 500
                  }
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
        description={`Mark transfer #TRF-${String(confirmCompleteId ?? 0).padStart(4, '0')} as completed? All listed items will be recorded as received at the destination camp.${activeDetailHasPeople ? ` Transferred people will be registered as ${completionPersonStatus}.` : ''} This action cannot be undone.`}
        confirmLabel="COMPLETE TRANSFER"
        cancelLabel="CANCEL"
        variant="warning"
        isPending={completeMutation.isPending}
        onConfirm={() => {
          if (confirmCompleteId !== null) {
            completeMutation.mutate({
              id: confirmCompleteId,
              person_status: activeDetailHasPeople ? completionPersonStatus : undefined,
            });
          }
        }}
        onCancel={() => setConfirmCompleteId(null)}
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
