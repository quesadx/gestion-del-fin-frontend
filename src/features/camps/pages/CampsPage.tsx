import { Panel } from '@/components/cyber/Panel';

export function CampsPage() {
  return (
    <div className="space-y-6">
      <Panel title="CAMP_DIRECTORY" tag="CAMP.01" status="AWAITING" accent="cyan">
        <p className="text-sm text-muted-foreground font-mono-data">Camp list coming soon.</p>
      </Panel>
    </div>
  );
}
