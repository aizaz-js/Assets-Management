import { Badge } from '@/components/ui/Badge'
import type { AssetStatus } from '@/types'

const statusLabel: Record<AssetStatus, string> = {
  available: 'Available',
  allotted: 'Allotted',
  in_repair: 'In Repair',
  retired: 'Retired',
}

const statusVariant: Record<AssetStatus, 'available' | 'allotted' | 'repair' | 'retired'> = {
  available: 'available',
  allotted: 'allotted',
  in_repair: 'repair',
  retired: 'retired',
}

export function AssetStatusBadge({ status }: { status: AssetStatus }) {
  return <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>
}
