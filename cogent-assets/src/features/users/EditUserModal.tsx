import { useEffect } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { useUpdateUser } from '@/hooks/useUsers'
import type { Profile } from '@/types'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  role: z.enum(['admin', 'manager', 'finance', 'employee']),
  designation: z.string().optional(),
  department: z.string().optional(),
  engagement_type: z.enum(['permanent', 'contract', 'intern']),
  engagement_end_date: z.string().optional(),
  status: z.enum(['active', 'inactive']),
})
type FormValues = z.infer<typeof schema>

const roleOptions = [
  { value: 'employee', label: 'Employee' },
  { value: 'finance', label: 'Finance' },
  { value: 'manager', label: 'Manager' },
  { value: 'admin', label: 'Admin' },
]

const engagementOptions = [
  { value: 'permanent', label: 'Permanent' },
  { value: 'contract', label: 'Contract' },
  { value: 'intern', label: 'Intern' },
]

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
]

interface EditUserModalProps {
  open: boolean
  onClose: () => void
  profile: Profile
}

export function EditUserModal({ open, onClose, profile }: EditUserModalProps) {
  const updateUser = useUpdateUser()

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: profile.name,
      role: profile.role,
      designation: profile.designation ?? '',
      department: profile.department ?? '',
      engagement_type: profile.engagement_type,
      engagement_end_date: profile.engagement_end_date ?? '',
      status: profile.status,
    },
  })

  useEffect(() => {
    if (open) reset({
      name: profile.name,
      role: profile.role,
      designation: profile.designation ?? '',
      department: profile.department ?? '',
      engagement_type: profile.engagement_type,
      engagement_end_date: profile.engagement_end_date ?? '',
      status: profile.status,
    })
  }, [open, profile, reset])

  const engagementType = watch('engagement_type')

  async function onSubmit(values: FormValues) {
    try {
      await updateUser.mutateAsync({
        id: profile.id,
        values: {
          name: values.name,
          role: values.role,
          designation: values.designation || null,
          department: values.department || null,
          engagement_type: values.engagement_type,
          engagement_end_date: values.engagement_end_date || null,
          status: values.status,
        },
      })
      toast.success('User updated')
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit User"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={updateUser.isPending}>
            Save Changes
          </Button>
        </>
      }
    >
      <div className="mb-4 p-3 bg-[var(--color-bg)] rounded-lg">
        <p className="text-xs text-[var(--color-text-secondary)]">{profile.email}</p>
      </div>

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Input label="Full Name *" {...register('name')} error={errors.name?.message} />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Designation" {...register('designation')} error={errors.designation?.message} />
          <Input label="Department" {...register('department')} error={errors.department?.message} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="role"
            control={control}
            render={({ field }) => (
              <Select
                label="Role *"
                options={roleOptions}
                value={field.value}
                onValueChange={field.onChange}
                error={errors.role?.message}
              />
            )}
          />
          <Controller
            name="status"
            control={control}
            render={({ field }) => (
              <Select
                label="Status *"
                options={statusOptions}
                value={field.value}
                onValueChange={field.onChange}
                error={errors.status?.message}
              />
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="engagement_type"
            control={control}
            render={({ field }) => (
              <Select
                label="Engagement Type *"
                options={engagementOptions}
                value={field.value}
                onValueChange={field.onChange}
                error={errors.engagement_type?.message}
              />
            )}
          />
          {(engagementType === 'contract' || engagementType === 'intern') && (
            <Input
              label="Engagement End Date"
              type="date"
              {...register('engagement_end_date')}
              error={errors.engagement_end_date?.message}
            />
          )}
        </div>
      </form>
    </Modal>
  )
}
