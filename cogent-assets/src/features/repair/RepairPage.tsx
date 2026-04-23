import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, CheckCircle, Pencil } from 'lucide-react'
import { differenceInDays, parseISO } from 'date-fns'
import { PageHeader } from '@/components/layout/PageHeader'
import { Table, TableHead, TableBody, Th, Td, Tr, TableSkeleton } from '@/components/ui/Table'
import { Tooltip } from '@/components/ui/Tooltip'
import { EmptyState } from '@/components/ui/EmptyState'
import { RepairDetailDrawer } from './RepairDetailDrawer'
import { CompleteRepairModal } from './CompleteRepairModal'
import { EditRepairModal } from './EditRepairModal'
import { useRepairs } from '@/hooks/useRepairs'
import { ASSET_TYPE_LABELS } from '@/lib/constants'
import { formatDate } from '@/lib/utils'
import type { RepairRecord } from '@/types'
import { Wrench } from 'lucide-react'

export function RepairPage() {
  const [viewRepair, setViewRepair] = useState<RepairRecord | null>(null)
  const [completeRepair, setCompleteRepair] = useState<RepairRecord | null>(null)
  const [editRepair, setEditRepair] = useState<RepairRecord | null>(null)

  const { data: openRepairs, isLoading } = useRepairs({ status: 'open' })

  function daysFromSent(dateSent: string): number {
    return Math.max(0, differenceInDays(new Date(), parseISO(dateSent)))
  }

  function rowBorderClass(days: number) {
    if (days >= 15) return 'border-l-4 border-[var(--color-danger)]'
    if (days >= 8) return 'border-l-4 border-amber-400'
    return ''
  }

  function daysTextClass(days: number) {
    if (days >= 15) return 'text-[var(--color-danger)] font-bold'
    if (days >= 8) return 'text-amber-600 font-semibold'
    return 'text-[var(--color-text)]'
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <PageHeader
        title="Repair Tracking"
        description="All assets currently under repair"
      />

      <div className="card p-0 overflow-hidden">
        <Table>
          <TableHead>
            <tr>
              <Th>Asset Tag</Th>
              <Th>Type</Th>
              <Th>Specs</Th>
              <Th>Fault</Th>
              <Th>Vendor</Th>
              <Th>Date Sent</Th>
              <Th>Expected Return</Th>
              <Th>Days</Th>
              <Th>Actions</Th>
            </tr>
          </TableHead>
          <TableBody>
            {isLoading && <TableSkeleton rows={5} cols={9} />}
            {!isLoading && (openRepairs ?? []).map((repair) => {
              const days = daysFromSent(repair.date_sent)
              return (
                <Tr
                  key={repair.id}
                  onClick={() => setViewRepair(repair)}
                  className={rowBorderClass(days)}
                >
                  <Td>
                    <span className="font-mono font-semibold text-[var(--color-primary)]">
                      {repair.asset?.asset_tag ?? '—'}
                    </span>
                  </Td>
                  <Td>{repair.asset ? ASSET_TYPE_LABELS[repair.asset.asset_type] : '—'}</Td>
                  <Td>
                    <Tooltip content={repair.asset?.specs ?? ''}>
                      <span className="line-clamp-1 max-w-[160px] text-xs">{repair.asset?.specs ?? '—'}</span>
                    </Tooltip>
                  </Td>
                  <Td>
                    <Tooltip content={repair.fault_description}>
                      <span className="line-clamp-1 max-w-[160px] text-xs">{repair.fault_description}</span>
                    </Tooltip>
                  </Td>
                  <Td>{repair.repair_vendor_name}</Td>
                  <Td>{formatDate(repair.date_sent)}</Td>
                  <Td>{formatDate(repair.expected_return_date)}</Td>
                  <Td>
                    <span className={daysTextClass(days)}>{days}d</span>
                  </Td>
                  <Td onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Tooltip content="View details">
                        <button
                          className="p-1.5 rounded hover:bg-[var(--color-bg)] text-slate-500 hover:text-[var(--color-primary)] transition-colors"
                          onClick={() => setViewRepair(repair)}
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Edit repair">
                        <button
                          className="p-1.5 rounded hover:bg-[var(--color-bg)] text-slate-500 hover:text-[var(--color-primary)] transition-colors"
                          onClick={() => setEditRepair(repair)}
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                      </Tooltip>
                      <Tooltip content="Mark complete">
                        <button
                          className="p-1.5 rounded hover:bg-[var(--color-available-light)] text-slate-500 hover:text-[var(--color-available)] transition-colors"
                          onClick={() => setCompleteRepair(repair)}
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </div>
                  </Td>
                </Tr>
              )
            })}
          </TableBody>
        </Table>

        {!isLoading && (openRepairs ?? []).length === 0 && (
          <EmptyState
            icon={Wrench}
            title="No open repairs"
            description="All assets are accounted for and no repairs are in progress"
          />
        )}
      </div>

      <RepairDetailDrawer repair={viewRepair} open={!!viewRepair} onClose={() => setViewRepair(null)} />

      {completeRepair && (
        <CompleteRepairModal
          open={!!completeRepair}
          onClose={() => setCompleteRepair(null)}
          repair={completeRepair}
        />
      )}

      {editRepair && (
        <EditRepairModal
          open={!!editRepair}
          onClose={() => setEditRepair(null)}
          repair={editRepair}
        />
      )}
    </motion.div>
  )
}
