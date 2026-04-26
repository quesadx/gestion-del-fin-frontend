interface Props {
  fill: number;
  segments?: number;
  tone?: 'ok' | 'warn';
}

export function SegmentBar({ fill, segments = 16, tone = 'ok' }: Props) {
  const filled = Math.round(fill * segments);
  return (
    <div className="pip-bar" aria-label={`${Math.round(fill * 100)}%`}>
      {Array.from({ length: segments }).map((_, i) => {
        const on = i < filled;
        const cls = on
          ? tone === 'warn'
            ? 'pip-bar-cell warn'
            : 'pip-bar-cell'
          : 'pip-bar-cell off';
        return <span key={i} className={cls} />;
      })}
    </div>
  );
}
