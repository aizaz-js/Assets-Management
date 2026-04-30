import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Download } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { useCategories } from '@/hooks/useCategories'
import { Pagination } from '@/components/ui/Pagination'
import { cn } from '@/lib/utils'

// ─── Employee summary ────────────────────────────────────────────────────────

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

function useEmployeeSummary() {
  return useQuery<SummaryRow[]>({
    queryKey: ['asset-summary', 'employee'],
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
        .eq('classification', 'employee_allocated')
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

// ─── Company summary ─────────────────────────────────────────────────────────

interface CompanyRow {
  assetType: string
  label: string
  total: number
  allotted: number
  available: number
  inRepair: number
  locations: string[]
}

function useCompanySummary() {
  return useQuery<CompanyRow[]>({
    queryKey: ['asset-summary', 'company'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('assets')
        .select('asset_type, location, status')
        .eq('classification', 'company_allocated')
        .neq('status', 'retired')

      if (error) throw error

      const map = new Map<string, CompanyRow>()
      for (const row of data ?? []) {
        if (!map.has(row.asset_type)) {
          map.set(row.asset_type, {
            assetType: row.asset_type,
            label: row.asset_type,
            total: 0, allotted: 0, available: 0, inRepair: 0,
            locations: [],
          })
        }
        const e = map.get(row.asset_type)!
        e.total++
        if (row.status === 'allotted') {
          e.allotted++
          if (row.location && !e.locations.includes(row.location)) {
            e.locations.push(row.location)
          }
        } else if (row.status === 'available') {
          e.available++
        } else if (row.status === 'in_repair') {
          e.inRepair++
        }
      }

      return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label))
    },
    staleTime: 0,
    gcTime: 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

// ─── Shared UI ────────────────────────────────────────────────────────────────

function KpiCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="card flex flex-col gap-1 p-5">
      <p className="text-xs text-[var(--color-text-secondary)] font-medium uppercase tracking-wide">{label}</p>
      <p className="text-3xl font-bold text-[var(--color-primary)]">{value}</p>
    </div>
  )
}

function Th({ children, center }: { children: React.ReactNode; center?: boolean }) {
  return (
    <th className={cn(
      'px-4 py-2.5 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide',
      center ? 'text-center' : 'text-left'
    )}>
      {children}
    </th>
  )
}

function exportEmployeeCsv(rows: SummaryRow[]) {
  const header = ['#', 'Name', 'Designation', 'Laptops', 'Mobiles', 'Monitors', 'Other', 'Total']
  const lines = rows.map((r, i) =>
    [i + 1, r.name, r.designation ?? '', r.laptops, r.mobiles, r.monitors, r.other, r.total].join(',')
  )
  const csv = [header.join(','), ...lines].join('\n')
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `employee-asset-summary-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function formatLocations(locations: string[]): string {
  if (locations.length === 0) return '—'
  if (locations.length <= 2) return locations.join(', ')
  return `${locations.slice(0, 2).join(', ')} and ${locations.length - 2} more`
}

// ─── Page ────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 15

export function SummaryPage() {
  const [activeTab, setActiveTab] = useState<'employee' | 'company'>('employee')
  const [empPage, setEmpPage] = useState(1)
  const [coPage, setCoPage] = useState(1)
  const { data: employeeRows = [], isLoading: empLoading } = useEmployeeSummary()
  const { data: companyRows = [], isLoading: coLoading } = useCompanySummary()
  const { data: categories = [] } = useCategories()

  useEffect(() => { setEmpPage(1) }, [activeTab])
  useEffect(() => { setCoPage(1) }, [activeTab])

  // Enrich company rows with labels from categories
  const enrichedCompanyRows = companyRows.map((row) => {
    const cat = categories.find((c) => c.type_key === row.assetType)
    return { ...row, label: cat?.label ?? row.assetType.replace(/_/g, ' ') }
  }).sort((a, b) => a.label.localeCompare(b.label))

  const pagedEmployeeRows = employeeRows.slice((empPage - 1) * PAGE_SIZE, empPage * PAGE_SIZE)
  const pagedCompanyRows = enrichedCompanyRows.slice((coPage - 1) * PAGE_SIZE, coPage * PAGE_SIZE)

  // Employee KPIs
  const totalEmployees  = employeeRows.length
  const totalLaptops    = employeeRows.reduce((s, r) => s + r.laptops, 0)
  const totalMobiles    = employeeRows.reduce((s, r) => s + r.mobiles, 0)
  const totalMonitors   = employeeRows.reduce((s, r) => s + r.monitors, 0)

  // Company KPIs
  const coTotal     = enrichedCompanyRows.reduce((s, r) => s + r.total, 0)
  const coAllotted  = enrichedCompanyRows.reduce((s, r) => s + r.allotted, 0)
  const coAvailable = enrichedCompanyRows.reduce((s, r) => s + r.available, 0)
  const coTypes     = enrichedCompanyRows.length

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }}>
      <PageHeader
        title="Asset Summary"
        description="Distribution of assets across all employees and company locations"
        actions={
          activeTab === 'employee' ? (
            <Button variant="secondary" size="sm" onClick={() => exportEmployeeCsv(employeeRows)} disabled={employeeRows.length === 0}>
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          ) : undefined
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-[var(--color-border)] mb-6 gap-1">
        {(
          [
            { value: 'employee', label: 'Employee Allocated' },
            { value: 'company',  label: 'Company Allocated'  },
          ] as const
        ).map(({ value, label }) => (
          <button
            key={value}
            onClick={() => setActiveTab(value)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px',
              activeTab === value
                ? 'text-[var(--color-primary)] border-[var(--color-primary)]'
                : 'text-[var(--color-text-secondary)] border-transparent hover:text-[var(--color-text)]'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Employee tab ── */}
      {activeTab === 'employee' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label="Employees with Assets" value={totalEmployees} />
            <KpiCard label="Laptops Allotted"      value={totalLaptops} />
            <KpiCard label="Mobiles Allotted"       value={totalMobiles} />
            <KpiCard label="Monitors Allotted"      value={totalMonitors} />
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-border)]">
              <h2 className="section-title">Employee Asset Distribution</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[640px] w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    <Th>#</Th>
                    <Th>Name</Th>
                    <Th>Designation</Th>
                    <Th center>Laptops</Th>
                    <Th center>Mobiles</Th>
                    <Th center>Monitors</Th>
                    <Th center>Other</Th>
                    <Th center>Total</Th>
                  </tr>
                </thead>
                <tbody>
                  {empLoading && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-[var(--color-text-secondary)]">Loading…</td></tr>
                  )}
                  {!empLoading && employeeRows.length === 0 && (
                    <tr><td colSpan={8} className="px-4 py-8 text-center text-sm text-[var(--color-text-secondary)]">No assets currently allotted</td></tr>
                  )}
                  {!empLoading && pagedEmployeeRows.map((row, i) => (
                    <tr key={row.userId} className={i % 2 === 0 ? 'bg-white' : 'bg-[var(--color-bg-secondary)]'}>
                      <td className="px-4 py-2.5 text-xs text-[var(--color-text-secondary)]">{(empPage - 1) * PAGE_SIZE + i + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-[var(--color-text)]">{row.name}</td>
                      <td className="px-4 py-2.5 text-[var(--color-text-secondary)] text-xs">{row.designation ?? '—'}</td>
                      {[row.laptops, row.mobiles, row.monitors, row.other].map((v, j) => (
                        <td key={j} className="px-4 py-2.5 text-center text-sm">
                          {v === 0 ? <span className="text-[var(--color-text-secondary)]">—</span> : v}
                        </td>
                      ))}
                      <td className="px-4 py-2.5 text-center">
                        <span className="font-bold text-[var(--color-primary)]">{row.total}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!empLoading && employeeRows.length > 0 && (
              <Pagination page={empPage} pageSize={PAGE_SIZE} total={employeeRows.length} onPageChange={setEmpPage} />
            )}
          </div>
        </>
      )}

      {/* ── Company tab ── */}
      {activeTab === 'company' && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard label="Total Company Assets" value={coTotal} />
            <KpiCard label="Allotted"             value={coAllotted} />
            <KpiCard label="Available"            value={coAvailable} />
            <KpiCard label="Asset Types in Use"   value={coTypes} />
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--color-border)]">
              <h2 className="section-title">Company Asset Distribution</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[640px] w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]">
                    <Th>#</Th>
                    <Th>Category</Th>
                    <Th center>Total</Th>
                    <Th center>Allotted</Th>
                    <Th center>Available</Th>
                    <Th>Locations</Th>
                  </tr>
                </thead>
                <tbody>
                  {coLoading && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--color-text-secondary)]">Loading…</td></tr>
                  )}
                  {!coLoading && enrichedCompanyRows.length === 0 && (
                    <tr><td colSpan={6} className="px-4 py-8 text-center text-sm text-[var(--color-text-secondary)]">No company assets found</td></tr>
                  )}
                  {!coLoading && pagedCompanyRows.map((row, i) => (
                    <tr key={row.assetType} className={i % 2 === 0 ? 'bg-white' : 'bg-[var(--color-bg-secondary)]'}>
                      <td className="px-4 py-2.5 text-xs text-[var(--color-text-secondary)]">{(coPage - 1) * PAGE_SIZE + i + 1}</td>
                      <td className="px-4 py-2.5 font-medium text-[var(--color-text)] capitalize">{row.label}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="font-bold text-[var(--color-primary)]">{row.total}</span>
                      </td>
                      <td className="px-4 py-2.5 text-center text-sm">
                        {row.allotted === 0 ? <span className="text-[var(--color-text-secondary)]">—</span> : row.allotted}
                      </td>
                      <td className="px-4 py-2.5 text-center text-sm">
                        {row.available === 0 ? <span className="text-[var(--color-text-secondary)]">—</span> : row.available}
                      </td>
                      <td className="px-4 py-2.5 text-xs text-[var(--color-text-secondary)] max-w-[220px]">
                        {formatLocations(row.locations)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!coLoading && enrichedCompanyRows.length > 0 && (
              <Pagination page={coPage} pageSize={PAGE_SIZE} total={enrichedCompanyRows.length} onPageChange={setCoPage} />
            )}
          </div>
        </>
      )}
    </motion.div>
  )
}
