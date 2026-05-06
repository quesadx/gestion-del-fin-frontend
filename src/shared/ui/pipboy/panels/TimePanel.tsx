import { useSystemTime } from '@/shared/hooks/useSystemTime';

export function TimePanel() {
  const { data, isLoading, isError } = useSystemTime();

  const timeValue = isLoading ? 'LOADING' : isError ? 'ERROR' : (data?.now ?? '--:--');
  const dateValue = data?.today ?? '--';
  const isoValue = data?.iso ?? '----';

  return (
    <div className="pip-frame">
      <span className="pip-frame-title">CHRONO</span>
      <div className="pip-row">
        <div>
          <div className="pip-label">SERVER TIME</div>
          <div className="pip-value lg">{timeValue}</div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="pip-label">DATE</div>
          <div className="pip-value lg">{dateValue}</div>
        </div>
      </div>
      <div style={{ height: 8 }} />
      <div className="pip-row">
        <div className="pip-label">ISO</div>
        <div className="pip-value">{isoValue}</div>
      </div>
    </div>
  );
}
