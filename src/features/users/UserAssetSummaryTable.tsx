import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

interface SummaryRow {
  userId: string
  name: string
  laptops: number
  mobiles: number
  monitors: number
  other: number
  total: number
}

interface UserAssetSummaryTableProps {
  onViewUser: (profile: Profile) => void
  allUsers: Profile[]
}

function useSummaryData() {
  return useQuery<SummaryRow[]>({
    queryKey: ['user-asset-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('allotted_user_id, asset_type, allotted_user:profiles!allotted_user_id(id, name)')
        .eq('status', 'allotted')
        .not('allotted_user_id', 'is', null)

      if (error) throw error

      const map = new Map<string, SummaryRow>()
      for (const row of data ?? []) {
        const raw = row.allotted_user
        const user = (Array.isArray(raw) ? raw[0] : raw) as { id: string; name: string } | null
        if (!user) continue
        if (!map.has(user.id)) {
          map.set(user.id, { userId: user.id, name: user.name, laptops: 0, mobiles: 0, monitors: 0, other: 0, total: 0 })
        }
        const entry = map.get(user.id)!
        entry.total++
        if (row.asset_type === 'laptop') entry.laptops++
        else if (row.asset_type === 'mobile') entry.mobiles++
        else if (row.asset_type === 'monitor') entry.monitors++
        else entry.other++
      }

      return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
    },
    staleTime: 0,
    gcTime: 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

function Cell({ value }: { value: number }) {
  return (
    <td className="px-4 py-2 text-center text-sm">
      {value === 0 ? <span className="text-[var(--color-text-secondary)]">—</span> : <span className="font-medium">{value}</span>}
    </td>
  )
}

export function UserAssetSummaryTable({ onViewUser, allUsers }: UserAssetSummaryTableProps) {
  const [open, setOpen] = useState(true)
  const { data: rows, isLoading } = useSummaryData()

  function handleView(userId: string) {
    const profile = allUsers.find((u) => u.id === userId)
    if (profile) onViewUser(profile)
  }

  return (
    <div className="card p-0 overflow-hidden mb-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)] hover:bg-[var(--color-bg-secondary)] transition-colors"
      >
        <span className="section-title">Asset Distribution Summary</span>
        {open ? <ChevronUp className="w-4 h-4 text-[var(--color-text-secondary)]" /> : <ChevronDown className="w-4 h-4 text-[var(--color-text-secondary)]" />}
      </button>

      {open && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <th className="px-4 py-2 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Name</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Laptops</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Mobiles</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">LED Monitors</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Other</th>
                <th className="px-4 py-2 text-center text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Total</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-[var(--color-text-secondary)]">Loading…</td>
                </tr>
              )}
              {!isLoading && (rows ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-[var(--color-text-secondary)]">No assets currently allotted</td>
                </tr>
              )}
              {!isLoading && (rows ?? []).map((row, i) => (
                <tr
                  key={row.userId}
                  className={i % 2 === 0 ? 'bg-white' : 'bg-[var(--color-bg-secondary)]'}
                >
                  <td className="px-4 py-2 font-medium text-sm text-[var(--color-text)]">{row.name}</td>
                  <Cell value={row.laptops} />
                  <Cell value={row.mobiles} />
                  <Cell value={row.monitors} />
                  <Cell value={row.other} />
                  <td className="px-4 py-2 text-center">
                    <span className="font-semibold text-[var(--color-primary)]">{row.total}</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    <button
                      onClick={() => handleView(row.userId)}
                      className="text-xs text-[var(--color-primary)] hover:underline font-medium"
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
