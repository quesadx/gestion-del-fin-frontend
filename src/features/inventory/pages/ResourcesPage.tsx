import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Panel } from '@/components/cyber/Panel';
import { GlitchButton } from '@/components/cyber/GlitchButton';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import {
  useResources,
  useCreateResource,
  useUpdateResource,
  useDeleteResource,
} from '@/features/inventory/hooks/useResources';
import { Plus, Edit3, Trash2, Package } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';

const resourceSchema = z.object({
  name: z.string().min(1, 'El nombre es obligatorio'),
  unit: z.string().min(1, 'La unidad es obligatoria'),
  daily_ration: z.coerce.number().min(0, 'No puede ser negativo'),
  minimum_stock: z.coerce.number().min(0, 'No puede ser negativo'),
});

type ResourceFormValues = z.infer<typeof resourceSchema>;

export function ResourcesPage() {
  const { data: resources, isLoading, isError, error, refetch } = useResources();
  const createMutation = useCreateResource();
  const updateMutation = useUpdateResource();
  const deleteMutation = useDeleteResource();

  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<{
    id: number;
    name: string;
    unit: string;
    daily_ration: number;
    minimum_stock: number;
  } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: number; name: string } | null>(null);

  const formCreate = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: { name: '', unit: '', daily_ration: 0, minimum_stock: 0 },
  });

  const formEdit = useForm<ResourceFormValues>({
    resolver: zodResolver(resourceSchema),
    defaultValues: { name: '', unit: '', daily_ration: 0, minimum_stock: 0 },
  });

  const openEdit = (item: {
    id: number;
    name: string;
    unit: string;
    daily_ration: number;
    minimum_stock: number;
  }) => {
    formEdit.reset({
      name: item.name,
      unit: item.unit,
      daily_ration: item.daily_ration,
      minimum_stock: item.minimum_stock,
    });
    setEditTarget(item);
  };

  const onSubmitCreate = async (values: ResourceFormValues) => {
    await createMutation.mutateAsync(values);
    formCreate.reset();
    setCreateDialogOpen(false);
  };

  const onSubmitEdit = async (values: ResourceFormValues) => {
    if (!editTarget) return;
    await updateMutation.mutateAsync({ id: editTarget.id, payload: values });
    setEditTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync(deleteTarget.id);
    setDeleteTarget(null);
  };

  if (isLoading) return <ScreenLoader />;

  if (isError) {
    return (
      <div className="space-y-6">
        <Panel title="ERROR" tag="RSC.ERR" status="ERROR" accent="fuchsia">
          <p className="text-sm text-red-400 font-mono-data mb-4">
            {(error as Error)?.message || 'Error al cargar recursos'}
          </p>
          <GlitchButton variant="warning" onClick={() => refetch()}>
            REINTENTAR
          </GlitchButton>
        </Panel>
      </div>
    );
  }

  const items = Array.isArray(resources) ? resources : [];

  return (
    <div className="space-y-6">
      <Panel title="RESOURCE_CATALOG" tag="RSC.01" status="ONLINE" accent="cyan">
        {items.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Package className="h-10 w-10 text-[var(--neon-cyan)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">
              NO HAY RECURSOS REGISTRADOS
            </p>
            <GlitchButton variant="primary" onClick={() => setCreateDialogOpen(true)}>
              NUEVO RECURSO
            </GlitchButton>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono-data text-xs">
                <thead>
                  <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                    <th className="py-3 px-2 font-semibold">NOMBRE</th>
                    <th className="py-3 px-2 font-semibold">UNIDAD</th>
                    <th className="py-3 px-2 font-semibold text-right">RACIÓN DIARIA</th>
                    <th className="py-3 px-2 font-semibold text-right">STOCK MÍNIMO</th>
                    <th className="py-3 px-2 font-semibold text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item: Record<string, unknown>) => (
                    <tr
                      key={item.id as number}
                      className="border-b border-[oklch(0.68_0.32_340_/_0.1)] hover:bg-[oklch(0.68_0.32_340_/_0.05)] transition-colors"
                    >
                      <td className="py-3 px-2 text-[var(--neon-fuchsia)] font-bold">
                        {item.name as string}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {item.unit as string}
                      </td>
                      <td className="py-3 px-2 text-right text-muted-foreground">
                        {item.daily_ration as number}
                      </td>
                      <td className="py-3 px-2 text-right text-muted-foreground">
                        {item.minimum_stock as number}
                      </td>
                      <td className="py-3 px-2">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEdit({
                              id: item.id as number,
                              name: item.name as string,
                              unit: item.unit as string,
                              daily_ration: item.daily_ration as number,
                              minimum_stock: item.minimum_stock as number,
                            })}
                            className="p-1.5 rounded-sm text-[var(--neon-cyan)] hover:bg-[oklch(0.85_0.22_200_/_0.1)] transition-colors"
                            title="Editar"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteTarget({ id: item.id as number, name: item.name as string })}
                            className="p-1.5 rounded-sm text-red-400 hover:bg-red-400/10 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-end">
              <GlitchButton variant="primary" onClick={() => setCreateDialogOpen(true)}>
                <span className="flex items-center gap-2">
                  <Plus className="h-3.5 w-3.5" />
                  NUEVO RECURSO
                </span>
              </GlitchButton>
            </div>
          </>
        )}
      </Panel>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-glow-fuchsia">
              NUEVO RECURSO
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={formCreate.handleSubmit(onSubmitCreate)} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                NOMBRE //
              </label>
              <input
                {...formCreate.register('name')}
                type="text"
                placeholder="AGUA"
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-all duration-200 focus:border-[var(--neon-fuchsia)] font-mono-data"
              />
              {formCreate.formState.errors.name && (
                <p className="mt-1.5 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {formCreate.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                UNIDAD //
              </label>
              <input
                {...formCreate.register('unit')}
                type="text"
                placeholder="LITROS"
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-all duration-200 focus:border-[var(--neon-cyan)] font-mono-data"
              />
              {formCreate.formState.errors.unit && (
                <p className="mt-1.5 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {formCreate.formState.errors.unit.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  RACIÓN DIARIA //
                </label>
                <input
                  {...formCreate.register('daily_ration')}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="2"
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-all duration-200 focus:border-[var(--neon-fuchsia)] font-mono-data"
                />
                {formCreate.formState.errors.daily_ration && (
                  <p className="mt-1.5 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                    {formCreate.formState.errors.daily_ration.message}
                  </p>
                )}
              </div>
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  STOCK MÍNIMO //
                </label>
                <input
                  {...formCreate.register('minimum_stock')}
                  type="number"
                  min={0}
                  step="0.01"
                  placeholder="100"
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-all duration-200 focus:border-[var(--neon-cyan)] font-mono-data"
                />
                {formCreate.formState.errors.minimum_stock && (
                  <p className="mt-1.5 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                    {formCreate.formState.errors.minimum_stock.message}
                  </p>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <GlitchButton variant="ghost" type="button" onClick={() => { formCreate.reset(); setCreateDialogOpen(false); }}>
                CANCELAR
              </GlitchButton>
              <GlitchButton variant="primary" type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? 'CREANDO...' : 'CREAR'}
              </GlitchButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editTarget} onOpenChange={(open) => { if (!open) setEditTarget(null); }}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-glow-fuchsia">
              EDITAR RECURSO
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={formEdit.handleSubmit(onSubmitEdit)} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                NOMBRE //
              </label>
              <input
                {...formEdit.register('name')}
                type="text"
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-all duration-200 focus:border-[var(--neon-fuchsia)] font-mono-data"
              />
              {formEdit.formState.errors.name && (
                <p className="mt-1.5 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {formEdit.formState.errors.name.message}
                </p>
              )}
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                UNIDAD //
              </label>
              <input
                {...formEdit.register('unit')}
                type="text"
                className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-all duration-200 focus:border-[var(--neon-cyan)] font-mono-data"
              />
              {formEdit.formState.errors.unit && (
                <p className="mt-1.5 text-[10px] text-[var(--neon-yellow)] font-mono-data">
                  {formEdit.formState.errors.unit.message}
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  RACIÓN DIARIA //
                </label>
                <input
                  {...formEdit.register('daily_ration')}
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-all duration-200 focus:border-[var(--neon-fuchsia)] font-mono-data"
                />
              </div>
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">
                  STOCK MÍNIMO //
                </label>
                <input
                  {...formEdit.register('minimum_stock')}
                  type="number"
                  min={0}
                  step="0.01"
                  className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/30 outline-none transition-all duration-200 focus:border-[var(--neon-cyan)] font-mono-data"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <GlitchButton variant="ghost" type="button" onClick={() => setEditTarget(null)}>
                CANCELAR
              </GlitchButton>
              <GlitchButton variant="primary" type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'GUARDANDO...' : 'GUARDAR'}
              </GlitchButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-sm tracking-widest text-[var(--neon-yellow)]">
              CONFIRMAR ELIMINACIÓN
            </AlertDialogTitle>
            <AlertDialogDescription className="font-mono-data text-xs text-muted-foreground">
              ¿Eliminar recurso <span className="text-[var(--neon-fuchsia)]">{deleteTarget?.name}</span>?
              Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border border-[var(--neon-cyan)] text-[var(--neon-cyan)] hover:bg-[oklch(0.85_0.22_200_/_0.1)] font-mono-data text-xs">
              CANCELAR
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
              className="bg-[var(--neon-yellow)] text-[var(--charcoal)] font-mono-data text-xs hover:bg-[var(--neon-yellow)]/80"
            >
              {deleteMutation.isPending ? 'ELIMINANDO...' : 'ELIMINAR'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
