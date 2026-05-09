import { Panel } from '@/components/cyber/Panel';

export function PersonCreatePage() {
  return (
    <div className="space-y-6">
      <Panel title="NEW_PERSON" tag="PPL.NEW" status="INPUT" accent="cyan">
        <p className="text-sm text-muted-foreground font-mono-data">Person form coming soon.</p>
      </Panel>
    </div>
  );
}
