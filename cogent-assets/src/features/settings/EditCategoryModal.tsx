import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import * as LucideIcons from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useUpdateCategory, type CategoryConfig } from '@/hooks/useCategories'

const schema = z.object({
  label: z.string().min(1, 'Label is required'),
  tag_prefix: z.string().min(1, 'Prefix is required').max(8, 'Max 8 characters'),
  is_active: z.boolean(),
})
type FormValues = z.infer<typeof schema>

function getIcon(iconName: string | undefined): React.ComponentType<{ className?: string; size?: number }> {
  if (!iconName) return LucideIcons.Package as React.ComponentType<{ className?: string; size?: number }>
  const Icon = (LucideIcons as Record<string, unknown>)[iconName] as React.ComponentType<{ className?: string; size?: number }> | undefined
  return Icon ?? (LucideIcons.Package as React.ComponentType<{ className?: string; size?: number }>)
}

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
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      label: category.label,
      tag_prefix: category.tag_prefix,
      is_active: category.is_active,
    },
  })

  const tagPrefixVal = watch('tag_prefix')

  useEffect(() => {
    if (open) reset({
      label: category.label,
      tag_prefix: category.tag_prefix,
      is_active: category.is_active,
    })
  }, [open, category, reset])

  async function onSubmit(values: FormValues) {
    try {
      await updateCategory.mutateAsync({
        ...category,
        label: values.label,
        tag_prefix: values.tag_prefix.toUpperCase().trim(),
        is_active: values.is_active,
      })
      toast.success('Category updated')
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update category')
    }
  }

  const Icon = getIcon(category.icon)

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
          <Icon size={22} className="text-[var(--color-primary)]" />
        </div>
        <div>
          <p className="text-xs text-[var(--color-text-secondary)]">slug</p>
          <p className="font-mono text-sm font-semibold text-[var(--color-text)]">{category.type_key}</p>
        </div>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input
          label="Display Name *"
          {...register('label')}
          error={errors.label?.message}
        />

        <div>
          <Input
            label="Tag Prefix *"
            placeholder="e.g. LT, MP, CLED"
            {...register('tag_prefix', {
              setValueAs: (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, ''),
            })}
            error={errors.tag_prefix?.message}
          />
          {tagPrefixVal && (
            <p className="mt-1 text-xs text-[var(--color-text-secondary)]">
              Preview: <span className="font-mono font-semibold">{tagPrefixVal.toUpperCase()}-0001</span>
              {' '}· This prefix will auto-fill when creating assets
            </p>
          )}
        </div>

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
