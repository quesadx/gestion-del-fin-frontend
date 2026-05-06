import { useCampStore } from '@/features/camps/store/camp.store';
import { useCamp } from '@/features/camps/hooks/useCamp';

export function LocationPanel() {
  const activeCamp = useCampStore((state) => state.activeCamp);
  const campQuery = useCamp(activeCamp?.id);

  const isLoading = campQuery.isLoading;
  const isError = campQuery.isError;
  const camp = campQuery.data;

  return (
    <div className="pip-frame">
      <span className="pip-frame-title">LOCATION</span>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
        {isLoading && <div className="pip-label">LOADING CAMP DATA...</div>}
        {isError && <div className="pip-label red">ERROR LOADING CAMP DATA</div>}
        {!activeCamp && !isLoading && !isError && (
          <div className="pip-label">SELECT A CAMP TO SEE LOCATION DATA.</div>
        )}
        {camp && (
          <>
            <div className="pip-row" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="pip-label">CAMP NAME</div>
                <div className="pip-value" style={{ fontSize: 16, wordBreak: 'break-word' }}>
                  {camp.name}
                </div>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="pip-label">STATUS</div>
                <div className={`pip-value ${camp.status === 'ACTIVE' ? '' : 'amber'}`}>
                  {camp.status ?? 'UNKNOWN'}
                </div>
              </div>
            </div>
            <div className="pip-row" style={{ flexWrap: 'wrap', gap: 12 }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="pip-label">LOCATION</div>
                <div className="pip-value" style={{ fontSize: 16, wordBreak: 'break-word' }}>
                  {camp.location ?? 'UNKNOWN'}
                </div>
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div className="pip-label">CAMP ID</div>
                <div className="pip-value" style={{ fontSize: 16 }}>
                  {camp.id}
                </div>
              </div>
            </div>
            {camp.ai_context_prompt && (
              <div>
                <div className="pip-label">AI CONTEXT</div>
                <div
                  className="pip-value"
                  style={{ fontSize: 13, lineHeight: 1.4, whiteSpace: 'pre-wrap' }}
                >
                  {camp.ai_context_prompt}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
