import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { ChartTooltip } from '@/components/dashboard/ChartTooltip'
import { STATUS_CHART_COLORS } from '@/lib/chartColors'
import { BOARD_COLUMNS, type TaskStatus } from '@/types/task'

export function StatusPieChart({ counts }: { counts: Record<TaskStatus, number> }) {
  const data = BOARD_COLUMNS.map((c) => ({ name: c.label, status: c.id, value: counts[c.id] ?? 0 }))
  const total = data.reduce((sum, d) => sum + d.value, 0)

  if (total === 0) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">No tasks yet</div>
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={0} outerRadius="80%" stroke="var(--card)" strokeWidth={2}>
          {data.map((d) => (
            <Cell key={d.status} fill={STATUS_CHART_COLORS[d.status]} />
          ))}
        </Pie>
        <Tooltip content={<ChartTooltip />} />
        <Legend
          verticalAlign="bottom"
          height={36}
          iconType="circle"
          iconSize={8}
          formatter={(value) => <span className="text-xs text-muted-foreground">{value}</span>}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
