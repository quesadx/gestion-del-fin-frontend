import { useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { ArrowRightLeft, Plus, Truck, Check, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const STATUS_MAP: Record<string, 'cyan' | 'yellow' | 'green' | 'red'> = {
  PENDING: 'yellow',
  APPROVED_SOURCE: 'cyan',
  APPROVED_TARGET: 'cyan',
  COMPLETED: 'green',
  REJECTED: 'red',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'PENDIENTE',
  APPROVED_SOURCE: 'FUENTE APROBADA',
  APPROVED_TARGET: 'DESTINO APROBADO',
  COMPLETED: 'COMPLETADO',
  REJECTED: 'RECHAZADO',
};

const TYPE_LABELS: Record<string, string> = {
  RESOURCE: 'RECURSO',
  PERSON: 'PERSONA',
  MIXED: 'MIXTO',
};

const transferItemSchema = z.object({
  item_type: z.enum(['RESOURCE', 'PERSON']),
  resource_type_id: z.coerce.number().min(1).optional(),
  person_id: z.coerce.number().min(1).optional(),
  quantity: z.coerce.number().positive().optional(),
});

const createTransferSchema = z.object({
  requesting_camp: z.coerce.number().min(1, 'Seleccione campamento origen'),
  target_camp: z.coerce.number().min(1, 'Seleccione campamento destino'),
  type: z.enum(['RESOURCE', 'PERSON', 'MIXED']),
  notes: z.string().optional(),
  leader_person_id: z.coerce.number().optional(),
  scheduled_delivery_date: z.string().optional(),
  items: z.array(transferItemSchema).min(1, 'Al menos un item es requerido'),
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

  const [createOpen, setCreateOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<{ id: number; reason: string } | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  const campsArray = Array.isArray(camps) ? camps : ([] as Record<string, unknown>[]);
  const transfersArray = Array.isArray(transfers) ? transfers : ([] as Record<string, unknown>[]);

  const formCreate = useForm<TransferFormValues>({
    resolver: zodResolver(createTransferSchema),
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
      requested_by: 0,
      leader_person_id: values.leader_person_id || undefined,
      scheduled_delivery_date: values.scheduled_delivery_date || undefined,
      items,
    };

    await createMutation.mutateAsync(payload);
    formCreate.reset();
    setCreateOpen(false);
  };

  const handleApproveSource = async (id: number) => {
    await approveSourceMutation.mutateAsync({ id, payload: {} });
  };

  const handleApproveTarget = async (id: number) => {
    await approveTargetMutation.mutateAsync({ id, payload: {} });
  };

  const handleComplete = async (id: number) => {
    await completeMutation.mutateAsync({ id, payload: {} });
  };

  const handleSchedule = async (id: number) => {
    const date = prompt('Fecha de entrega (YYYY-MM-DDTHH:mm):');
    if (!date) return;
    await scheduleMutation.mutateAsync({ id, payload: { scheduled_delivery_date: date } });
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    await rejectMutation.mutateAsync({
      id: rejectTarget.id,
      payload: { reason: rejectTarget.reason },
    });
    setRejectDialogOpen(false);
    setRejectTarget(null);
  };

  if (isLoading) return <ScreenLoader />;

  if (isError) {
    return (
      <div className="space-y-6">
        <Panel title="ERROR" tag="TRN.ERR" status="ERROR" accent="purple">
          <p className="text-sm text-red-400 font-mono-data mb-4">
            {(error as Error)?.message || 'Error al cargar transferencias'}
          </p>
          <GlitchButton variant="warning" onClick={() => refetch()}>
            REINTENTAR
          </GlitchButton>
        </Panel>
      </div>
    );
  }

  const campMap = new Map<number, string>();
  campsArray.forEach((c: Record<string, unknown>) => campMap.set(c.id as number, c.name as string));

  return (
    <div className="space-y-6">
      <Panel
        title="TRANSFERENCIAS ENTRE CAMPAMENTOS"
        tag="TRN.01"
        status={transfersArray.length.toString()}
        accent="cyan"
      >
        {transfersArray.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <ArrowRightLeft className="h-10 w-10 text-[var(--neon-cyan)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">
              NO HAY TRANSFERENCIAS REGISTRADAS
            </p>
            <GlitchButton variant="primary" onClick={() => setCreateOpen(true)}>
              <span className="flex items-center gap-2">
                <Plus className="h-3.5 w-3.5" />
                NUEVA TRANSFERENCIA
              </span>
            </GlitchButton>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <GlitchButton variant="primary" onClick={() => setCreateOpen(true)}>
                <span className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  NUEVA TRANSFERENCIA
                </span>
              </GlitchButton>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono-data text-xs">
                <thead>
                  <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                    <th className="py-3 px-2">TIPO</th>
                    <th className="py-3 px-2">ORIGEN → DESTINO</th>
                    <th className="py-3 px-2">ESTADO</th>
                    <th className="py-3 px-2">ITEMS</th>
                    <th className="py-3 px-2">CREADO</th>
                    <th className="py-3 px-2">ACCIONES WORKFLOW</th>
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
                                  title="Programar entrega"
                                >
                                  <Truck className="h-3 w-3" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleApproveSource(t.id as number)}
                                  className="p-1 rounded-sm text-green-400 hover:bg-green-400/10 text-[10px]"
                                  title="Aprobar origen"
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
                                  title="Rechazar"
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
                                APROBAR DESTINO
                              </button>
                            )}
                            {status === 'APPROVED_TARGET' && (
                              <button
                                type="button"
                                onClick={() => handleComplete(t.id as number)}
                                className="p-1 rounded-sm bg-[var(--neon-fuchsia)]/10 text-[var(--neon-fuchsia)] hover:bg-[var(--neon-fuchsia)]/20 text-[10px] px-2"
                              >
                                COMPLETAR
                              </button>
                            )}
                            {status === 'COMPLETED' && (
                              <span className="text-[10px] text-muted-foreground">COMPLETADO</span>
                            )}
                            {status === 'REJECTED' && (
                              <span className="text-[10px] text-red-400">RECHAZADO</span>
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

      {/* Create Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-glow-cyan">
              NUEVA TRANSFERENCIA
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={formCreate.handleSubmit(onSubmitCreate)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  CAMPAMENTO ORIGEN //
                </label>
                <select
                  {...formCreate.register('requesting_camp')}
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
                >
                  <option value="0">SELECCIONE...</option>
                  {campsArray.map((c: Record<string, unknown>) => (
                    <option key={c.id as number} value={c.id as number}>
                      {c.name as string}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  CAMPAMENTO DESTINO //
                </label>
                <select
                  {...formCreate.register('target_camp')}
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
                >
                  <option value="0">SELECCIONE...</option>
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
                TIPO //
              </label>
              <select
                {...formCreate.register('type')}
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data"
              >
                <option value="RESOURCE">RECURSOS</option>
                <option value="PERSON">PERSONAS</option>
                <option value="MIXED">MIXTO</option>
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                ITEMS //
              </label>
              <div className="space-y-2">
                {watchItems?.map((_, index) => (
                  <div
                    key={index}
                    className="flex gap-2 items-start p-2 border border-[oklch(0.68_0.32_340_/_0.2)] rounded-sm"
                  >
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] text-muted-foreground">TIPO</label>
                        <select
                          {...formCreate.register(`items.${index}.item_type`)}
                          className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.3)] px-2 py-1.5 text-xs text-foreground outline-none font-mono-data"
                        >
                          <option value="RESOURCE">RECURSO</option>
                          <option value="PERSON">PERSONA</option>
                        </select>
                      </div>
                      {watchItems?.[index]?.item_type === 'RESOURCE' ? (
                        <>
                          <div>
                            <label className="text-[9px] text-muted-foreground">RECURSO ID</label>
                            <input
                              {...formCreate.register(`items.${index}.resource_type_id`)}
                              type="number"
                              min={1}
                              className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.3)] px-2 py-1.5 text-xs text-foreground outline-none font-mono-data"
                            />
                          </div>
                          <div>
                            <label className="text-[9px] text-muted-foreground">CANTIDAD</label>
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
                          <label className="text-[9px] text-muted-foreground">PERSONA ID</label>
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
                + AGREGAR ITEM
              </button>
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                NOTAS //
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
                CANCELAR
              </GlitchButton>
              <GlitchButton variant="primary" type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'CREANDO...' : 'CREAR'}
              </GlitchButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-[var(--neon-yellow)]">
              RECHAZAR TRANSFERENCIA
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                MOTIVO //
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
                CANCELAR
              </GlitchButton>
              <GlitchButton
                variant="danger"
                type="button"
                onClick={handleReject}
                disabled={!rejectTarget?.reason || rejectMutation.isPending}
              >
                {rejectMutation.isPending ? 'RECHAZANDO...' : 'RECHAZAR'}
              </GlitchButton>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
