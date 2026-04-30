import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format, parseISO } from 'date-fns'
import {
  CheckCircle, Wrench, UserCheck, PackagePlus,
  RotateCcw, Archive, Pencil, Clock,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { supabase } from '@/lib/supabase'
import { formatPKR } from '@/lib/utils'

interface AssetHistoryModalProps {
  assetId: string
  assetTag: string
  onClose: () => void
}

interface AuditEntry {
  id: string
  action: string
  created_at: string
  before_state: Record<string, unknown> | null
  after_state: Record<string, unknown> | null
  actor: { id: string; name: string } | null
}

interface RepairEntry {
  id: string
  fault_description: string
  repair_vendor_name: string
  final_cost_pkr: number | null
  status: string
  resolved_status: string | null
  created_at: string
  completed_at: string | null
  original_user: { id: string; name: string } | null
}

interface TimelineEvent {
  id: string
  eventType: string
  title: string
  subtitle?: string
  created_at: string
  actorLabel?: string
}

function useAssetHistory(assetId: string) {
  return useQuery({
    queryKey: ['asset-history', assetId],
    queryFn: async () => {
      const [auditRes, repairRes] = await Promise.all([
        supabase
          .from('asset_audit_log')
          .select('id, action, created_at, before_state, after_state, actor:profiles!actor_id(id, name)')
          .eq('asset_id', assetId)
          .order('created_at', { ascending: true }),
        supabase
          .from('repair_records')
          .select('id, fault_description, repair_vendor_name, final_cost_pkr, status, resolved_status, created_at, completed_at, original_user:profiles!original_user_id(id, name)')
          .eq('asset_id', assetId)
          .order('created_at', { ascending: true }),
      ])
      if (auditRes.error) throw auditRes.error
      if (repairRes.error) throw repairRes.error

      const audit = (auditRes.data ?? []) as unknown as AuditEntry[]
      const repairs = (repairRes.data ?? []) as unknown as RepairEntry[]

      // Batch-fetch user names for allotted_user_id values in audit state
      const userIds = [
        ...new Set(
          audit
            .map((e) => e.after_state?.allotted_user_id as string | undefined)
            .filter((id): id is string => !!id)
        ),
      ]
      let userMap: Record<string, string> = {}
      if (userIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, name')
          .in('id', userIds)
        userMap = Object.fromEntries((profiles ?? []).map((u) => [u.id, u.name as string]))
      }

      return { audit, repairs, userMap }
    },
    enabled: !!assetId,
    staleTime: 0,
  })
}

function getBadgeClass(eventType: string): string {
  switch (eventType) {
    case 'created':     return 'bg-emerald-500'
    case 'allocated':   return 'bg-blue-500'
    case 'available':   return 'bg-gray-400'
    case 'in_repair':   return 'bg-orange-500'
    case 'repaired':    return 'bg-emerald-500'
    case 'retired':     return 'bg-red-500'
    case 'updated':     return 'bg-gray-300'
    default:            return 'bg-gray-300'
  }
}

function EventIcon({ type }: { type: string }) {
  const cls = 'w-4 h-4 text-white'
  switch (type) {
    case 'created':   return <PackagePlus className={cls} />
    case 'allocated': return <UserCheck className={cls} />
    case 'available': return <RotateCcw className={cls} />
    case 'in_repair': return <Wrench className={cls} />
    case 'repaired':  return <CheckCircle className={cls} />
    case 'retired':   return <Archive className={cls} />
    case 'updated':   return <Pencil className={cls} />
    default:          return <Clock className={cls} />
  }
}

function formatShortDate(dateStr: string): string {
  try { return format(parseISO(dateStr), 'dd MMM, h:mm a') } catch { return dateStr }
}

function formatGroupDate(dateStr: string): string {
  try { return format(parseISO(dateStr), 'dd MMMM yyyy') } catch { return dateStr }
}

export function AssetHistoryModal({ assetId, assetTag, onClose }: AssetHistoryModalProps) {
  const { data, isLoading } = useAssetHistory(assetId)

  const events = useMemo<TimelineEvent[]>(() => {
    if (!data) return []
    const { audit, repairs, userMap } = data

    const auditEvents: TimelineEvent[] = audit
      .filter((log) => log.action !== 'repair_opened' && log.action !== 'repair_closed')
      .map((log): TimelineEvent => {
        let title = ''
        let subtitle: string | undefined
        let eventType = log.action

        switch (log.action) {
          case 'created':
            title = 'Asset added to system'
            eventType = 'created'
            break
          case 'assigned': {
            const userId = log.after_state?.allotted_user_id as string | undefined
            const userName = userId ? (userMap[userId] ?? 'Unknown') : undefined
            title = userName ? `Allocated to ${userName}` : 'Allocated to employee'
            eventType = 'allocated'
            break
          }
          case 'returned':
            title = 'Returned — marked Available'
            eventType = 'available'
            break
          case 'status_changed': {
            const s = log.after_state?.status as string | undefined
            const userId = log.after_state?.allotted_user_id as string | undefined
            const userName = userId ? (userMap[userId] ?? 'Unknown') : undefined
            if (s === 'allotted' && userName) {
              title = `Allocated to ${userName}`
              eventType = 'allocated'
            } else if (s === 'available') {
              title = 'Marked Available'
              eventType = 'available'
            } else if (s === 'in_repair') {
              title = 'Sent for repair'
              eventType = 'in_repair'
            } else if (s === 'retired') {
              title = 'Retired'
              eventType = 'retired'
            } else {
              title = 'Status changed'
              subtitle = s ? `→ ${s.replace(/_/g, ' ')}` : undefined
              eventType = 'updated'
            }
            break
          }
          case 'updated': {
            // Only show if allotted_user_id changed
            const beforeId = log.before_state?.allotted_user_id as string | undefined
            const afterId = log.after_state?.allotted_user_id as string | undefined
            if (afterId && afterId !== beforeId) {
              const userName = userMap[afterId] ?? 'Unknown'
              title = `Allocated to ${userName}`
              eventType = 'allocated'
            } else {
              title = 'Asset details updated'
              eventType = 'updated'
            }
            break
          }
          case 'retired': {
            title = 'Asset retired'
            const r = log.after_state?.retirement_reason as string | undefined
            subtitle = r ? r.replace(/_/g, ' ') : undefined
            eventType = 'retired'
            break
          }
          default:
            title = log.action.replace(/_/g, ' ')
        }

        return {
          id: `audit-${log.id}`,
          eventType,
          title,
          subtitle,
          created_at: log.created_at,
          actorLabel: log.actor?.name ? `by ${log.actor.name}` : undefined,
        }
      })

    const repairEvents: TimelineEvent[] = []
    for (const repair of repairs) {
      repairEvents.push({
        id: `repair-open-${repair.id}`,
        eventType: 'in_repair',
        title: 'Sent for repair',
        subtitle: [repair.fault_description, repair.repair_vendor_name].filter(Boolean).join(' · '),
        created_at: repair.created_at,
        actorLabel: repair.original_user?.name ? `Had by ${repair.original_user.name}` : undefined,
      })
      if (repair.status === 'completed' && repair.completed_at) {
        repairEvents.push({
          id: `repair-close-${repair.id}`,
          eventType: 'repaired',
          title: `Repair completed${repair.resolved_status ? ` — ${repair.resolved_status.replace(/_/g, ' ')}` : ''}`,
          subtitle: repair.final_cost_pkr != null ? `Cost: ${formatPKR(repair.final_cost_pkr)}` : undefined,
          created_at: repair.completed_at,
        })
      }
    }

    return [...auditEvents, ...repairEvents].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    )
  }, [data])

  // Unique previous users extracted from allotment events
  const previousUsers = useMemo(() => {
    if (!data) return []
    const seen = new Set<string>()
    const users: { id: string; name: string }[] = []
    for (const log of data.audit) {
      const userId = log.after_state?.allotted_user_id as string | undefined
      if (userId && !seen.has(userId)) {
        seen.add(userId)
        const name = data.userMap[userId]
        if (name) users.push({ id: userId, name })
      }
    }
    return users
  }, [data])

  // Group events by calendar date
  const groupedEvents = useMemo(() => {
    const map = new Map<string, TimelineEvent[]>()
    for (const ev of events) {
      const key = formatGroupDate(ev.created_at)
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(ev)
    }
    return Array.from(map.entries())
  }, [events])

  return (
    <Modal open onClose={onClose} title={`Asset History — ${assetTag}`} size="md">
      {isLoading && (
        <div className="flex items-center justify-center py-12">
          <Spinner size="md" className="text-[var(--color-primary)]" />
        </div>
      )}

      {!isLoading && events.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-12 text-gray-400">
          <Clock className="w-8 h-8" />
          <p className="text-sm">No history recorded for this asset yet.</p>
        </div>
      )}

      {!isLoading && events.length > 0 && (
        <div>
          {/* Previous users summary */}
          {previousUsers.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-3 mb-4">
              <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Previous Users
              </p>
              <div className="flex flex-wrap gap-1.5">
                {previousUsers.map((u) => (
                  <span
                    key={u.id}
                    className="text-xs bg-white border border-gray-200 rounded-full px-2.5 py-1 text-gray-700"
                  >
                    {u.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Timeline grouped by date */}
          <div className="space-y-1">
            {groupedEvents.map(([dateLabel, dayEvents]) => (
              <div key={dateLabel}>
                <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider py-2 px-1">
                  {dateLabel}
                </div>
                {dayEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-start gap-3 px-1 py-2.5 hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getBadgeClass(event.eventType)}`}>
                      <EventIcon type={event.eventType} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 leading-snug">{event.title}</p>
                      {event.subtitle && (
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{event.subtitle}</p>
                      )}
                      {event.actorLabel && (
                        <p className="text-xs text-gray-400 mt-0.5">{event.actorLabel}</p>
                      )}
                    </div>
                    <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5 whitespace-nowrap">
                      {formatShortDate(event.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </Modal>
  )
}
