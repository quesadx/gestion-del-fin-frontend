import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, unwrapList } from '../../lib/api';
import { useAuthStore, useCampStore } from '../../store';
import { hasPermission } from '../../lib/permissions';
import { Camp } from '../../types';
import { Plus, Edit2, MapPin, Activity, X, Trash2, AlertTriangle, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';
import { Skeleton } from '../../components/Skeleton';
import { Pagination } from '../../components/Pagination';
import { ActionFeedbackDialog, ActionFeedbackType } from '../../components/ActionFeedbackDialog';
import { getApiErrorMessage } from '../../lib/apiErrors';

const PAGE_SIZE = 6;
const API_LIST_PAGE_SIZE = 100;
const CAMP_NAME_MAX_LENGTH = 100;
const CAMP_LOCATION_MAX_LENGTH = 100;

type CampStatus = 'ACTIVE' | 'ABANDONED';

const CAMP_STATUS_FILTERS: (CampStatus | 'ALL')[] = ['ALL', 'ACTIVE', 'ABANDONED'];

type CampPayload = {
  name: string;
  location?: string;
  status: CampStatus;
  ai_context_prompt?: string;
};

type FieldErrors = {
  name?: string;
  location?: string;
};

type CampFeedback = {
  type: ActionFeedbackType;
  title: string;
  message: string;
  actionLabel?: string;
};

const getTotalPagesFromResponse = (responseData: unknown) =>
  Math.max(
    1,
    Number((responseData as { pagination?: { totalPages?: number } })?.pagination?.totalPages) || 1,
  );

export default function CampManagement() {
  const { user } = useAuthStore();
  const { currentCampId, setCurrentCamp } = useCampStore();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCamp, setEditingCamp] = useState<Camp | null>(null);
  const [deletingCamp, setDeletingCamp] = useState<Camp | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<CampFeedback | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<CampStatus | 'ALL'>('ALL');

  // Form states
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState<CampStatus>('ACTIVE');
  const [aiPrompt, setAiPrompt] = useState('');

  const { data: camps, isLoading } = useQuery<Camp[]>({
    queryKey: ['camps', API_LIST_PAGE_SIZE],
    queryFn: async () => {
      const firstPage = await apiClient.get('/camps', {
        params: { page: 1, pageSize: API_LIST_PAGE_SIZE },
      });
      const firstPageItems = unwrapList<Camp>(firstPage.data);
      const totalPages = getTotalPagesFromResponse(firstPage.data);

      if (totalPages === 1) return firstPageItems;

      const remainingPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, async (_, index) => {
          const pageNumber = index + 2;
          const res = await apiClient.get('/camps', {
            params: { page: pageNumber, pageSize: API_LIST_PAGE_SIZE },
          });
          return unwrapList<Camp>(res.data);
        }),
      );

      return firstPageItems.concat(...remainingPages);
    },
    enabled: hasPermission(user?.permissions, 'camps.read'),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: CampPayload) => {
      const res = await apiClient.post('/camps', payload);
      return res.data;
    },
    onSuccess: (createdCamp: Camp) => {
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      closeModal();
      setPage(1);
      setFeedback({
        type: 'success',
        title: 'REFUGE REGISTERED',
        message: `${createdCamp.name} was created successfully.`,
      });
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: 'CREATE FAILED',
        message: getApiErrorMessage(error, 'The refuge could not be created.'),
        actionLabel: 'REVIEW',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: CampPayload }) => {
      const res = await apiClient.put(`/camps/${id}`, payload);
      return res.data;
    },
    onSuccess: (updatedCamp: Camp) => {
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      queryClient.invalidateQueries({ queryKey: ['camp', updatedCamp.id] });
      closeModal();
      setFeedback({
        type: 'success',
        title: 'REFUGE UPDATED',
        message: `${updatedCamp.name} was updated successfully.`,
      });
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: 'UPDATE FAILED',
        message: getApiErrorMessage(error, 'The refuge could not be updated.'),
        actionLabel: 'REVIEW',
      });
    },
  });

  const canCreate = hasPermission(user?.permissions, 'camps.create');
  const canUpdate = hasPermission(user?.permissions, 'camps.update');
  const canDelete = hasPermission(user?.permissions, 'camps.delete');

  const requestCampDeletion = (camp: Camp) => {
    if (camp.id === currentCampId) {
      setFeedback({
        type: 'warning',
        title: 'ACTIVE REFUGE',
        message: 'Select another refuge before deleting the one currently active in your session.',
        actionLabel: 'UNDERSTOOD',
      });
      return;
    }

    setDeleteError(null);
    setDeletingCamp(camp);
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/camps/${id}`);
      return res.data;
    },
    onSuccess: (_data, deletedId) => {
      const deletedName = deletingCamp?.name ?? `Refuge #${deletedId}`;
      queryClient.invalidateQueries({ queryKey: ['camps'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      if (currentCampId === deletedId) {
        setCurrentCamp(null);
      }
      setDeletingCamp(null);
      setDeleteError(null);
      setFeedback({
        type: 'success',
        title: 'REFUGE DELETED',
        message: `${deletedName} was deleted successfully.`,
      });
    },
    onError: (error: unknown) => {
      const msg = getApiErrorMessage(error, 'The refuge could not be deleted.');
      setDeleteError(msg);
      setFeedback({
        type: 'error',
        title: 'DELETE FAILED',
        message: msg,
        actionLabel: 'REVIEW',
      });
    },
  });

  const resetForm = () => {
    setName('');
    setLocation('');
    setStatus('ACTIVE');
    setAiPrompt('');
    setEditingCamp(null);
    setFieldErrors({});
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const openCreateModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (camp: Camp) => {
    setEditingCamp(camp);
    setName(camp.name);
    setLocation(camp.location || '');
    setStatus(camp.status);
    setAiPrompt(camp.ai_context_prompt || '');
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: FieldErrors = {};
    const trimmedName = name.trim();
    const trimmedLocation = location.trim();

    if (!trimmedName) {
      errors.name = 'Refuge title is required.';
    } else if (trimmedName.length > CAMP_NAME_MAX_LENGTH) {
      errors.name = `Refuge title cannot exceed ${CAMP_NAME_MAX_LENGTH} characters.`;
    }

    if (trimmedLocation.length > CAMP_LOCATION_MAX_LENGTH) {
      errors.location = `Location cannot exceed ${CAMP_LOCATION_MAX_LENGTH} characters.`;
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
        title: 'CHECK REFUGE FORMAT',
        message: 'Correct the highlighted fields before submitting the refuge.',
        actionLabel: 'REVIEW',
      });
      return;
    }

    const trimmedName = name.trim();
    const trimmedLocation = location.trim();
    const trimmedAiPrompt = aiPrompt.trim();

    const payload = {
      name: trimmedName,
      location: editingCamp ? trimmedLocation : trimmedLocation || undefined,
      status,
      ai_context_prompt: editingCamp ? trimmedAiPrompt : trimmedAiPrompt || undefined,
    };

    if (editingCamp) {
      updateMutation.mutate({ id: editingCamp.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const normalizedCampSearch = searchTerm.trim().toLowerCase();
  const isCampFiltering = normalizedCampSearch.length > 0 || statusFilter !== 'ALL';
  const filteredCamps = (camps ?? []).filter((camp) => {
    if (statusFilter !== 'ALL' && camp.status !== statusFilter) return false;
    if (!normalizedCampSearch) return true;

    return [camp.name, camp.location ?? '', camp.ai_context_prompt ?? '', `gf-${camp.id}`].some(
      (field) => field.toLowerCase().includes(normalizedCampSearch),
    );
  });
  const totalPages = Math.max(1, Math.ceil(filteredCamps.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedCamps = filteredCamps.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-brand-primary">
            Refuge Management
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
            Multi-Refuge Setup & Command Guidelines
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="bg-brand-primary hover:bg-brand-primary/95 text-black font-semibold uppercase tracking-wider px-6 py-2 rounded-md flex items-center gap-2 text-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            <Plus size={20} />
            REGISTER NEW REFUGE
          </button>
        )}
      </div>

      {hasPermission(user?.permissions, 'camps.read') && (
        <div className="bg-surface-raised brutalist-border rounded-xl p-3 sm:p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3">
            <div className="relative">
              <Search
                size={14}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-600"
              />
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setPage(1);
                }}
                placeholder="Filter by refuge name, location, or AI context"
                aria-label="Filter refuges by name, location, or AI context"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-9 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary font-mono uppercase"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as CampStatus | 'ALL');
                setPage(1);
              }}
              aria-label="Filter refuges by status"
              className="bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-[10px] text-zinc-300 focus:outline-none focus:border-brand-primary font-mono uppercase"
            >
              {CAMP_STATUS_FILTERS.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption === 'ALL' ? 'ALL STATUS' : statusOption}
                </option>
              ))}
            </select>
          </div>
          <p className="text-[10px] font-mono text-zinc-600 uppercase">
            {filteredCamps.length} refuges found - page {currentPage}/{totalPages}
          </p>
        </div>
      )}

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-pulse">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="p-6 bg-surface-raised/40 brutalist-border rounded-xl space-y-4">
              <div className="space-y-2">
                <Skeleton className="h-6 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </div>
              <Skeleton className="h-16 w-full rounded" />
              <div className="flex justify-between items-center pt-2">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-3 w-10" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {paginatedCamps.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-600">
              <MapPin size={48} className="mb-4 opacity-30" />
              <p className="text-sm font-mono uppercase tracking-wider">
                {isCampFiltering ? 'No refuges match the current filters' : 'No refuges registered'}
              </p>
              <p className="text-xs font-mono mt-1 text-zinc-700">
                {isCampFiltering
                  ? 'Adjust the filter criteria to review registered refuges'
                  : 'Register the first refuge to begin camp management'}
              </p>
            </div>
          )}
          {paginatedCamps.map((camp) => {
            const isActiveCamp = camp.id === currentCampId;

            return (
              <motion.div
                key={camp.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface-raised brutalist-border p-6 rounded-xl flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-xl font-black uppercase tracking-tight text-white group-hover:text-brand-primary">
                        {camp.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-zinc-500 font-mono mt-0.5">
                        <MapPin size={12} />
                        {camp.location || 'Undisclosed Sector'}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border',
                          camp.status === 'ACTIVE'
                            ? 'bg-emerald-950/20 text-emerald-500 border-emerald-500/30'
                            : 'bg-zinc-950/20 text-zinc-500 border-zinc-500/30',
                        )}
                      >
                        {camp.status}
                      </span>
                      {canUpdate && (
                        <button
                          onClick={() => openEditModal(camp)}
                          aria-label={`Edit ${camp.name}`}
                          title={`Edit ${camp.name}`}
                          className="p-1.5 sm:p-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:text-brand-secondary rounded transition-colors text-zinc-400 touch-target"
                        >
                          <Edit2 size={12} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => requestCampDeletion(camp)}
                          aria-label={`Delete ${camp.name}`}
                          title={
                            isActiveCamp
                              ? 'Select another refuge before deleting this one'
                              : `Delete ${camp.name}`
                          }
                          className={cn(
                            'p-1.5 sm:p-2 bg-zinc-950 border border-zinc-800 rounded transition-colors touch-target',
                            isActiveCamp
                              ? 'text-amber-500/80 border-amber-500/30 hover:border-amber-500/50'
                              : 'text-zinc-400 hover:border-red-500/50 hover:text-red-500',
                          )}
                        >
                          <Trash2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-3 bg-zinc-950/60 rounded border border-zinc-900 font-mono text-[11px] leading-relaxed text-zinc-400">
                    <p className="text-[9px] font-black uppercase text-zinc-600 tracking-wider mb-1">
                      Stability AI Overwatch Focus Context
                    </p>
                    <p className="italic">
                      "
                      {camp.ai_context_prompt ||
                        'No override prompt defined. Standard quarantine measures active.'}
                      "
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 border-t border-zinc-900/50 pt-3">
                  <span>
                    REFUGE SIGNATURE ID // GF-
                    {camp.id.toString().padStart(3, '0')}
                  </span>
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/camps/${camp.id}`}
                      className="text-brand-primary hover:text-brand-primary/80 font-bold uppercase tracking-wider transition-colors"
                    >
                      VIEW DETAILS
                    </Link>
                    <span className="flex items-center gap-1">
                      <Activity size={10} className="text-emerald-500 animate-pulse" />
                      ONLINE
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />

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
                    COMMAND LOGISTIC CL-40
                  </p>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    {editingCamp ? 'Configure Refuge Parameters' : 'Register New Survival Center'}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    Setup defensive rules and allocation directives across Sector 04.
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
                    Refuge title is required and max {CAMP_NAME_MAX_LENGTH} characters. Location is
                    optional and max {CAMP_LOCATION_MAX_LENGTH} characters. Status must be ACTIVE or
                    ABANDONED. AI context is optional.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Refuge Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      aria-label="Refuge title"
                      aria-invalid={Boolean(fieldErrors.name)}
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        if (fieldErrors.name) {
                          setFieldErrors((prev) => ({ ...prev, name: undefined }));
                        }
                      }}
                      placeholder="e.g. Sector-9 Outpost"
                      className={cn(
                        'w-full bg-zinc-950 border rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none',
                        fieldErrors.name
                          ? 'border-red-500/60 focus:border-red-400'
                          : 'border-zinc-800 focus:border-brand-primary',
                      )}
                    />
                    <p
                      className={cn(
                        'text-[10px] font-mono',
                        fieldErrors.name ? 'text-red-400' : 'text-zinc-600',
                      )}
                    >
                      {fieldErrors.name ??
                        `Required. ${name.trim().length}/${CAMP_NAME_MAX_LENGTH} characters.`}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Geographical Location (Optional)
                    </label>
                    <input
                      type="text"
                      aria-label="Geographical location"
                      aria-invalid={Boolean(fieldErrors.location)}
                      value={location}
                      onChange={(e) => {
                        setLocation(e.target.value);
                        if (fieldErrors.location) {
                          setFieldErrors((prev) => ({ ...prev, location: undefined }));
                        }
                      }}
                      placeholder="e.g. Colorado High Sierra"
                      className={cn(
                        'w-full bg-zinc-950 border rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none',
                        fieldErrors.location
                          ? 'border-red-500/60 focus:border-red-400'
                          : 'border-zinc-800 focus:border-brand-primary',
                      )}
                    />
                    <p
                      className={cn(
                        'text-[10px] font-mono',
                        fieldErrors.location ? 'text-red-400' : 'text-zinc-600',
                      )}
                    >
                      {fieldErrors.location ??
                        `Optional. ${location.trim().length}/${CAMP_LOCATION_MAX_LENGTH} characters.`}
                    </p>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Overwatch Status
                  </label>
                  <select
                    aria-label="Overwatch status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'ABANDONED')}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-brand-primary cursor-pointer"
                  >
                    <option value="ACTIVE">ACTIVE - SYSTEM OVERWATCH FUNCTIONAL</option>
                    <option value="ABANDONED">ABANDONED - OFF-GRID EMPTY SECTOR</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    AI stability intelligence context prompt
                  </label>
                  <textarea
                    aria-label="AI stability intelligence context prompt"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Focus directives (e.g. community survival, medical prioritize, strict resource rationing, military lockdown...)"
                    rows={4}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary resize-none"
                  />
                  <span className="text-[9px] font-mono text-zinc-600 block leading-tight">
                    This directly parameters the screening algorithm deciding the Admission intake
                    process.
                  </span>
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
                      ? 'PROCESSING DICTIONARY...'
                      : 'CONFIRM SECTOR DISPATCH'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {deletingCamp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-surface-raised brutalist-border rounded-xl p-4 sm:p-6 max-w-sm w-full space-y-5"
          >
            <div className="flex items-start gap-4">
              <div className="p-2 rounded-lg shrink-0 bg-red-950/30 text-red-500">
                <AlertTriangle size={20} />
              </div>
              <div className="space-y-1 pt-0.5">
                <h3 className="font-black uppercase tracking-tight text-sm">Delete Refuge</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                  Permanently delete <strong>{deletingCamp.name}</strong>? This action cannot be
                  undone. Deletion will fail if the camp still has associated people, inventory,
                  expeditions, or transfers.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="p-3 bg-red-950/30 border border-red-500/30 rounded-lg">
                <p className="text-xs text-red-400 font-mono">{deleteError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setDeletingCamp(null);
                  setDeleteError(null);
                }}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase disabled:opacity-40"
              >
                CANCEL
              </button>
              <button
                onClick={() => deleteMutation.mutate(deletingCamp.id)}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2 text-xs font-black uppercase rounded transition-colors disabled:opacity-40 bg-red-600 hover:bg-red-500 text-white"
              >
                {deleteMutation.isPending ? 'DELETING...' : 'CONFIRM DELETE'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {feedback && (
        <ActionFeedbackDialog
          isOpen={true}
          type={feedback.type}
          eyebrow="Refuge Command"
          title={feedback.title}
          message={feedback.message}
          actionLabel={feedback.actionLabel}
          onClose={() => setFeedback(null)}
        />
      )}
    </div>
  );
}
