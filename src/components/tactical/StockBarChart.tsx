import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface StockBarEntry {
  name: string;
  current: number;
  minimum: number;
  status: 'CRITICAL' | 'LOW' | 'OK';
}

const STATUS_COLORS: Record<string, string> = {
  CRITICAL: '#ef4444',
  LOW: '#f59e0b',
  OK: '#06b6d4',
};

const TOOLTIP_STYLE = {
  backgroundColor: 'var(--gdf-surface-overlay)',
  border: '1px solid var(--gdf-border-default)',
  borderRadius: 'var(--gdf-radius-md)',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '10px',
  color: 'var(--gdf-text-primary)',
};

interface StockBarChartProps {
  data: StockBarEntry[];
  height?: number;
}

export function StockBarChart({ data, height = 300 }: StockBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 font-sans text-xs text-xs text-gdf-text-muted">
        NO STOCK DATA AVAILABLE
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--gdf-border-subtle)" horizontal={false} />
        <XAxis type="number" hide />
        <YAxis
          dataKey="name"
          type="category"
          axisLine={false}
          tickLine={false}
          tick={{
            fill: 'var(--gdf-text-muted)',
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
          }}
          width={100}
        />
        <Tooltip cursor={{ fill: 'var(--gdf-accent-primary-glow)' }} contentStyle={TOOLTIP_STYLE} />
        <Bar dataKey="current" radius={[0, 2, 2, 0]} barSize={16}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || STATUS_COLORS.OK} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
