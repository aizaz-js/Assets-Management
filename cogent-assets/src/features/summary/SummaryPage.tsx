import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'

interface SummaryRow {
  userId: string
  name: string
  designation: string | null
  laptops: number
  mobiles: number
  monitors: number
  other: number
  total: number
}

function useSummary() {
  return useQuery<SummaryRow[]>({
    queryKey: ['asset-summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select(`
          asset_type,
          allotted_user_id,
          allotted_user:profiles!allotted_user_id (
            id, name, designation
          )
        `)
        .eq('status', 'allotted')
        .not('allotted_user_id', 'is', null)

      if (error) throw error

      const map = new Map<string, SummaryRow>()
      for (const row of data ?? []) {
        const raw = row.allotted_user
        const user = (Array.isArray(raw) ? raw[0] : raw) as { id: string; name: string; designation: string | null } | null
        if (!user) continue
        if (!map.has(user.id)) {
          map.set(user.id, { userId: user.id, name: user.name, designation: user.designation, laptops: 0, mobiles: 0, monitors: 0, other: 0, total: 0 })
        }
        const e = map.get(user.id)!
        e.total++
        if (row.asset_type === 'laptop') e.laptops++
        else if (row.asset_type === 'mobile') e.mobiles++
        else if (row.asset_type === 'monitor') e.monitors++
        else e.other++
      }

      return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
    },
    staleTime: 0,
    gcTime: 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

function Num({ value }: { value: number }) {
  return (
    <td className="px-4 py-2.5 text-center text-sm">
      {value === 0 ? <span className="text-[var(--color-text-secondary)]">—</span> : value}
    </td>
  )
}

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card flex flex-col gap-1 p-5">
      <p className="text-xs text-[var(--color-text-secondary)] font-medium uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-[var(--color-primary)]">{value}</p>
    </div>
  )
}

function exportCsv(rows: SummaryRow[]) {
  const header = ['#', 'Name', 'Designation', 'Laptops', 'Mobiles', 'Monitors', 'Other', 'Total']
  const lines = rows.map((r, i) =>
    [i + 1, r.name, r.designation ?? '', r.laptops, r.mobiles, r.monitors, r.other, r.total].join(',')
  )
  const csv = [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `asset-summary-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function SummaryPage() {
  const { data: rows = [], isLoading } = useSummary()

  const totalEmployees = rows.length
  const totalLaptops = rows.reduce((s, r) => s + r.laptops, 0)
  const totalMobiles = rows.reduce((s, r) => s + r.mobiles, 0)
  const totalMonitors = rows.reduce((s, r) => s + r.monitors, 0)

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <PageHeader
        title="Asset Summary"
        description="Distribution of assets across all employees"
        actions={
          <Button variant="secondary" size="sm" onClick={() => exportCsv(rows)} disabled={rows.length === 0}>
            <Download className="w-4 h-4" />
            Export CSV
          </Button>
        }
      />

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard label="Employees with Assets" value={totalEmployees} />
        <KpiCard label="Laptops Allotted" value={totalLaptops} />
        <KpiCard label="Mobiles Allotted" value={totalMobiles} />
        <KpiCard label="Monitors Allotted" value={totalMonitors} />
      </div>

      {/* Distribution table */}
      <div className="card p-0 overflow-hidden">
        <div className="px-4 py-3 border-b border-[var(--color-border)]">
          <h2 className="section-title">Employee Asset Distribution</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-[640px] w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide w-10">#</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Designation</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Laptops</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Mobiles</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Monitors</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Other</th>
                <th className="px-4 py-2.5 text-center text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Total</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-[var(--color-text-secondary)]">Loading…</td>
                </tr>
              )}
              {!isLoading && rows.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-sm text-[var(--color-text-secondary)]">No assets currently allotted</td>
                </tr>
              )}
              {!isLoading && rows.map((row, i) => (
                <tr key={row.userId} className={i % 2 === 0 ? 'bg-white' : 'bg-[var(--color-bg-secondary)]'}>
                  <td className="px-4 py-2.5 text-xs text-[var(--color-text-secondary)]">{i + 1}</td>
                  <td className="px-4 py-2.5 font-medium text-[var(--color-text)]">{row.name}</td>
                  <td className="px-4 py-2.5 text-[var(--color-text-secondary)] text-xs">{row.designation ?? '—'}</td>
                  <Num value={row.laptops} />
                  <Num value={row.mobiles} />
                  <Num value={row.monitors} />
                  <Num value={row.other} />
                  <td className="px-4 py-2.5 text-center">
                    <span className="font-bold text-[var(--color-primary)]">{row.total}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  )
}
