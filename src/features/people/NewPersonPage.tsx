import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, toFormData, unwrapList } from '../../lib/api';
import { useAuthStore, useCampStore } from '../../store';
import { hasPermission } from '../../lib/permissions';
import {
  ArrowLeft,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  UserPlus,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../../lib/utils';

const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;

const newPersonSchema = z.object({
  full_name: z
    .string()
    .trim()
    .min(1, 'Full name is required')
    .max(150, 'Full name must be 150 characters or less'),
  age: z
    .string()
    .trim()
    .optional()
    .refine((value) => {
      if (!value) return true;
      const age = Number(value);
      return Number.isInteger(age) && age >= 0 && age <= 255;
    }, 'Age must be a whole number from 0 to 255'),
  profession_id: z.string().min(1, 'Profession is required'),
  status: z.enum(['HEALTHY', 'SICK', 'INJURED', 'AWAY', 'DEAD']),
  skills_summary: z.string().trim().optional(),
  identification_code: z
    .string()
    .trim()
    .max(20, 'Identification code must be 20 characters or less')
    .optional(),
});

type NewPersonForm = z.infer<typeof newPersonSchema>;
type CreatePersonInput = NewPersonForm & { photo?: File | null };

interface FeedbackState {
  type: 'success' | 'error';
  title: string;
  message: string;
}

const getApiErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as {
    response?: { data?: { error?: { message?: unknown }; message?: unknown } };
    message?: unknown;
  };
  const message =
    apiError.response?.data?.error?.message ?? apiError.response?.data?.message ?? apiError.message;
  return typeof message === 'string' && message.trim() ? message : fallback;
};

const validateImageFile = (file: File | null | undefined) => {
  if (!file) return null;
  if (!file.type.startsWith('image/')) return 'Photo must be an image file.';
  if (file.size > MAX_IMAGE_SIZE_BYTES) return 'Photo must be 10MB or smaller.';
  return null;
};

export default function NewPersonPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const { currentCampId } = useCampStore();
  const canAccess = hasPermission(user?.permissions, 'people.create');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<FeedbackState | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<NewPersonForm>({
    resolver: zodResolver(newPersonSchema),
    defaultValues: {
      full_name: '',
      age: '',
      profession_id: '',
      status: 'HEALTHY',
      skills_summary: '',
      identification_code: '',
    },
  });

  const { data: professions } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['professions'],
    queryFn: async () => {
      const res = await apiClient.get('/professions');
      return unwrapList<{ id: number; name: string }>(res.data);
    },
    enabled: canAccess,
  });

  const createPersonMutation = useMutation({
    mutationFn: async (formValues: CreatePersonInput) => {
      if (!currentCampId) throw new Error('No active camp selected.');

      const body = toFormData({
        full_name: formValues.full_name.trim(),
        camp_id: currentCampId,
        profession_id: Number(formValues.profession_id),
        admitted_at: new Date().toISOString(),
        status: formValues.status,
        age: formValues.age ? Number(formValues.age) : null,
        skills_summary: formValues.skills_summary?.trim() || null,
        identification_code: formValues.identification_code?.trim() || null,
        ...(formValues.photo ? { photo: formValues.photo } : {}),
      });

      const res = await apiClient.post(`/camps/${currentCampId}/people`, body);
      return res.data as { full_name?: string };
    },
    onSuccess: (person) => {
      queryClient.invalidateQueries({ queryKey: ['people', currentCampId] });
      queryClient.invalidateQueries({ queryKey: ['people'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      reset();
      setPhoto(null);
      setPhotoError(null);
      setFeedback({
        type: 'success',
        title: 'SURVIVOR REGISTERED',
        message: `${person.full_name || 'The survivor'} was added to the active camp roster.`,
      });
    },
    onError: (error) => {
      setFeedback({
        type: 'error',
        title: 'REGISTRATION FAILED',
        message: getApiErrorMessage(error, 'The survivor could not be registered.'),
      });
    },
  });

  const handlePhotoChange = (file?: File | null) => {
    const validationError = validateImageFile(file);
    setPhotoError(validationError);
    setPhoto(validationError ? null : (file ?? null));
  };

  const onSubmit = (data: NewPersonForm) => {
    const validationError = validateImageFile(photo);
    if (validationError) {
      setPhotoError(validationError);
      return;
    }
    createPersonMutation.mutate({ ...data, photo });
  };

  if (!canAccess) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/population')}
        className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-600 rounded-lg px-3 py-2 transition-all hover:-translate-x-0.5 hover:shadow-[0_0_12px_rgba(255,255,255,0.04)] group"
      >
        <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
        BACK TO POPULATION
      </button>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-raised brutalist-border p-6 md:p-8 rounded-xl space-y-6"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-primary/10 rounded-lg flex items-center justify-center text-brand-primary">
              <UserPlus size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black uppercase italic tracking-tighter">
                Register New Survivor
              </h1>
              <p className="text-xs text-zinc-500 font-mono">
                Add a new personnel record to the camp roster
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div className="rounded-lg border border-zinc-800 bg-zinc-950/40 p-3 space-y-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400">
              Required format
            </p>
            <p className="text-[10px] font-mono text-zinc-500 leading-relaxed">
              Name and profession are required. Name max 150 characters. Age is optional and must be
              0 to 255. Identification code max 20 characters. Photo is optional, image-only, max
              10MB.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Full Name <span className="text-brand-primary">*</span>
            </label>
            <input
              {...register('full_name')}
              maxLength={150}
              placeholder="e.g. Marlene Carter"
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-brand-primary font-mono uppercase"
            />
            {errors.full_name && (
              <p className="text-[10px] text-red-500 font-mono mt-1">{errors.full_name.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Age (Years)
              </label>
              <input
                {...register('age')}
                type="number"
                min={0}
                max={255}
                step={1}
                placeholder="e.g. 28"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-brand-primary font-mono"
              />
              {errors.age && (
                <p className="text-[10px] text-red-500 font-mono mt-1">{errors.age.message}</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Status <span className="text-brand-primary">*</span>
              </label>
              <select
                {...register('status')}
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-brand-primary cursor-pointer uppercase font-mono"
              >
                <option value="HEALTHY">HEALTHY</option>
                <option value="SICK">SICK</option>
                <option value="INJURED">INJURED</option>
                <option value="AWAY">AWAY</option>
                <option value="DEAD">DEAD</option>
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Profession/Role <span className="text-brand-primary">*</span>
            </label>
            <select
              {...register('profession_id')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-brand-primary font-mono uppercase cursor-pointer"
            >
              <option value="">-- Select profession --</option>
              {professions?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {errors.profession_id && (
              <p className="text-[10px] text-red-500 font-mono mt-1">
                {errors.profession_id.message}
              </p>
            )}
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Skills Summary
            </label>
            <textarea
              {...register('skills_summary')}
              rows={3}
              placeholder="e.g. combat training, medical triage, scouting, agriculture"
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-brand-primary font-mono resize-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Survivor Photo (Optional, max 10MB)
              </label>
              <label className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded border border-zinc-800 bg-zinc-950 px-3 py-2.5 text-xs font-mono text-zinc-400 transition-colors hover:border-brand-primary/60">
                <ImageIcon size={16} className="text-brand-primary" />
                <span className="min-w-0 flex-1 truncate">
                  {photo ? photo.name : 'Select image file'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handlePhotoChange(e.target.files?.[0] ?? null)}
                  className="sr-only"
                />
              </label>
              {photoError && (
                <p className="text-[10px] text-red-500 font-mono mt-1">{photoError}</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Identification Code
              </label>
              <input
                {...register('identification_code')}
                maxLength={20}
                placeholder="e.g. GF-2026-001"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-brand-primary font-mono uppercase"
              />
              {errors.identification_code && (
                <p className="text-[10px] text-red-500 font-mono mt-1">
                  {errors.identification_code.message}
                </p>
              )}
            </div>
          </div>

          {(Object.keys(errors).length > 0 || photoError) && (
            <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-lg">
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                Please fix the highlighted fields before registering.
              </p>
            </div>
          )}

          <div className="flex gap-4 pt-4 border-t border-zinc-900">
            <button
              type="button"
              onClick={() => navigate('/population')}
              className="flex-1 py-2.5 text-xs font-bold border border-zinc-800 rounded hover:bg-zinc-900 transition-colors uppercase"
            >
              CANCEL
            </button>
            <button
              type="submit"
              disabled={createPersonMutation.isPending}
              className="flex-2 py-2.5 bg-brand-primary text-black text-xs font-bold uppercase rounded hover:bg-zinc-300 transition-colors disabled:opacity-30 flex items-center justify-center gap-2"
            >
              {createPersonMutation.isPending ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  REGISTERING...
                </>
              ) : (
                'REGISTER SURVIVOR'
              )}
            </button>
          </div>
        </form>
      </motion.div>

      <AnimatePresence>
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
                    : 'border-red-500/40 bg-red-950/20 text-red-400',
                )}
              >
                {feedback.type === 'success' ? <CheckCircle2 size={28} /> : <XCircle size={28} />}
              </div>
              <div className="space-y-2">
                <p
                  className={cn(
                    'text-[10px] font-mono uppercase tracking-widest',
                    feedback.type === 'success' ? 'text-emerald-400' : 'text-red-400',
                  )}
                >
                  Population Roster
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
                onClick={() => {
                  if (feedback.type === 'success') {
                    navigate('/population');
                    return;
                  }
                  setFeedback(null);
                }}
                className={cn(
                  'w-full rounded px-4 py-2.5 text-xs font-black uppercase tracking-wider text-black transition-colors',
                  feedback.type === 'success'
                    ? 'bg-emerald-500 hover:bg-emerald-400'
                    : 'bg-brand-primary hover:bg-brand-primary/90',
                )}
              >
                {feedback.type === 'success' ? 'VIEW ROSTER' : 'ACKNOWLEDGE'}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
