import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, LayoutGrid } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { AssetTypeIcon } from '@/components/shared/AssetTypeIcon'
import { EditCategoryModal } from './EditCategoryModal'
import { useCategories, useUpdateCategory, type CategoryConfig } from '@/hooks/useCategories'
import type { AssetType } from '@/types'
import toast from 'react-hot-toast'

function CategoryCard({
  category,
  onEdit,
  onToggle,
  toggling,
}: {
  category: CategoryConfig
  onEdit: (c: CategoryConfig) => void
  onToggle: (c: CategoryConfig) => void
  toggling: boolean
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.15 }}
      className={`card p-4 flex flex-col gap-3 relative transition-opacity ${!category.is_active ? 'opacity-50' : ''}`}
    >
      {/* Header row */}
      <div className="flex items-start justify-between">
        <div className={`w-10 h-10 flex items-center justify-center rounded-xl ${category.is_active ? 'bg-[var(--color-primary)]/10' : 'bg-gray-100'}`}>
          <AssetTypeIcon type={category.type_key as AssetType} size={22} className={category.is_active ? '' : '!text-gray-400'} />
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onEdit(category)}
            className="p-1.5 rounded hover:bg-gray-100 transition-colors text-slate-400 hover:text-[var(--color-primary)]"
            title="Edit"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            disabled={toggling}
            onClick={() => onToggle(category)}
            className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${category.is_active ? 'bg-[var(--color-primary)]' : 'bg-gray-300'} disabled:opacity-60`}
            title={category.is_active ? 'Deactivate' : 'Activate'}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${category.is_active ? 'translate-x-4' : 'translate-x-0'}`}
            />
          </button>
        </div>
      </div>

      {/* Label */}
      <div>
        <p className="text-sm font-semibold text-[var(--color-text)] leading-tight">{category.label}</p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5 font-mono">{category.type_key}</p>
      </div>

      {/* Tag prefix badge */}
      <div className="flex items-center gap-2">
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-mono font-semibold bg-[var(--color-primary)]/8 text-[var(--color-primary)]">
          {category.tag_prefix}-####
        </span>
        {!category.is_active && (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
            Inactive
          </span>
        )}
      </div>
    </motion.div>
  )
}

export function SettingsPage() {
  const [editCategory, setEditCategory] = useState<CategoryConfig | null>(null)
  const [togglingKey, setTogglingKey] = useState<string | null>(null)
  const { data: categories, isLoading } = useCategories()
  const updateCategory = useUpdateCategory()

  const employeeCategories = (categories ?? [])
    .filter((c) => c.classification === 'employee_allocated')
    .sort((a, b) => a.sort_order - b.sort_order)

  const companyCategories = (categories ?? [])
    .filter((c) => c.classification === 'company_allocated')
    .sort((a, b) => a.sort_order - b.sort_order)

  async function handleToggle(category: CategoryConfig) {
    setTogglingKey(category.type_key)
    try {
      await updateCategory.mutateAsync({ ...category, is_active: !category.is_active })
      toast.success(`${category.label} ${!category.is_active ? 'activated' : 'deactivated'}`)
    } catch {
      toast.error('Failed to update category')
    } finally {
      setTogglingKey(null)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      <PageHeader
        title="Settings"
        description="Configure asset categories and system preferences"
      />

      {/* Section: Asset Categories */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <LayoutGrid className="w-4 h-4 text-[var(--color-primary)]" />
          <h2 className="text-sm font-semibold text-[var(--color-text)]">Asset Categories</h2>
          <span className="text-xs text-[var(--color-text-secondary)] ml-1">
            Manage display names, tag prefixes, and visibility
          </span>
        </div>

        {isLoading ? (
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="card p-4 h-32 animate-pulse bg-gray-50" />
            ))}
          </div>
        ) : (
          <>
            {/* Employee Assets */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-[var(--color-allotted)]" />
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                  Employee Assets
                </p>
                <span className="text-xs text-[var(--color-text-secondary)]">({employeeCategories.length})</span>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
                {employeeCategories.map((cat) => (
                  <CategoryCard
                    key={cat.type_key}
                    category={cat}
                    onEdit={setEditCategory}
                    onToggle={handleToggle}
                    toggling={togglingKey === cat.type_key}
                  />
                ))}
              </div>
            </div>

            {/* Company Assets */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                  Company Assets
                </p>
                <span className="text-xs text-[var(--color-text-secondary)]">({companyCategories.length})</span>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
                {companyCategories.map((cat) => (
                  <CategoryCard
                    key={cat.type_key}
                    category={cat}
                    onEdit={setEditCategory}
                    onToggle={handleToggle}
                    toggling={togglingKey === cat.type_key}
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>

      {editCategory && (
        <EditCategoryModal
          open={!!editCategory}
          onClose={() => setEditCategory(null)}
          category={editCategory}
        />
      )}
    </motion.div>
  )
}
