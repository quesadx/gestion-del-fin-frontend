import { Navigate, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, toFormData, unwrapList } from '../../lib/api';
import { useCampStore } from '../../store';
import { can, PERM } from '../../lib/permissions';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';
import { motion } from 'motion/react';

// ── Form schema ────────────────────────────────────────────────────────────

const newPersonSchema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  age: z.string().optional(),
  profession_id: z.string().optional(),
  status: z.string().min(1, 'Status is required'),
  photo_url: z.string().optional(),
  skills_summary: z.string().optional(),
  identification_code: z.string().optional(),
});

type NewPersonForm = z.infer<typeof newPersonSchema>;

// ── Component ──────────────────────────────────────────────────────────────

export default function NewPersonPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { currentCampId } = useCampStore();
  const hasSystemAdminAccess = can(PERM.WILDCARD);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<NewPersonForm>({
    resolver: zodResolver(newPersonSchema),
    defaultValues: {
      full_name: '',
      age: '',
      profession_id: '',
      status: 'HEALTHY',
      photo_url: '',
      skills_summary: '',
      identification_code: '',
    },
  });

  // ── Fetch professions ───────────────────────────────────────────────────

  const { data: professions } = useQuery<{ id: number; name: string }[]>({
    queryKey: ['professions'],
    queryFn: async () => {
      const res = await apiClient.get('/professions');
      return unwrapList<{ id: number; name: string }>(res.data);
    },
    enabled: hasSystemAdminAccess,
  });

  // ── Create mutation ─────────────────────────────────────────────────────

  const createPersonMutation = useMutation({
    mutationFn: async (formValues: NewPersonForm) => {
      const body = toFormData({
        full_name: formValues.full_name,
        status: formValues.status,
        age: formValues.age ? Number(formValues.age) : null,
        profession_id: formValues.profession_id ? Number(formValues.profession_id) : null,
        photo_url: formValues.photo_url || null,
        skills_summary: formValues.skills_summary || null,
        identification_code: formValues.identification_code || null,
      });
      const res = await apiClient.post(`/camps/${currentCampId}/people`, body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['people', currentCampId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-metrics'] });
      navigate('/population');
    },
  });

  const onSubmit = (data: NewPersonForm) => {
    createPersonMutation.mutate(data);
  };

  if (!hasSystemAdminAccess) {
    return <Navigate to="/" replace />;
  }

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Back navigation */}
      <button
        onClick={() => navigate('/population')}
        className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-wider"
      >
        <ArrowLeft size={14} />
        BACK TO POPULATION
      </button>

      {/* Form card */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface-raised brutalist-border p-6 md:p-8 rounded-xl space-y-6"
      >
        {/* Header */}
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
          {/* Full Name */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Full Name <span className="text-brand-primary">*</span>
            </label>
            <input
              {...register('full_name')}
              placeholder="e.g. Marlene Carter"
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-brand-primary font-mono uppercase"
            />
            {errors.full_name && (
              <p className="text-[10px] text-red-500 font-mono mt-1">{errors.full_name.message}</p>
            )}
          </div>

          {/* Age + Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Age (Years)
              </label>
              <input
                {...register('age')}
                type="number"
                placeholder="e.g. 28"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-brand-primary font-mono"
              />
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

          {/* Profession */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
              Profession/Role
            </label>
            <select
              {...register('profession_id')}
              className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2.5 text-xs text-zinc-200 focus:outline-none focus:border-brand-primary font-mono uppercase cursor-pointer"
            >
              <option value="">— Select profession —</option>
              {professions?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Skills summary */}
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

          {/* Photo URL + Identification Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Photo URL (Optional)
              </label>
              <input
                {...register('photo_url')}
                type="url"
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-brand-primary font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                Identification Code (Optional)
              </label>
              <input
                {...register('identification_code')}
                placeholder="e.g. GF-2024-001"
                className="w-full bg-zinc-950 border border-zinc-800 rounded px-3 py-2.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-brand-primary font-mono uppercase"
              />
            </div>
          </div>

          {/* Validation errors summary */}
          {Object.keys(errors).length > 0 && (
            <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-lg">
              <p className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
                Please fix the following errors:
              </p>
              <ul className="mt-1 space-y-0.5">
                {Object.entries(errors).map(([field, err]) => (
                  <li key={field} className="text-[10px] font-mono text-red-400">
                    {field}: {err?.message as string}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Actions */}
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
    </div>
  );
}
