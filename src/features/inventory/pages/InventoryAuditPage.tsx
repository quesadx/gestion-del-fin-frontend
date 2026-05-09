import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Panel } from '@/components/cyber/Panel';
import { GlitchButton } from '@/components/cyber/GlitchButton';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import { StatusBadge } from '@/components/cyber/StatusBadge';
import { useCamps } from '@/features/camps/hooks/useCamps';
import { useInventoryAudit } from '@/features/inventory/hooks/useInventory';
import { ClipboardList, Warehouse, ArrowLeft } from 'lucide-react';

export function InventoryAuditPage() {
  const navigate = useNavigate();
  const { data: camps, isLoading: campsLoading } = useCamps();
  const [selectedCampId, setSelectedCampId] = useState<number | null>(null);
  const { data: audit, isLoading: auditLoading, isError: auditError, error: auditErr, refetch } = useInventoryAudit(selectedCampId ?? 0);

  const campsArray = Array.isArray(camps) ? camps : [];
  const auditArray = Array.isArray(audit) ? audit : [];

  return (
    <div className="space-y-6">
      <GlitchButton variant="ghost" onClick={() => navigate('/inventory')}>
        <span className="flex items-center gap-2"><ArrowLeft className="h-3.5 w-3.5" />VOLVER AL INVENTARIO</span>
      </GlitchButton>

      <Panel title="AUDITORÍA DE INVENTARIO" tag="INV.AUDIT" status={selectedCampId ? 'ONLINE' : 'AWAITING'} accent="cyan">
        {campsLoading ? (
          <ScreenLoader />
        ) : campsArray.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <Warehouse className="h-8 w-8 text-[var(--neon-cyan)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">NO HAY CAMPAMENTOS DISPONIBLES</p>
          </div>
        ) : (
          <div>
            <label className="block mb-1.5 text-[10px] tracking-[0.2em] text-[var(--neon-cyan)]/60 font-mono-data">CAMPAMENTO //</label>
            <select
              value={selectedCampId ?? ''}
              onChange={(e) => setSelectedCampId(e.target.value ? Number(e.target.value) : null)}
              className="w-full rounded-sm bg-[oklch(0.15_0.05_320_/_0.5)] border border-[oklch(0.68_0.32_340_/_0.4)] px-3 py-2.5 text-sm text-foreground outline-none focus:border-[var(--neon-cyan)] font-mono-data"
            >
              <option value="">SELECCIONE UN CAMPAMENTO</option>
              {campsArray.map((c: Record<string, unknown>) => (
                <option key={c.id as number} value={c.id as number}>{c.name as string}</option>
              ))}
            </select>
          </div>
        )}
      </Panel>

      {!selectedCampId ? (
        <Panel accent="fuchsia">
          <div className="flex flex-col items-center gap-4 py-8">
            <ClipboardList className="h-10 w-10 text-[var(--neon-fuchsia)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">SELECCIONE UN CAMPAMENTO</p>
          </div>
        </Panel>
      ) : auditLoading ? (
        <ScreenLoader />
      ) : auditError ? (
        <Panel title="ERROR" status="ERROR" accent="fuchsia">
          <p className="text-sm text-red-400 font-mono-data mb-4">{(auditErr as Error)?.message || 'Error al cargar auditoría'}</p>
          <GlitchButton variant="warning" onClick={() => refetch()}>REINTENTAR</GlitchButton>
        </Panel>
      ) : auditArray.length === 0 ? (
        <Panel accent="cyan">
          <div className="flex flex-col items-center gap-4 py-8">
            <ClipboardList className="h-10 w-10 text-[var(--neon-cyan)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">NO HAY REGISTROS DE AUDITORÍA</p>
          </div>
        </Panel>
      ) : (
        <Panel title="REGISTRO DE AUDITORÍA" tag={`INV.AUDIT.${selectedCampId}`} status={`${auditArray.length} REGISTROS`} accent="cyan">
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono-data text-xs">
              <thead>
                <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                  <th className="py-3 px-2 font-semibold">RECURSO</th>
                  <th className="py-3 px-2 font-semibold">TIPO</th>
                  <th className="py-3 px-2 font-semibold">CANTIDAD</th>
                  <th className="py-3 px-2 font-semibold">DESCRIPCIÓN</th>
                  <th className="py-3 px-2 font-semibold">FECHA</th>
                </tr>
              </thead>
              <tbody>
                {auditArray.map((entry: Record<string, unknown>) => {
                  const resourceName = (entry.resource as Record<string, unknown>)?.name || entry.resource_type_id as string;
                  const typeVariant = entry.type === 'MANUAL_IN' ? 'green' : 'red';
                  const typeLabel = entry.type === 'MANUAL_IN' ? 'ENTRADA' : 'SALIDA';
                  return (
                    <tr key={entry.id as number} className="border-b border-[oklch(0.68_0.32_340_/_0.1)] hover:bg-[oklch(0.68_0.32_340_/_0.05)] transition-colors">
                      <td className="py-3 px-2 text-[var(--neon-fuchsia)]">{resourceName as string}</td>
                      <td className="py-3 px-2">
                        <StatusBadge status={typeLabel} variant={typeVariant} />
                      </td>
                      <td className="py-3 px-2 text-foreground font-bold">{entry.quantity as string}</td>
                      <td className="py-3 px-2 text-muted-foreground max-w-[200px] truncate">{(entry.description as string) || '—'}</td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {entry.created_at ? format(new Date(entry.created_at as string), 'dd/MM/yyyy HH:mm') : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Panel>
      )}
    </div>
  );
}
