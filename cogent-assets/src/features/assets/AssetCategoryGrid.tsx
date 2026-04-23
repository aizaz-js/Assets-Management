import { motion } from 'framer-motion'
import { AssetTypeIcon } from '@/components/shared/AssetTypeIcon'
import { ASSET_TYPE_LABELS, EMPLOYEE_ASSET_TYPES, COMPANY_ASSET_TYPES } from '@/lib/constants'
import type { Asset, AssetType, Classification } from '@/types'

interface AssetCategoryGridProps {
  assets: Asset[]
  classification: Classification
  onSelectType: (type: AssetType) => void
}

export function AssetCategoryGrid({ assets, classification, onSelectType }: AssetCategoryGridProps) {
  const types = classification === 'employee_allocated' ? EMPLOYEE_ASSET_TYPES : COMPANY_ASSET_TYPES

  const countsByType = types.reduce<Record<string, { total: number; available: number; allotted: number; repair: number }>>((acc, type) => {
    const typeAssets = assets.filter((a) => a.asset_type === type)
    acc[type] = {
      total: typeAssets.length,
      available: typeAssets.filter((a) => a.status === 'available').length,
      allotted: typeAssets.filter((a) => a.status === 'allotted').length,
      repair: typeAssets.filter((a) => a.status === 'in_repair').length,
    }
    return acc
  }, {})

  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
      {types.map((type) => {
        const counts = countsByType[type] ?? { total: 0, available: 0, allotted: 0, repair: 0 }
        return (
          <motion.button
            key={type}
            onClick={() => onSelectType(type as AssetType)}
            className="card text-left relative cursor-pointer p-5 hover:border-[var(--color-light-blue)] transition-colors"
            whileHover={{ scale: 1.01, boxShadow: '0 4px 12px rgba(25,82,116,0.12)' }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-start justify-between mb-3">
              <AssetTypeIcon type={type as AssetType} size={28} />
              <span className="bg-[var(--color-primary)] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {counts.total}
              </span>
            </div>
            <p className="text-sm font-semibold text-[var(--color-primary)] leading-tight mb-3">
              {ASSET_TYPE_LABELS[type]}
            </p>
            {/* Status mini-bar */}
            <div className="flex items-center gap-2 flex-wrap">
              {counts.available > 0 && (
                <span className="flex items-center gap-1 text-xs text-[var(--color-available)]">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-available)]" />
                  {counts.available}
                </span>
              )}
              {counts.allotted > 0 && (
                <span className="flex items-center gap-1 text-xs text-[var(--color-allotted)]">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-allotted)]" />
                  {counts.allotted}
                </span>
              )}
              {counts.repair > 0 && (
                <span className="flex items-center gap-1 text-xs text-[var(--color-repair)]">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-repair)]" />
                  {counts.repair}
                </span>
              )}
              {counts.total === 0 && (
                <span className="text-xs text-[var(--color-text-secondary)]">No assets</span>
              )}
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}
