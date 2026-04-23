import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { Database } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { supabase } from '@/lib/supabase'
import { ALL_SEED_DATA } from '@/lib/seedData'
import { ASSET_TAG_PREFIXES } from '@/lib/constants'

function getManufacturer(specs: string): string {
  if (/^macbook|^iphone|^ipad/i.test(specs)) return 'Apple'
  if (/^samsung/i.test(specs)) return 'Samsung'
  if (/^dell/i.test(specs)) return 'Dell'
  if (/^lenovo/i.test(specs)) return 'Lenovo'
  if (/^hp /i.test(specs)) return 'HP'
  if (/^asus/i.test(specs)) return 'ASUS'
  if (/^lg /i.test(specs)) return 'LG'
  if (/^benq/i.test(specs)) return 'BenQ'
  if (/^viewsonic/i.test(specs)) return 'ViewSonic'
  if (/^acer/i.test(specs)) return 'Acer'
  return specs.split(' ')[0]
}

export function SeedExistingData() {
  const [existingCount, setExistingCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [confirm, setConfirm] = useState(false)

  useEffect(() => {
    supabase
      .from('assets')
      .select('id', { count: 'exact', head: true })
      .then(({ count }) => setExistingCount(count ?? 0))
  }, [])

  async function handleSeed() {
    setLoading(true)
    try {
      const tagCounters: Record<string, number> = {}

      function nextTag(assetType: string): string {
        const prefix = ASSET_TAG_PREFIXES[assetType] ?? 'OTH'
        tagCounters[prefix] = (tagCounters[prefix] ?? 0) + 1
        return `${prefix}-${String(tagCounters[prefix]).padStart(4, '0')}`
      }

      const BATCH = 20
      for (let i = 0; i < ALL_SEED_DATA.length; i += BATCH) {
        const chunk = ALL_SEED_DATA.slice(i, i + BATCH)
        const rows = chunk.map((item) => ({
            asset_tag: nextTag(item.asset_type),
            classification: 'employee_allocated' as const,
            asset_type: item.asset_type,
            manufacturer: getManufacturer(item.specs),
            specs: item.specs,
            condition: item.condition,
            status: item.status,
            allotted_user_name: item.allotted_user_name,
            allotted_user_id: null,
            purchase_date: item.purchase_date,
            warranty_type: item.warranty_type,
            warranty_expiry: item.warranty_expiry,
            pta_status: item.pta_status,
            price_pkr: 0,
            vendor_name: '',
            vendor_phone: '',
            invoice_number: '',
            serial_number: null,
            location: null,
            notes: null,
            retirement_reason: null,
            created_by: null,
          }))
        const { error } = await supabase
          .from('assets')
          .upsert(rows, { onConflict: 'asset_tag', ignoreDuplicates: false })
        if (error) throw error
      }

      toast.success(`Seeded ${ALL_SEED_DATA.length} assets successfully!`)
      setConfirm(false)
      setLoading(false)
      const { count } = await supabase
        .from('assets')
        .select('id', { count: 'exact', head: true })
      setExistingCount(count ?? 0)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Seed failed')
      setLoading(false)
      setConfirm(false)
    }
  }

  return (
    <div className="card">
      <div className="flex items-start gap-3">
        <Database className="w-5 h-5 text-[var(--color-primary)] flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[var(--color-text)] mb-1">Seed Existing Inventory</h3>
          <p className="text-xs text-[var(--color-text-secondary)] mb-1">
            {ALL_SEED_DATA.filter((a) => a.asset_type === 'laptop').length} laptops,{' '}
            {ALL_SEED_DATA.filter((a) => a.asset_type === 'mobile').length} mobiles,{' '}
            {ALL_SEED_DATA.filter((a) => a.asset_type === 'monitor').length} monitors —{' '}
            {ALL_SEED_DATA.length} total. Existing records are updated, not duplicated.
          </p>
          {existingCount !== null && existingCount > 0 && (
            <p className="text-xs text-[var(--color-text-secondary)] mb-3">
              <span className="font-medium text-[var(--color-text)]">{existingCount}</span> assets already in database.
            </p>
          )}
          {existingCount === 0 && (
            <p className="text-xs text-[var(--color-text-secondary)] mb-3">Database is empty.</p>
          )}

          {!confirm ? (
            <Button variant="primary" size="sm" onClick={() => setConfirm(true)}>
              {existingCount ? 'Re-seed Inventory' : 'Seed Inventory'}
            </Button>
          ) : (
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-xs text-[var(--color-danger)] font-medium">
                Upsert {ALL_SEED_DATA.length} rows into assets. Continue?
              </p>
              <Button variant="primary" size="sm" loading={loading} onClick={handleSeed}>
                Yes, seed now
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setConfirm(false)}>
                Cancel
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
