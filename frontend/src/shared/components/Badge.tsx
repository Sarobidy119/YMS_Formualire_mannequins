import { statusColor, formatStatus } from '../utils/formatters'

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${statusColor(status)}`}>
      {formatStatus(status)}
    </span>
  )
}
