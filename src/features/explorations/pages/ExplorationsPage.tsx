import { useState } from 'react';
import { format } from 'date-fns';
import { Panel } from '@/components/cyber/Panel';
import { GlitchButton } from '@/components/cyber/GlitchButton';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import { StatusBadge } from '@/components/cyber/StatusBadge';
import { useExplorations, useCreateExploration, useUpdateExplorationStatus, useDeleteExploration } from '@/features/explorations/hooks/useExplorations';
import { useCamps } from '@/features/camps/hooks/useCamps';
import { useAuthStore } from '@/features/auth/store/auth.store';
import { Compass, Plus, Trash2 } from 'lucide-react';
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

const STATUS_MAP: Record<string, 'cyan' | 'yellow' | 'green' | 'red'> = {
  PLANNED: 'cyan',
  ONGOING: 'yellow',
  RETURNED: 'green',
  CANCELLED: 'red',
};

export function ExplorationsPage() {
  const { data: explorations, isLoading, isError, error, refetch } = useExplorations();
  const { data: camps } = useCamps();
  const createMutation = useCreateExploration();
  const updateStatusMutation = useUpdateExplorationStatus();
  const deleteMutation = useDeleteExploration();
  const user = useAuthStore((s) => s.user);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);

  const campsArray = Array.isArray(camps) ? camps : [];
  const expArray = Array.isArray(explorations) ? explorations : [];

  const campMap = new Map<number, string>();
  campsArray.forEach((c: Record<string, unknown>) => campMap.set(c.id as number, c.name as string));

  const handleStatusChange = async (id: number, status: string) => {
    await updateStatusMutation.mutateAsync({
      id,
      payload: {
        status: status as 'PLANNED' | 'ONGOING' | 'RETURNED' | 'CANCELLED',
        changed_by: 0,
      },
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMutation.mutateAsync({
      id: deleteTarget,
      payload: { changed_by: 0 },
    });
    setDeleteTarget(null);
  };

  if (isLoading) return <ScreenLoader />;

  if (isError) {
    return (
      <div className="space-y-6">
        <Panel title="ERROR" tag="EXP.01" status="ERROR" accent="fuchsia">
          <p className="text-sm text-red-400 font-mono-data mb-4">{(error as Error)?.message || 'Error al cargar expediciones'}</p>
          <GlitchButton variant="warning" onClick={() => refetch()}>REINTENTAR</GlitchButton>
        </Panel>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Panel title="REGISTRO DE EXPEDICIONES" tag="EXP.01" status={isLoading ? 'LOADING' : expArray.length.toString()} accent="cyan">
        {expArray.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-8">
            <Compass className="h-10 w-10 text-[var(--neon-cyan)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">NO HAY EXPEDICIONES REGISTRADAS</p>
            <GlitchButton variant="primary" onClick={() => setCreateOpen(true)}>
              <span className="flex items-center gap-2"><Plus className="h-3.5 w-3.5" />NUEVA EXPEDICIÓN</span>
            </GlitchButton>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-end">
              <GlitchButton variant="primary" onClick={() => setCreateOpen(true)}>
                <span className="flex items-center gap-2"><Plus className="h-3.5 w-3.5" />NUEVA EXPEDICIÓN</span>
              </GlitchButton>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono-data text-xs">
                <thead>
                  <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                    <th className="py-3 px-2">DESTINO</th>
                    <th className="py-3 px-2">ESTADO</th>
                    <th className="py-3 px-2">SALIDA</th>
                    <th className="py-3 px-2">RETORNO ESPERADO</th>
                    <th className="py-3 px-2">CAMPAMENTO</th>
                    <th className="py-3 px-2">CAMBIAR ESTADO</th>
                    <th className="py-3 px-2 text-right">ACCIONES</th>
                  </tr>
                </thead>
                <tbody>
                  {expArray.map((exp: Record<string, unknown>) => (
                    <tr key={exp.id as number} className="border-b border-[oklch(0.68_0.32_340_/_0.1)] hover:bg-[oklch(0.68_0.32_340_/_0.05)] transition-colors">
                      <td className="py-3 px-2 text-[var(--neon-fuchsia)]">{exp.destination as string}</td>
                      <td className="py-3 px-2">
                        <StatusBadge status={exp.status as string} variant={STATUS_MAP[exp.status as string] || 'cyan'} />
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {exp.departure_date ? format(new Date(exp.departure_date as string), 'dd/MM/yyyy') : '—'}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {exp.expected_return_date ? format(new Date(exp.expected_return_date as string), 'dd/MM/yyyy') : '—'}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {campMap.get(exp.camp_id as number) || exp.camp_id as string}
                      </td>
                      <td className="py-3 px-2">
                        <select
                          value={exp.status as string}
                          onChange={(e) => handleStatusChange(exp.id as number, e.target.value)}
                          className="rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-2 py-1 text-[10px] text-foreground outline-none font-mono-data"
                        >
                          <option value="PLANNED">PLANEADA</option>
                          <option value="ONGOING">EN CURSO</option>
                          <option value="RETURNED">RETORNADA</option>
                          <option value="CANCELLED">CANCELADA</option>
                        </select>
                      </td>
                      <td className="py-3 px-2 text-right">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(exp.id as number)}
                          className="p-1.5 rounded-sm text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </Panel>

      {/* Delete */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-sm tracking-widest text-[var(--neon-yellow)]">CONFIRMAR ELIMINACIÓN</AlertDialogTitle>
            <AlertDialogDescription className="font-mono-data text-xs text-muted-foreground">Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border border-[var(--neon-cyan)] text-[var(--neon-cyan)] hover:bg-[oklch(0.85_0.22_200_/_0.1)] font-mono-data text-xs">CANCELAR</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending} className="bg-[var(--neon-yellow)] text-[var(--charcoal)] font-mono-data text-xs">
              {deleteMutation.isPending ? 'ELIMINANDO...' : 'ELIMINAR'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
