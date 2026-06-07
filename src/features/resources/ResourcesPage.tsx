import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useAuthStore } from '../../store';
import { hasPermission } from '../../lib/permissions';
import { Resource } from '../../types';
import { Package, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Skeleton } from '../../components/Skeleton';
import { Pagination } from '../../components/Pagination';
import { ActionFeedbackDialog, ActionFeedbackType } from '../../components/ActionFeedbackDialog';
import { getApiErrorMessage } from '../../lib/apiErrors';

const PAGE_SIZE = 9;
const RESOURCE_NAME_MAX_LENGTH = 80;
const RESOURCE_UNIT_MAX_LENGTH = 20;
const DAILY_RATION_MAX = 999999.99;
const MINIMUM_STOCK_MAX = 99999999.99;

interface ResourcesResponse {
  data: Resource[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasNextPage: boolean;
    totalPages: number;
  };
}

type ResourcePayload = {
  name: string;
  unit: string;
  daily_ration: number;
  minimum_stock: number;
  auto_daily: boolean;
};

type FieldErrors = {
  name?: string;
  unit?: string;
  dailyRation?: string;
  minimumStock?: string;
};

type ResourceFeedback = {
  type: ActionFeedbackType;
  title: string;
  message: string;
  actionLabel?: string;
};

type ApiLikeError = {
  response?: {
    status?: number;
    data?: {
      error?: {
        message?: unknown;
        details?: unknown;
      };
      message?: unknown;
    };
  };
};

const normalizeResourcesResponse = (responseData: unknown, page: number): ResourcesResponse => {
  if (Array.isArray(responseData)) {
    return {
      data: responseData as Resource[],
      pagination: {
        page,
        pageSize: PAGE_SIZE,
        total: responseData.length,
        hasNextPage: false,
        totalPages: Math.max(1, Math.ceil(responseData.length / PAGE_SIZE)),
      },
    };
  }

  const payload = responseData as Partial<ResourcesResponse> | undefined;
  const data = Array.isArray(payload?.data) ? payload.data : [];

  return {
    data,
    pagination: {
      page: payload?.pagination?.page ?? page,
      pageSize: payload?.pagination?.pageSize ?? PAGE_SIZE,
      total: payload?.pagination?.total ?? data.length,
      hasNextPage: payload?.pagination?.hasNextPage ?? false,
      totalPages:
        payload?.pagination?.totalPages ?? Math.max(1, Math.ceil(data.length / PAGE_SIZE)),
    },
  };
};

function extractValidationDetails(error: unknown) {
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

function getResourceActionErrorMessage(error: unknown, fallback: string) {
  const status = (error as ApiLikeError).response?.status;
  if (status === 403) return 'Your current role is not authorized to perform this action.';

  const validationDetails = extractValidationDetails(error);
  if (validationDetails) return validationDetails;

  const apiMessage = getApiErrorMessage(error, fallback);
  if (apiMessage === 'Cannot delete record with related records') {
    return 'Cannot delete record with related records. The backend kept this resource type because it is already linked to other records.';
  }

  return apiMessage;
}

function parseNonNegativeNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function invalidateResourceConsumers(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['resources'] });
  queryClient.invalidateQueries({ queryKey: ['resources-list'] });
  queryClient.invalidateQueries({ queryKey: ['inventory'] });
  queryClient.invalidateQueries({ queryKey: ['inventory-alerts'] });
  queryClient.invalidateQueries({ queryKey: ['resource-metrics'] });
  queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
}

export default function ResourcesPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [deletingResource, setDeletingResource] = useState<Resource | null>(null);
  const [page, setPage] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<ResourceFeedback | null>(null);

  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [dailyRation, setDailyRation] = useState('');
  const [minimumStock, setMinimumStock] = useState('');
  const [autoDaily, setAutoDaily] = useState(false);

  const canCreate = hasPermission(user?.permissions, 'resources.create');
  const canUpdate = hasPermission(user?.permissions, 'resources.update');
  const canDelete = hasPermission(user?.permissions, 'resources.delete');

  const {
    data: resourcesResponse,
    isLoading,
    isError,
    error: listError,
  } = useQuery<ResourcesResponse>({
    queryKey: ['resources', 'list', page, PAGE_SIZE],
    queryFn: async () => {
      const res = await apiClient.get('/resources', {
        params: { page, pageSize: PAGE_SIZE },
      });
      return normalizeResourcesResponse(res.data, page);
    },
    enabled: hasPermission(user?.permissions, 'resources.read'),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: ResourcePayload) => {
      const res = await apiClient.post('/resources', payload);
      return res.data as Resource;
    },
    onSuccess: (createdResource) => {
      invalidateResourceConsumers(queryClient);
      closeModal();
      setPage(1);
      setFeedback({
        type: 'success',
        title: 'RESOURCE CREATED',
        message: `${createdResource.name} was registered successfully.`,
      });
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: 'CREATE FAILED',
        message: getResourceActionErrorMessage(error, 'The resource type could not be created.'),
        actionLabel: 'REVIEW',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: ResourcePayload }) => {
      const res = await apiClient.put(`/resources/${id}`, payload);
      return res.data as Resource;
    },
    onSuccess: (updatedResource) => {
      invalidateResourceConsumers(queryClient);
      closeModal();
      setFeedback({
        type: 'success',
        title: 'RESOURCE UPDATED',
        message: `${updatedResource.name} was updated successfully.`,
      });
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: 'UPDATE FAILED',
        message: getResourceActionErrorMessage(error, 'The resource type could not be updated.'),
        actionLabel: 'REVIEW',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiClient.delete(`/resources/${id}`);
    },
    onSuccess: (_data, deletedResourceId) => {
      const deletedName =
        deletingResource?.name ??
        resourcesResponse?.data.find((resource) => resource.id === deletedResourceId)?.name;
      const resourcesOnPage = resourcesResponse?.data.length ?? 0;

      if (resourcesOnPage <= 1 && page > 1) {
        setPage((currentPage) => Math.max(1, currentPage - 1));
      }

      invalidateResourceConsumers(queryClient);
      setDeletingResource(null);
      setFeedback({
        type: 'success',
        title: 'RESOURCE DELETED',
        message: `${deletedName ?? 'The resource type'} was deleted successfully.`,
      });
    },
    onError: (error) => {
      setDeletingResource(null);
      setFeedback({
        type: 'error',
        title: 'DELETE FAILED',
        message: getResourceActionErrorMessage(error, 'The resource type could not be deleted.'),
        actionLabel: 'REVIEW',
      });
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingResource(null);
    setName('');
    setUnit('');
    setDailyRation('');
    setMinimumStock('');
    setAutoDaily(false);
    setFieldErrors({});
  };

  const openCreateModal = () => {
    setEditingResource(null);
    setName('');
    setUnit('');
    setDailyRation('');
    setMinimumStock('');
    setAutoDaily(false);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (resource: Resource) => {
    setEditingResource(resource);
    setName(resource.name);
    setUnit(resource.unit);
    setDailyRation(String(resource.daily_ration));
    setMinimumStock(String(resource.minimum_stock));
    setAutoDaily(resource.auto_daily);
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: FieldErrors = {};
    const trimmedName = name.trim();
    const trimmedUnit = unit.trim();
    const parsedDailyRation = parseNonNegativeNumber(dailyRation);
    const parsedMinimumStock = parseNonNegativeNumber(minimumStock);

    if (!trimmedName) {
      errors.name = 'Resource name is required.';
    } else if (trimmedName.length > RESOURCE_NAME_MAX_LENGTH) {
      errors.name = `Resource name cannot exceed ${RESOURCE_NAME_MAX_LENGTH} characters.`;
    }

    if (!trimmedUnit) {
      errors.unit = 'Unit is required.';
    } else if (trimmedUnit.length > RESOURCE_UNIT_MAX_LENGTH) {
      errors.unit = `Unit cannot exceed ${RESOURCE_UNIT_MAX_LENGTH} characters.`;
    }

    if (parsedDailyRation === null) {
      errors.dailyRation = 'Daily ration is required.';
    } else if (Number.isNaN(parsedDailyRation)) {
      errors.dailyRation = 'Daily ration must be numeric.';
    } else if (parsedDailyRation < 0) {
      errors.dailyRation = 'Daily ration must be zero or greater.';
    } else if (parsedDailyRation > DAILY_RATION_MAX) {
      errors.dailyRation = `Daily ration cannot exceed ${DAILY_RATION_MAX}.`;
    }

    if (parsedMinimumStock === null) {
      errors.minimumStock = 'Minimum stock is required.';
    } else if (Number.isNaN(parsedMinimumStock)) {
      errors.minimumStock = 'Minimum stock must be numeric.';
    } else if (parsedMinimumStock < 0) {
      errors.minimumStock = 'Minimum stock must be zero or greater.';
    } else if (parsedMinimumStock > MINIMUM_STOCK_MAX) {
      errors.minimumStock = `Minimum stock cannot exceed ${MINIMUM_STOCK_MAX}.`;
    }

    return errors;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setFeedback({
        type: 'warning',
        title: 'CHECK RESOURCE FORMAT',
        message: 'Correct the highlighted fields before submitting the resource type.',
        actionLabel: 'REVIEW',
      });
      return;
    }

    const payload = {
      name: name.trim(),
      unit: unit.trim(),
      daily_ration: Number(dailyRation),
      minimum_stock: Number(minimumStock),
      auto_daily: autoDaily,
    };

    if (editingResource) {
      updateMutation.mutate({ id: editingResource.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const resources = resourcesResponse?.data ?? [];
  const totalPages = resourcesResponse?.pagination.totalPages ?? 1;
  const currentPage = Math.min(page, totalPages);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-brand-primary">
            Resource Types
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
            Define resource categories, units, and ration parameters
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="bg-brand-primary hover:bg-brand-primary/95 text-black font-semibold uppercase tracking-wider px-6 py-2 rounded-md flex items-center gap-2 text-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            <Plus size={20} />
            NEW RESOURCE TYPE
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="p-6 bg-surface-raised/40 brutalist-border rounded-xl space-y-4">
              <Skeleton className="h-12 w-12 rounded-lg" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-1/3" />
              <Skeleton className="h-16 w-full rounded" />
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-zinc-500 brutalist-border bg-surface-raised/30 rounded-xl">
          <AlertCircle size={44} className="mb-4 text-red-500/70" />
          <p className="text-sm font-black uppercase tracking-wider text-zinc-300">
            Resource Catalog Unavailable
          </p>
          <p className="text-xs font-mono mt-2 max-w-md text-zinc-500">
            {getResourceActionErrorMessage(listError, 'Resource types could not be loaded.')}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {resources.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-600">
              <Package size={48} className="mb-4 opacity-30" />
              <p className="text-sm font-mono uppercase tracking-wider">
                No resource types defined
              </p>
              <p className="text-xs font-mono mt-1 text-zinc-700">
                Register the first resource type to begin cataloging supplies
              </p>
            </div>
          )}
          {resources.map((resource) => (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-raised brutalist-border p-6 rounded-xl flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-zinc-950 rounded-lg flex items-center justify-center text-zinc-500 border border-zinc-800">
                    <Package size={24} />
                  </div>
                  <div className="flex items-center gap-1">
                    {canUpdate && (
                      <button
                        onClick={() => openEditModal(resource)}
                        aria-label={`Edit ${resource.name}`}
                        title={`Edit ${resource.name}`}
                        className="p-1.5 sm:p-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:text-brand-secondary rounded transition-colors text-zinc-400 touch-target"
                      >
                        <Edit2 size={12} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setDeletingResource(resource)}
                        aria-label={`Delete ${resource.name}`}
                        title={`Delete ${resource.name}`}
                        className="p-1.5 sm:p-2 bg-zinc-950 border border-zinc-800 hover:border-red-500/50 hover:text-red-500 rounded transition-colors text-zinc-400 touch-target"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white">
                    {resource.name}
                  </h3>
                  <p className="text-xs font-mono text-zinc-500 mt-0.5">Unit: {resource.unit}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-zinc-950/60 rounded border border-zinc-900">
                    <p className="text-[9px] font-black uppercase text-zinc-600 tracking-wider mb-1">
                      Daily Ration
                    </p>
                    <p className="text-sm font-mono font-bold text-zinc-200">
                      {resource.daily_ration} {resource.unit}
                    </p>
                  </div>
                  <div className="p-3 bg-zinc-950/60 rounded border border-zinc-900">
                    <p className="text-[9px] font-black uppercase text-zinc-600 tracking-wider mb-1">
                      Min. Stock
                    </p>
                    <p className="text-sm font-mono font-bold text-zinc-200">
                      {resource.minimum_stock} {resource.unit}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border',
                      resource.auto_daily
                        ? 'bg-emerald-950/20 text-emerald-500 border-emerald-500/30'
                        : 'bg-zinc-950/20 text-zinc-500 border-zinc-500/30',
                    )}
                  >
                    {resource.auto_daily ? 'AUTO DAILY' : 'MANUAL RATION'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Pagination
        page={currentPage}
        totalPages={totalPages}
        onPageChange={setPage}
        showEdgeButtons
      />

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-surface-raised brutalist-border p-4 sm:p-6 md:p-8 rounded-xl max-w-lg w-full space-y-6"
            >
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
                <div>
                  <p className="text-[10px] font-mono text-brand-primary uppercase tracking-widest leading-none mb-1">
                    RESOURCE REGISTRY RR-07
                  </p>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    {editingResource ? 'Edit Resource Parameters' : 'Register New Resource Type'}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    Categorize supply types and set baseline consumption metrics across all refuges.
                  </p>
                </div>
                <button
                  onClick={closeModal}
                  aria-label="Close modal"
                  title="Close modal"
                  className="p-1 sm:p-2 text-zinc-500 hover:text-white border border-transparent hover:border-zinc-800 rounded transition-colors touch-target"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                <div className="rounded border border-zinc-800 bg-zinc-950/40 p-3 space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    Format requirements
                  </p>
                  <p className="text-[10px] font-mono leading-relaxed text-zinc-500">
                    Name is required and max {RESOURCE_NAME_MAX_LENGTH} characters. Unit is required
                    and max {RESOURCE_UNIT_MAX_LENGTH} characters. Daily ration and minimum stock
                    must be numeric values equal to or greater than zero.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Resource Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      aria-label="Resource name"
                      aria-invalid={Boolean(fieldErrors.name)}
                      value={name}
                      maxLength={RESOURCE_NAME_MAX_LENGTH}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldErrors.name) {
                          setFieldErrors((prev) => ({ ...prev, name: undefined }));
                        }
                      }}
                      placeholder="e.g. Canned Beans"
                      className={`w-full bg-zinc-950 border rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none ${
                        fieldErrors.name
                          ? 'border-red-500/60 focus:border-red-400'
                          : 'border-zinc-800 focus:border-brand-primary'
                      }`}
                    />
                    <p
                      className={`text-[10px] font-mono ${
                        fieldErrors.name ? 'text-red-400' : 'text-zinc-600'
                      }`}
                    >
                      {fieldErrors.name ??
                        `Required. ${name.trim().length}/${RESOURCE_NAME_MAX_LENGTH} characters.`}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Unit of Measure <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      aria-label="Unit of measure"
                      aria-invalid={Boolean(fieldErrors.unit)}
                      value={unit}
                      maxLength={RESOURCE_UNIT_MAX_LENGTH}
                      onChange={(e) => {
                        setUnit(e.target.value);
                        if (fieldErrors.unit) {
                          setFieldErrors((prev) => ({ ...prev, unit: undefined }));
                        }
                      }}
                      placeholder="e.g. kg, cans, liters"
                      className={`w-full bg-zinc-950 border rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none ${
                        fieldErrors.unit
                          ? 'border-red-500/60 focus:border-red-400'
                          : 'border-zinc-800 focus:border-brand-primary'
                      }`}
                    />
                    <p
                      className={`text-[10px] font-mono ${
                        fieldErrors.unit ? 'text-red-400' : 'text-zinc-600'
                      }`}
                    >
                      {fieldErrors.unit ??
                        `Required. ${unit.trim().length}/${RESOURCE_UNIT_MAX_LENGTH} characters.`}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Daily Ration per Person <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      max={DAILY_RATION_MAX}
                      step="0.01"
                      aria-label="Daily ration per person"
                      aria-invalid={Boolean(fieldErrors.dailyRation)}
                      value={dailyRation}
                      onChange={(e) => {
                        setDailyRation(e.target.value);
                        if (fieldErrors.dailyRation) {
                          setFieldErrors((prev) => ({ ...prev, dailyRation: undefined }));
                        }
                      }}
                      placeholder="e.g. 0.5"
                      className={`w-full bg-zinc-950 border rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none ${
                        fieldErrors.dailyRation
                          ? 'border-red-500/60 focus:border-red-400'
                          : 'border-zinc-800 focus:border-brand-primary'
                      }`}
                    />
                    <p
                      className={`text-[10px] font-mono ${
                        fieldErrors.dailyRation ? 'text-red-400' : 'text-zinc-600'
                      }`}
                    >
                      {fieldErrors.dailyRation ?? `Required. Numeric, 0 to ${DAILY_RATION_MAX}.`}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Minimum Stock Level <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="number"
                      min="0"
                      max={MINIMUM_STOCK_MAX}
                      step="0.01"
                      aria-label="Minimum stock level"
                      aria-invalid={Boolean(fieldErrors.minimumStock)}
                      value={minimumStock}
                      onChange={(e) => {
                        setMinimumStock(e.target.value);
                        if (fieldErrors.minimumStock) {
                          setFieldErrors((prev) => ({ ...prev, minimumStock: undefined }));
                        }
                      }}
                      placeholder="e.g. 100"
                      className={`w-full bg-zinc-950 border rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none ${
                        fieldErrors.minimumStock
                          ? 'border-red-500/60 focus:border-red-400'
                          : 'border-zinc-800 focus:border-brand-primary'
                      }`}
                    />
                    <p
                      className={`text-[10px] font-mono ${
                        fieldErrors.minimumStock ? 'text-red-400' : 'text-zinc-600'
                      }`}
                    >
                      {fieldErrors.minimumStock ?? `Required. Numeric, 0 to ${MINIMUM_STOCK_MAX}.`}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Ration Mode
                  </label>
                  <div className="flex items-center gap-3 p-3 bg-zinc-950/60 border border-zinc-900 rounded">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={autoDaily}
                        onChange={(e) => setAutoDaily(e.target.checked)}
                        className="accent-brand-primary"
                      />
                      <span className="text-xs text-zinc-300 font-mono font-bold">
                        AUTO DAILY - automatically deduct daily ration each cycle
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 py-2.5 bg-brand-primary text-black text-xs font-bold uppercase rounded hover:bg-brand-primary/90 transition-colors disabled:opacity-30"
                  >
                    {createMutation.isPending || updateMutation.isPending
                      ? 'PROCESSING...'
                      : editingResource
                        ? 'UPDATE REGISTRY'
                        : 'CONFIRM REGISTRATION'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {deletingResource && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              className="bg-surface-raised brutalist-border p-4 sm:p-6 md:p-8 rounded-xl max-w-md w-full space-y-6"
            >
              <div className="flex justify-between items-start border-b border-zinc-900 pb-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-red-950/40 rounded-lg flex items-center justify-center text-red-500 border border-red-500/20 shrink-0">
                    <AlertCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-xl font-black uppercase italic tracking-tighter">
                      Destructive Action
                    </h3>
                    <p className="text-xs text-zinc-500 font-mono">
                      This will permanently delete this resource type from the backend catalog.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-950/60 rounded border border-zinc-900">
                <p className="text-sm font-bold text-zinc-200">{deletingResource.name}</p>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  Unit: {deletingResource.unit} &middot; Daily ration:{' '}
                  {deletingResource.daily_ration} &middot; Min stock:{' '}
                  {deletingResource.minimum_stock}
                </p>
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingResource(null)}
                  className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                >
                  ABORT
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(deletingResource.id)}
                  disabled={deleteMutation.isPending}
                  className="flex-1 py-2.5 bg-red-600 text-white text-xs font-black uppercase rounded hover:bg-red-700 transition-colors disabled:opacity-30"
                >
                  {deleteMutation.isPending ? 'PURGING...' : 'CONFIRM DELETION'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ActionFeedbackDialog
        isOpen={Boolean(feedback)}
        type={feedback?.type ?? 'success'}
        title={feedback?.title ?? ''}
        message={feedback?.message ?? ''}
        actionLabel={feedback?.actionLabel}
        onClose={() => setFeedback(null)}
      />
    </div>
  );
}
