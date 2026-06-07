import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, toFormData, unwrapList } from '../../lib/api';
import { useAuthStore, useCampStore } from '../../store';
import { hasPermission } from '../../lib/permissions';
import { Admission } from '../../types';
import {
  AlertTriangle,
  BrainCircuit,
  ShieldAlert,
  UserPlus,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatDate } from '../../lib/utils';
import { Skeleton, SkeletonList } from '../../components/Skeleton';
import { Pagination } from '../../components/Pagination';

const PAGE_SIZE = 15;
const API_LIST_PAGE_SIZE = 100;
const CORRECTED_INTAKE_ARCHIVE_REASON = 'CORRECTED_INTAKE_ARCHIVE';
const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

type AdmissionStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED';
type AdmissionStatusFilter = 'ALL' | AdmissionStatus;
type FeedbackType = 'success' | 'error' | 'warning';
type AdmissionDecisionSource = 'AI' | 'MANUAL' | 'PENDING';

interface AdmissionFormDraft {
  name: string;
  age: string;
  skills: string;
  health: string;
  background: string;
  photo?: File | null;
  idCard?: File | null;
}

interface AdmissionFeedback {
  type: FeedbackType;
  title: string;
  message: string;
  actionLabel?: string;
}

interface AdmissionPayload {
  applicant_name: string;
  applicant_age?: number;
  applicant_skills?: string;
  health_notes?: string;
  background_notes?: string;
  photo?: File | null;
  id_card?: File | null;
}

type AdmissionPayloadResult = { ok: true; values: AdmissionPayload } | { ok: false; error: string };

const getAdmissionDecisionStatus = (admission?: Partial<Admission> | null): AdmissionStatus => {
  const rawStatus = admission?.final_decision?.toString().toUpperCase();

  if (rawStatus === 'APPROVED') return 'ACCEPTED';
  if (rawStatus === 'ACCEPTED' || rawStatus === 'REJECTED') return rawStatus;
  return 'PENDING';
};

const getAdmissionDecisionSource = (
  admission?: Partial<Admission> | null,
): AdmissionDecisionSource => {
  if (admission?.admitted_by?.toString().toUpperCase() === 'AI') return 'AI';
  if (admission?.reviewed_by != null || admission?.reviewed_at) return 'MANUAL';
  return 'PENDING';
};

const getAdmissionDecisionSourceMeta = (admission?: Partial<Admission> | null) => {
  const source = getAdmissionDecisionSource(admission);

  if (source === 'AI') {
    return {
      label: 'AI AUTO',
      detailLabel: 'AI auto-admission',
      description: 'The applicant was accepted automatically by the AI evaluation flow.',
      icon: BrainCircuit,
      className: 'bg-brand-primary/10 text-brand-primary border-brand-primary/30',
    };
  }

  if (source === 'MANUAL') {
    return {
      label: 'MANUAL',
      detailLabel: 'Manual review',
      description: 'The final decision was registered by an authorized reviewer.',
      icon: CheckCircle2,
      className: 'bg-zinc-950/50 text-zinc-300 border-zinc-700/70',
    };
  }

  return {
    label: 'PENDING REVIEW',
    detailLabel: 'Pending review',
    description: 'The intake is waiting for a final authorized decision.',
    icon: AlertTriangle,
    className: 'bg-amber-950/20 text-amber-500 border-amber-500/30',
  };
};

const isArchivedCorrectedIntake = (admission: Partial<Admission>) =>
  getAdmissionDecisionStatus(admission) === 'REJECTED' &&
  admission.correction_reason === CORRECTED_INTAKE_ARCHIVE_REASON;

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as {
    response?: { data?: { error?: { message?: unknown }; message?: unknown } };
    message?: unknown;
  };
  const message =
    apiError.response?.data?.error?.message ?? apiError.response?.data?.message ?? apiError.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
};

const validateImageFile = (file: File | null | undefined, label: string) => {
  if (!file) return null;
  if (!file.type.startsWith('image/')) return `${label} must be an image file.`;
  if (file.size > MAX_IMAGE_SIZE_BYTES) return `${label} must be 10MB or smaller.`;
  return null;
};

const buildAdmissionPayload = (draft: AdmissionFormDraft): AdmissionPayloadResult => {
  const applicantName = draft.name.trim();
  const applicantSkills = draft.skills.trim();
  const healthNotes = draft.health.trim();
  const backgroundNotes = draft.background.trim();
  const ageInput = draft.age.trim();
  const age = ageInput ? Number(ageInput) : undefined;

  if (!applicantName) return { ok: false, error: 'Applicant full name is required.' };
  if (applicantName.length > 150)
    return { ok: false, error: 'Applicant full name must be 150 characters or less.' };
  if (age != null && (!Number.isInteger(age) || age < 0 || age > 255)) {
    return { ok: false, error: 'Age must be a whole number from 0 to 255.' };
  }

  const photoError = validateImageFile(draft.photo, 'Applicant photo');
  if (photoError) return { ok: false, error: photoError };

  const idCardError = validateImageFile(draft.idCard, 'ID card');
  if (idCardError) return { ok: false, error: idCardError };

  return {
    ok: true,
    values: {
      applicant_name: applicantName,
      ...(age != null ? { applicant_age: age } : {}),
      ...(applicantSkills ? { applicant_skills: applicantSkills } : {}),
      ...(healthNotes ? { health_notes: healthNotes } : {}),
      ...(backgroundNotes ? { background_notes: backgroundNotes } : {}),
      photo: draft.photo,
      id_card: draft.idCard,
    },
  };
};

export default function AdmissionList() {
  const { currentCampId } = useCampStore();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const canReevaluate =
    hasPermission(user?.permissions, 'admission.create') &&
    hasPermission(user?.permissions, 'admission.review');
  const canCreate = hasPermission(user?.permissions, 'admission.create');
  const canReview = hasPermission(user?.permissions, 'admission.review');
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<number | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<AdmissionStatusFilter>('ALL');
  const [feedback, setFeedback] = useState<AdmissionFeedback | null>(null);

  // Form states for register intake
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState('');
  const [newSkills, setNewSkills] = useState('');
  const [newHealth, setNewHealth] = useState('');
  const [newBackground, setNewBackground] = useState('');
  const [newPhoto, setNewPhoto] = useState<File | null>(null);
  const [newIdCard, setNewIdCard] = useState<File | null>(null);
  const [createFormError, setCreateFormError] = useState<string | null>(null);

  const [selectedProfId, setSelectedProfId] = useState<number | null>(null);

  const [isCorrectModalOpen, setIsCorrectModalOpen] = useState(false);
  const [correctName, setCorrectName] = useState('');
  const [correctAge, setCorrectAge] = useState('');
  const [correctSkills, setCorrectSkills] = useState('');
  const [correctHealth, setCorrectHealth] = useState('');
  const [correctBackground, setCorrectBackground] = useState('');
  const [correctPhoto, setCorrectPhoto] = useState<File | null>(null);
  const [correctIdCard, setCorrectIdCard] = useState<File | null>(null);
  const [correctFormError, setCorrectFormError] = useState<string | null>(null);

  const { data: admissions, isLoading } = useQuery<Admission[]>({
    queryKey: ['admissions', currentCampId, API_LIST_PAGE_SIZE],
    queryFn: async () => {
      const firstPage = await apiClient.get(`/admission/camps/${currentCampId}`, {
        params: { page: 1, pageSize: API_LIST_PAGE_SIZE },
      });
      const firstPageItems = unwrapList<Admission>(firstPage.data);
      const totalPages = Math.max(
        1,
        Number(
          (firstPage.data as { pagination?: { totalPages?: number } })?.pagination?.totalPages,
        ) || 1,
      );

      if (totalPages === 1) return firstPageItems;

      const remainingPages = await Promise.all(
        Array.from({ length: totalPages - 1 }, async (_, index) => {
          const pageNumber = index + 2;
          const res = await apiClient.get(`/admission/camps/${currentCampId}`, {
            params: { page: pageNumber, pageSize: API_LIST_PAGE_SIZE },
          });
          return unwrapList<Admission>(res.data);
        }),
      );

      return firstPageItems.concat(...remainingPages);
    },
    enabled: !!currentCampId && hasPermission(user?.permissions, 'admission.read'),
  });
  const activeAdmissions = useMemo(
    () => (admissions ?? []).filter((admission) => !isArchivedCorrectedIntake(admission)),
    [admissions],
  );
  const statusCounts = useMemo(
    () =>
      activeAdmissions.reduce(
        (counts, admission) => {
          counts[getAdmissionDecisionStatus(admission)] += 1;
          counts.ALL += 1;
          return counts;
        },
        { ALL: 0, PENDING: 0, ACCEPTED: 0, REJECTED: 0 } as Record<AdmissionStatusFilter, number>,
      ),
    [activeAdmissions],
  );
  const filteredAdmissions = useMemo(
    () =>
      statusFilter === 'ALL'
        ? activeAdmissions
        : activeAdmissions.filter(
            (admission) => getAdmissionDecisionStatus(admission) === statusFilter,
          ),
    [activeAdmissions, statusFilter],
  );
  const totalPages = Math.max(1, Math.ceil(filteredAdmissions.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paginatedAdmissions = filteredAdmissions.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const { data: details, isLoading: detailsLoading } = useQuery({
    queryKey: ['admission-details', selectedAdmissionId],
    queryFn: async () => {
      const res = await apiClient.get(`/admission/${selectedAdmissionId}`);
      return res.data;
    },
    enabled: !!selectedAdmissionId && hasPermission(user?.permissions, 'admission.read'),
  });

  // Fetch professions dynamically for the correction select
  const { data: professions } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['professions', 'admission-selector', API_LIST_PAGE_SIZE],
    queryFn: async () => {
      const res = await apiClient.get('/professions', {
        params: { page: 1, pageSize: API_LIST_PAGE_SIZE },
      });
      return unwrapList<{ id: number; name: string }>(res.data);
    },
    enabled: hasPermission(user?.permissions, 'professions.read'),
  });

  const reviewMutation = useMutation({
    mutationFn: async ({
      id,
      decision,
      corrected_profession_id,
      applicantName,
    }: {
      id: number;
      decision: 'ACCEPTED' | 'REJECTED';
      corrected_profession_id?: number;
      applicantName?: string;
    }) => {
      const res = await apiClient.patch(`/admission/${id}/review`, {
        final_decision: decision,
        ...(corrected_profession_id != null ? { corrected_profession_id } : {}),
      });
      return { admission: res.data as Admission, decision, applicantName };
    },
    onSuccess: ({ decision, applicantName }) => {
      queryClient.invalidateQueries({ queryKey: ['admissions', currentCampId] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      setSelectedAdmissionId(null);
      setFeedback(
        decision === 'ACCEPTED'
          ? {
              type: 'success',
              title: 'ADMISSION ACCEPTED',
              message: `${applicantName || 'The applicant'} is now part of the active camp roster.`,
            }
          : {
              type: 'warning',
              title: 'ADMISSION REJECTED',
              message: `${applicantName || 'The applicant'} was rejected. No camp roster record was created.`,
            },
      );
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: 'REVIEW FAILED',
        message: getApiErrorMessage(error, 'The admission review could not be completed.'),
      });
    },
  });

  const createAdmissionMutation = useMutation({
    mutationFn: async (formValues: AdmissionPayload) => {
      const body = toFormData({
        applicant_name: formValues.applicant_name,
        applicant_age: formValues.applicant_age,
        applicant_skills: formValues.applicant_skills,
        health_notes: formValues.health_notes,
        background_notes: formValues.background_notes,
        ...(formValues.photo ? { photo: formValues.photo } : {}),
        ...(formValues.id_card ? { id_card: formValues.id_card } : {}),
      });
      const res = await apiClient.post(`/admission/camps/${currentCampId}`, body);
      return res.data as Admission;
    },
    onSuccess: (admission) => {
      queryClient.invalidateQueries({
        queryKey: ['admissions', currentCampId],
      });
      if (getAdmissionDecisionSource(admission) === 'AI') {
        queryClient.invalidateQueries({ queryKey: ['people'] });
      }
      setIsCreateModalOpen(false);
      setCreateFormError(null);
      setNewName('');
      setNewAge('');
      setNewSkills('');
      setNewHealth('');
      setNewBackground('');
      setNewPhoto(null);
      setNewIdCard(null);
      setFeedback({
        type: 'success',
        title:
          getAdmissionDecisionSource(admission) === 'AI'
            ? 'AI ADMISSION ACCEPTED'
            : 'INTAKE REGISTERED',
        message:
          getAdmissionDecisionSource(admission) === 'AI'
            ? `${admission.applicant_name || 'The applicant'} was accepted automatically by AI and added to the camp roster.`
            : 'The applicant was submitted to the automated evaluation queue.',
      });
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, 'The intake could not be registered.');
      setCreateFormError(message);
      setFeedback({
        type: 'error',
        title: 'INTAKE FAILED',
        message,
      });
    },
  });

  const correctAndReevaluateMutation = useMutation({
    mutationFn: async ({ oldId, formValues }: { oldId: number; formValues: AdmissionPayload }) => {
      const body = toFormData({
        applicant_name: formValues.applicant_name,
        applicant_age: formValues.applicant_age,
        applicant_skills: formValues.applicant_skills,
        health_notes: formValues.health_notes,
        background_notes: formValues.background_notes,
        ...(formValues.photo ? { photo: formValues.photo } : {}),
        ...(formValues.id_card ? { id_card: formValues.id_card } : {}),
      });
      const res = await apiClient.post(`/admission/camps/${currentCampId}`, body);
      await apiClient.patch(`/admission/${oldId}/review`, {
        final_decision: 'REJECTED',
        correction_reason: CORRECTED_INTAKE_ARCHIVE_REASON,
      });
      return res.data;
    },
    onSuccess: (admission: Admission) => {
      queryClient.invalidateQueries({ queryKey: ['admissions', currentCampId] });
      setIsCorrectModalOpen(false);
      setCorrectFormError(null);
      setSelectedAdmissionId(null);
      setCorrectPhoto(null);
      setCorrectIdCard(null);
      setStatusFilter(getAdmissionDecisionStatus(admission));
      setPage(1);
      setFeedback({
        type: 'success',
        title: 'CORRECTION SUBMITTED',
        message:
          'The corrected intake was sent for a fresh AI evaluation. The previous version was archived from the active queue.',
      });
    },
    onError: (error) => {
      const message = getApiErrorMessage(error, 'The correction could not be submitted.');
      setCorrectFormError(message);
      setFeedback({
        type: 'error',
        title: 'CORRECTION FAILED',
        message,
      });
    },
  });

  const handleSubmitIntake = (e: React.FormEvent) => {
    e.preventDefault();
    setCreateFormError(null);
    const result = buildAdmissionPayload({
      name: newName,
      age: newAge,
      skills: newSkills,
      health: newHealth,
      background: newBackground,
      photo: newPhoto,
      idCard: newIdCard,
    });
    if (!result.ok) {
      setCreateFormError(result.error);
      setFeedback({
        type: 'warning',
        title: 'CHECK INTAKE FORMAT',
        message: result.error,
        actionLabel: 'REVIEW',
      });
      return;
    }
    createAdmissionMutation.mutate(result.values);
  };

  const handleSubmitCorrection = (e: React.FormEvent, oldId: number) => {
    e.preventDefault();
    setCorrectFormError(null);
    const result = buildAdmissionPayload({
      name: correctName,
      age: correctAge,
      skills: correctSkills,
      health: correctHealth,
      background: correctBackground,
      photo: correctPhoto,
      idCard: correctIdCard,
    });
    if (!result.ok) {
      setCorrectFormError(result.error);
      setFeedback({
        type: 'warning',
        title: 'CHECK CORRECTION FORMAT',
        message: result.error,
        actionLabel: 'REVIEW',
      });
      return;
    }
    correctAndReevaluateMutation.mutate({
      oldId,
      formValues: result.values,
    });
  };

  // Close detail modal on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setSelectedAdmissionId(null);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="space-y-8 h-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter uppercase text-brand-primary">
            Admission Protocol
          </h1>
          <p className="text-zinc-500 font-mono text-xs uppercase pl-1">
            AI-driven refugee screening & assessment
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              setCreateFormError(null);
              setIsCreateModalOpen(true);
            }}
            aria-label="Register new refugee intake"
            className="bg-brand-primary hover:bg-brand-primary/95 text-black font-semibold px-4 py-2 rounded-md flex items-center gap-2 text-sm transition-all shadow-[0_0_20px_rgba(239,68,68,0.2)] uppercase tracking-wider"
          >
            <UserPlus size={18} />
            REGISTER INTAKE
          </button>
        )}
      </div>

      <div className="h-[calc(100vh-280px)]">
        {/* List Panel - full width */}
        <div className="flex flex-col bg-surface-raised brutalist-border rounded-xl overflow-hidden h-full">
          <div className="p-3 sm:p-4 bg-black/40 border-b border-zinc-900 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500">
                Intake Queue
              </h3>
              <span className="text-[10px] font-mono bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded w-fit">
                {statusCounts.PENDING} PENDING - PAGE {currentPage}/{totalPages}
              </span>
            </div>
            <div
              className="flex flex-wrap gap-2"
              role="tablist"
              aria-label="Admission status filter"
            >
              {(['ALL', 'PENDING', 'ACCEPTED', 'REJECTED'] as AdmissionStatusFilter[]).map(
                (status) => {
                  const active = statusFilter === status;
                  return (
                    <button
                      key={status}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => {
                        setStatusFilter(status);
                        setPage(1);
                      }}
                      className={cn(
                        'rounded border px-3 py-1.5 text-[10px] font-black uppercase tracking-wider transition-colors',
                        active
                          ? 'border-brand-primary bg-brand-primary text-black'
                          : 'border-zinc-800 bg-zinc-950/40 text-zinc-500 hover:border-zinc-700 hover:text-zinc-300',
                      )}
                    >
                      {status} {statusCounts[status]}
                    </button>
                  );
                },
              )}
            </div>
          </div>
          <div className="flex-1 overflow-auto divide-y divide-zinc-900">
            {isLoading ? (
              <div className="p-3 sm:p-4">
                <SkeletonList count={4} />
              </div>
            ) : filteredAdmissions.length === 0 ? (
              <div className="p-12 text-center space-y-4">
                <CheckCircle2 size={48} className="mx-auto text-zinc-800" />
                <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">
                  No {statusFilter === 'ALL' ? 'active' : statusFilter.toLowerCase()} applications.
                </p>
              </div>
            ) : (
              paginatedAdmissions.map((admission) => {
                const decisionStatus = getAdmissionDecisionStatus(admission);
                const sourceMeta = getAdmissionDecisionSourceMeta(admission);
                const SourceIcon = sourceMeta.icon;

                return (
                  <button
                    key={admission.id}
                    onClick={() => {
                      setSelectedProfId(null);
                      setSelectedAdmissionId(admission.id);
                    }}
                    aria-label={`View details for ${admission.applicant_name || admission.full_name}`}
                    className={cn(
                      'w-full p-5 text-left transition-all hover:bg-white/5 border-l-4 group',
                      selectedAdmissionId === admission.id
                        ? 'bg-white/5 border-brand-primary'
                        : 'border-transparent',
                    )}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-bold text-base tracking-tight group-hover:text-brand-primary transition-colors">
                        {admission.applicant_name || admission.full_name}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500 italic shrink-0 ml-2">
                        {formatDate(admission.created_at)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div
                        className={cn(
                          'text-[9px] font-black uppercase px-2 py-0.5 rounded border',
                          decisionStatus === 'PENDING'
                            ? 'bg-amber-950/20 text-amber-500 border-amber-500/30'
                            : decisionStatus === 'ACCEPTED'
                              ? 'bg-emerald-950/20 text-emerald-500 border-emerald-500/30'
                              : 'bg-red-950/20 text-red-500 border-red-500/30',
                        )}
                      >
                        {decisionStatus}
                      </div>
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded border',
                          sourceMeta.className,
                        )}
                      >
                        <SourceIcon size={10} />
                        {sourceMeta.label}
                      </span>
                      {admission.ai_confidence != null && (
                        <span className="text-[10px] font-mono text-zinc-600">
                          {(admission.ai_confidence * 100).toFixed(0)}% confidence
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div className="p-3 border-t border-zinc-900 flex justify-center">
            <Pagination page={currentPage} totalPages={totalPages} onPageChange={setPage} />
          </div>
        </div>
      </div>

      <AnimatePresence>
        {selectedAdmissionId && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Admission details"
            className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
            onClick={() => setSelectedAdmissionId(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-surface-raised brutalist-border rounded-xl w-full max-w-3xl my-8 overflow-hidden relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedAdmissionId(null)}
                aria-label="Close admission details"
                className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-zinc-900/80 hover:bg-zinc-800 rounded-full text-zinc-400 hover:text-zinc-200 transition-colors touch-target"
              >
                <XCircle size={16} />
              </button>

              {detailsLoading ? (
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <Skeleton className="h-8 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
                    <Skeleton className="h-28 w-full rounded-lg" />
                    <Skeleton className="h-28 col-span-2 w-full rounded-lg" />
                  </div>
                  <div className="p-4 sm:p-6 bg-zinc-900 border border-zinc-800 rounded-lg space-y-3">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                </div>
              ) : !details ? (
                <div className="p-12 text-center">
                  <p className="text-zinc-600 font-mono text-xs">
                    Failed to load admission details.
                  </p>
                </div>
              ) : (
                <div className="flex flex-col max-h-[80vh]">
                  {/* Header */}
                  <div className="p-4 sm:p-6 border-b border-zinc-900 space-y-4">
                    <div className="flex items-start justify-between gap-4 pr-8">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1">
                          <h2 className="text-2xl font-black tracking-tighter uppercase truncate">
                            {details.applicant_name || details.full_name}
                          </h2>
                          {(() => {
                            const s = getAdmissionDecisionStatus(details);
                            return (
                              <span
                                className={cn(
                                  'shrink-0 text-[9px] font-black uppercase px-2 py-0.5 rounded border',
                                  s === 'PENDING'
                                    ? 'bg-amber-950/20 text-amber-500 border-amber-500/30'
                                    : s === 'ACCEPTED'
                                      ? 'bg-emerald-950/20 text-emerald-500 border-emerald-500/30'
                                      : 'bg-red-950/20 text-red-500 border-red-500/30',
                                )}
                              >
                                {s}
                              </span>
                            );
                          })()}
                          {(() => {
                            const sourceMeta = getAdmissionDecisionSourceMeta(details);
                            const SourceIcon = sourceMeta.icon;

                            return (
                              <span
                                className={cn(
                                  'shrink-0 inline-flex items-center gap-1 text-[9px] font-black uppercase px-2 py-0.5 rounded border',
                                  sourceMeta.className,
                                )}
                              >
                                <SourceIcon size={10} />
                                {sourceMeta.label}
                              </span>
                            );
                          })()}
                        </div>
                        <p className="text-zinc-600 font-mono text-xs">
                          ID: ADM-{String(details.id).padStart(4, '0')} ·{' '}
                          {details.created_at
                            ? new Date(details.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })
                            : '—'}
                        </p>
                      </div>
                      <div className="shrink-0 bg-zinc-950 px-3 py-1.5 border border-zinc-800 rounded flex items-center gap-3">
                        <div className="text-center">
                          <p className="text-[9px] font-bold text-zinc-500 uppercase">Age</p>
                          <p className="font-mono font-bold text-base">
                            {details.applicant_age ?? '?'}
                          </p>
                        </div>
                        <div className="w-px h-8 bg-zinc-800" />
                        <div className="text-center">
                          <p className="text-[9px] font-bold text-zinc-500 uppercase">Conf.</p>
                          <p className="font-mono font-bold text-base">
                            {details.ai_confidence != null
                              ? `${(details.ai_confidence * 100).toFixed(0)}%`
                              : '—'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable content */}
                  <div className="flex-1 overflow-auto">
                    <div className="p-4 sm:p-6 space-y-6">
                      <section className="space-y-3">
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-primary" />
                          Personal Information
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="p-3 bg-zinc-900/60 border border-zinc-800/60 rounded-lg">
                            <p className="text-[9px] font-bold text-brand-primary uppercase mb-1.5">
                              Skills
                            </p>
                            <p className="text-xs leading-relaxed text-zinc-300">
                              {details.applicant_skills || (
                                <span className="text-zinc-600 italic">None reported</span>
                              )}
                            </p>
                          </div>
                          <div className="p-3 bg-zinc-900/60 border border-zinc-800/60 rounded-lg">
                            <p className="text-[9px] font-bold text-brand-secondary uppercase mb-1.5">
                              Health
                            </p>
                            <p className="text-xs leading-relaxed text-zinc-300">
                              {details.health_notes || (
                                <span className="text-zinc-600 italic">None reported</span>
                              )}
                            </p>
                          </div>
                        </div>
                        {details.background_notes && (
                          <div className="p-3 bg-zinc-900/60 border border-zinc-800/60 rounded-lg">
                            <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1.5">
                              Background
                            </p>
                            <p className="text-xs leading-relaxed text-zinc-300">
                              {details.background_notes}
                            </p>
                          </div>
                        )}
                      </section>

                      <section className="space-y-3">
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-brand-secondary" />
                          Decision Source
                        </h4>
                        {(() => {
                          const sourceMeta = getAdmissionDecisionSourceMeta(details);
                          const SourceIcon = sourceMeta.icon;

                          return (
                            <div
                              className={cn(
                                'p-3 bg-zinc-900/40 border rounded-lg flex items-start gap-3',
                                sourceMeta.className,
                              )}
                            >
                              <SourceIcon size={16} className="mt-0.5 shrink-0" />
                              <div>
                                <p className="text-[10px] font-black uppercase">
                                  {sourceMeta.detailLabel}
                                </p>
                                <p className="text-xs font-mono leading-relaxed opacity-80">
                                  {sourceMeta.description}
                                </p>
                              </div>
                            </div>
                          );
                        })()}
                      </section>

                      {(details.photo_url || details.id_card_url) && (
                        <section className="space-y-3">
                          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                            Attached Documents
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            {details.photo_url && (
                              <div>
                                <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1.5">
                                  Photo
                                </p>
                                <div className="aspect-square rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950">
                                  <img
                                    src={details.photo_url}
                                    alt="Applicant"
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-300"
                                  />
                                </div>
                              </div>
                            )}
                            {details.id_card_url && (
                              <div
                                className={details.photo_url ? 'md:col-span-2' : 'md:col-span-3'}
                              >
                                <p className="text-[9px] font-bold text-zinc-500 uppercase mb-1.5">
                                  ID Card
                                </p>
                                <div className="aspect-[1.58] rounded-lg overflow-hidden border border-zinc-800 bg-zinc-950 relative group">
                                  <img
                                    src={details.id_card_url}
                                    alt="ID Card"
                                    referrerPolicy="no-referrer"
                                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                  />
                                  <div className="absolute inset-x-0 bottom-0 bg-black/80 py-1.5 text-center border-t border-zinc-900">
                                    <span className="text-[8px] font-mono font-bold text-brand-secondary uppercase tracking-widest">
                                      IDENTITY ATTESTATION
                                    </span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </section>
                      )}

                      <section className="space-y-3">
                        <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          AI Evaluation
                        </h4>
                        <div className="relative">
                          <div className="absolute -inset-1 bg-linear-to-r from-brand-primary/10 to-brand-secondary/10 rounded-xl blur opacity-30" />
                          <div className="relative p-3 sm:p-4 bg-surface-base border border-zinc-800 rounded-xl space-y-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2 text-[10px] font-mono text-zinc-500 uppercase">
                                <BrainCircuit size={14} className="text-brand-primary" />
                                Decision Engine
                              </div>
                              {details.ai_confidence != null && (
                                <div className="flex items-center gap-2">
                                  <div className="w-20 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                      className={cn(
                                        'h-full rounded-full transition-all',
                                        details.ai_confidence > 0.7
                                          ? 'bg-emerald-500'
                                          : details.ai_confidence > 0.4
                                            ? 'bg-amber-500'
                                            : 'bg-red-500',
                                      )}
                                      style={{
                                        width: `${(details.ai_confidence * 100).toFixed(0)}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-[10px] font-mono font-bold text-zinc-400">
                                    {details.ai_decision || 'PENDING'}
                                  </span>
                                </div>
                              )}
                            </div>
                            {details.ai_reasoning && (
                              <div className="p-3 bg-zinc-900/40 border border-zinc-800/40 rounded-lg">
                                <p className="text-[9px] font-bold text-zinc-600 uppercase mb-1">
                                  Reasoning
                                </p>
                                <p className="text-xs leading-relaxed text-zinc-300 italic">
                                  "{details.ai_reasoning}"
                                </p>
                              </div>
                            )}
                            {details.ai_suggested_profession && (
                              <div className="flex items-center gap-2 text-xs text-zinc-400">
                                <ShieldAlert size={12} className="text-brand-primary" />
                                Suggested role:{' '}
                                <span className="font-bold text-zinc-200 uppercase">
                                  {details.ai_suggested_profession}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </section>

                      {getAdmissionDecisionStatus(details) === 'PENDING' && (
                        <section className="space-y-2">
                          <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            Role Override
                          </h4>
                          <div className="p-3 bg-zinc-900/40 border border-zinc-800/40 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <p className="text-[11px] text-zinc-500 font-mono">
                              Override the AI-suggested profession:
                            </p>
                            <select
                              aria-label="Override AI-suggested profession"
                              value={selectedProfId ?? ''}
                              onChange={(e) =>
                                setSelectedProfId(e.target.value ? Number(e.target.value) : null)
                              }
                              className="bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 font-bold font-mono focus:outline-none focus:border-brand-primary uppercase"
                            >
                              <option value="">— AI Suggested —</option>
                              {professions?.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </section>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  {canReview && (
                    <div className="p-3 sm:p-4 border-t border-zinc-900 bg-surface-raised flex gap-3">
                      <button
                        onClick={() =>
                          reviewMutation.mutate({
                            id: details.id,
                            decision: 'REJECTED',
                            applicantName: details.applicant_name || details.full_name,
                          })
                        }
                        aria-label="Reject admission"
                        disabled={
                          reviewMutation.isPending ||
                          getAdmissionDecisionStatus(details) !== 'PENDING'
                        }
                        className="flex-1 bg-zinc-900 hover:bg-red-950/30 text-red-500 border border-red-500/30 font-black py-3 rounded-lg flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-30"
                      >
                        <XCircle size={16} />
                        REJECT
                      </button>
                      {canReevaluate && (
                        <button
                          onClick={() => {
                            setCorrectName(details.applicant_name || details.full_name || '');
                            setCorrectAge(String(details.applicant_age ?? ''));
                            setCorrectSkills(details.applicant_skills || '');
                            setCorrectHealth(details.health_notes || '');
                            setCorrectBackground(details.background_notes || '');
                            setCorrectFormError(null);
                            setCorrectPhoto(null);
                            setCorrectIdCard(null);
                            setIsCorrectModalOpen(true);
                          }}
                          aria-label="Correct and re-evaluate admission"
                          disabled={
                            correctAndReevaluateMutation.isPending ||
                            getAdmissionDecisionStatus(details) !== 'PENDING'
                          }
                          className="flex-1 bg-amber-950/20 hover:bg-amber-950/40 text-amber-500 border border-amber-500/30 font-black py-3 rounded-lg flex items-center justify-center gap-2 text-xs transition-all disabled:opacity-30"
                        >
                          <BrainCircuit size={16} />
                          CORRECT
                        </button>
                      )}
                      <button
                        onClick={() =>
                          reviewMutation.mutate({
                            id: details.id,
                            decision: 'ACCEPTED',
                            corrected_profession_id: selectedProfId || undefined,
                            applicantName: details.applicant_name || details.full_name,
                          })
                        }
                        aria-label="Approve admission"
                        disabled={
                          reviewMutation.isPending ||
                          getAdmissionDecisionStatus(details) !== 'PENDING'
                        }
                        className="flex-[2] bg-brand-accent hover:bg-emerald-600 text-black font-black py-3 rounded-lg flex items-center justify-center gap-2 text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.15)] disabled:opacity-30"
                      >
                        <CheckCircle2 size={16} />
                        APPROVE
                      </button>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </div>
        )}

        {isCreateModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Register new refugee intake"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-surface-raised brutalist-border p-4 sm:p-6 md:p-8 rounded-xl max-w-xl w-full space-y-6"
            >
              <div className="border-b border-zinc-900 pb-4 mb-2">
                <p className="text-[10px] font-mono text-brand-primary uppercase tracking-widest leading-none mb-1">
                  STABILITY PROTOCOL v4.7
                </p>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  Register New Refugee Intake
                </h3>
                <p className="text-xs text-zinc-500 font-mono">
                  This form transmits telemetry data directly to the automated triage system.
                </p>
              </div>

              <form onSubmit={handleSubmitIntake} className="space-y-4">
                <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
                    Required format
                  </p>
                  <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
                    Name is required and max 150 characters. Age, skills, health, and background
                    notes are optional; when age is provided, it must be a whole number from 0 to
                    255. Images are optional, image-only, max 10MB each.
                  </p>
                </div>

                {createFormError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-950/20 p-3 text-red-400">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <p className="text-xs font-mono leading-relaxed">{createFormError}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Applicant Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      maxLength={150}
                      value={newName}
                      onChange={(e) => {
                        setNewName(e.target.value);
                        setCreateFormError(null);
                      }}
                      placeholder="e.g. Marlene Carter"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Age (Optional)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={255}
                      step={1}
                      value={newAge}
                      onChange={(e) => {
                        setNewAge(e.target.value);
                        setCreateFormError(null);
                      }}
                      placeholder="e.g. 28"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Applicant Skills summary (Optional, comma separated)
                  </label>
                  <input
                    type="text"
                    value={newSkills}
                    onChange={(e) => {
                      setNewSkills(e.target.value);
                      setCreateFormError(null);
                    }}
                    placeholder="e.g. combat training, basic surgical operations, scouting, agriculture"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Health assessment notes (Optional)
                  </label>
                  <textarea
                    value={newHealth}
                    onChange={(e) => {
                      setNewHealth(e.target.value);
                      setCreateFormError(null);
                    }}
                    placeholder="e.g. Minor exhaustions, no active bites or infectious symptoms detected."
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Historical background notes (Optional)
                  </label>
                  <textarea
                    value={newBackground}
                    onChange={(e) => {
                      setNewBackground(e.target.value);
                      setCreateFormError(null);
                    }}
                    placeholder="e.g. Former cargo vehicle driver from the state border. Cooperative and compliant."
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 placeholder-zinc-700 focus:outline-none focus:border-brand-primary resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Applicant Photo (Optional, max 10MB)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        setNewPhoto(e.target.files?.[0] ?? null);
                        setCreateFormError(null);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-brand-primary file:text-black file:text-xs file:font-bold focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      ID Card (Optional, max 10MB)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        setNewIdCard(e.target.files?.[0] ?? null);
                        setCreateFormError(null);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-brand-primary file:text-black file:text-xs file:font-bold focus:outline-none focus:border-brand-primary"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    aria-label="Abort intake registration"
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                  >
                    ABORT INTAKE
                  </button>
                  <button
                    type="submit"
                    aria-label="Submit refuge entry"
                    disabled={createAdmissionMutation.isPending}
                    className="flex-2 py-2.5 bg-brand-primary text-black text-xs font-bold uppercase rounded hover:bg-brand-primary/90 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
                  >
                    {createAdmissionMutation.isPending
                      ? 'STABILITY AI CALIBRATING...'
                      : 'SUBMIT REFUGE ENTRY'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {isCorrectModalOpen && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Correct and re-evaluate admission"
            className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-surface-raised brutalist-border p-4 sm:p-6 md:p-8 rounded-xl max-w-xl w-full space-y-6"
            >
              <div className="border-b border-zinc-900 pb-4 mb-2">
                <p className="text-[10px] font-mono text-amber-500 uppercase tracking-widest leading-none mb-1">
                  CORRECTION PROTOCOL
                </p>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  Correct &amp; Re-evaluate
                </h3>
                <p className="text-xs text-zinc-500 font-mono mt-1">
                  Edit the applicant data and submit a fresh AI evaluation. The previous version is
                  archived from the active queue.
                </p>
              </div>

              <form onSubmit={(e) => handleSubmitCorrection(e, details.id)} className="space-y-4">
                <div className="rounded-lg border border-amber-500/30 bg-amber-950/10 p-3 space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                    Required format
                  </p>
                  <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
                    Name is required and max 150 characters. Age, skills, health, and background
                    notes are optional; when age is provided, it must be a whole number from 0 to
                    255. Images are optional, image-only, max 10MB each.
                  </p>
                </div>

                {correctFormError && (
                  <div className="flex items-start gap-2 rounded-lg border border-red-500/40 bg-red-950/20 p-3 text-red-400">
                    <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                    <p className="text-xs font-mono leading-relaxed">{correctFormError}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2 space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Applicant Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      required
                      type="text"
                      maxLength={150}
                      value={correctName}
                      onChange={(e) => {
                        setCorrectName(e.target.value);
                        setCorrectFormError(null);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Age (Optional)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={255}
                      step={1}
                      value={correctAge}
                      onChange={(e) => {
                        setCorrectAge(e.target.value);
                        setCorrectFormError(null);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Applicant Skills summary (Optional)
                  </label>
                  <input
                    type="text"
                    value={correctSkills}
                    onChange={(e) => {
                      setCorrectSkills(e.target.value);
                      setCorrectFormError(null);
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Health assessment notes (Optional)
                  </label>
                  <textarea
                    value={correctHealth}
                    onChange={(e) => {
                      setCorrectHealth(e.target.value);
                      setCorrectFormError(null);
                    }}
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase">
                    Historical background notes (Optional)
                  </label>
                  <textarea
                    value={correctBackground}
                    onChange={(e) => {
                      setCorrectBackground(e.target.value);
                      setCorrectFormError(null);
                    }}
                    rows={2}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-amber-500 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      Applicant Photo (Optional, max 10MB)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        setCorrectPhoto(e.target.files?.[0] ?? null);
                        setCorrectFormError(null);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-amber-600 file:text-black file:text-xs file:font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase">
                      ID Card (Optional, max 10MB)
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        setCorrectIdCard(e.target.files?.[0] ?? null);
                        setCorrectFormError(null);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-300 file:mr-3 file:py-1 file:px-3 file:rounded file:border-0 file:bg-amber-600 file:text-black file:text-xs file:font-bold focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setIsCorrectModalOpen(false)}
                    aria-label="Cancel correction"
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 hover:bg-zinc-900 rounded transition-colors uppercase"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    aria-label="Submit and re-evaluate admission"
                    disabled={correctAndReevaluateMutation.isPending}
                    className="flex-2 py-2.5 bg-amber-600 text-black text-xs font-bold uppercase rounded hover:bg-amber-500 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
                  >
                    {correctAndReevaluateMutation.isPending
                      ? 'REEVALUATING...'
                      : 'SUBMIT & REEVALUATE'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {feedback && (
          <div
            role="dialog"
            aria-modal="true"
            aria-label={feedback.title}
            className="fixed inset-0 z-[60] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md"
            onClick={() => setFeedback(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="bg-surface-raised brutalist-border p-5 sm:p-7 rounded-xl max-w-md w-full space-y-5 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={cn(
                  'mx-auto flex h-14 w-14 items-center justify-center rounded-xl border',
                  feedback.type === 'success'
                    ? 'border-emerald-500/40 bg-emerald-950/20 text-emerald-400'
                    : feedback.type === 'warning'
                      ? 'border-amber-500/40 bg-amber-950/20 text-amber-400'
                      : 'border-red-500/40 bg-red-950/20 text-red-400',
                )}
              >
                {feedback.type === 'success' ? (
                  <CheckCircle2 size={28} />
                ) : feedback.type === 'warning' ? (
                  <AlertTriangle size={28} />
                ) : (
                  <XCircle size={28} />
                )}
              </div>
              <div className="space-y-2">
                <p
                  className={cn(
                    'text-[10px] font-mono uppercase tracking-widest',
                    feedback.type === 'success'
                      ? 'text-emerald-400'
                      : feedback.type === 'warning'
                        ? 'text-amber-400'
                        : 'text-red-400',
                  )}
                >
                  Admission Protocol
                </p>
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  {feedback.title}
                </h3>
                <p className="text-xs font-mono leading-relaxed text-zinc-400">
                  {feedback.message}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setFeedback(null)}
                className={cn(
                  'w-full rounded px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black transition-colors',
                  feedback.type === 'success'
                    ? 'bg-emerald-500 hover:bg-emerald-400'
                    : feedback.type === 'warning'
                      ? 'bg-amber-500 hover:bg-amber-400'
                      : 'bg-brand-primary hover:bg-brand-primary/90',
                )}
              >
                {feedback.actionLabel || 'ACKNOWLEDGE'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
