import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import {
  Laptop, Smartphone, Monitor, MousePointer, Keyboard, Camera,
  HardDrive, Briefcase, Package, Armchair, Layout, Video,
  Speaker, Zap, PenTool, Wifi, Headphones, Printer, Phone,
  Tablet, Watch, Tv, Battery, Cpu, Server, Database,
  Shield, Wrench, Star, Tag, Box,
} from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { useAddCategory } from '@/hooks/useCategories'

const ICON_OPTIONS = [
  { name: 'Laptop', icon: Laptop },
  { name: 'Smartphone', icon: Smartphone },
  { name: 'Monitor', icon: Monitor },
  { name: 'Mouse', icon: MousePointer },
  { name: 'Keyboard', icon: Keyboard },
  { name: 'Camera', icon: Camera },
  { name: 'HardDrive', icon: HardDrive },
  { name: 'Briefcase', icon: Briefcase },
  { name: 'Package', icon: Package },
  { name: 'Chair', icon: Armchair },
  { name: 'Layout', icon: Layout },
  { name: 'Video', icon: Video },
  { name: 'Speaker', icon: Speaker },
  { name: 'Zap', icon: Zap },
  { name: 'PenTool', icon: PenTool },
  { name: 'Wifi', icon: Wifi },
  { name: 'Headphones', icon: Headphones },
  { name: 'Printer', icon: Printer },
  { name: 'Phone', icon: Phone },
  { name: 'Tablet', icon: Tablet },
  { name: 'Watch', icon: Watch },
  { name: 'Tv', icon: Tv },
  { name: 'Battery', icon: Battery },
  { name: 'Cpu', icon: Cpu },
  { name: 'Server', icon: Server },
  { name: 'Database', icon: Database },
  { name: 'Shield', icon: Shield },
  { name: 'Wrench', icon: Wrench },
  { name: 'Star', icon: Star },
  { name: 'Tag', icon: Tag },
  { name: 'Box', icon: Box },
]

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
})
type FormValues = z.infer<typeof schema>

interface AddCategoryModalProps {
  open: boolean
  onClose: () => void
  classification: 'employee_allocated' | 'company_allocated'
  nextSortOrder: number
}

export function AddCategoryModal({ open, onClose, classification, nextSortOrder }: AddCategoryModalProps) {
  const addCategory = useAddCategory()
  const [selectedIcon, setSelectedIcon] = useState('Package')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  })

  function handleClose() {
    reset()
    setSelectedIcon('Package')
    onClose()
  }

  async function onSubmit(values: FormValues) {
    try {
      await addCategory.mutateAsync({
        name: values.name.trim(),
        classification,
        icon: selectedIcon,
        sort_order: nextSortOrder,
      })
      toast.success(`${values.name} category added`)
      handleClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add category')
    }
  }

  const classLabel = classification === 'employee_allocated' ? 'Employee Assets' : 'Company Assets'

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Add Category"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={handleClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={addCategory.isPending}>
            Add Category
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-bg)] rounded-lg text-sm">
          <span className="text-[var(--color-text-secondary)]">Classification:</span>
          <span className="font-medium text-[var(--color-text)]">{classLabel}</span>
        </div>

        <Input
          label="Display Name *"
          placeholder="e.g. Tablet"
          {...register('name')}
          error={errors.name?.message}
        />

        <div>
          <p className="text-sm font-medium text-[var(--color-text)] mb-2">Icon *</p>
          <div className="grid grid-cols-6 gap-2 max-h-52 overflow-y-auto border border-[var(--color-border)] rounded-lg p-3">
            {ICON_OPTIONS.map(({ name, icon: Icon }) => (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedIcon(name)}
                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-colors hover:bg-gray-50 border-2 ${
                  selectedIcon === name
                    ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)]'
                    : 'border-transparent'
                }`}
              >
                <Icon className="w-5 h-5 text-gray-700" />
                <span className="text-[9px] text-gray-500 text-center leading-tight">{name}</span>
              </button>
            ))}
          </div>
        </div>
      </form>
    </Modal>
  )
}
