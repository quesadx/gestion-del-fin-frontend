import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { Panel } from '@/components/cyber/Panel';
import { GlitchButton } from '@/components/cyber/GlitchButton';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import { StatusBadge } from '@/components/cyber/StatusBadge';
import { usePerson, useUpdatePerson, useDeletePerson, useAddPersonStatusLog } from '@/features/people/hooks/usePeople';
import { useCamp } from '@/features/camps/hooks/useCamps';
import { useProfessions } from '@/features/people/hooks/useProfessions';
import { ArrowLeft, Edit3, Trash2, User, Activity } from 'lucide-react';
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

const updatePersonSchema = z.object({
  full_name: z.string().min(1, 'El nombre es obligatorio'),
  age: z.coerce.number().min(0).optional(),
  identification_code: z.string().optional(),
  blood_type: z.string().optional(),
  skills_summary: z.string().optional(),
  status: z.enum(['HEALTHY', 'SICK', 'INJURED', 'AWAY', 'DEAD']).default('HEALTHY'),
  profession_id: z.coerce.number().min(1, 'Seleccione una profesión'),
  admitted_at: z.string().min(1, 'La fecha de ingreso es obligatoria'),
});

type UpdatePersonFormValues = z.infer<typeof updatePersonSchema>;

const statusLogSchema = z.object({
  new_status: z.enum(['HEALTHY', 'SICK', 'INJURED', 'AWAY', 'DEAD']),
  reason: z.string().optional(),
});

type StatusLogFormValues = z.infer<typeof statusLogSchema>;

function getStatusVariant(status: string): 'green' | 'yellow' | 'red' | 'cyan' {
  switch (status) {
    case 'HEALTHY': return 'green';
    case 'SICK': return 'yellow';
    case 'INJURED': return 'yellow';
    case 'DEAD': return 'red';
    default: return 'cyan';
  }
}

export function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const personId = Number(id);

  const { data: person, isLoading, isError, error, refetch } = usePerson(0, personId);
  const campId = (person as Record<string, unknown>)?.camp_id as number | undefined;
  const { data: camp } = useCamp(campId ?? 0);
  const { data: professions } = useProfessions();
  const updateMutation = useUpdatePerson();
  const deleteMutation = useDeletePerson();
  const statusLogMutation = useAddPersonStatusLog();

  const [editOpen, setEditOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(false);
  const [statusLogOpen, setStatusLogOpen] = useState(false);

  const editForm = useForm<UpdatePersonFormValues>({
    resolver: zodResolver(updatePersonSchema),
  });

  const statusLogForm = useForm<StatusLogFormValues>({
    resolver: zodResolver(statusLogSchema),
    defaultValues: { new_status: 'HEALTHY', reason: '' },
  });

  useEffect(() => {
    if (person) {
      const p = person as Record<string, unknown>;
      editForm.reset({
        full_name: p.full_name as string,
        age: p.age as number | undefined,
        identification_code: p.identification_code as string || '',
        blood_type: p.blood_type as string || '',
        skills_summary: p.skills_summary as string || '',
        status: p.status as 'HEALTHY' | 'SICK' | 'INJURED' | 'AWAY' | 'DEAD',
        profession_id: (p.profession_id ?? (p.profession as Record<string, unknown>)?.id ?? 0) as number,
        admitted_at: p.admitted_at ? format(new Date(p.admitted_at as string), "yyyy-MM-dd'T'HH:mm") : '',
      });
    }
  }, [person, editForm]);

  if (isLoading) return <ScreenLoader />;

  if (isError) {
    return (
      <div className="space-y-6">
        <Panel title="ERROR" tag={`PPL.${personId}`} status="ERROR" accent="fuchsia">
          <p className="text-sm text-red-400 font-mono-data mb-4">
            {(error as Error)?.message || 'Error al cargar persona'}
          </p>
          <GlitchButton variant="warning" onClick={() => refetch()}>REINTENTAR</GlitchButton>
        </Panel>
      </div>
    );
  }

  if (!person) {
    return (
      <div className="space-y-6">
        <Panel title="PERSONA NO ENCONTRADA" tag={`PPL.${personId}`} status="OFFLINE" accent="fuchsia">
          <p className="text-sm text-muted-foreground font-mono-data">La persona solicitada no existe.</p>
        </Panel>
      </div>
    );
  }

  const p = person as Record<string, unknown>;
  const profObj = p.profession as Record<string, unknown> | undefined;
  const statusLogs = p.status_logs as Array<Record<string, unknown>> | undefined;

  const onSubmitEdit = async (values: UpdatePersonFormValues) => {
    await updateMutation.mutateAsync({
      campId: p.camp_id as number,
      id: personId,
      payload: values,
    });
    setEditOpen(false);
  };

  const handleDelete = async () => {
    await deleteMutation.mutateAsync({
      campId: p.camp_id as number,
      id: personId,
    });
    navigate('/people');
  };

  const onSubmitStatusLog = async (values: StatusLogFormValues) => {
    await statusLogMutation.mutateAsync({
      campId: p.camp_id as number,
      payload: { person_id: personId, ...values },
    });
    setStatusLogOpen(false);
    statusLogForm.reset();
    refetch();
  };

  return (
    <div className="space-y-6">
      <GlitchButton variant="ghost" onClick={() => navigate('/people')}>
        <span className="flex items-center gap-2"><ArrowLeft className="h-3.5 w-3.5" />VOLVER</span>
      </GlitchButton>

      <Panel title={p.full_name as string} tag={`PPL.${personId}`} status={p.status as string} accent="cyan">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="space-y-2 font-mono-data text-xs">
            <div><span className="text-muted-foreground">ESTADO: </span><StatusBadge status={p.status as string} variant={getStatusVariant(p.status as string)} /></div>
            <div><span className="text-muted-foreground">PROFESIÓN: </span><span className="text-[var(--neon-fuchsia)]">{profObj?.name as string || '—'}</span></div>
            <div><span className="text-muted-foreground">CAMPAMENTO: </span>{(camp as Record<string, unknown>)?.name as string || p.camp_id as string}</div>
            <div><span className="text-muted-foreground">INGRESO: </span>{p.admitted_at ? format(new Date(p.admitted_at as string), 'dd/MM/yyyy') : '—'}</div>
          </div>
          <div className="space-y-2 font-mono-data text-xs">
            <div><span className="text-muted-foreground">EDAD: </span>{(p.age as number) ?? '—'}</div>
            <div><span className="text-muted-foreground">CÓDIGO: </span>{(p.identification_code as string) || '—'}</div>
            <div><span className="text-muted-foreground">TIPO SANGRE: </span>{(p.blood_type as string) || '—'}</div>
          </div>
        </div>
        {p.skills_summary && (
          <div className="font-mono-data text-xs"><span className="text-muted-foreground">HABILIDADES: </span>{p.skills_summary as string}</div>
        )}
        <div className="flex flex-wrap gap-2 mt-4 pt-3 border-t border-[oklch(0.68_0.32_340_/_0.2)]">
          <GlitchButton variant="ghost" onClick={() => setEditOpen(true)}><Edit3 className="h-3.5 w-3.5 mr-1" />EDITAR</GlitchButton>
          <GlitchButton variant="ghost" onClick={() => setStatusLogOpen(true)}><Activity className="h-3.5 w-3.5 mr-1" />CAMBIAR ESTADO</GlitchButton>
          <GlitchButton variant="warning" onClick={() => setDeleteTarget(true)}><Trash2 className="h-3.5 w-3.5 mr-1" />ELIMINAR</GlitchButton>
        </div>
      </Panel>

      {statusLogs && statusLogs.length > 0 && (
        <Panel title="HISTORIAL DE ESTADOS" tag={`PPL.${personId}.LOGS`} status={`${statusLogs.length} REGISTROS`} accent="cyan">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono-data text-xs">
              <thead>
                <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                  <th className="py-2 px-2">ESTADO</th>
                  <th className="py-2 px-2">FECHA</th>
                  <th className="py-2 px-2">MOTIVO</th>
                </tr>
              </thead>
              <tbody>
                {statusLogs.map((log, i) => (
                  <tr key={i} className="border-b border-[oklch(0.68_0.32_340_/_0.1)]">
                    <td className="py-2 px-2"><StatusBadge status={log.new_status as string} variant={getStatusVariant(log.new_status as string)} /></td>
                    <td className="py-2 px-2 text-muted-foreground">{log.created_at ? format(new Date(log.created_at as string), 'dd/MM/yyyy HH:mm') : '—'}</td>
                    <td className="py-2 px-2 text-muted-foreground">{(log.reason as string) || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-glow-fuchsia">EDITAR PERSONA</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">NOMBRE //</label>
              <input {...editForm.register('full_name')} className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data" />
              {editForm.formState.errors.full_name && <p className="mt-1 text-[10px] text-[var(--neon-yellow)] font-mono-data">{editForm.formState.errors.full_name.message}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">EDAD //</label>
                <input {...editForm.register('age')} type="number" className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data" />
              </div>
              <div>
                <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">PROFESIÓN //</label>
                <select {...editForm.register('profession_id')} className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data">
                  {(Array.isArray(professions) ? professions : []).map((prof: Record<string, unknown>) => (
                    <option key={prof.id as number} value={prof.id as number}>{prof.name as string}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">ESTADO //</label>
              <select {...editForm.register('status')} className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data">
                <option value="HEALTHY">SANO</option>
                <option value="SICK">ENFERMO</option>
                <option value="INJURED">LESIONADO</option>
                <option value="AWAY">AUSENTE</option>
                <option value="DEAD">FALLECIDO</option>
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">INGRESO //</label>
              <input {...editForm.register('admitted_at')} type="datetime-local" className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data" />
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">CÓDIGO IDENTIFICACIÓN //</label>
              <input {...editForm.register('identification_code')} className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data" />
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">TIPO SANGRE //</label>
              <input {...editForm.register('blood_type')} placeholder="A+, O-, etc." className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data" />
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">HABILIDADES //</label>
              <textarea {...editForm.register('skills_summary')} rows={3} className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <GlitchButton variant="ghost" type="button" onClick={() => setEditOpen(false)}>CANCELAR</GlitchButton>
              <GlitchButton variant="primary" type="submit" disabled={updateMutation.isPending}>{updateMutation.isPending ? 'GUARDANDO...' : 'GUARDAR'}</GlitchButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Status Log Dialog */}
      <Dialog open={statusLogOpen} onOpenChange={setStatusLogOpen}>
        <DialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <DialogHeader>
            <DialogTitle className="font-display text-sm tracking-widest text-glow-fuchsia">REGISTRAR CAMBIO DE ESTADO</DialogTitle>
          </DialogHeader>
          <form onSubmit={statusLogForm.handleSubmit(onSubmitStatusLog)} className="space-y-4">
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">NUEVO ESTADO //</label>
              <select {...statusLogForm.register('new_status')} className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-fuchsia)] font-mono-data">
                <option value="HEALTHY">SANO</option>
                <option value="SICK">ENFERMO</option>
                <option value="INJURED">LESIONADO</option>
                <option value="AWAY">AUSENTE</option>
                <option value="DEAD">FALLECIDO</option>
              </select>
            </div>
            <div>
              <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">MOTIVO //</label>
              <textarea {...statusLogForm.register('reason')} rows={3} className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <GlitchButton variant="ghost" type="button" onClick={() => { setStatusLogOpen(false); statusLogForm.reset(); }}>CANCELAR</GlitchButton>
              <GlitchButton variant="primary" type="submit" disabled={statusLogMutation.isPending}>
                {statusLogMutation.isPending ? 'REGISTRANDO...' : 'REGISTRAR'}
              </GlitchButton>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(false)}>
        <AlertDialogContent className="bg-[oklch(0.1_0.03_320_/_0.95)] border border-[oklch(0.68_0.32_340_/_0.3)] text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display text-sm tracking-widest text-[var(--neon-yellow)]">CONFIRMAR ELIMINACIÓN</AlertDialogTitle>
            <AlertDialogDescription className="font-mono-data text-xs text-muted-foreground">
              ¿Eliminar a <span className="text-[var(--neon-fuchsia)]">{p.full_name as string}</span>? Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border border-[var(--neon-cyan)] text-[var(--neon-cyan)] hover:bg-[oklch(0.85_0.22_200_/_0.1)] font-mono-data text-xs">CANCELAR</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={deleteMutation.isPending} className="bg-[var(--neon-yellow)] text-[var(--charcoal)] font-mono-data text-xs hover:bg-[var(--neon-yellow)]/80">
              {deleteMutation.isPending ? 'ELIMINANDO...' : 'ELIMINAR'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
