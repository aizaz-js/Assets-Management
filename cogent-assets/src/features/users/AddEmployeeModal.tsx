import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import toast from 'react-hot-toast'
import { useQueryClient } from '@tanstack/react-query'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { supabase } from '@/lib/supabase'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z
    .string()
    .email('Invalid email')
    .refine((e) => e.toLowerCase().endsWith('@cogentlabs.co'), {
      message: 'Only @cogentlabs.co email addresses are allowed',
    }),
  role: z.enum(['admin', 'employee']),
  designation: z.string().optional(),
  department: z.string().optional(),
})
type FormValues = z.infer<typeof schema>

const roleOptions = [
  { value: 'employee', label: 'Employee' },
  { value: 'admin', label: 'Admin' },
]

interface AddEmployeeModalProps {
  open: boolean
  onClose: () => void
}

export function AddEmployeeModal({ open, onClose }: AddEmployeeModalProps) {
  const qc = useQueryClient()
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { role: 'employee' },
  })

  async function onSubmit(values: FormValues) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', values.email.toLowerCase())
      .maybeSingle()

    if (existing) {
      toast.error('An employee with this email already exists')
      return
    }

    setSubmitting(true)
    try {
      const { error } = await supabase.from('profiles').insert({
        id: crypto.randomUUID(),
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        role: values.role,
        designation: values.designation?.trim() || null,
        department: values.department?.trim() || null,
        status: 'active',
        manually_created: true,
      })

      if (error) {
        if (error.code === '23505') {
          toast.error('An employee with this email already exists')
        } else if (error.code === '42501') {
          toast.error('Permission denied. Make sure you are logged in as admin.')
        } else {
          toast.error(error.message || 'Failed to add employee')
        }
        return
      }

      qc.invalidateQueries({ queryKey: ['users'] })
      toast.success('Employee added successfully')
      reset()
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to add employee')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose() }}
      title="Add Employee"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={() => { reset(); onClose() }}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={submitting}>
            Add Employee
          </Button>
        </>
      }
    >
      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full Name *" {...register('name')} error={errors.name?.message} />
          <Input label="Email *" type="email" {...register('email')} error={errors.email?.message} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Designation" {...register('designation')} error={errors.designation?.message} />
          <Input label="Department" {...register('department')} error={errors.department?.message} />
        </div>

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
      </form>
    </Modal>
  )
}
