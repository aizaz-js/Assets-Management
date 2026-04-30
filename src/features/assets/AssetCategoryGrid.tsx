import { motion } from 'framer-motion'
import * as LucideIcons from 'lucide-react'
import type { Asset } from '@/types'
import type { CategoryConfig } from '@/hooks/useCategories'

function getIcon(iconName: string | undefined): React.ComponentType<{ className?: string; size?: number }> {
  if (!iconName) return LucideIcons.Package as React.ComponentType<{ className?: string; size?: number }>
  const Icon = (LucideIcons as Record<string, unknown>)[iconName] as React.ComponentType<{ className?: string; size?: number }> | undefined
  return Icon ?? (LucideIcons.Package as React.ComponentType<{ className?: string; size?: number }>)
}

interface AssetCategoryGridProps {
  assets: Asset[]
  categories: CategoryConfig[]
  onSelectType: (type: string) => void
}

export function AssetCategoryGrid({ assets, categories, onSelectType }: AssetCategoryGridProps) {
  return (
    <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
      {categories.map((category) => {
        const type = category.type_key
        const typeAssets = assets.filter((a) => a.asset_type === type)
        const counts = {
          total: typeAssets.length,
          available: typeAssets.filter((a) => a.status === 'available').length,
          allotted: typeAssets.filter((a) => a.status === 'allotted').length,
          repair: typeAssets.filter((a) => a.status === 'in_repair').length,
        }
        const Icon = getIcon(category.icon)

        return (
          <motion.button
            key={type}
            onClick={() => onSelectType(type)}
            className="card text-left relative cursor-pointer p-5 hover:border-[var(--color-light-blue)] transition-colors"
            whileHover={{ scale: 1.01, boxShadow: '0 4px 12px rgba(25,82,116,0.12)' }}
            transition={{ duration: 0.15 }}
          >
            <div className="flex items-start justify-between mb-3">
              <Icon className="text-[var(--color-primary)]" size={28} />
              <span className="bg-[var(--color-primary)] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {counts.total}
              </span>
            </div>
            <p className="text-sm font-semibold text-[var(--color-primary)] leading-tight mb-3">
              {category.label}
            </p>
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
