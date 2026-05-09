import { Panel } from '@/components/cyber/Panel';

export function ExplorationsPage() {
  return (
    <div className="space-y-6">
      <Panel title="EXPEDITION_LOG" tag="EXP.01" status="AWAITING" accent="cyan">
        <p className="text-sm text-muted-foreground font-mono-data">Expeditions coming soon.</p>
      </Panel>
    </div>
  );
}
