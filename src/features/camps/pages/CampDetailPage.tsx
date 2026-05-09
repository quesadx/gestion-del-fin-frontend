import { useParams } from 'react-router-dom';
import { Panel } from '@/components/cyber/Panel';

export function CampDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <Panel title="CAMP_DETAIL" tag={`CAMP.${id}`} status="LOADING" accent="cyan">
        <p className="text-sm text-muted-foreground font-mono-data">Camp detail coming soon.</p>
      </Panel>
    </div>
  );
}
