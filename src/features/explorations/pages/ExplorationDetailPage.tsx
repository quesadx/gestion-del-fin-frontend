import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Panel } from '@/components/cyber/Panel';
import { GlitchButton } from '@/components/cyber/GlitchButton';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import { StatusBadge } from '@/components/cyber/StatusBadge';
import { useExploration } from '@/features/explorations/hooks/useExplorations';
import { ArrowLeft, Users, Package, Gift } from 'lucide-react';

const STATUS_MAP: Record<string, 'red' | 'amber' | 'green'> = {
  PLANNED: 'red',
  ONGOING: 'amber',
  RETURNED: 'green',
  CANCELLED: 'red',
};

export function ExplorationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const explorationId = Number(id);

  const { data: exp, isLoading, isError, error, refetch } = useExploration(explorationId);

  if (isLoading) return <ScreenLoader />;

  if (isError) {
    return (
      <div className="space-y-6">
        <Panel title="ERROR" tag={`EXP.${explorationId}`} status="ERROR" accent="purple">
          <p className="text-sm text-red-400 font-mono-data mb-4">
            {(error as Error)?.message || 'Failed to load exploration'}
          </p>
          <GlitchButton variant="warning" onClick={() => refetch()}>
            RETRY
          </GlitchButton>
        </Panel>
      </div>
    );
  }

  if (!exp) {
    return (
      <div className="space-y-6">
        <Panel title="NOT FOUND" tag={`EXP.${explorationId}`} status="OFFLINE" accent="purple">
          <p className="text-sm text-muted-foreground font-mono-data">
            Requested exploration does not exist.
          </p>
        </Panel>
      </div>
    );
  }

  const p = exp as Record<string, unknown>;
  const camp = p.camps as Record<string, unknown> | undefined;
  const user = p.users as Record<string, unknown> | undefined;
  const members = Array.isArray(p.expedition_members)
    ? (p.expedition_members as Array<Record<string, unknown>>)
    : undefined;
  const allocated = Array.isArray(p.expedition_allocated_resources)
    ? (p.expedition_allocated_resources as Array<Record<string, unknown>>)
    : undefined;
  const found = Array.isArray(p.expedition_found_resources)
    ? (p.expedition_found_resources as Array<Record<string, unknown>>)
    : undefined;

  return (
    <div className="space-y-6">
      <GlitchButton variant="ghost" onClick={() => navigate('/explorations')}>
        <span className="flex items-center gap-2">
          <ArrowLeft className="h-3.5 w-3.5" />
          BACK TO EXPLORATIONS
        </span>
      </GlitchButton>

      <Panel
        title={p.destination as string}
        tag={`EXP.${p.id}`}
        status={p.status as string}
        accent="cyan"
      >
        <div className="space-y-2 font-mono-data text-xs mb-4">
          <div>
            <span className="text-muted-foreground">STATUS: </span>
            <StatusBadge
              status={p.status as string}
              variant={STATUS_MAP[p.status as string] || 'red'}
            />
          </div>
          <div>
            <span className="text-muted-foreground">CAMP: </span>
            <span className="text-foreground">
              {(camp?.name as string) || (p.camp_id as string) || '—'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">PLANNED BY: </span>
            <span className="text-foreground">
              {(user?.username as string) || (p.created_by as string) || '—'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono-data text-xs mb-4">
          <div>
            <span className="text-muted-foreground">DEPARTURE: </span>
            <span className="text-foreground">
              {p.departure_date ? format(new Date(p.departure_date as string), 'dd/MM/yyyy') : '—'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">EXPECTED RETURN: </span>
            <span className="text-foreground">
              {p.expected_return_date
                ? format(new Date(p.expected_return_date as string), 'dd/MM/yyyy')
                : '—'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">MAX RETURN: </span>
            <span className="text-foreground">
              {p.max_return_date
                ? format(new Date(p.max_return_date as string), 'dd/MM/yyyy')
                : '—'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">ACTUAL RETURN: </span>
            <span className="text-foreground">
              {p.actual_return_date
                ? format(new Date(p.actual_return_date as string), 'dd/MM/yyyy')
                : 'NOT YET RETURNED'}
            </span>
          </div>
        </div>

        {(p.notes as string) && (
          <div className="space-y-1 font-mono-data text-xs mb-4">
            <span className="text-muted-foreground">NOTES: </span>
            <p className="text-foreground whitespace-pre-wrap bg-zinc-800/50 border border-zinc-700 p-3">
              {p.notes as string}
            </p>
          </div>
        )}
      </Panel>

      <Panel title="EXPEDITION MEMBERS" tag={`EXP.${p.id}.MEMBERS`} accent="cyan">
        {members && members.length > 0 ? (
          (() => {
            const valid = members.filter((m) => m.person_id != null);
            const skipped = members.length - valid.length;
            return (
              <>
                {skipped > 0 && (
                  <div className="mb-3 border border-amber-500/30 bg-amber-950/20 p-2 font-mono-data text-[10px] text-amber-400">
                    {skipped} member(s) missing person_id and not shown
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono-data text-xs">
                    <thead>
                      <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                        <th className="py-2 px-2">PERSON ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {valid.map((m) => (
                        <tr
                          key={String(m.person_id)}
                          className="border-b border-[oklch(0.68_0.32_340_/_0.1)]"
                        >
                          <td className="py-2 px-2 text-foreground">{m.person_id as number}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()
        ) : (
          <div className="flex items-center gap-2 py-4 font-mono-data text-xs text-muted-foreground">
            <Users className="h-4 w-4" />
            {members === undefined ? 'Member data not included in response' : 'No members assigned'}
          </div>
        )}
      </Panel>

      <Panel title="ALLOCATED RESOURCES" tag={`EXP.${p.id}.ALLOC`} accent="cyan">
        {allocated && allocated.length > 0 ? (
          (() => {
            const valid = allocated.filter((r) => r.resource_type_id != null);
            const skipped = allocated.length - valid.length;
            return (
              <>
                {skipped > 0 && (
                  <div className="mb-3 border border-amber-500/30 bg-amber-950/20 p-2 font-mono-data text-[10px] text-amber-400">
                    {skipped} resource(s) missing resource_type_id and not shown
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono-data text-xs">
                    <thead>
                      <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                        <th className="py-2 px-2">RESOURCE TYPE ID</th>
                        <th className="py-2 px-2 text-right">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {valid.map((r) => (
                        <tr
                          key={`alloc-${r.resource_type_id}`}
                          className="border-b border-[oklch(0.68_0.32_340_/_0.1)]"
                        >
                          <td className="py-2 px-2 text-foreground">
                            {r.resource_type_id as number}
                          </td>
                          <td className="py-2 px-2 text-right text-foreground">
                            {r.amount as number}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()
        ) : (
          <div className="flex items-center gap-2 py-4 font-mono-data text-xs text-muted-foreground">
            <Package className="h-4 w-4" />
            {allocated === undefined
              ? 'Resource data not included in response'
              : 'No allocated resources'}
          </div>
        )}
      </Panel>

      <Panel title="FOUND RESOURCES" tag={`EXP.${p.id}.FOUND`} accent="cyan">
        {found && found.length > 0 ? (
          (() => {
            const valid = found.filter((r) => r.resource_type_id != null);
            const skipped = found.length - valid.length;
            return (
              <>
                {skipped > 0 && (
                  <div className="mb-3 border border-amber-500/30 bg-amber-950/20 p-2 font-mono-data text-[10px] text-amber-400">
                    {skipped} resource(s) missing resource_type_id and not shown
                  </div>
                )}
                <div className="overflow-x-auto">
                  <table className="w-full text-left font-mono-data text-xs">
                    <thead>
                      <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                        <th className="py-2 px-2">RESOURCE TYPE ID</th>
                        <th className="py-2 px-2 text-right">AMOUNT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {valid.map((r) => (
                        <tr
                          key={`found-${r.resource_type_id}`}
                          className="border-b border-[oklch(0.68_0.32_340_/_0.1)]"
                        >
                          <td className="py-2 px-2 text-foreground">
                            {r.resource_type_id as number}
                          </td>
                          <td className="py-2 px-2 text-right text-foreground">
                            {r.amount as number}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            );
          })()
        ) : (
          <div className="flex items-center gap-2 py-4 font-mono-data text-xs text-muted-foreground">
            <Gift className="h-4 w-4" />
            {found === undefined
              ? 'Resource data not included in response'
              : 'No found resources recorded'}
          </div>
        )}
      </Panel>
    </div>
  );
}
