import { Panel } from '@/components/cyber/Panel';

export function ResourcesPage() {
  return (
    <div className="space-y-6">
      <Panel title="RESOURCE_CATALOG" tag="RSC.01" status="AWAITING" accent="cyan">
        <p className="text-sm text-muted-foreground font-mono-data">Resource catalog coming soon.</p>
      </Panel>
    </div>
  );
}
