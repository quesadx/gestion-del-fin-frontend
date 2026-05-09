import { Panel } from '@/components/cyber/Panel';

export function AdmissionsPage() {
  return (
    <div className="space-y-6">
      <Panel title="ADMISSION_REQUESTS" tag="ADM.01" status="AWAITING" accent="cyan">
        <p className="text-sm text-muted-foreground font-mono-data">Admissions coming soon.</p>
      </Panel>
    </div>
  );
}
