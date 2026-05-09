import { Panel } from '@/components/cyber/Panel';
import { GlitchButton } from '@/components/cyber/GlitchButton';

export function DashboardPage() {
  return (
    <div className="space-y-6">
      <Panel title="SYSTEM_OVERVIEW" tag="SYS.01" status="ONLINE" accent="cyan">
        <div className="space-y-3 text-sm text-muted-foreground font-mono-data">
          <p>Welcome to the command shell. Select a module from the sidebar to begin.</p>
          <div className="flex flex-wrap gap-3">
            <GlitchButton variant="primary" type="button" className="rounded-sm">
              OPEN_DASHBOARD
            </GlitchButton>
            <GlitchButton variant="ghost" type="button" className="rounded-sm">
              VIEW_LOGS
            </GlitchButton>
          </div>
        </div>
      </Panel>
    </div>
  );
}
