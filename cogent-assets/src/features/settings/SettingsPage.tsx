import { useState } from 'react'
import { motion } from 'framer-motion'
import { Pencil, LayoutGrid, Plus, Trash2 } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { EditCategoryModal } from './EditCategoryModal'
import { AddCategoryModal } from './AddCategoryModal'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { useCategories, useUpdateCategory, useDeleteCategory, type CategoryConfig } from '@/hooks/useCategories'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

function getIcon(iconName: string | undefined): React.ComponentType<{ className?: string; size?: number }> {
  if (!iconName) return LucideIcons.Package as React.ComponentType<{ className?: string; size?: number }>
  const Icon = (LucideIcons as Record<string, unknown>)[iconName] as React.ComponentType<{ className?: string; size?: number }> | undefined
  return Icon ?? (LucideIcons.Package as React.ComponentType<{ className?: string; size?: number }>)
}

function CategoryCard({
  category,
  onEdit,
  onToggle,
  onDelete,
  toggling,
}: {
  category: CategoryConfig
  onEdit: (c: CategoryConfig) => void
  onToggle: (c: CategoryConfig) => void
  onDelete: (c: CategoryConfig) => void
  toggling: boolean
}) {
  const Icon = getIcon(category.icon)

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
          <Icon
            size={22}
            className={category.is_active ? 'text-[var(--color-primary)]' : 'text-gray-400'}
          />
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
            onClick={() => onDelete(category)}
            className="p-1.5 rounded hover:bg-red-50 transition-colors text-slate-400 hover:text-red-500"
            title="Delete"
          >
            <Trash2 className="w-3.5 h-3.5" />
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
  const [addClassification, setAddClassification] = useState<'employee_allocated' | 'company_allocated' | null>(null)
  const [deleteCategory, setDeleteCategory] = useState<CategoryConfig | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingKey, setTogglingKey] = useState<string | null>(null)

  const { data: categories, isLoading } = useCategories()
  const updateCategory = useUpdateCategory()
  const deleteCategoryMutation = useDeleteCategory()

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

  async function handleDelete() {
    if (!deleteCategory) return
    setDeleting(true)
    try {
      // Check if any assets exist for this category
      const { count } = await supabase
        .from('assets')
        .select('id', { count: 'exact', head: true })
        .eq('asset_type', deleteCategory.type_key)

      if (count && count > 0) {
        toast.error(`Cannot delete — ${count} asset${count === 1 ? '' : 's'} exist with this type`)
        setDeleteCategory(null)
        return
      }

      await deleteCategoryMutation.mutateAsync(deleteCategory.id)
      toast.success(`${deleteCategory.label} deleted`)
      setDeleteCategory(null)
    } catch {
      toast.error('Failed to delete category')
    } finally {
      setDeleting(false)
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
              <div className="flex items-center gap-3 mb-3">
                <span className="w-2 h-2 rounded-full bg-[var(--color-allotted)]" />
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                  Employee Assets
                </p>
                <span className="text-xs text-[var(--color-text-secondary)]">({employeeCategories.length})</span>
                <button
                  onClick={() => setAddClassification('employee_allocated')}
                  className="ml-auto flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Category
                </button>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
                {employeeCategories.map((cat) => (
                  <CategoryCard
                    key={cat.type_key}
                    category={cat}
                    onEdit={setEditCategory}
                    onToggle={handleToggle}
                    onDelete={setDeleteCategory}
                    toggling={togglingKey === cat.type_key}
                  />
                ))}
              </div>
            </div>

            {/* Company Assets */}
            <div>
              <div className="flex items-center gap-3 mb-3">
                <span className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                  Company Assets
                </p>
                <span className="text-xs text-[var(--color-text-secondary)]">({companyCategories.length})</span>
                <button
                  onClick={() => setAddClassification('company_allocated')}
                  className="ml-auto flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Category
                </button>
              </div>
              <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))' }}>
                {companyCategories.map((cat) => (
                  <CategoryCard
                    key={cat.type_key}
                    category={cat}
                    onEdit={setEditCategory}
                    onToggle={handleToggle}
                    onDelete={setDeleteCategory}
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

      {addClassification && (
        <AddCategoryModal
          open={!!addClassification}
          onClose={() => setAddClassification(null)}
          classification={addClassification}
          nextSortOrder={
            (addClassification === 'employee_allocated' ? employeeCategories : companyCategories).length + 1
          }
        />
      )}

      <ConfirmDialog
        open={!!deleteCategory}
        onClose={() => setDeleteCategory(null)}
        onConfirm={handleDelete}
        title={`Delete '${deleteCategory?.label}'?`}
        description={`This will remove it from the category grid. Existing assets of this type will not be deleted.`}
        confirmLabel="Delete"
        variant="danger"
        loading={deleting}
      />
    </motion.div>
  )
}
