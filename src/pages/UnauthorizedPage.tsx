import { useNavigate } from 'react-router-dom';
import { Panel } from '@/components/cyber/Panel';
import { GlitchButton } from '@/components/cyber/GlitchButton';

export function UnauthorizedPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-10">
      <Panel title="ACCESS DENIED" tag="403" status="FORBIDDEN" accent="cyan">
        <div className="space-y-4 text-sm text-muted-foreground">
          <p className="font-mono-data">
            You do not have permission to access this route. Contact an administrator if you need
            access.
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <GlitchButton
              variant="warning"
              type="button"
              onClick={() => navigate('/dashboard', { replace: true })}
            >
              BACK_TO_DASHBOARD
            </GlitchButton>
            <GlitchButton
              variant="ghost"
              type="button"
              onClick={() => navigate('/login', { replace: true })}
            >
              SWITCH_USER
            </GlitchButton>
          </div>
        </div>
      </Panel>
    </div>
  );
}
