import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { resolved } from '@/shared/lib/form';
import { z } from 'zod';
import { format } from 'date-fns';
import { GlassPanel } from '@/components/tactical/GlassPanel';
import { TacticalButton } from '@/components/tactical/TacticalButton';
import { HoloLoader } from '@/components/tactical/HoloLoader';
import { StatusBadge } from '@/components/cyber/StatusBadge';
import { toast } from '@/shared/lib/toast';
import { useCamps } from '@/features/camps/hooks/useCamps';
import {
  useAdmissions,
  useCreateAdmission,
  useReviewAdmission,
} from '@/features/admission/hooks/useAdmissions';
import type { AdmissionResponse } from '@/features/admission/api/admission.api';
import type { Camp } from '@/features/camps/types/camp.types';
import type { PaginatedResponse } from '@/shared/api/types';
import { AIAnalysisPanel } from '@/features/admission/components/AIAnalysisPanel';
import { AdmissionDetailPanel } from '@/features/admission/components/AdmissionDetailPanel';
import { ClipboardCheck, UserPlus, CheckCircle, XCircle, FileText, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const createAdmissionSchema = z.object({
  applicant_name: z.string().min(1, 'Name is required'),
  applicant_age: z.coerce.number().min(0).optional(),
  applicant_skills: z.string().optional(),
  health_notes: z.string().optional(),
  background_notes: z.string().optional(),
  photo_url: z.string().optional(),
  id_card_url: z.string().optional(),
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
  const [detailTarget, setDetailTarget] = useState<AdmissionResponse | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  const campsResponse = camps as PaginatedResponse<Camp> | undefined;
  const campsArray = Array.isArray(campsResponse?.data) ? campsResponse.data : ([] as Camp[]);
  const admArray: AdmissionResponse[] = Array.isArray(admissions)
    ? (admissions as AdmissionResponse[])
    : [];
  const form = useForm<CreateFormValues>({
    resolver: resolved(createAdmissionSchema),
    defaultValues: {
      applicant_name: '',
      applicant_age: undefined,
      applicant_skills: '',
      health_notes: '',
      background_notes: '',
      photo_url: '',
      id_card_url: '',
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
          photo_url: values.photo_url || undefined,
          id_card_url: values.id_card_url || undefined,
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
      <GlassPanel
        title="ADMISSION REQUESTS"
        tag="ADM.01"
        status={selectedCampId ? 'ONLINE' : 'AWAITING'}
        accent="cyan"
      >
        {campsLoading ? (
          <HoloLoader />
        ) : campsArray.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <ClipboardCheck className="h-8 w-8 text-gdf-accent-secondary/40" />
            <p className="font-sans text-xs text-sm text-muted-foreground">NO CAMPS AVAILABLE</p>
          </div>
        ) : (
          <div>
            <label className="block mb-1.5 text-[10px] tracking-normal text-gdf-accent-secondary/60 font-sans text-xs">
              CAMP //
            </label>
            <select
              value={selectedCampId ?? ''}
              onChange={(e) => setSelectedCampId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-md bg-gdf-surface-overlay/50 border border-gdf-border-default px-3 py-2.5 text-sm text-foreground outline-none focus:border-gdf-accent-secondary font-sans text-xs"
            >
              <option value="">SELECT A CAMP</option>
              {campsArray.map((c: Camp) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </GlassPanel>

      {!selectedCampId ? (
        <GlassPanel accent="amber">
          <div className="flex flex-col items-center gap-4 py-8">
            <ClipboardCheck className="h-10 w-10 text-gdf-accent-primary/40" />
            <p className="font-sans text-xs text-sm text-muted-foreground">SELECT A CAMP</p>
          </div>
        </GlassPanel>
      ) : admLoading ? (
        <HoloLoader />
      ) : admError ? (
        <GlassPanel title="ERROR" status="ERROR" accent="amber">
          <p className="text-sm text-red-400 font-sans text-xs mb-4">
            {(admErr as Error)?.message || 'Failed to load requests'}
          </p>
          <TacticalButton variant="warning" onClick={() => refetch()}>
            RETRY
          </TacticalButton>
        </GlassPanel>
      ) : admArray.length === 0 ? (
        <GlassPanel accent="cyan">
          <div className="flex flex-col items-center gap-4 py-8">
            <FileText className="h-10 w-10 text-gdf-accent-secondary/40" />
            <p className="font-sans text-xs text-sm text-muted-foreground">NO ADMISSION REQUESTS</p>
            <TacticalButton variant="primary" onClick={() => setCreateOpen(true)}>
              <span className="flex items-center gap-2">
                <UserPlus className="h-3.5 w-3.5" />
                NEW ADMISSION REQUEST
              </span>
            </TacticalButton>
          </div>
        </GlassPanel>
      ) : (
        <GlassPanel
          title="REQUESTS"
          tag={`ADM.${selectedCampId}`}
          status={`${admArray.length} RECORDS`}
          accent="cyan"
        >
          <div className="mb-4 flex justify-end">
            <TacticalButton variant="primary" onClick={() => setCreateOpen(true)}>
              <span className="flex items-center gap-2">
                <UserPlus className="h-3.5 w-3.5" />
                NEW REQUEST
              </span>
            </TacticalButton>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left font-sans text-xs text-xs">
              <thead>
                <tr className="border-b border-gdf-border-subtle text-muted-foreground">
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
                {admArray.map((a) => (
                  <tr
                    key={a.id as number}
                    className="border-b border-gdf-border-subtle hover:bg-gdf-surface-hover transition-colors"
                  >
                    <td className="py-3 px-2 text-gdf-accent-primary">
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
                            onClick={() => {
                              setDetailTarget(a);
                              setDetailDialogOpen(true);
                            }}
                            className="p-1.5 rounded-md text-gdf-accent-secondary hover:bg-[oklch(0.85_0.22_200_/_0.1)] transition-colors"
                            title="View details and AI analysis"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {(!a.final_decision || a.final_decision === 'PENDING') && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleReview(a.id, 'ACCEPTED')}
                                className="p-1.5 rounded-md text-green-400 hover:bg-green-400/10 transition-colors"
                                title="Accept"
                              >
                                <CheckCircle className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReview(a.id, 'REJECTED')}
                                className="p-1.5 rounded-md text-red-400 hover:bg-red-400/10 transition-colors"
                                title="Reject"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassPanel>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-gdf-surface-overlay/95 border border-gdf-border-default text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-normal text-glow-fuchsia">
              NEW ADMISSION REQUEST
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmitCreate)} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-normal text-gdf-accent-secondary/60 font-sans text-xs">
                APPLICANT NAME //
              </label>
              <input
                {...form.register('applicant_name')}
                className="w-full rounded-md bg-gdf-surface-overlay/50 border border-gdf-border-default px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-gdf-accent-primary font-sans text-xs"
              />
              {form.formState.errors.applicant_name && (
                <p className="mt-1 text-[10px] text-gdf-status-warning font-sans text-xs">
                  {form.formState.errors.applicant_name.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 text-[10px] tracking-normal text-gdf-accent-secondary/60 font-sans text-xs">
                  AGE //
                </label>
                <input
                  {...form.register('applicant_age')}
                  type="number"
                  className="w-full rounded-md bg-gdf-surface-overlay/50 border border-gdf-border-default px-3 py-2.5 text-sm text-foreground outline-none focus:border-gdf-accent-secondary font-sans text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-normal text-gdf-accent-secondary/60 font-sans text-xs">
                SKILLS //
              </label>
              <textarea
                {...form.register('applicant_skills')}
                rows={3}
                className="w-full rounded-md bg-gdf-surface-overlay/50 border border-gdf-border-default px-3 py-2.5 text-sm text-foreground outline-none focus:border-gdf-accent-secondary font-sans text-xs"
              />
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-normal text-gdf-accent-secondary/60 font-sans text-xs">
                HEALTH NOTES //
              </label>
              <textarea
                {...form.register('health_notes')}
                rows={2}
                className="w-full rounded-md bg-gdf-surface-overlay/50 border border-gdf-border-default px-3 py-2.5 text-sm text-foreground outline-none focus:border-gdf-accent-secondary font-sans text-xs"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 text-[10px] tracking-normal text-gdf-accent-secondary/60 font-sans text-xs">
                  PHOTO URL //
                </label>
                <input
                  {...form.register('photo_url')}
                  type="text"
                  placeholder="https://..."
                  className="w-full rounded-md bg-gdf-surface-overlay/50 border border-gdf-border-default px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-gdf-accent-secondary font-sans text-xs"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-[10px] tracking-normal text-gdf-accent-secondary/60 font-sans text-xs">
                  ID CARD URL //
                </label>
                <input
                  {...form.register('id_card_url')}
                  type="text"
                  placeholder="https://..."
                  className="w-full rounded-md bg-gdf-surface-overlay/50 border border-gdf-border-default px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none focus:border-gdf-accent-secondary font-sans text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-normal text-gdf-accent-secondary/60 font-sans text-xs">
                BACKGROUND NOTES //
              </label>
              <textarea
                {...form.register('background_notes')}
                rows={2}
                className="w-full rounded-md bg-gdf-surface-overlay/50 border border-gdf-border-default px-3 py-2.5 text-sm text-foreground outline-none focus:border-gdf-accent-secondary font-sans text-xs"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <TacticalButton
                variant="ghost"
                type="button"
                onClick={() => {
                  setCreateOpen(false);
                  form.reset();
                }}
              >
                CANCEL
              </TacticalButton>
              <TacticalButton variant="primary" type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'CREATING...' : 'CREATE REQUEST'}
              </TacticalButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="bg-gdf-surface-overlay/95 border border-gdf-border-default text-foreground max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-normal text-gdf-accent-secondary">
              ADMISSION DETAILS
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <AdmissionDetailPanel
              applicantName={detailTarget?.applicant_name ?? ''}
              applicantAge={detailTarget?.applicant_age ?? null}
              applicantSkills={detailTarget?.applicant_skills ?? null}
              healthNotes={detailTarget?.health_notes ?? null}
              backgroundNotes={detailTarget?.background_notes ?? null}
              photoUrl={detailTarget?.photo_url ?? null}
              idCardUrl={detailTarget?.id_card_url ?? null}
              createdAt={detailTarget?.created_at ?? null}
            />
            <AIAnalysisPanel
              aiDecision={detailTarget?.ai_decision ?? null}
              aiReasoning={detailTarget?.ai_reasoning ?? null}
              aiSuggestedProfession={detailTarget?.ai_suggested_profession ?? null}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
