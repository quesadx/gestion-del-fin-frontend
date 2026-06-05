import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../lib/api';
import { useAuthStore } from '../../store';
import { hasPermission } from '../../lib/permissions';
import { Profession } from '../../types';
import { Wrench, Plus, Edit2, Trash2, X, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '../../components/Skeleton';
import { Pagination } from '../../components/Pagination';
import { ActionFeedbackDialog, ActionFeedbackType } from '../../components/ActionFeedbackDialog';
import { getApiErrorMessage } from '../../lib/apiErrors';

const PAGE_SIZE = 9;
const API_LIST_PAGE_SIZE = 100;
const PROFESSION_NAME_MAX_LENGTH = 80;

interface ProfessionsResponse {
  data: Profession[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    hasNextPage: boolean;
    totalPages: number;
  };
}

type FieldErrors = {
  name?: string;
};

type ProfessionFeedback = {
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

const normalizeProfessionsResponse = (responseData: unknown, page: number): ProfessionsResponse => {
  if (Array.isArray(responseData)) {
    return {
      data: responseData as Profession[],
      pagination: {
        page,
        pageSize: API_LIST_PAGE_SIZE,
        total: responseData.length,
        hasNextPage: false,
        totalPages: Math.max(1, Math.ceil(responseData.length / PAGE_SIZE)),
      },
    };
  }

  const payload = responseData as Partial<ProfessionsResponse> | undefined;
  const data = Array.isArray(payload?.data) ? payload.data : [];

  return {
    data,
    pagination: {
      page: payload?.pagination?.page ?? page,
      pageSize: payload?.pagination?.pageSize ?? API_LIST_PAGE_SIZE,
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

function getProfessionActionErrorMessage(error: unknown, fallback: string) {
  const status = (error as ApiLikeError).response?.status;
  if (status === 403) return 'Your current role is not authorized to perform this action.';

  const validationDetails = extractValidationDetails(error);
  if (validationDetails) return validationDetails;

  return getApiErrorMessage(error, fallback);
}

export default function ProfessionsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProfession, setEditingProfession] = useState<Profession | null>(null);
  const [deletingProfession, setDeletingProfession] = useState<Profession | null>(null);
  const [page, setPage] = useState(1);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [feedback, setFeedback] = useState<ProfessionFeedback | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const canCreate = hasPermission(user?.permissions, 'professions.create');
  const canUpdate = hasPermission(user?.permissions, 'professions.update');
  const canDelete = hasPermission(user?.permissions, 'professions.delete');

  const { data: professionsResponse, isLoading } = useQuery<ProfessionsResponse>({
    queryKey: ['professions', 'list', API_LIST_PAGE_SIZE],
    queryFn: async () => {
      const res = await apiClient.get('/professions', {
        params: { page: 1, pageSize: API_LIST_PAGE_SIZE },
      });
      return normalizeProfessionsResponse(res.data, 1);
    },
    enabled: hasPermission(user?.permissions, 'professions.read'),
  });

  const createMutation = useMutation({
    mutationFn: async (payload: { name: string; description?: string }) => {
      const res = await apiClient.post('/professions', payload);
      return res.data;
    },
    onSuccess: (createdProfession: Profession) => {
      queryClient.invalidateQueries({ queryKey: ['professions'] });
      closeModal();
      setPage(1);
      setFeedback({
        type: 'success',
        title: 'PROFESSION CREATED',
        message: `${createdProfession.name} was registered successfully.`,
      });
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: 'CREATE FAILED',
        message: getProfessionActionErrorMessage(error, 'The profession could not be registered.'),
        actionLabel: 'REVIEW',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: number;
      payload: { name: string; description?: string };
    }) => {
      const res = await apiClient.put(`/professions/${id}`, payload);
      return res.data;
    },
    onSuccess: (updatedProfession: Profession) => {
      queryClient.invalidateQueries({ queryKey: ['professions'] });
      closeModal();
      setFeedback({
        type: 'success',
        title: 'PROFESSION UPDATED',
        message: `${updatedProfession.name} was updated successfully.`,
      });
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: 'UPDATE FAILED',
        message: getProfessionActionErrorMessage(error, 'The profession could not be updated.'),
        actionLabel: 'REVIEW',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiClient.delete(`/professions/${id}`);
      return res.data;
    },
    onSuccess: (_data, deletedProfessionId) => {
      const deletedName =
        deletingProfession?.name ??
        professionsResponse?.data.find((profession) => profession.id === deletedProfessionId)?.name;
      queryClient.invalidateQueries({ queryKey: ['professions'] });
      setDeletingProfession(null);
      setFeedback({
        type: 'success',
        title: 'PROFESSION DELETED',
        message: `${deletedName ?? 'The profession'} was deleted successfully.`,
      });
    },
    onError: (error) => {
      setDeletingProfession(null);
      setFeedback({
        type: 'error',
        title: 'DELETE FAILED',
        message: getProfessionActionErrorMessage(error, 'The profession could not be deleted.'),
        actionLabel: 'REVIEW',
      });
    },
  });

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProfession(null);
    setName('');
    setDescription('');
    setFieldErrors({});
  };

  const openCreateModal = () => {
    setEditingProfession(null);
    setName('');
    setDescription('');
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const openEditModal = (profession: Profession) => {
    setEditingProfession(profession);
    setName(profession.name);
    setDescription(profession.description || '');
    setFieldErrors({});
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const errors: FieldErrors = {};
    const trimmedName = name.trim();

    if (!trimmedName) {
      errors.name = 'Profession name is required.';
    } else if (trimmedName.length > PROFESSION_NAME_MAX_LENGTH) {
      errors.name = `Profession name cannot exceed ${PROFESSION_NAME_MAX_LENGTH} characters.`;
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
        title: 'CHECK PROFESSION FORMAT',
        message: 'Correct the highlighted fields before submitting the profession.',
        actionLabel: 'REVIEW',
      });
      return;
    }

    const trimmedDescription = description.trim();
    const payload = {
      name: name.trim(),
      description: editingProfession ? trimmedDescription : trimmedDescription || undefined,
    };

    if (editingProfession) {
      updateMutation.mutate({ id: editingProfession.id, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const professions = professionsResponse?.data ?? [];
  const totalPages = Math.max(1, Math.ceil(professions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedProfessions = professions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-brand-primary">
            Professions
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
            Define profession types across the population
          </p>
        </div>
        {canCreate && (
          <button
            onClick={openCreateModal}
            className="bg-brand-primary hover:bg-brand-primary/95 text-black font-semibold uppercase tracking-wider px-6 py-2 rounded-md flex items-center gap-2 text-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)]"
          >
            <Plus size={20} />
            NEW PROFESSION
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
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {professions.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 text-zinc-600">
              <Wrench size={48} className="mb-4 opacity-30" />
              <p className="text-sm font-mono uppercase tracking-wider">No professions defined</p>
              <p className="text-xs font-mono mt-1 text-zinc-700">
                Register the first profession to begin cataloging roles
              </p>
            </div>
          )}
          {paginatedProfessions.map((profession) => (
            <motion.div
              key={profession.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-surface-raised brutalist-border p-6 rounded-xl flex flex-col justify-between space-y-4 hover:border-zinc-700 transition-colors"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start">
                  <div className="w-12 h-12 bg-zinc-950 rounded-lg flex items-center justify-center text-zinc-500 border border-zinc-800">
                    <Wrench size={24} />
                  </div>
                  <div className="flex items-center gap-1">
                    {canUpdate && (
                      <button
                        onClick={() => openEditModal(profession)}
                        aria-label={`Edit ${profession.name}`}
                        title={`Edit ${profession.name}`}
                        className="p-1.5 sm:p-2 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 hover:text-brand-secondary rounded transition-colors text-zinc-400 touch-target"
                      >
                        <Edit2 size={12} />
                      </button>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => setDeletingProfession(profession)}
                        aria-label={`Delete ${profession.name}`}
                        title={`Delete ${profession.name}`}
                        className="p-1.5 sm:p-2 bg-zinc-950 border border-zinc-800 hover:border-red-500/50 hover:text-red-500 rounded transition-colors text-zinc-400 touch-target"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight text-white">
                    {profession.name}
                  </h3>
                  {profession.description && (
                    <p className="text-xs font-mono text-zinc-500 mt-1 leading-relaxed">
                      {profession.description}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
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
                    PERSONNEL DIRECTIVE PD-03
                  </p>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    {editingProfession ? 'Edit Profession' : 'Register New Profession'}
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    Define specialized roles across all refuge populations.
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
                    Profession name is required and max {PROFESSION_NAME_MAX_LENGTH} characters.
                    Description is optional.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Profession Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    required
                    type="text"
                    aria-label="Profession name"
                    aria-invalid={Boolean(fieldErrors.name)}
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (fieldErrors.name) {
                        setFieldErrors((prev) => ({ ...prev, name: undefined }));
                      }
                    }}
                    placeholder="e.g. Medic, Engineer, Scout"
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
                      `Required. ${name.trim().length}/${PROFESSION_NAME_MAX_LENGTH} characters.`}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Description
                  </label>
                  <textarea
                    aria-label="Profession description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Brief role description and typical duties"
                    rows={3}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary resize-none"
                  />
                  <p className="text-[10px] font-mono text-zinc-600">
                    Optional. The backend stores this text trimmed.
                  </p>
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
                      : editingProfession
                        ? 'UPDATE RECORD'
                        : 'CONFIRM REGISTRATION'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {deletingProfession && (
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
                      This will permanently delete this profession from all refuge registries.
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-zinc-950/60 rounded border border-zinc-900">
                <p className="text-sm font-bold text-zinc-200">{deletingProfession.name}</p>
                {deletingProfession.description && (
                  <p className="text-xs text-zinc-500 font-mono mt-1">
                    {deletingProfession.description}
                  </p>
                )}
              </div>

              <div className="flex gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setDeletingProfession(null)}
                  className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                >
                  ABORT
                </button>
                <button
                  type="button"
                  onClick={() => deleteMutation.mutate(deletingProfession.id)}
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

      {feedback && (
        <ActionFeedbackDialog
          isOpen={true}
          type={feedback.type}
          eyebrow="Personnel Directive"
          title={feedback.title}
          message={feedback.message}
          actionLabel={feedback.actionLabel}
          onClose={() => setFeedback(null)}
        />
      )}
    </div>
  );
}
