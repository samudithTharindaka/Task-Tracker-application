import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { ChartTooltip } from '@/components/dashboard/ChartTooltip'
import { STATUS_CHART_COLORS } from '@/lib/chartColors'
import { BOARD_COLUMNS } from '@/types/task'
import type { StatusCounts } from '@/store/dashboardStore'

export function StatusStackedBarChart({ data }: { data: (StatusCounts & { name: string })[] }) {
  if (data.length === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No projects yet</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }} barCategoryGap="25%">
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey="name" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={{ stroke: 'var(--border)' }} tickLine={false} />
        <YAxis tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--secondary)' }} />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
        />
        {BOARD_COLUMNS.map((c, i) => (
          <Bar
            key={c.id}
            dataKey={c.id}
            name={c.label}
            stackId="status"
            fill={STATUS_CHART_COLORS[c.id]}
            stroke="var(--card)"
            strokeWidth={2}
            radius={i === BOARD_COLUMNS.length - 1 ? [4, 4, 0, 0] : undefined}
            maxBarSize={40}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}
