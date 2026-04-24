import { useState } from 'react'
import { motion } from 'framer-motion'
import { Eye, CheckCircle, Pencil } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { Table, TableHead, TableBody, Th, Td, Tr, TableSkeleton } from '@/components/ui/Table'
import { Tooltip } from '@/components/ui/Tooltip'
import { EmptyState } from '@/components/ui/EmptyState'
import { RepairDetailDrawer } from './RepairDetailDrawer'
import { CompleteRepairModal } from './CompleteRepairModal'
import { EditRepairModal } from './EditRepairModal'
import { useRepairs, useRepairHistory } from '@/hooks/useRepairs'
import { ASSET_TYPE_LABELS } from '@/lib/constants'
import { formatDate, formatPKR } from '@/lib/utils'
import type { RepairRecord } from '@/types'
import { Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

type Tab = 'active' | 'history'

export function RepairPage() {
  const [tab, setTab] = useState<Tab>('active')
  const [viewRepair, setViewRepair] = useState<RepairRecord | null>(null)
  const [completeRepair, setCompleteRepair] = useState<RepairRecord | null>(null)
  const [editRepair, setEditRepair] = useState<RepairRecord | null>(null)

  const { data: openRepairs, isLoading: loadingActive } = useRepairs({ status: 'open' })
  const { data: history, isLoading: loadingHistory } = useRepairHistory()

  function daysFromSent(dateSent: string): number {
    if (!dateSent) return 0
    try {
      const sent = new Date(dateSent)
      const today = new Date()
      const diff = Math.floor((today.getTime() - sent.getTime()) / (1000 * 60 * 60 * 24))
      return Math.max(0, diff)
    } catch {
      return 0
    }
  }

  function daysBetween(start: string, end: string | null): string {
    if (!end) return '—'
    try {
      const diff = Math.floor((new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60 * 24))
      return `${Math.max(0, diff)}d`
    } catch {
      return '—'
    }
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

  const resolvedStatusLabel: Record<string, string> = {
    available: 'Available',
    allotted: 'Allotted',
    retired: 'Retired',
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

      {/* Tabs */}
      <div className="flex gap-1 mb-4">
        {(['active', 'history'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              'px-4 py-2 rounded text-sm font-medium border transition-all',
              tab === t
                ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)]'
                : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:border-[var(--color-primary)]'
            )}
          >
            {t === 'active' ? 'Active Repairs' : 'Repair History'}
            {t === 'active' && openRepairs && openRepairs.length > 0 && (
              <span className="ml-2 min-w-5 h-5 px-1.5 rounded-full bg-white/20 text-xs font-semibold inline-flex items-center justify-center">
                {openRepairs.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Active Repairs Tab */}
      {tab === 'active' && (
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
              {loadingActive && <TableSkeleton rows={5} cols={9} />}
              {!loadingActive && (openRepairs ?? []).map((repair) => {
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

          {!loadingActive && (openRepairs ?? []).length === 0 && (
            <EmptyState
              icon={Wrench}
              title="No open repairs"
              description="All assets are accounted for and no repairs are in progress"
            />
          )}
        </div>
      )}

      {/* Repair History Tab */}
      {tab === 'history' && (
        <div className="card p-0 overflow-hidden">
          <Table>
            <TableHead>
              <tr>
                <Th>Asset Tag</Th>
                <Th>Type</Th>
                <Th>Fault</Th>
                <Th>Date Sent</Th>
                <Th>Returned</Th>
                <Th>Days Taken</Th>
                <Th>Final Cost</Th>
                <Th>Resolved As</Th>
                <Th>Assigned To</Th>
              </tr>
            </TableHead>
            <TableBody>
              {loadingHistory && <TableSkeleton rows={5} cols={9} />}
              {!loadingHistory && (history ?? []).map((repair) => (
                <Tr key={repair.id}>
                  <Td>
                    <span className="font-mono font-semibold text-[var(--color-primary)]">
                      {repair.asset?.asset_tag ?? '—'}
                    </span>
                  </Td>
                  <Td>{repair.asset ? ASSET_TYPE_LABELS[repair.asset.asset_type] : '—'}</Td>
                  <Td>
                    <Tooltip content={repair.fault_description}>
                      <span className="line-clamp-1 max-w-[160px] text-xs">{repair.fault_description}</span>
                    </Tooltip>
                  </Td>
                  <Td>{formatDate(repair.date_sent)}</Td>
                  <Td>{formatDate(repair.actual_return_date)}</Td>
                  <Td>{daysBetween(repair.date_sent, repair.actual_return_date)}</Td>
                  <Td>{formatPKR(repair.final_cost_pkr)}</Td>
                  <Td>
                    {repair.resolved_status ? (
                      <span className={cn(
                        'text-xs font-medium px-2 py-0.5 rounded',
                        repair.resolved_status === 'available' && 'bg-green-100 text-green-700',
                        repair.resolved_status === 'allotted' && 'bg-blue-100 text-blue-700',
                        repair.resolved_status === 'retired' && 'bg-red-100 text-red-700',
                      )}>
                        {resolvedStatusLabel[repair.resolved_status] ?? repair.resolved_status}
                      </span>
                    ) : '—'}
                  </Td>
                  <Td>
                    {repair.asset?.allotted_user?.name ?? '—'}
                  </Td>
                </Tr>
              ))}
            </TableBody>
          </Table>

          {!loadingHistory && (history ?? []).length === 0 && (
            <EmptyState
              icon={Wrench}
              title="No repair history"
              description="Completed repairs will appear here"
            />
          )}
        </div>
      )}

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
