import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Panel } from '@/components/cyber/Panel';
import { GlitchButton } from '@/components/cyber/GlitchButton';
import { ScreenLoader } from '@/components/cyber/ScreenLoader';
import { StatusBadge } from '@/components/cyber/StatusBadge';
import { useExploration } from '@/features/explorations/hooks/useExplorations';
import { ArrowLeft, Users, Package, Gift } from 'lucide-react';

const STATUS_MAP: Record<string, 'cyan' | 'yellow' | 'green' | 'red'> = {
  PLANNED: 'cyan',
  ONGOING: 'yellow',
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

  return (
    <div className="space-y-6">
      <GlitchButton variant="ghost" onClick={() => navigate('/explorations')}>
        <span className="flex items-center gap-2">
          <ArrowLeft className="h-3.5 w-3.5" />
          BACK TO EXPLORATIONS
        </span>
      </GlitchButton>

      <Panel title={exp.destination} tag={`EXP.${exp.id}`} status={exp.status} accent="cyan">
        <div className="space-y-2 font-mono-data text-xs mb-4">
          <div>
            <span className="text-muted-foreground">STATUS: </span>
            <StatusBadge status={exp.status} variant={STATUS_MAP[exp.status] || 'cyan'} />
          </div>
          <div>
            <span className="text-muted-foreground">CAMP: </span>
            <span className="text-foreground">{exp.camps?.name || String(exp.camp_id)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">PLANNED BY: </span>
            <span className="text-foreground">{exp.users?.username || String(exp.created_by)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 font-mono-data text-xs mb-4">
          <div>
            <span className="text-muted-foreground">DEPARTURE: </span>
            <span className="text-foreground">
              {exp.departure_date ? format(new Date(exp.departure_date), 'dd/MM/yyyy') : '—'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">EXPECTED RETURN: </span>
            <span className="text-foreground">
              {exp.expected_return_date
                ? format(new Date(exp.expected_return_date), 'dd/MM/yyyy')
                : '—'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">MAX RETURN: </span>
            <span className="text-foreground">
              {exp.max_return_date ? format(new Date(exp.max_return_date), 'dd/MM/yyyy') : '—'}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">ACTUAL RETURN: </span>
            <span className="text-foreground">
              {exp.actual_return_date
                ? format(new Date(exp.actual_return_date), 'dd/MM/yyyy')
                : 'NOT YET RETURNED'}
            </span>
          </div>
        </div>

        {exp.notes && (
          <div className="space-y-1 font-mono-data text-xs mb-4">
            <span className="text-muted-foreground">NOTES: </span>
            <p className="text-foreground whitespace-pre-wrap bg-zinc-800/50 border border-zinc-700 p-3">
              {exp.notes}
            </p>
          </div>
        )}
      </Panel>

      <Panel title="EXPEDITION MEMBERS" tag={`EXP.${exp.id}.MEMBERS`} accent="cyan">
        {exp.members && exp.members.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono-data text-xs">
              <thead>
                <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                  <th className="py-2 px-2">PERSON ID</th>
                </tr>
              </thead>
              <tbody>
                {exp.members.map((m, i) => (
                  <tr
                    key={m.person_id || i}
                    className="border-b border-[oklch(0.68_0.32_340_/_0.1)]"
                  >
                    <td className="py-2 px-2 text-foreground">{m.person_id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center gap-2 py-4 font-mono-data text-xs text-muted-foreground">
            <Users className="h-4 w-4" />
            {exp.members === undefined
              ? 'Member data not included in response'
              : 'No members assigned'}
          </div>
        )}
      </Panel>

      <Panel title="ALLOCATED RESOURCES" tag={`EXP.${exp.id}.ALLOC`} accent="cyan">
        {exp.allocated_resources && exp.allocated_resources.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono-data text-xs">
              <thead>
                <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                  <th className="py-2 px-2">RESOURCE TYPE ID</th>
                  <th className="py-2 px-2 text-right">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {exp.allocated_resources.map((r, i) => (
                  <tr
                    key={r.resource_type_id || i}
                    className="border-b border-[oklch(0.68_0.32_340_/_0.1)]"
                  >
                    <td className="py-2 px-2 text-foreground">{r.resource_type_id}</td>
                    <td className="py-2 px-2 text-right text-foreground">{r.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center gap-2 py-4 font-mono-data text-xs text-muted-foreground">
            <Package className="h-4 w-4" />
            {exp.allocated_resources === undefined
              ? 'Resource data not included in response'
              : 'No allocated resources'}
          </div>
        )}
      </Panel>

      <Panel title="FOUND RESOURCES" tag={`EXP.${exp.id}.FOUND`} accent="cyan">
        {exp.found_resources && exp.found_resources.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left font-mono-data text-xs">
              <thead>
                <tr className="border-b border-[oklch(0.68_0.32_340_/_0.25)] text-muted-foreground">
                  <th className="py-2 px-2">RESOURCE TYPE ID</th>
                  <th className="py-2 px-2 text-right">AMOUNT</th>
                </tr>
              </thead>
              <tbody>
                {exp.found_resources.map((r, i) => (
                  <tr
                    key={r.resource_type_id || i}
                    className="border-b border-[oklch(0.68_0.32_340_/_0.1)]"
                  >
                    <td className="py-2 px-2 text-foreground">{r.resource_type_id}</td>
                    <td className="py-2 px-2 text-right text-foreground">{r.amount}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex items-center gap-2 py-4 font-mono-data text-xs text-muted-foreground">
            <Gift className="h-4 w-4" />
            {exp.found_resources === undefined
              ? 'Resource data not included in response'
              : 'No found resources recorded'}
          </div>
        )}
      </Panel>
    </div>
  );
}
