import { Panel } from '@/components/cyber/Panel';

export function ProfessionsPage() {
  return (
    <div className="space-y-6">
      <Panel title="PROFESSION_CATALOG" tag="PRF.01" status="AWAITING" accent="cyan">
        <p className="text-sm text-muted-foreground font-mono-data">Professions coming soon.</p>
      </Panel>
    </div>
  );
}
