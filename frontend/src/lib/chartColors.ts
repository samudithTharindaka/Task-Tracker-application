import type { TaskStatus } from '@/types/task'

// Reuses the same fixed status colors as StatusBadge (TODO/IN_PROGRESS/TEST/DONE
// are a reserved status domain, not an arbitrary series — same rule as
// StatusBadge's colors, kept in sync here so charts and badges always agree).
export const STATUS_CHART_COLORS: Record<TaskStatus, string> = {
  TODO: '#171717',
  IN_PROGRESS: '#fbbf24',
  TEST: '#0ea5e9',
  DONE: '#10b981',
}

// Validated categorical palette (fixed order, CVD-safe) for arbitrary-identity
// series such as "one slice per project".
export const CATEGORICAL_CHART_COLORS = [
  '#2a78d6',
  '#1baf7a',
  '#eda100',
  '#008300',
  '#4a3aa7',
  '#e34948',
  '#e87ba4',
  '#eb6834',
]
