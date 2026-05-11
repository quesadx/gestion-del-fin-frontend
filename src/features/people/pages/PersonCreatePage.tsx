import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { resolved } from '@/shared/lib/form';
import { z } from 'zod';
import { Panel } from '@/components/cyber/Panel';
import { GlitchButton } from '@/components/cyber/GlitchButton';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import { useCamps } from '@/features/camps/hooks/useCamps';
import { useProfessions } from '@/features/people/hooks/useProfessions';
import { useCreatePerson } from '@/features/people/hooks/usePeople';
import { ArrowLeft, UserPlus, Building2, Wrench } from 'lucide-react';

const createPersonSchema = z.object({
  full_name: z.string().min(1, 'Name is required'),
  camp_id: z.coerce.number().min(1, 'Select a camp'),
  profession_id: z.coerce.number().min(1, 'Select a profession'),
  status: z.enum(['HEALTHY', 'SICK', 'INJURED', 'AWAY', 'DEAD']).default('HEALTHY'),
  age: z.coerce.number().min(0).optional(),
  identification_code: z.string().optional(),
  blood_type: z.string().optional(),
  skills_summary: z.string().optional(),
  photo_url: z.string().optional(),
  admitted_at: z.string().min(1, 'Admission date is required'),
});

type CreatePersonFormValues = z.infer<typeof createPersonSchema>;

export function PersonCreatePage() {
  const navigate = useNavigate();
  const { data: camps, isLoading: campsLoading, isError: campsError } = useCamps();
  const { data: professions, isLoading: profsLoading, isError: profsError } = useProfessions();
  const createMutation = useCreatePerson();

  const campsArray = Array.isArray(camps) ? camps : [];
  const professionsArray = Array.isArray(professions) ? professions : [];

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePersonFormValues>({
    resolver: resolved(createPersonSchema),
    defaultValues: {
      full_name: '',
      camp_id: 0,
      profession_id: 0,
      status: 'HEALTHY',
      admitted_at: new Date().toISOString().slice(0, 16),
    },
  });

  const onSubmit = async (values: CreatePersonFormValues) => {
    await createMutation.mutateAsync({
      campId: values.camp_id,
      payload: {
        ...values,
        admitted_at: new Date(values.admitted_at).toISOString(),
        age: values.age || undefined,
        identification_code: values.identification_code || undefined,
        blood_type: values.blood_type || undefined,
        skills_summary: values.skills_summary || undefined,
        photo_url: values.photo_url || undefined,
      },
    });
    navigate('/people');
  };

  const isPending = createMutation.isPending;

  return (
    <div className="space-y-6">
      <GlitchButton variant="ghost" onClick={() => navigate('/people')}>
        <span className="flex items-center gap-2">
          <ArrowLeft className="h-3.5 w-3.5" />
          BACK
        </span>
      </GlitchButton>

      <Panel title="REGISTER PERSON" tag="PPL.NEW" status="INPUT" accent="cyan">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div>
            <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
              FULL NAME //
            </label>
            <input
              {...register('full_name')}
              placeholder="JOHN DOE"
              className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
            />
            {errors.full_name && (
              <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                {errors.full_name.message}
              </p>
            )}
          </div>

          {/* Row: Camp + Profession */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                CAMP //
              </label>
              {campsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground font-mono-data text-xs">
                  <ScreenLoader />
                </div>
              ) : campsError ? (
                <p className="text-red-400 font-mono-data text-xs">Failed to load camps</p>
              ) : campsArray.length === 0 ? (
                <div className="flex items-center gap-2 text-muted-foreground font-mono-data text-xs">
                  <Building2 className="h-3.5 w-3.5" />
                  NO CAMPS AVAILABLE
                </div>
              ) : (
                <select
                  {...register('camp_id')}
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
                >
                  <option value="">SELECT...</option>
                  {campsArray.map((c: Record<string, unknown>) => (
                    <option key={c.id as number} value={c.id as number}>
                      {c.name as string}
                    </option>
                  ))}
                </select>
              )}
              {errors.camp_id && (
                <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {errors.camp_id.message}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                PROFESSION //
              </label>
              {profsLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground font-mono-data text-xs">
                  <ScreenLoader />
                </div>
              ) : profsError ? (
                <p className="text-red-400 font-mono-data text-xs">Failed to load professions</p>
              ) : professionsArray.length === 0 ? (
                <div className="flex items-center gap-2 text-muted-foreground font-mono-data text-xs">
                  <Wrench className="h-3.5 w-3.5" />
                  NO PROFESSIONS AVAILABLE
                </div>
              ) : (
                <select
                  {...register('profession_id')}
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
                >
                  <option value="">SELECT...</option>
                  {professionsArray.map((p: Record<string, unknown>) => (
                    <option key={p.id as number} value={p.id as number}>
                      {p.name as string}
                    </option>
                  ))}
                </select>
              )}
              {errors.profession_id && (
                <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {errors.profession_id.message}
                </p>
              )}
            </div>
          </div>

          {/* Row: Status + Age */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                STATUS //
              </label>
              <select
                {...register('status')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
              >
                <option value="HEALTHY">HEALTHY</option>
                <option value="SICK">SICK</option>
                <option value="INJURED">INJURED</option>
                <option value="AWAY">AWAY</option>
                <option value="DEAD">DECEASED</option>
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                AGE //
              </label>
              <input
                {...register('age')}
                type="number"
                placeholder="30"
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              />
            </div>
          </div>

          {/* Admitted at */}
          <div>
            <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
              ADMISSION DATE //
            </label>
            <input
              {...register('admitted_at')}
              type="datetime-local"
              className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
            />
            {errors.admitted_at && (
              <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                {errors.admitted_at.message}
              </p>
            )}
          </div>

          {/* Row: Code + Blood */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                ID CODE //
              </label>
              <input
                {...register('identification_code')}
                placeholder="ID-XXX-###"
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                BLOOD TYPE //
              </label>
              <input
                {...register('blood_type')}
                placeholder="O+"
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              />
            </div>
          </div>

          {/* Skills */}
          <div>
            <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
              SKILLS //
            </label>
            <textarea
              {...register('skills_summary')}
              rows={3}
              placeholder="First aid, basic mechanics..."
              className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-[var(--neon-cyan)] font-mono-data"
            />
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[oklch(0.68_0.32_340_/_0.2)]">
            <GlitchButton variant="ghost" type="button" onClick={() => navigate('/people')}>
              CANCEL
            </GlitchButton>
            <GlitchButton variant="primary" type="submit" disabled={isPending}>
              {isPending ? (
                'REGISTERING...'
              ) : (
                <span className="flex items-center gap-2">
                  <UserPlus className="h-3.5 w-3.5" />
                  REGISTER
                </span>
              )}
            </GlitchButton>
          </div>
        </form>
      </Panel>
    </div>
  );
}
