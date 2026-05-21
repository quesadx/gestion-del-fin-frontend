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
  const {
    data: audit,
    isLoading: auditLoading,
    isError: auditError,
    error: auditErr,
    refetch,
  } = useInventoryAudit(selectedCampId ?? 0);

  const campsArray = camps?.data ?? [];
  const auditArray = Array.isArray(audit) ? audit : [];

  return (
    <div className="space-y-6">
      <GlitchButton variant="ghost" onClick={() => navigate('/inventory')}>
        <span className="flex items-center gap-2">
          <ArrowLeft className="h-3.5 w-3.5" />
          BACK TO INVENTORY
        </span>
      </GlitchButton>

      <Panel
        title="INVENTORY AUDIT"
        tag="INV.AUDIT"
        status={selectedCampId ? 'ONLINE' : 'AWAITING'}
        accent="cyan"
      >
        {campsLoading ? (
          <ScreenLoader />
        ) : campsArray.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-6">
            <Warehouse className="h-8 w-8 text-[var(--neon-cyan)]/40" />
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
              {campsArray.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </Panel>

      {!selectedCampId ? (
        <Panel accent="purple">
          <div className="flex flex-col items-center gap-4 py-8">
            <ClipboardList className="h-10 w-10 text-[var(--neon-fuchsia)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">SELECT A CAMP</p>
          </div>
        </Panel>
      ) : auditLoading ? (
        <ScreenLoader />
      ) : auditError ? (
        <Panel title="ERROR" status="ERROR" accent="purple">
          <p className="text-sm text-red-400 font-mono-data mb-4">
            {(auditErr as Error)?.message || 'Failed to load audit'}
          </p>
          <GlitchButton variant="warning" onClick={() => refetch()}>
            RETRY
          </GlitchButton>
        </Panel>
      ) : auditArray.length === 0 ? (
        <Panel accent="cyan">
          <div className="flex flex-col items-center gap-4 py-8">
            <ClipboardList className="h-10 w-10 text-[var(--neon-cyan)]/40" />
            <p className="font-mono-data text-sm text-muted-foreground">NO AUDIT RECORDS</p>
          </div>
        </Panel>
      ) : (
        <Panel
          title="AUDIT LOG"
          tag={`INV.AUDIT.${selectedCampId}`}
          status={`${auditArray.length} RECORDS`}
          accent="cyan"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono-data text-xs">
              <thead>
                <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                  <th className="py-3 px-2 font-semibold">RESOURCE</th>
                  <th className="py-3 px-2 font-semibold">TYPE</th>
                  <th className="py-3 px-2 font-semibold">QUANTITY</th>
                  <th className="py-3 px-2 font-semibold">DESCRIPTION</th>
                  <th className="py-3 px-2 font-semibold">DATE</th>
                </tr>
              </thead>
              <tbody>
                {auditArray.map((entry) => {
                  const resourceName = String(entry.resource_type_id);
                  const typeVariant = entry.type === 'MANUAL_IN' ? 'green' : 'red';
                  const typeLabel = entry.type === 'MANUAL_IN' ? 'IN' : 'OUT';
                  return (
                    <tr
                      key={entry.id}
                      className="border-b border-[oklch(0.68_0.32_340_/_0.1)] hover:bg-[oklch(0.68_0.32_340_/_0.05)] transition-colors"
                    >
                      <td className="py-3 px-2 text-[var(--neon-fuchsia)]">{resourceName}</td>
                      <td className="py-3 px-2">
                        <StatusBadge status={typeLabel} variant={typeVariant} />
                      </td>
                      <td className="py-3 px-2 text-foreground font-bold">{entry.quantity}</td>
                      <td className="py-3 px-2 text-muted-foreground max-w-[200px] truncate">
                        {entry.description || '—'}
                      </td>
                      <td className="py-3 px-2 text-muted-foreground">
                        {entry.created_at
                          ? format(new Date(entry.created_at), 'dd/MM/yyyy HH:mm')
                          : '—'}
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
