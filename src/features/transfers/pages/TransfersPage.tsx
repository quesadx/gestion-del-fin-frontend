import { useState, useMemo } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { resolved } from '@/shared/lib/form';
import { z } from 'zod';
import { format } from 'date-fns';
import { Panel } from '@/components/cyber/Panel';
import { GlitchButton } from '@/components/cyber/GlitchButton';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import { StatusBadge } from '@/components/cyber/StatusBadge';
import {
  useTransfers,
  useCreateTransfer,
  useScheduleTransferDelivery,
  useApproveTransferSource,
  useApproveTransferTarget,
  useCompleteTransfer,
  useRejectTransfer,
} from '@/features/transfers/hooks/useTransfers';
import { useCamps } from '@/features/camps/hooks/useCamps';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { toast } from '@/shared/lib/toast';
import { ArrowRightLeft, Plus, Truck, Check, X, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const STATUS_MAP: Record<string, 'cyan' | 'yellow' | 'green' | 'red'> = {
  PENDING: 'yellow',
  APPROVED_SOURCE: 'cyan',
  APPROVED_TARGET: 'cyan',
  COMPLETED: 'green',
  REJECTED: 'red',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'PENDING',
  APPROVED_SOURCE: 'SOURCE APPROVED',
  APPROVED_TARGET: 'DESTINATION APPROVED',
  COMPLETED: 'COMPLETED',
  REJECTED: 'REJECTED',
};

const TYPE_LABELS: Record<string, string> = {
  RESOURCE: 'RESOURCE',
  PERSON: 'PERSON',
  MIXED: 'MIXED',
};

const transferItemSchema = z.object({
  item_type: z.enum(['RESOURCE', 'PERSON']),
  resource_type_id: z.coerce.number().min(1).optional(),
  person_id: z.coerce.number().min(1).optional(),
  quantity: z.coerce.number().positive().optional(),
});

const createTransferSchema = z.object({
  requesting_camp: z.coerce.number().min(1, 'Select source camp'),
  target_camp: z.coerce.number().min(1, 'Select destination camp'),
  type: z.enum(['RESOURCE', 'PERSON', 'MIXED']),
  notes: z.string().optional(),
  leader_person_id: z.coerce.number().optional(),
  scheduled_delivery_date: z.string().optional(),
  items: z.array(transferItemSchema).min(1, 'At least one item is required'),
});

type TransferFormValues = z.infer<typeof createTransferSchema>;

export function TransfersPage() {
  const { data: transfers, isLoading, isError, error, refetch } = useTransfers();
  const { data: camps } = useCamps();
  const createMutation = useCreateTransfer();
  const scheduleMutation = useScheduleTransferDelivery();
  const approveSourceMutation = useApproveTransferSource();
  const approveTargetMutation = useApproveTransferTarget();
  const completeMutation = useCompleteTransfer();
  const rejectMutation = useRejectTransfer();

  const userId = useAuthStore((state) => state.userId);

  const [createOpen, setCreateOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ id: number; reason: string } | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [scheduleTarget, setScheduleTarget] = useState<number | null>(null);
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [scheduleDate, setScheduleDate] = useState('');

  const campsArray = useMemo(
    () =>
      Array.isArray((camps as Record<string, unknown>)?.data)
        ? ((camps as Record<string, unknown>).data as Record<string, unknown>[])
        : ([] as Record<string, unknown>[]),
    [camps],
  );
  const transfersArray = useMemo(
    () => (Array.isArray(transfers) ? transfers : ([] as Record<string, unknown>[])),
    [transfers],
  );

  const formCreate = useForm<TransferFormValues>({
    resolver: resolved(createTransferSchema),
    defaultValues: {
      requesting_camp: 0,
      target_camp: 0,
      type: 'RESOURCE',
      notes: '',
      items: [
        {
          item_type: 'RESOURCE',
          resource_type_id: undefined,
          person_id: undefined,
          quantity: undefined,
        },
      ],
    },
  });

  const watchItems = useWatch({
    control: formCreate.control,
    name: 'items',
  });

  const addItem = () => {
    const items = formCreate.getValues('items');
    formCreate.setValue('items', [
      ...items,
      {
        item_type: 'RESOURCE',
        resource_type_id: undefined,
        person_id: undefined,
        quantity: undefined,
      },
    ]);
  };

  const removeItem = (index: number) => {
    const items = formCreate.getValues('items');
    if (items.length <= 1) return;
    formCreate.setValue(
      'items',
      items.filter((_, i) => i !== index),
    );
  };

  const onSubmitCreate = async (values: TransferFormValues) => {
    if (!userId) {
      toast('Authentication required — user ID not available', 'error');
      return;
    }

    const items = values.items.map((item) => ({
      item_type: item.item_type,
      resource_type_id: item.item_type === 'RESOURCE' ? item.resource_type_id : undefined,
      person_id: item.item_type === 'PERSON' ? item.person_id : undefined,
      quantity: item.item_type === 'RESOURCE' ? item.quantity : undefined,
    }));

    const payload = {
      requesting_camp: values.requesting_camp,
      target_camp: values.target_camp,
      type: values.type,
      notes: values.notes || undefined,
      requested_by: userId,
      leader_person_id: values.leader_person_id || undefined,
      scheduled_delivery_date: values.scheduled_delivery_date || undefined,
      items,
    };

    try {
      await createMutation.mutateAsync(payload);
      toast('Transfer created successfully', 'success');
      formCreate.reset();
      setCreateOpen(false);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create transfer';
      toast(message, 'error');
    }
  };

  const handleApproveSource = async (id: number) => {
    try {
      await approveSourceMutation.mutateAsync({ id, payload: {} });
      toast('Source approved successfully', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to approve source';
      toast(message, 'error');
    }
  };

  const handleApproveTarget = async (id: number) => {
    try {
      await approveTargetMutation.mutateAsync({ id, payload: {} });
      toast('Destination approved successfully', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to approve destination';
      toast(message, 'error');
    }
  };

  const handleComplete = async (id: number) => {
    try {
      await completeMutation.mutateAsync({ id, payload: {} });
      toast('Transfer completed successfully', 'success');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to complete transfer';
      toast(message, 'error');
    }
  };

  const handleSchedule = (id: number) => {
    setScheduleTarget(id);
    setScheduleDate('');
    setScheduleDialogOpen(true);
  };

  const handleScheduleConfirm = async () => {
    if (!scheduleTarget || !scheduleDate) return;
    try {
      await scheduleMutation.mutateAsync({
        id: scheduleTarget,
        payload: { scheduled_delivery_date: new Date(scheduleDate).toISOString() },
      });
      toast('Delivery scheduled successfully', 'success');
      setScheduleDialogOpen(false);
      setScheduleTarget(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to schedule delivery';
      toast(message, 'error');
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    try {
      await rejectMutation.mutateAsync({
        id: rejectTarget.id,
        payload: { reason: rejectTarget.reason },
      });
      toast('Transfer rejected', 'success');
      setRejectDialogOpen(false);
      setRejectTarget(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reject transfer';
      toast(message, 'error');
    }
  };

  const campMap = new Map<number, string>();
  campsArray.forEach((c: Record<string, unknown>) => campMap.set(c.id as number, c.name as string));

  const historyTransfers = useMemo(() => {
    return transfersArray
      .filter((t: Record<string, unknown>) => {
        const status = t.status as string;
        return status === 'COMPLETED' || status === 'REJECTED';
      })
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const aTime = new Date((a.updated_at ?? a.created_at) as string).getTime();
        const bTime = new Date((b.updated_at ?? b.created_at) as string).getTime();
        return bTime - aTime;
      });
  }, [transfersArray]);

  if (isLoading) return <ScreenLoader />;

  if (isError) {
    return (
      <div className="space-y-6">
        <Panel title="ERROR" tag="TRN.ERR" status="ERROR" accent="purple">
          <p className="text-sm text-red-400 font-mono-data mb-4">
            {(error as Error)?.message || 'Failed to load transfers'}
          </p>
          <GlitchButton variant="warning" onClick={() => refetch()}>
            RETRY
          </GlitchButton>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Panel
        title="CAMP-TO-CAMP TRANSFERS"
        tag="TRN.01"
        status={transfersArray.length.toString()}
        accent="cyan"
      >
        {transfersArray.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <ArrowRightLeft className="h-10 w-10 text-[var(--neon-cyan)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">NO TRANSFERS REGISTERED</p>
            <GlitchButton variant="primary" onClick={() => setCreateOpen(true)}>
              <span className="flex items-center gap-2">
                <Plus className="h-3.5 w-3.5" />
                NEW TRANSFER
              </span>
            </GlitchButton>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <GlitchButton variant="primary" onClick={() => setCreateOpen(true)}>
                <span className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  NEW TRANSFER
                </span>
              </GlitchButton>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono-data text-xs">
                <thead>
                  <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                    <th className="py-3 px-2">TYPE</th>
                    <th className="py-3 px-2">SOURCE → DESTINATION</th>
                    <th className="py-3 px-2">STATUS</th>
                    <th className="py-3 px-2">ITEMS</th>
                    <th className="py-3 px-2">CREATED</th>
                    <th className="py-3 px-2">WORKFLOW ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {transfersArray.map((t: Record<string, unknown>) => {
                    const items = t.items as Record<string, unknown>[] | undefined;
                    const itemCount = items?.length ?? 0;
                    const requesting =
                      campMap.get(t.requesting_camp as number) || `CAMP-${t.requesting_camp}`;
                    const target = campMap.get(t.target_camp as number) || `CAMP-${t.target_camp}`;
                    const status = t.status as string;

                    return (
                      <tr
                        key={t.id as number}
                        className="border-b border-[oklch(0.68_0.32_340_/_0.1)] hover:bg-[oklch(0.68_0.32_340_/_0.05)] transition-colors"
                      >
                        <td className="py-3 px-2">
                          <StatusBadge
                            status={TYPE_LABELS[t.type as string] || (t.type as string)}
                            variant="purple"
                          />
                        </td>
                        <td className="py-3 px-2">
                          <span className="text-[var(--neon-fuchsia)]">{requesting}</span>
                          <span className="text-muted-foreground mx-1">→</span>
                          <span className="text-[var(--neon-cyan)]">{target}</span>
                        </td>
                        <td className="py-3 px-2">
                          <StatusBadge
                            status={STATUS_LABELS[status] || status}
                            variant={STATUS_MAP[status] || 'cyan'}
                          />
                        </td>
                        <td className="py-3 px-2 text-muted-foreground">{itemCount}</td>
                        <td className="py-3 px-2 text-muted-foreground">
                          {t.created_at
                            ? format(new Date(t.created_at as string), 'dd/MM/yyyy')
                            : '—'}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-1">
                            {status === 'PENDING' && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleSchedule(t.id as number)}
                                  className="p-1 rounded-sm text-[var(--neon-cyan)] hover:bg-[oklch(0.85_0.22_200_/_0.1)] text-[10px]"
                                  title="Schedule delivery"
                                >
                                  <Truck className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApproveSource(t.id as number)}
                                  className="p-1 rounded-sm text-green-400 hover:bg-green-400/10 text-[10px]"
                                  title="Approve source"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setRejectTarget({ id: t.id as number, reason: '' });
                                    setRejectDialogOpen(true);
                                  }}
                                  className="p-1 rounded-sm text-red-400 hover:bg-red-400/10 text-[10px]"
                                  title="Reject"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </>
                            )}
                            {status === 'APPROVED_SOURCE' && (
                              <button
                                type="button"
                                onClick={() => handleApproveTarget(t.id as number)}
                                className="p-1 rounded-sm bg-green-400/10 text-green-400 hover:bg-green-400/20 text-[10px] px-2"
                              >
                                APPROVE DESTINATION
                              </button>
                            )}
                            {status === 'APPROVED_TARGET' && (
                              <button
                                type="button"
                                onClick={() => handleComplete(t.id as number)}
                                className="p-1 rounded-sm bg-[var(--neon-fuchsia)]/10 text-[var(--neon-fuchsia)] hover:bg-[var(--neon-fuchsia)]/20 text-[10px] px-2"
                              >
                                COMPLETE
                              </button>
                            )}
                            {status === 'COMPLETED' && (
                              <span className="text-[10px] text-muted-foreground">COMPLETED</span>
                            )}
                            {status === 'REJECTED' && (
                              <span className="text-[10px] text-red-400">REJECTED</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Panel>

      {historyTransfers.length > 0 && (
        <Panel
          title="TRANSFER LOG"
          tag="TRN.HIST"
          status={`${historyTransfers.length} RECORDS`}
          accent="purple"
        >
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-mono-data text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>Completed and rejected transfers</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono-data text-xs">
                <thead>
                  <tr className="border-b border-[oklch(0.68_0.32_340_/_0.15)] text-muted-foreground">
                    <th className="py-2 px-2">TYPE</th>
                    <th className="py-2 px-2">SOURCE → DESTINATION</th>
                    <th className="py-2 px-2">RESULT</th>
                    <th className="py-2 px-2">ITEMS</th>
                    <th className="py-2 px-2">TIMELINE</th>
                    <th className="py-2 px-2">DURATION</th>
                  </tr>
                </thead>
                <tbody>
                  {historyTransfers.map((t: Record<string, unknown>) => {
                    const requesting =
                      campMap.get(t.requesting_camp as number) || `CAMP-${t.requesting_camp}`;
                    const target = campMap.get(t.target_camp as number) || `CAMP-${t.target_camp}`;
                    const status = t.status as string;
                    const items = t.items as Record<string, unknown>[] | undefined;
                    const itemCount = items?.length ?? 0;

                    const events: Array<{
                      label: string;
                      date: string | null;
                      accent: 'cyan' | 'purple' | 'green' | 'red';
                    }> = [];
                    if (t.created_at) {
                      events.push({
                        label: 'CREATED',
                        date: t.created_at as string,
                        accent: 'cyan',
                      });
                    }
                    if (t.scheduled_delivery_date) {
                      events.push({
                        label: 'SCHEDULED',
                        date: t.scheduled_delivery_date as string,
                        accent: 'purple',
                      });
                    }
                    if (t.approved_source_at) {
                      events.push({
                        label: 'SRC APPROVED',
                        date: t.approved_source_at as string,
                        accent: 'green',
                      });
                    }
                    if (t.approved_target_at) {
                      events.push({
                        label: 'DST APPROVED',
                        date: t.approved_target_at as string,
                        accent: 'green',
                      });
                    }
                    if (status === 'COMPLETED') {
                      events.push({
                        label: 'COMPLETED',
                        date: (t.updated_at ?? t.created_at) as string,
                        accent: 'green',
                      });
                    } else if (status === 'REJECTED') {
                      events.push({
                        label: 'REJECTED',
                        date: (t.updated_at ?? t.created_at) as string,
                        accent: 'red',
                      });
                    }

                    const startDate = t.created_at ? new Date(t.created_at as string) : null;
                    const endDate =
                      (status === 'COMPLETED' || status === 'REJECTED') && t.updated_at
                        ? new Date(t.updated_at as string)
                        : null;
                    const durationDays =
                      startDate && endDate
                        ? Math.round(
                            (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
                          )
                        : null;

                    return (
                      <tr
                        key={t.id as number}
                        className="border-b border-[oklch(0.68_0.32_340_/_0.08)] hover:bg-[oklch(0.68_0.32_340_/_0.05)]"
                      >
                        <td className="py-2 px-2">
                          <StatusBadge
                            status={TYPE_LABELS[t.type as string] || (t.type as string)}
                            variant="purple"
                          />
                        </td>
                        <td className="py-2 px-2">
                          <span className="text-[var(--neon-fuchsia)]">{requesting}</span>
                          <span className="text-muted-foreground mx-1">→</span>
                          <span className="text-[var(--neon-cyan)]">{target}</span>
                        </td>
                        <td className="py-2 px-2">
                          <StatusBadge
                            status={STATUS_LABELS[status]}
                            variant={STATUS_MAP[status] || 'cyan'}
                          />
                        </td>
                        <td className="py-2 px-2 text-muted-foreground text-center">{itemCount}</td>
                        <td className="py-2 px-2">
                          <div className="flex flex-wrap gap-1 items-center">
                            {events.map((ev, i) => (
                              <span key={ev.label} className="inline-flex items-center gap-0.5">
                                {i > 0 && (
                                  <span className="text-muted-foreground/50 mx-0.5">→</span>
                                )}
                                <StatusBadge
                                  status={ev.label}
                                  variant={ev.accent}
                                  className="text-[9px] py-0 px-1.5"
                                />
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 px-2 text-muted-foreground text-center">
                          {durationDays !== null ? `${durationDays}d` : '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {historyTransfers.some(
              (t: Record<string, unknown>) => t.status === 'REJECTED' && t.notes,
            ) && (
              <details className="mt-3">
                <summary className="font-mono-data text-[10px] text-muted-foreground cursor-pointer hover:text-[var(--neon-yellow)]">
                  SHOW REJECTION NOTES
                </summary>
                <div className="mt-2 space-y-1">
                  {historyTransfers
                    .filter((t: Record<string, unknown>) => t.status === 'REJECTED' && t.notes)
                    .map((t: Record<string, unknown>) => {
                      const tid = t.id as number;
                      const tnotes = t.notes as string;
                      return (
                        <div
                          key={tid}
                          className="font-mono-data text-xs text-red-400/80 pl-4 border-l border-red-400/20"
                        >
                          #{tid}: {tnotes}
                        </div>
                      );
                    })}
                </div>
              </details>
            )}
          </div>
        </Panel>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-glow-cyan">
              NEW TRANSFER
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={formCreate.handleSubmit(onSubmitCreate)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  SOURCE CAMP //
                </label>
                <select
                  {...formCreate.register('requesting_camp')}
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
                >
                  <option value="0">SELECT...</option>
                  {campsArray.map((c: Record<string, unknown>) => (
                    <option key={c.id as number} value={c.id as number}>
                      {c.name as string}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  DESTINATION CAMP //
                </label>
                <select
                  {...formCreate.register('target_camp')}
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
                >
                  <option value="0">SELECT...</option>
                  {campsArray.map((c: Record<string, unknown>) => (
                    <option key={c.id as number} value={c.id as number}>
                      {c.name as string}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                TYPE //
              </label>
              <select
                {...formCreate.register('type')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
              >
                <option value="RESOURCE">RESOURCES</option>
                <option value="PERSON">PEOPLE</option>
                <option value="MIXED">MIXED</option>
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                ITEMS //
              </label>
              <div className="space-y-2">
                {watchItems?.map((_, index) => (
                  <div
                    key={`item-${index}`}
                    className="flex gap-2 items-start p-2 border border-[oklch(0.68_0.32_340_/_0.2)] rounded-sm"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-muted-foreground">TYPE</label>
                        <select
                          {...formCreate.register(`items.${index}.item_type`)}
                          className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.3)] px-2 py-1.5 text-xs text-foreground outline-none font-mono-data"
                        >
                          <option value="RESOURCE">RESOURCE</option>
                          <option value="PERSON">PERSON</option>
                        </select>
                      </div>
                      {watchItems?.[index]?.item_type === 'RESOURCE' ? (
                        <>
                          <div>
                            <label className="text-[9px] text-muted-foreground">RESOURCE ID</label>
                            <input
                              {...formCreate.register(`items.${index}.resource_type_id`)}
                              type="number"
                              min={1}
                              className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.3)] px-2 py-1.5 text-xs text-foreground outline-none font-mono-data"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-muted-foreground">QUANTITY</label>
                            <input
                              {...formCreate.register(`items.${index}.quantity`)}
                              type="number"
                              min={0.01}
                              step="0.01"
                              className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.3)] px-2 py-1.5 text-xs text-foreground outline-none font-mono-data"
                            />
                          </div>
                        </>
                      ) : (
                        <div>
                          <label className="text-[9px] text-muted-foreground">PERSON ID</label>
                          <input
                            {...formCreate.register(`items.${index}.person_id`)}
                            type="number"
                            min={1}
                            className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.3)] px-2 py-1.5 text-xs text-foreground outline-none font-mono-data"
                          />
                        </div>
                      )}
                    </div>
                    {watchItems && watchItems.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="mt-4 p-1 rounded-sm text-red-400 hover:bg-red-400/10 text-[10px]"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addItem}
                className="mt-2 text-[10px] text-[var(--neon-cyan)] hover:text-[var(--neon-fuchsia)] font-mono-data"
              >
                + ADD ITEM
              </button>
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                NOTES //
              </label>
              <textarea
                {...formCreate.register('notes')}
                rows={2}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <GlitchButton
                variant="ghost"
                type="button"
                onClick={() => {
                  formCreate.reset();
                  setCreateOpen(false);
                }}
              >
                CANCEL
              </GlitchButton>
              <GlitchButton variant="primary" type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'CREATING...' : 'CREATE'}
              </GlitchButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-[var(--neon-yellow)]">
              REJECT TRANSFER
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                REASON //
              </label>
              <textarea
                value={rejectTarget?.reason ?? ''}
                onChange={(e) =>
                  setRejectTarget((p) => (p ? { ...p, reason: e.target.value } : null))
                }
                rows={3}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-yellow)] font-mono-data resize-none"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <GlitchButton
                variant="ghost"
                type="button"
                onClick={() => {
                  setRejectDialogOpen(false);
                  setRejectTarget(null);
                }}
              >
                CANCEL
              </GlitchButton>
              <GlitchButton
                variant="danger"
                type="button"
                onClick={handleReject}
                disabled={!rejectTarget?.reason || rejectMutation.isPending}
              >
                {rejectMutation.isPending ? 'REJECTING...' : 'REJECT'}
              </GlitchButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={scheduleDialogOpen} onOpenChange={setScheduleDialogOpen}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-[var(--neon-cyan)]">
              SCHEDULE DELIVERY
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                DELIVERY DATE //
              </label>
              <input
                type="datetime-local"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data [color-scheme:dark]"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <GlitchButton
                variant="ghost"
                type="button"
                onClick={() => {
                  setScheduleDialogOpen(false);
                  setScheduleTarget(null);
                }}
              >
                CANCEL
              </GlitchButton>
              <GlitchButton
                variant="primary"
                type="button"
                onClick={handleScheduleConfirm}
                disabled={!scheduleDate || scheduleMutation.isPending}
              >
                {scheduleMutation.isPending ? 'SCHEDULING...' : 'SCHEDULE'}
              </GlitchButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
