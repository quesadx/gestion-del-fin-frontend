import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { resolved } from '@/shared/lib/form';
import { z } from 'zod';
import { format } from 'date-fns';
import { Panel } from '@/components/cyber/Panel';
import { GlitchButton } from '@/components/cyber/GlitchButton';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import { StatusBadge } from '@/components/cyber/StatusBadge';
import { toast } from '@/shared/lib/toast';
import { useCamps } from '@/features/camps/hooks/useCamps';
import {
  useAdmissions,
  useCreateAdmission,
  useReviewAdmission,
} from '@/features/admission/hooks/useAdmissions';
import { ClipboardCheck, UserPlus, CheckCircle, XCircle, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const createAdmissionSchema = z.object({
  applicant_name: z.string().min(1, 'Name is required'),
  applicant_age: z.coerce.number().min(0).optional(),
  applicant_skills: z.string().optional(),
  health_notes: z.string().optional(),
  background_notes: z.string().optional(),
});

type CreateFormValues = z.infer<typeof createAdmissionSchema>;

export function AdmissionsPage() {
  const { data: camps, isLoading: campsLoading } = useCamps();
  const [selectedCampId, setSelectedCampId] = useState<number | null>(null);
  const {
    data: admissions,
    isLoading: admLoading,
    isError: admError,
    error: admErr,
    refetch,
  } = useAdmissions(selectedCampId ?? 0);
  const createMutation = useCreateAdmission();
  const reviewMutation = useReviewAdmission();

  const [createOpen, setCreateOpen] = useState(false);

  const campsArray = Array.isArray((camps as Record<string, unknown>)?.data)
    ? ((camps as Record<string, unknown>).data as Record<string, unknown>[])
    : [];
  const admArray = Array.isArray(admissions) ? admissions : [];

  const form = useForm<CreateFormValues>({
    resolver: resolved(createAdmissionSchema),
    defaultValues: {
      applicant_name: '',
      applicant_age: undefined,
      applicant_skills: '',
      health_notes: '',
      background_notes: '',
    },
  });

  const onSubmitCreate = async (values: CreateFormValues) => {
    if (!selectedCampId) return;
    try {
      await createMutation.mutateAsync({
        campId: selectedCampId,
        payload: {
          ...values,
          applicant_age: values.applicant_age || undefined,
          applicant_skills: values.applicant_skills || undefined,
          health_notes: values.health_notes || undefined,
          background_notes: values.background_notes || undefined,
        },
      });
      toast('Admission request created successfully', 'success');
      setCreateOpen(false);
      form.reset();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create admission request';
      toast(message, 'error');
    }
  };

  const handleReview = async (id: number, final_decision: 'ACCEPTED' | 'REJECTED') => {
    try {
      await reviewMutation.mutateAsync({ id, payload: { final_decision } });
      const label = final_decision === 'ACCEPTED' ? 'accepted' : 'rejected';
      toast(`Admission ${label} successfully`, 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to review admission';
      toast(message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      <Panel
        title="ADMISSION REQUESTS"
        tag="ADM.01"
        status={selectedCampId ? 'ONLINE' : 'AWAITING'}
        accent="cyan"
      >
        {campsLoading ? (
          <ScreenLoader />
        ) : campsArray.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <ClipboardCheck className="h-8 w-8 text-[var(--neon-cyan)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">NO CAMPS AVAILABLE</p>
          </div>
        ) : (
          <div>
            <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
              CAMP //
            </label>
            <select
              value={selectedCampId ?? ''}
              onChange={(e) => setSelectedCampId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
            >
              <option value="">SELECT A CAMP</option>
              {campsArray.map((c: Record<string, unknown>) => (
                <option key={c.id as number} value={c.id as number}>
                  {c.name as string}
                </option>
              ))}
            </select>
          </div>
        )}
      </Panel>

      {!selectedCampId ? (
        <Panel accent="purple">
          <div className="flex flex-col items-center gap-4 py-8">
            <ClipboardCheck className="h-10 w-10 text-[var(--neon-fuchsia)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">SELECT A CAMP</p>
          </div>
        </Panel>
      ) : admLoading ? (
        <ScreenLoader />
      ) : admError ? (
        <Panel title="ERROR" status="ERROR" accent="purple">
          <p className="text-sm text-red-400 font-mono-data mb-4">
            {(admErr as Error)?.message || 'Failed to load requests'}
          </p>
          <GlitchButton variant="warning" onClick={() => refetch()}>
            RETRY
          </GlitchButton>
        </Panel>
      ) : admArray.length === 0 ? (
        <Panel accent="cyan">
          <div className="flex flex-col items-center gap-4 py-8">
            <FileText className="h-10 w-10 text-[var(--neon-cyan)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">NO ADMISSION REQUESTS</p>
            <GlitchButton variant="primary" onClick={() => setCreateOpen(true)}>
              <span className="flex items-center gap-2">
                <UserPlus className="h-3.5 w-3.5" />
                NEW REQUEST
              </span>
            </GlitchButton>
          </div>
        </Panel>
      ) : (
        <Panel
          title="REQUESTS"
          tag={`ADM.${selectedCampId}`}
          status={`${admArray.length} RECORDS`}
          accent="cyan"
        >
          <div className="mb-4 flex justify-end">
            <GlitchButton variant="primary" onClick={() => setCreateOpen(true)}>
              <span className="flex items-center gap-2">
                <UserPlus className="h-3.5 w-3.5" />
                NEW REQUEST
              </span>
            </GlitchButton>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono-data text-xs">
              <thead>
                <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                  <th className="py-3 px-2">NAME</th>
                  <th className="py-3 px-2">AGE</th>
                  <th className="py-3 px-2">SKILLS</th>
                  <th className="py-3 px-2">HEALTH</th>
                  <th className="py-3 px-2">DECISION</th>
                  <th className="py-3 px-2">DATE</th>
                  <th className="py-3 px-2">ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {admArray.map((a: Record<string, unknown>) => (
                  <tr
                    key={a.id as number}
                    className="border-b border-[oklch(0.68_0.32_340_/_0.1)] hover:bg-[oklch(0.68_0.32_340_/_0.05)] transition-colors"
                  >
                    <td className="py-3 px-2 text-[var(--neon-fuchsia)]">
                      {a.applicant_name as string}
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">
                      {(a.applicant_age as number) ?? '—'}
                    </td>
                    <td className="py-3 px-2 text-muted-foreground max-w-[150px] truncate">
                      {(a.applicant_skills as string) || '—'}
                    </td>
                    <td className="py-3 px-2 text-muted-foreground max-w-[150px] truncate">
                      {(a.health_notes as string) || '—'}
                    </td>
                    <td className="py-3 px-2">
                      {a.final_decision ? (
                        <StatusBadge
                          status={a.final_decision as string}
                          variant={a.final_decision === 'ACCEPTED' ? 'green' : 'red'}
                        />
                      ) : (
                        <StatusBadge status="PENDING" variant="amber" />
                      )}
                    </td>
                    <td className="py-3 px-2 text-muted-foreground">
                      {a.created_at ? format(new Date(a.created_at as string), 'dd/MM/yyyy') : '—'}
                    </td>
                    <td className="py-3 px-2">
                      {!a.final_decision && (
                        <div className="flex gap-1">
                          <button
                            type="button"
                            onClick={() => handleReview(a.id as number, 'ACCEPTED')}
                            className="p-1.5 rounded-sm text-green-400 hover:bg-green-400/10 transition-colors"
                            title="Accept"
                          >
                            <CheckCircle className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReview(a.id as number, 'REJECTED')}
                            className="p-1.5 rounded-sm text-red-400 hover:bg-red-400/10 transition-colors"
                            title="Reject"
                          >
                            <XCircle className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-glow-fuchsia">
              NEW ADMISSION REQUEST
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                APPLICANT NAME //
              </label>
              <input
                {...form.register('applicant_name')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
              />
              {form.formState.errors.applicant_name && (
                <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {form.formState.errors.applicant_name.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  AGE //
                </label>
                <input
                  {...form.register('applicant_age')}
                  type="number"
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                SKILLS //
              </label>
              <textarea
                {...form.register('applicant_skills')}
                rows={3}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                HEALTH NOTES //
              </label>
              <textarea
                {...form.register('health_notes')}
                rows={2}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                BACKGROUND NOTES //
              </label>
              <textarea
                {...form.register('background_notes')}
                rows={2}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <GlitchButton
                variant="ghost"
                type="button"
                onClick={() => {
                  setCreateOpen(false);
                  form.reset();
                }}
              >
                CANCEL
              </GlitchButton>
              <GlitchButton variant="primary" type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'CREATING...' : 'CREATE REQUEST'}
              </GlitchButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
