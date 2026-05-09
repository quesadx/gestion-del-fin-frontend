import { Panel } from '@/components/cyber/Panel';

export function UsersPage() {
  return (
    <div className="space-y-6">
      <Panel title="USER_MANAGEMENT" tag="USR.01" status="AWAITING" accent="cyan">
        <p className="text-sm text-muted-foreground font-mono-data">Users coming soon.</p>
      </Panel>
    </div>
  );
}
