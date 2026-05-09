import { useParams } from 'react-router-dom';
import { Panel } from '@/components/cyber/Panel';

export function PersonDetailPage() {
  const { id } = useParams<{ id: string }>();

  return (
    <div className="space-y-6">
      <Panel title="PERSON_DETAIL" tag={`PPL.${id}`} status="LOADING" accent="cyan">
        <p className="text-sm text-muted-foreground font-mono-data">Person detail coming soon.</p>
      </Panel>
    </div>
  );
}
