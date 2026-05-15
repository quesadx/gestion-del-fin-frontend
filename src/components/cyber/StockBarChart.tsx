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
  CRITICAL: '#f43f5e',
  LOW: '#f59e0b',
  OK: '#22d3ee',
};

const TOOLTIP_STYLE = {
  backgroundColor: 'oklch(0.1 0.03 320 / 0.95)',
  border: '1px solid oklch(0.68 0.32 340 / 0.3)',
  borderRadius: '2px',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: '10px',
  color: 'var(--text-primary, #e0e0e0)',
};

interface StockBarChartProps {
  data: StockBarEntry[];
  height?: number;
}

export function StockBarChart({ data, height = 300 }: StockBarChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 font-mono-data text-xs text-muted-foreground">
        NO STOCK DATA AVAILABLE
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart layout="vertical" data={data} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="oklch(0.55 0.22 210 / 0.08)"
          horizontal={false}
        />
        <XAxis type="number" hide />
        <YAxis
          dataKey="name"
          type="category"
          axisLine={false}
          tickLine={false}
          tick={{
            fill: 'oklch(0.68 0.32 340 / 0.6)',
            fontSize: 10,
            fontFamily: "'JetBrains Mono', monospace",
          }}
          width={100}
        />
        <Tooltip
          cursor={{ fill: 'oklch(0.68 0.32 340 / 0.05)' }}
          contentStyle={TOOLTIP_STYLE}
        />
        <Bar dataKey="current" radius={[0, 2, 2, 0]} barSize={16}>
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || STATUS_COLORS.OK} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
