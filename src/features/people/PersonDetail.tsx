import { useState } from 'react';
import { useParams, useNavigate, Navigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient, toFormData, unwrapList } from '../../lib/api';
import { Person, Camp } from '../../types';
import { useAuthStore, useCampStore } from '../../store';
import { hasPermission } from '../../lib/permissions';
import { cn, formatDate, normalizePersonStatus } from '../../lib/utils';
import { showToast } from '../../lib/toast';
import { getApiErrorMessage } from '../../lib/apiErrors';
import {
  ArrowLeft,
  AlertCircle,
  Heart,
  Skull,
  Activity,
  Edit2,
  Trash2,
  ArrowLeftRight,
  X,
  Briefcase,
  Calendar,
  Fingerprint,
  Droplets,
  BookOpen,
  Camera,
  MapPin,
  User,
  Award,
  Clock,
  DollarSign,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Skeleton } from '../../components/Skeleton';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { ActionFeedbackDialog, ActionFeedbackType } from '../../components/ActionFeedbackDialog';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
const MAX_OVERRIDE_AMOUNT = 9999999999.99;

type PersonUpdatePayload = {
  full_name?: string;
  age?: number;
  status?: Person['status'];
  profession_id?: number;
  skills_summary?: string;
  photo?: File | null;
  photo_url?: string | null;
};

type PeopleFeedback = {
  type: ActionFeedbackType;
  title: string;
  message: string;
  actionLabel?: string;
  nextPath?: string;
};

const getPeopleActionErrorMessage = (error: unknown, fallback: string) => {
  const status = (error as { response?: { status?: number } }).response?.status;
  if (status === 403) return 'Your current role is not authorized to perform this action.';
  return getApiErrorMessage(error, fallback);
};

const validateImageFile = (file: File | null | undefined) => {
  if (!file) return null;
  if (!file.type.startsWith('image/')) return 'Photo must be an image file.';
  if (file.size > MAX_IMAGE_SIZE_BYTES) return 'Photo must be 10MB or smaller.';
  return null;
};

const getDateOnlyTime = (value?: string | null) => {
  if (!value) return null;
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return null;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

const formatShortDate = (value?: string | null) => {
  if (!value) return 'Open-ended';
  const [year, month, day] = value.slice(0, 10).split('-').map(Number);
  if (!year || !month || !day) return 'Invalid date';
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return 'Invalid date';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  }).format(date);
};

const formatOverrideAmount = (amount: number | string, unit?: string | null) => {
  const numericAmount = Number(amount);
  if (!Number.isFinite(numericAmount)) return `${amount}${unit ? ` ${unit}` : ''}`;
  const signedAmount = `${numericAmount > 0 ? '+' : ''}${numericAmount.toFixed(2)}`;
  return `${signedAmount}${unit ? ` ${unit}` : ''}`;
};

export default function PersonDetail() {
  const { id } = useParams();
  const personId = Number(id);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { currentCampId } = useCampStore();
  const hasReadPermission = hasPermission(user?.permissions, 'people.read');
  const canUpdate = hasPermission(user?.permissions, 'people.update');
  const canDelete = hasPermission(user?.permissions, 'people.delete');
  const canStatusLog = hasPermission(user?.permissions, 'people.status_log.create');
  const canReassignProfession = hasPermission(
    user?.permissions,
    'people.profession_reassign.create',
  );
  const canOverrideContribution = hasPermission(
    user?.permissions,
    'people.contribution_override.create',
  );
  const canTransferPerson = hasPermission(user?.permissions, 'transfers.create');
  const canReadCamps = hasPermission(user?.permissions, 'camps.read');
  const canReadProfessions = hasPermission(user?.permissions, 'professions.read');
  const canReadResources = hasPermission(user?.permissions, 'resources.read');

  // ── Person query ───────────────────────────────────────────────────────

  const {
    data: person,
    isLoading: personLoading,
    isError: personError,
  } = useQuery<Person>({
    queryKey: ['person', currentCampId, personId],
    queryFn: async () => {
      const res = await apiClient.get(`/camps/${currentCampId}/people/${personId}`);
      const raw = res.data?.data ?? res.data;
      // Flatten nested profession like PopulationRoster does
      return {
        ...raw,
        profession_name: raw.profession_name ?? raw.professions?.name ?? null,
      } as Person;
    },
    enabled: hasReadPermission && !isNaN(personId) && !!currentCampId,
  });

  // ── Supporting queries ─────────────────────────────────────────────────

  const { data: camps } = useQuery<Camp[]>({
    queryKey: ['camps'],
    queryFn: async () => {
      const res = await apiClient.get('/camps');
      return unwrapList<Camp>(res.data);
    },
    enabled: hasReadPermission && canReadCamps,
  });

  const { data: professions } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['professions'],
    queryFn: async () => {
      const res = await apiClient.get('/professions');
      return unwrapList<{ id: number; name: string }>(res.data);
    },
    enabled: hasReadPermission && canReadProfessions,
  });

  const { data: resources } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['resources'],
    queryFn: async () => {
      const res = await apiClient.get('/resources');
      return unwrapList<{ id: number; name: string }>(res.data);
    },
    enabled: hasReadPermission && canReadResources && canOverrideContribution,
  });

  const campName = camps?.find((c) => c.id === person?.camp_id)?.name;
  const [feedback, setFeedback] = useState<PeopleFeedback | null>(null);

  const showErrorFeedback = (title: string, error: unknown, fallback: string) => {
    setFeedback({
      type: 'error',
      title,
      message: getPeopleActionErrorMessage(error, fallback),
    });
  };

  const closeFeedback = () => {
    const nextPath = feedback?.nextPath;
    setFeedback(null);
    if (nextPath) navigate(nextPath);
  };

  // ── Update mutation ────────────────────────────────────────────────────

  const updatePersonMutation = useMutation({
    mutationFn: async ({ data }: { data: PersonUpdatePayload }) => {
      const body = toFormData({
        full_name: data.full_name,
        age: data.age,
        status: data.status,
        profession_id: data.profession_id,
        skills_summary: data.skills_summary,
        photo: data.photo,
        photo_url: data.photo_url,
      });
      const res = await apiClient.put(`/camps/${currentCampId}/people/${personId}`, body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person', currentCampId, personId] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setEditingPerson(false);
      setEditPhotoFile(null);
      setEditPhotoError(null);
      setFeedback({
        type: 'success',
        title: 'PROFILE UPDATED',
        message: 'The personnel record was updated successfully.',
      });
    },
    onError: (error) =>
      showErrorFeedback('UPDATE FAILED', error, 'Could not update personnel profile.'),
  });

  // ── Delete mutation ────────────────────────────────────────────────────

  const deletePersonMutation = useMutation({
    mutationFn: async () => {
      const res = await apiClient.delete(`/camps/${currentCampId}/people/${personId}`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setFeedback({
        type: 'success',
        title: 'RECORD REMOVED',
        message: 'The survivor was removed from the camp roster.',
        actionLabel: 'VIEW ROSTER',
        nextPath: '/population',
      });
    },
    onError: (error) =>
      showErrorFeedback('DELETE FAILED', error, 'Could not delete personnel record.'),
  });

  // ── Transfer mutation ──────────────────────────────────────────────────

  const transferMutation = useMutation({
    mutationFn: async ({ campId }: { campId: number }) => {
      await apiClient.post('/transfers', {
        requesting_camp: currentCampId,
        target_camp: campId,
        type: 'PERSON',
        requested_by: user?.id ?? 1,
        items: [{ item_type: 'PERSON', person_id: personId }],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people'] });
      setTransferringPerson(false);
      setTargetCampId(null);
      setFeedback({
        type: 'success',
        title: 'TRANSFER REQUESTED',
        message: 'The personnel transfer request was created successfully.',
        actionLabel: 'VIEW ROSTER',
        nextPath: '/population',
      });
    },
    onError: (error) =>
      showErrorFeedback('TRANSFER FAILED', error, 'Could not create personnel transfer.'),
  });

  // ── Status log mutation ────────────────────────────────────────────────

  const statusLogMutation = useMutation({
    mutationFn: async ({ newStatus, reason }: { newStatus: string; reason: string }) => {
      await apiClient.post(`/camps/${currentCampId}/people/status-log`, {
        person_id: personId,
        new_status: newStatus,
        reason: reason || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person', currentCampId, personId] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setShowStatusLogModal(false);
      setStatusReason('');
      setStatusNewStatus('HEALTHY');
      setFeedback({
        type: 'success',
        title: 'STATUS LOGGED',
        message: 'The survivor status change was recorded successfully.',
      });
    },
    onError: (error) =>
      showErrorFeedback('STATUS UPDATE FAILED', error, 'Could not log status change.'),
  });

  // ── Reassign mutation ──────────────────────────────────────────────────

  const reassignMutation = useMutation({
    mutationFn: async ({
      toProfessionId,
      reason,
      startDate,
      endDate,
    }: {
      toProfessionId: number;
      reason: string;
      startDate: string;
      endDate: string;
    }) => {
      await apiClient.post(`/camps/${currentCampId}/people/profession-reassignments`, {
        person_id: personId,
        from_profession_id: person?.profession_id,
        to_profession_id: toProfessionId,
        reason: reason || undefined,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person', currentCampId, personId] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      setShowReassignModal(false);
      setReassignProfessionId(null);
      setReassignReason('');
      setReassignStartDate('');
      setReassignEndDate('');
      setFeedback({
        type: 'success',
        title: 'PROFESSION UPDATED',
        message: 'The profession reassignment was saved successfully.',
      });
    },
    onError: (error) =>
      showErrorFeedback('REASSIGNMENT FAILED', error, 'Could not reassign profession.'),
  });

  // ── Override mutation ──────────────────────────────────────────────────

  const overrideMutation = useMutation({
    mutationFn: async ({
      resourceTypeId,
      amount,
      reason,
      startDate,
      endDate,
    }: {
      resourceTypeId: number;
      amount: number;
      reason: string;
      startDate: string;
      endDate: string;
    }) => {
      await apiClient.post(`/camps/${currentCampId}/people/contribution-overrides`, {
        person_id: personId,
        resource_type_id: resourceTypeId,
        amount,
        reason,
        start_date: startDate || undefined,
        end_date: endDate || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['person', currentCampId, personId] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      setShowOverrideModal(false);
      setOverrideResourceTypeId(null);
      setOverrideAmount('');
      setOverrideReason('');
      setOverrideStartDate('');
      setOverrideEndDate('');
      setFeedback({
        type: 'success',
        title: 'OVERRIDE SAVED',
        message:
          'The contribution override was registered and will be applied by the daily production job while active.',
      });
    },
    onError: (error) =>
      showErrorFeedback('OVERRIDE FAILED', error, 'Could not save contribution override.'),
  });

  // ── Edit modal state ───────────────────────────────────────────────────

  const [editingPerson, setEditingPerson] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editStatus, setEditStatus] = useState<string>('HEALTHY');
  const [editProfessionId, setEditProfessionId] = useState<number | null>(null);
  const [editSkillsSummary, setEditSkillsSummary] = useState('');
  const [editPhotoUrl, setEditPhotoUrl] = useState('');
  const [editPhotoFile, setEditPhotoFile] = useState<File | null>(null);
  const [editPhotoError, setEditPhotoError] = useState<string | null>(null);

  const openEditModal = () => {
    if (!person) return;
    setEditName(person.full_name);
    setEditAge(String(person.age ?? ''));

    setEditStatus(normalizePersonStatus(person.status));
    setEditProfessionId(person.profession_id ?? null);
    setEditSkillsSummary(person.skills_summary ?? '');
    setEditPhotoUrl(person.photo_url ?? '');
    setEditPhotoFile(null);
    setEditPhotoError(null);
    setEditingPerson(true);
  };

  const handleEditPhotoChange = (file?: File | null) => {
    const validationError = validateImageFile(file);
    setEditPhotoError(validationError);
    setEditPhotoFile(validationError ? null : (file ?? null));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!person) return;

    const trimmedName = editName.trim();
    if (!trimmedName) {
      showToast.warning('Full name is required.');
      return;
    }

    const parsedAge = editAge.trim() === '' ? undefined : Number(editAge);
    if (
      parsedAge !== undefined &&
      (!Number.isInteger(parsedAge) || parsedAge < 0 || parsedAge > 255)
    ) {
      showToast.warning('Age must be a whole number from 0 to 255.');
      return;
    }

    const imageError = validateImageFile(editPhotoFile);
    if (imageError) {
      setEditPhotoError(imageError);
      return;
    }

    updatePersonMutation.mutate({
      data: {
        full_name: trimmedName,
        ...(parsedAge !== undefined ? { age: parsedAge } : {}),
        status: editStatus as Person['status'],
        ...(editProfessionId != null ? { profession_id: editProfessionId } : {}),
        ...(editSkillsSummary.trim() ? { skills_summary: editSkillsSummary.trim() } : {}),
        ...(editPhotoFile ? { photo: editPhotoFile } : {}),
        ...(!editPhotoFile && editPhotoUrl ? { photo_url: editPhotoUrl } : {}),
      },
    });
  };

  // ── Transfer modal state ───────────────────────────────────────────────

  const [transferringPerson, setTransferringPerson] = useState(false);
  const [targetCampId, setTargetCampId] = useState<number | null>(null);

  // ── Delete confirm state ───────────────────────────────────────────────

  const [confirmDelete, setConfirmDelete] = useState(false);

  // ── Status log modal state ─────────────────────────────────────────────
  const [showStatusLogModal, setShowStatusLogModal] = useState(false);
  const [statusNewStatus, setStatusNewStatus] = useState<string>('HEALTHY');
  const [statusReason, setStatusReason] = useState('');

  // ── Reassign modal state ───────────────────────────────────────────────
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignProfessionId, setReassignProfessionId] = useState<number | null>(null);
  const [reassignReason, setReassignReason] = useState('');
  const [reassignStartDate, setReassignStartDate] = useState('');
  const [reassignEndDate, setReassignEndDate] = useState('');

  // ── Override modal state ───────────────────────────────────────────────
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideResourceTypeId, setOverrideResourceTypeId] = useState<number | null>(null);
  const [overrideAmount, setOverrideAmount] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideStartDate, setOverrideStartDate] = useState('');
  const [overrideEndDate, setOverrideEndDate] = useState('');

  const trimmedOverrideReason = overrideReason.trim();
  const overrideAmountNumber = Number(overrideAmount);
  const overrideAmountInvalid =
    overrideAmount.trim() !== '' &&
    (!Number.isFinite(overrideAmountNumber) ||
      Math.abs(overrideAmountNumber) > MAX_OVERRIDE_AMOUNT);
  const overrideReasonInvalid = trimmedOverrideReason.length > 255;
  const overrideDateRangeInvalid =
    !!overrideStartDate &&
    !!overrideEndDate &&
    getDateOnlyTime(overrideEndDate)! < getDateOnlyTime(overrideStartDate)!;
  const canSubmitOverride =
    overrideResourceTypeId != null &&
    overrideAmount.trim() !== '' &&
    trimmedOverrideReason.length > 0 &&
    !overrideAmountInvalid &&
    !overrideReasonInvalid &&
    !overrideDateRangeInvalid &&
    !overrideMutation.isPending;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  const contributionOverrides = [...(person?.contribution_overrides ?? [])].sort(
    (a, b) =>
      (getDateOnlyTime(b.created_at) ?? getDateOnlyTime(b.start_date) ?? 0) -
      (getDateOnlyTime(a.created_at) ?? getDateOnlyTime(a.start_date) ?? 0),
  );
  const getOverrideStatus = (startDate?: string | null, endDate?: string | null) => {
    const startTime = getDateOnlyTime(startDate);
    const endTime = getDateOnlyTime(endDate);

    if (startTime != null && startTime > todayTime) return 'SCHEDULED';
    if (endTime != null && endTime < todayTime) return 'ENDED';
    return 'ACTIVE';
  };
  const activeOverrideCount = contributionOverrides.filter(
    (override) => getOverrideStatus(override.start_date, override.end_date) === 'ACTIVE',
  ).length;

  if (!hasReadPermission) {
    return <Navigate to="/" replace />;
  }

  // ── Status badge helper ────────────────────────────────────────────────

  const renderStatusBadge = (raw: string) => {
    const status = normalizePersonStatus(raw);
    const isHealthy = status === 'HEALTHY';
    const isSick = status === 'SICK';
    const isInjured = status === 'INJURED';
    const isAway = status === 'AWAY';
    const isDeceased = status === 'DEAD';

    const label = status;

    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider border',
          isHealthy
            ? 'bg-emerald-950/20 text-emerald-500 border-emerald-500/30'
            : isInjured
              ? 'bg-amber-950/20 text-amber-500 border-amber-500/30'
              : isSick
                ? 'bg-orange-950/20 text-orange-500 border-orange-500/30'
                : isAway
                  ? 'bg-blue-950/20 text-blue-400 border-blue-400/30'
                  : 'bg-zinc-950/20 text-zinc-500 border-zinc-500/30',
        )}
      >
        {isHealthy && <Heart size={12} />}
        {isInjured && <Activity size={12} />}
        {isDeceased && <Skull size={12} />}
        {label}
      </div>
    );
  };

  // ── Loading skeleton ───────────────────────────────────────────────────

  if (personLoading) {
    return (
      <div className="space-y-6 animate-pulse">
        <Skeleton className="h-8 w-40" />
        <div className="p-6 md:p-8 bg-surface-raised/40 brutalist-border rounded-xl space-y-4">
          <div className="flex items-start gap-6">
            <Skeleton className="w-20 h-20 rounded-xl shrink-0" />
            <div className="space-y-3 flex-1">
              <Skeleton className="h-8 w-2/3" />
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="p-6 bg-surface-raised/40 brutalist-border rounded-lg space-y-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── Not found / invalid ID ─────────────────────────────────────────────

  if (isNaN(personId) || personError || !person) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-4">
        <AlertCircle size={48} className="text-zinc-800" />
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Personnel Record Not Found</h2>
          <p className="text-zinc-500 text-sm max-w-sm">
            The survivor record with ID "{id}" does not exist or has been removed from the roster.
          </p>
        </div>
        <button
          onClick={() => navigate('/population')}
          className="bg-brand-primary hover:bg-brand-primary/95 text-black font-semibold uppercase tracking-wider px-6 py-2 rounded-md inline-flex items-center gap-2 text-sm transition-all"
        >
          <ArrowLeft size={16} />
          BACK TO POPULATION
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <button
        onClick={() => navigate('/population')}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider"
      >
        <ArrowLeft size={14} />
        BACK TO POPULATION
      </button>

      {/* Profile card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-raised brutalist-border p-6 md:p-8 rounded-xl space-y-6"
      >
        <div className="flex flex-col md:flex-row md:items-start gap-6">
          {/* Photo */}
          <div className="shrink-0">
            {person.photo_url ? (
              <div className="w-20 h-20 rounded-xl overflow-hidden border border-zinc-800 bg-zinc-950">
                <img
                  src={person.photo_url}
                  alt={person.full_name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 hover:opacity-100 transition-all duration-300"
                />
              </div>
            ) : (
              <div className="w-20 h-20 rounded-xl bg-zinc-900 border border-zinc-800 grid place-items-center">
                <Camera size={24} className="text-zinc-700" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-3">
            <div className="space-y-1">
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase text-white">
                {person.full_name}
              </h1>
              <div className="flex items-center gap-3 flex-wrap">
                {renderStatusBadge(person.status)}
                <span className="text-xs font-mono text-zinc-500">ID: SURVIVOR-{person.id}</span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs text-zinc-500 font-mono flex-wrap">
              <span className="inline-flex items-center gap-1">
                <User size={12} />
                {person.age ?? '—'} YRS
              </span>
              <span className="text-zinc-800 select-none">|</span>
              <span className="inline-flex items-center gap-1">
                <Briefcase size={12} />
                {person.profession_name || 'UNASSIGNED'}
              </span>
              {campName && (
                <>
                  <span className="text-zinc-800 select-none">|</span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} />
                    {campName}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Footer meta */}
        <div className="flex items-center justify-between text-[10px] font-mono text-zinc-500 border-t border-zinc-900/50 pt-4">
          <span>
            PERSONNEL DOSSIER // GF-
            {person.id.toString().padStart(3, '0')}
          </span>
          <span className="inline-flex items-center gap-1">
            <Activity size={10} className="text-emerald-500 animate-pulse" />
            ACTIVE RECORD
          </span>
        </div>
      </motion.div>

      {/* Stats section */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">
          Personnel Data
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Skills summary */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-surface-raised brutalist-border rounded-lg space-y-3 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-brand-primary/10 rounded-lg flex items-center justify-center text-brand-primary">
                <Award size={16} />
              </div>
              <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                Skills Summary
              </p>
            </div>
            <p className="text-sm font-mono text-zinc-300 leading-relaxed">
              {person.skills_summary || (
                <span className="text-zinc-600 italic">No skills data recorded.</span>
              )}
            </p>
          </motion.div>

          {/* Identification code */}
          {(person.identification_code || person.blood_type) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-6 bg-surface-raised brutalist-border rounded-lg space-y-3 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500/10 rounded-lg flex items-center justify-center text-blue-500">
                  <Fingerprint size={16} />
                </div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  Identification
                </p>
              </div>
              <div className="space-y-2">
                {person.identification_code && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                      ID Code
                    </span>
                    <span className="text-xs font-mono text-zinc-300">
                      {person.identification_code}
                    </span>
                  </div>
                )}
                {person.blood_type && (
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 uppercase tracking-wider font-mono">
                      Blood Type
                    </span>
                    <span className="text-xs font-mono text-zinc-300 flex items-center gap-1">
                      <Droplets size={12} className="text-red-500" />
                      {person.blood_type}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {/* Admitted at */}
          {person.admitted_at && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-6 bg-surface-raised brutalist-border rounded-lg space-y-3 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500/10 rounded-lg flex items-center justify-center text-emerald-500">
                  <Calendar size={16} />
                </div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  Admission Date
                </p>
              </div>
              <p className="text-sm font-mono text-zinc-300">{formatDate(person.admitted_at)}</p>
            </motion.div>
          )}

          {/* Skills summary fallback block when identification data is missing */}
          {!person.identification_code && !person.blood_type && !person.admitted_at && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="p-6 bg-surface-raised brutalist-border rounded-lg space-y-3 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-zinc-800 rounded-lg flex items-center justify-center text-zinc-500">
                  <BookOpen size={16} />
                </div>
                <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                  Additional Records
                </p>
              </div>
              <p className="text-xs font-mono text-zinc-600 italic">
                No additional personnel data on file.
              </p>
            </motion.div>
          )}
        </div>
      </div>

      {canOverrideContribution && (
        <div>
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400">
              Contribution Overrides
            </h2>
            <span className="rounded border border-blue-500/20 bg-blue-950/20 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-blue-400">
              {activeOverrideCount} active
            </span>
          </div>

          <div className="bg-surface-raised brutalist-border rounded-lg overflow-hidden">
            {contributionOverrides.length === 0 ? (
              <div className="px-6 py-8 text-center text-[11px] font-mono uppercase tracking-widest text-zinc-600">
                No contribution overrides recorded.
              </div>
            ) : (
              <div className="divide-y divide-zinc-900">
                {contributionOverrides.map((override) => {
                  const amountNumber = Number(override.amount);
                  const isPositive = Number.isFinite(amountNumber) && amountNumber >= 0;
                  const status = getOverrideStatus(override.start_date, override.end_date);
                  const resourceName =
                    override.resource_type?.name ?? `Resource #${override.resource_type_id}`;

                  return (
                    <div
                      key={override.id}
                      className="grid gap-4 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <div className="min-w-0 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-xs font-black uppercase tracking-wider text-zinc-200">
                            {resourceName}
                          </span>
                          <span
                            className={cn(
                              'rounded border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider',
                              status === 'ACTIVE'
                                ? 'border-emerald-500/30 bg-emerald-950/20 text-emerald-400'
                                : status === 'SCHEDULED'
                                  ? 'border-blue-500/30 bg-blue-950/20 text-blue-400'
                                  : 'border-zinc-700 bg-zinc-950/30 text-zinc-500',
                            )}
                          >
                            {status}
                          </span>
                        </div>
                        <p className="text-xs font-mono leading-relaxed text-zinc-500">
                          {override.reason}
                        </p>
                        <p className="text-[10px] font-mono uppercase tracking-wider text-zinc-600">
                          {formatShortDate(override.start_date)} to{' '}
                          {formatShortDate(override.end_date)}
                          {override.users?.username ? ` by ${override.users.username}` : ''}
                        </p>
                      </div>
                      <div
                        className={cn(
                          'text-right text-sm font-black tabular-nums',
                          isPositive ? 'text-emerald-400' : 'text-red-400',
                        )}
                      >
                        {formatOverrideAmount(override.amount, override.resource_type?.unit)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        {canUpdate && (
          <button
            onClick={openEditModal}
            className="flex-1 flex items-center justify-center gap-2 bg-surface-raised brutalist-border hover:border-emerald-500/50 rounded-lg px-6 py-4 text-sm font-bold uppercase tracking-wider text-zinc-300 hover:text-emerald-500 transition-all"
          >
            <Edit2 size={16} />
            EDIT PROFILE
          </button>
        )}
        {canTransferPerson && (
          <button
            onClick={() => setTransferringPerson(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-surface-raised brutalist-border hover:border-amber-500/50 rounded-lg px-6 py-4 text-sm font-bold uppercase tracking-wider text-zinc-300 hover:text-amber-500 transition-all"
          >
            <ArrowLeftRight size={16} />
            TRANSFER PERSONNEL
          </button>
        )}
        {canDelete && (
          <button
            onClick={() => setConfirmDelete(true)}
            className="flex-1 flex items-center justify-center gap-2 bg-surface-raised brutalist-border hover:border-red-500/50 rounded-lg px-6 py-4 text-sm font-bold uppercase tracking-wider text-zinc-300 hover:text-red-500 transition-all"
          >
            <Trash2 size={16} />
            DELETE RECORD
          </button>
        )}
      </div>

      {/* Personnel Actions */}
      <div>
        <h2 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-4">
          Personnel Actions
        </h2>
        <div className="flex flex-col sm:flex-row gap-4">
          {canStatusLog && (
            <button
              onClick={() => {
                setStatusNewStatus(normalizePersonStatus(person?.status));
                setShowStatusLogModal(true);
              }}
              className="flex-1 flex items-center justify-center gap-2 bg-surface-raised brutalist-border hover:border-purple-500/50 rounded-lg px-6 py-4 text-sm font-bold uppercase tracking-wider text-zinc-300 hover:text-purple-500 transition-all"
            >
              <Clock size={16} />
              LOG STATUS CHANGE
            </button>
          )}
          {canReassignProfession && (
            <button
              onClick={() => setShowReassignModal(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-surface-raised brutalist-border hover:border-brand-secondary/50 rounded-lg px-6 py-4 text-sm font-bold uppercase tracking-wider text-zinc-300 hover:text-brand-secondary transition-all"
            >
              <RefreshCw size={16} />
              REASSIGN PROFESSION
            </button>
          )}
          {canOverrideContribution && (
            <button
              onClick={() => setShowOverrideModal(true)}
              className="flex-1 flex items-center justify-center gap-2 bg-surface-raised brutalist-border hover:border-blue-500/50 rounded-lg px-6 py-4 text-sm font-bold uppercase tracking-wider text-zinc-300 hover:text-blue-500 transition-all"
            >
              <DollarSign size={16} />
              OVERRIDE CONTRIBUTION
            </button>
          )}
        </div>
      </div>

      {/* ── Edit Modal ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {editingPerson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-raised brutalist-border p-8 rounded-xl max-w-md w-full space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    Edit Personnel Profile
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">ID: SURVIVOR-{person.id}</p>
                </div>
                <button
                  onClick={() => setEditingPerson(false)}
                  className="p-1.5 text-zinc-500 hover:text-white rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Full Name
                  </label>
                  <input
                    required
                    type="text"
                    maxLength={150}
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-brand-primary font-mono uppercase"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Age (Years)
                    </label>
                    <input
                      required
                      type="number"
                      min={0}
                      max={255}
                      step={1}
                      value={editAge}
                      onChange={(e) => setEditAge(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-brand-primary font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Status Rating
                    </label>
                    <select
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-brand-primary cursor-pointer uppercase font-mono"
                    >
                      <option value="HEALTHY">HEALTHY</option>
                      <option value="INJURED">WOUNDED</option>
                      <option value="SICK">SICK</option>
                      <option value="AWAY">MISSING</option>
                      <option value="DEAD">DECEASED</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Profession/Role
                  </label>
                  <select
                    value={editProfessionId ?? ''}
                    onChange={(e) =>
                      setEditProfessionId(e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-brand-primary font-mono uppercase cursor-pointer"
                  >
                    <option value="">— No change —</option>
                    {professions?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Skills Summary
                  </label>
                  <textarea
                    value={editSkillsSummary}
                    onChange={(e) => setEditSkillsSummary(e.target.value)}
                    rows={2}
                    placeholder="e.g. combat training, medical triage, scouting"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-brand-primary font-mono resize-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Personnel Photo (Optional, max 10MB)
                  </label>
                  <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs font-mono text-zinc-400 transition-colors hover:border-brand-primary/60">
                    <Camera size={16} className="shrink-0 text-brand-primary" />
                    <span className="min-w-0 flex-1 truncate">
                      {editPhotoFile
                        ? editPhotoFile.name
                        : person.photo_url
                          ? 'Current photo will be kept'
                          : 'Select image file'}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleEditPhotoChange(e.target.files?.[0] ?? null)}
                      className="sr-only"
                    />
                  </label>
                  {editPhotoError && (
                    <p className="mt-1 text-[10px] font-mono text-red-500">{editPhotoError}</p>
                  )}
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setEditingPerson(false)}
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 rounded hover:bg-zinc-900 transition-colors uppercase"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={updatePersonMutation.isPending}
                    className="flex-2 py-2.5 bg-brand-primary text-black text-xs font-bold uppercase rounded hover:bg-zinc-300 transition-colors"
                  >
                    {updatePersonMutation.isPending ? 'SAVING...' : 'SAVE CHANGES'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ── Transfer Modal ────────────────────────────────────────────── */}
        {transferringPerson && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-raised brutalist-border p-8 rounded-xl max-w-md w-full space-y-6"
            >
              <div className="space-y-1">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                  Personnel Transfer
                </h3>
                <p className="text-sm text-zinc-500 font-mono">Transferring: {person.full_name}</p>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                  Select Target Destination
                </p>
                <div className="grid gap-2 max-h-75 overflow-auto pr-2">
                  {camps
                    ?.filter((c) => c.id !== currentCampId)
                    .map((camp) => (
                      <button
                        key={camp.id}
                        onClick={() => setTargetCampId(camp.id)}
                        className={cn(
                          'p-4 text-left border rounded-lg transition-all',
                          targetCampId === camp.id
                            ? 'bg-brand-secondary/10 border-brand-secondary text-brand-secondary'
                            : 'bg-surface-base border-zinc-800 text-zinc-400 hover:border-zinc-700',
                        )}
                      >
                        <p className="font-bold uppercase">{camp.name}</p>
                        <p className="text-[10px] font-mono opacity-60">{camp.location}</p>
                      </button>
                    ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={() => {
                    setTransferringPerson(false);
                    setTargetCampId(null);
                  }}
                  className="flex-1 py-3 font-bold border border-zinc-800 rounded hover:bg-zinc-900 transition-colors"
                >
                  CANCEL
                </button>
                <button
                  disabled={!targetCampId || transferMutation.isPending}
                  onClick={() => targetCampId && transferMutation.mutate({ campId: targetCampId })}
                  className="flex-2 py-3 bg-brand-secondary text-black font-black uppercase rounded hover:bg-amber-600 transition-colors disabled:opacity-30"
                >
                  {transferMutation.isPending ? 'AUTHORIZING...' : 'CONFIRM TRANSFER'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* ── Status Log Modal ───────────────────────────────────────────── */}
        {showStatusLogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-raised brutalist-border p-8 rounded-xl max-w-md w-full space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    Log Status Change
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    SURVIVOR-{person.id} &middot; {person.full_name}
                  </p>
                </div>
                <button
                  onClick={() => setShowStatusLogModal(false)}
                  className="p-1.5 text-zinc-500 hover:text-white rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  statusLogMutation.mutate({
                    newStatus: statusNewStatus,
                    reason: statusReason,
                  });
                }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    New Status
                  </label>
                  <select
                    required
                    value={statusNewStatus}
                    onChange={(e) => setStatusNewStatus(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono uppercase cursor-pointer"
                  >
                    <option value="HEALTHY">HEALTHY</option>
                    <option value="SICK">SICK</option>
                    <option value="INJURED">INJURED</option>
                    <option value="AWAY">AWAY</option>
                    <option value="DEAD">DEAD</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    rows={3}
                    placeholder="e.g. sustained injury during patrol, showing symptoms of illness..."
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-purple-500 font-mono resize-none"
                  />
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setShowStatusLogModal(false)}
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 rounded hover:bg-zinc-900 transition-colors uppercase"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={statusLogMutation.isPending}
                    className="flex-2 py-2.5 bg-purple-600 text-white text-xs font-bold uppercase rounded hover:bg-purple-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {statusLogMutation.isPending ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> LOGGING...
                      </>
                    ) : (
                      'LOG STATUS CHANGE'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ── Reassign Profession Modal ──────────────────────────────────── */}
        {showReassignModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-raised brutalist-border p-8 rounded-xl max-w-md w-full space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    Reassign Profession
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    SURVIVOR-{person.id} &middot; {person.full_name}
                  </p>
                </div>
                <button
                  onClick={() => setShowReassignModal(false)}
                  className="p-1.5 text-zinc-500 hover:text-white rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (reassignProfessionId == null) return;
                  reassignMutation.mutate({
                    toProfessionId: reassignProfessionId,
                    reason: reassignReason,
                    startDate: reassignStartDate,
                    endDate: reassignEndDate,
                  });
                }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Current Profession
                  </label>
                  <p className="text-xs font-mono text-zinc-400">
                    {person.profession_name || 'UNASSIGNED'}
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    New Profession
                  </label>
                  <select
                    required
                    value={reassignProfessionId ?? ''}
                    onChange={(e) =>
                      setReassignProfessionId(e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-brand-secondary font-mono uppercase cursor-pointer"
                  >
                    <option value="">— Select profession —</option>
                    {professions?.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Reason (Optional)
                  </label>
                  <textarea
                    value={reassignReason}
                    onChange={(e) => setReassignReason(e.target.value)}
                    rows={2}
                    placeholder="e.g. reassigned to medical unit due to background"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-brand-secondary font-mono resize-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Start Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={reassignStartDate}
                      onChange={(e) => setReassignStartDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-brand-secondary font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={reassignEndDate}
                      onChange={(e) => setReassignEndDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-brand-secondary font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setShowReassignModal(false)}
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 rounded hover:bg-zinc-900 transition-colors uppercase"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={reassignProfessionId == null || reassignMutation.isPending}
                    className="flex-2 py-2.5 bg-brand-secondary text-black text-xs font-bold uppercase rounded hover:bg-amber-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {reassignMutation.isPending ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> REASSIGNING...
                      </>
                    ) : (
                      'CONFIRM REASSIGNMENT'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {/* ── Contribution Override Modal ─────────────────────────────────── */}
        {showOverrideModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface-raised brutalist-border p-8 rounded-xl max-w-md w-full space-y-6"
            >
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter">
                    Override Contribution
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono">
                    SURVIVOR-{person.id} &middot; {person.full_name}
                  </p>
                </div>
                <button
                  onClick={() => setShowOverrideModal(false)}
                  className="p-1.5 text-zinc-500 hover:text-white rounded-lg transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (!canSubmitOverride) {
                    showToast.warning('Check contribution override format before saving.');
                    return;
                  }
                  overrideMutation.mutate({
                    resourceTypeId: overrideResourceTypeId,
                    amount: overrideAmountNumber,
                    reason: trimmedOverrideReason,
                    startDate: overrideStartDate,
                    endDate: overrideEndDate,
                  });
                }}
                className="space-y-4"
              >
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Resource Type
                  </label>
                  <select
                    required
                    value={overrideResourceTypeId ?? ''}
                    onChange={(e) =>
                      setOverrideResourceTypeId(e.target.value ? Number(e.target.value) : null)
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono uppercase cursor-pointer"
                  >
                    <option value="">— Select resource —</option>
                    {resources?.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Amount
                  </label>
                  <input
                    required
                    type="number"
                    step="0.01"
                    inputMode="decimal"
                    value={overrideAmount}
                    onChange={(e) => setOverrideAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                  />
                  <p className="text-[10px] text-zinc-600 font-mono">
                    Format: decimal amount, positive or negative, up to 2 decimals.
                  </p>
                  {overrideAmountInvalid && (
                    <p className="text-[10px] text-red-500 font-mono">
                      Amount must be a valid number within backend range.
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Reason
                  </label>
                  <textarea
                    required
                    maxLength={255}
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    rows={2}
                    placeholder="e.g. adjusted contribution due to special circumstances"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono resize-none"
                  />
                  <div className="flex justify-between gap-3 text-[10px] font-mono">
                    <span className="text-zinc-600">Required, max 255 characters.</span>
                    <span className={overrideReasonInvalid ? 'text-red-500' : 'text-zinc-600'}>
                      {trimmedOverrideReason.length}/255
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      Start Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={overrideStartDate}
                      onChange={(e) => setOverrideStartDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                      End Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={overrideEndDate}
                      onChange={(e) => setOverrideEndDate(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                </div>
                {overrideDateRangeInvalid && (
                  <p className="text-[10px] text-red-500 font-mono">
                    End date cannot be earlier than start date.
                  </p>
                )}

                <div className="flex gap-4 pt-4 border-t border-zinc-900">
                  <button
                    type="button"
                    onClick={() => setShowOverrideModal(false)}
                    className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 rounded hover:bg-zinc-900 transition-colors uppercase"
                  >
                    CANCEL
                  </button>
                  <button
                    type="submit"
                    disabled={!canSubmitOverride}
                    className="flex-2 py-2.5 bg-blue-600 text-white text-xs font-bold uppercase rounded hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {overrideMutation.isPending ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> SAVING...
                      </>
                    ) : (
                      'CONFIRM OVERRIDE'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Delete Confirm Dialog ───────────────────────────────────────── */}
      <ConfirmDialog
        isOpen={confirmDelete}
        title="Remove survivor from roster?"
        description={`This will permanently delete ${person.full_name} from the camp roster. This action cannot be undone.`}
        confirmLabel="DELETE"
        variant="danger"
        isPending={deletePersonMutation.isPending}
        onConfirm={() => {
          deletePersonMutation.mutate(undefined, {
            onSettled: () => setConfirmDelete(false),
          });
        }}
        onCancel={() => setConfirmDelete(false)}
      />

      {feedback && (
        <ActionFeedbackDialog
          isOpen={true}
          type={feedback.type}
          eyebrow="Population Roster"
          title={feedback.title}
          message={feedback.message}
          actionLabel={feedback.actionLabel}
          onClose={closeFeedback}
        />
      )}
    </div>
  );
}
