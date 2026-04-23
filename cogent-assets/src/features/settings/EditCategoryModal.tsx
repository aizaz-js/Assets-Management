import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { AssetTypeIcon } from '@/components/shared/AssetTypeIcon'
import { useUpdateCategory, type CategoryConfig } from '@/hooks/useCategories'
import type { AssetType } from '@/types'

const schema = z.object({
  label: z.string().min(1, 'Label is required'),
  tag_prefix: z.string().min(1, 'Prefix is required').max(8, 'Max 8 characters').toUpperCase(),
  classification: z.enum(['employee_allocated', 'company_allocated']),
  is_active: z.boolean(),
})
type FormValues = z.infer<typeof schema>

const classificationOptions = [
  { value: 'employee_allocated', label: 'Employee Assets' },
  { value: 'company_allocated', label: 'Company Assets' },
]

interface EditCategoryModalProps {
  open: boolean
  onClose: () => void
  category: CategoryConfig
}

export function EditCategoryModal({ open, onClose, category }: EditCategoryModalProps) {
  const updateCategory = useUpdateCategory()

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: category.label,
      tag_prefix: category.tag_prefix,
      classification: category.classification,
      is_active: category.is_active,
    },
  })

  useEffect(() => {
    if (open) reset({
      label: category.label,
      tag_prefix: category.tag_prefix,
      classification: category.classification,
      is_active: category.is_active,
    })
  }, [open, category, reset])

  async function onSubmit(values: FormValues) {
    try {
      await updateCategory.mutateAsync({
        type_key: category.type_key,
        label: values.label,
        tag_prefix: values.tag_prefix.toUpperCase(),
        classification: values.classification,
        is_active: values.is_active,
        sort_order: category.sort_order,
      })
      toast.success('Category updated')
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update category')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Category"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={updateCategory.isPending}>
            Save
          </Button>
        </>
      }
    >
      <div className="flex items-center gap-3 mb-5 p-3 bg-[var(--color-bg)] rounded-lg">
        <div className="w-10 h-10 flex items-center justify-center bg-[var(--color-primary)]/10 rounded-lg">
          <AssetTypeIcon type={category.type_key as AssetType} size={22} />
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-secondary)]">type_key</p>
          <p className="font-mono text-sm font-semibold text-[var(--color-text)]">{category.type_key}</p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Display Name *"
          {...register('label')}
          error={errors.label?.message}
        />

        <Input
          label="Asset Tag Prefix *"
          placeholder="e.g. LT"
          {...register('tag_prefix')}
          error={errors.tag_prefix?.message}
        />

        <Controller
          name="classification"
          control={control}
          render={({ field }) => (
            <Select
              label="Classification *"
              options={classificationOptions}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.classification?.message}
            />
          )}
        />

        <Controller
          name="is_active"
          control={control}
          render={({ field }) => (
            <div className="flex items-center justify-between p-3 bg-[var(--color-bg)] rounded-lg">
              <div>
                <p className="text-sm font-medium text-[var(--color-text)]">Active</p>
                <p className="text-xs text-[var(--color-text-secondary)]">Inactive types are hidden from all dropdowns</p>
              </div>
              <button
                type="button"
                onClick={() => field.onChange(!field.value)}
                className={`relative w-11 h-6 rounded-full transition-colors ${field.value ? 'bg-[var(--color-primary)]' : 'bg-gray-300'}`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${field.value ? 'translate-x-5' : 'translate-x-0'}`}
                />
              </button>
            </div>
          )}
        />
      </form>
    </Modal>
  )
}
