import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { repairSchema, type RepairFormValues } from '@/lib/validations'
import { useUpdateRepair } from '@/hooks/useRepairs'
import type { RepairRecord } from '@/types'
import { ASSET_TYPE_LABELS } from '@/lib/constants'

interface EditRepairModalProps {
  open: boolean
  onClose: () => void
  repair: RepairRecord
}

export function EditRepairModal({ open, onClose, repair }: EditRepairModalProps) {
  const updateRepair = useUpdateRepair()

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RepairFormValues>({
    resolver: zodResolver(repairSchema),
    defaultValues: {
      fault_description: repair.fault_description,
      repair_vendor_name: repair.repair_vendor_name,
      repair_vendor_phone: repair.repair_vendor_phone,
      date_sent: repair.date_sent,
      expected_return_date: repair.expected_return_date,
      estimated_cost_pkr: repair.estimated_cost_pkr ?? undefined,
    },
  })

  useEffect(() => {
    if (open) reset({
      fault_description: repair.fault_description,
      repair_vendor_name: repair.repair_vendor_name,
      repair_vendor_phone: repair.repair_vendor_phone,
      date_sent: repair.date_sent,
      expected_return_date: repair.expected_return_date,
      estimated_cost_pkr: repair.estimated_cost_pkr ?? undefined,
    })
  }, [open, repair, reset])

  async function onSubmit(values: RepairFormValues) {
    try {
      await updateRepair.mutateAsync({ repairId: repair.id, values })
      toast.success('Repair record updated')
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to update repair')
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Edit Repair"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={updateRepair.isPending}>
            Save Changes
          </Button>
        </>
      }
    >
      {repair.asset && (
        <div className="mb-4 p-3 bg-[var(--color-repair-light)] rounded-lg">
          <p className="text-sm font-semibold text-[var(--color-repair)]">
            {repair.asset.asset_tag} — {ASSET_TYPE_LABELS[repair.asset.asset_type]}
          </p>
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <Textarea
          label="Fault Description *"
          rows={3}
          {...register('fault_description')}
          error={errors.fault_description?.message}
        />

        <div className="grid grid-cols-2 gap-4">
          <Input label="Repair Vendor Name *" {...register('repair_vendor_name')} error={errors.repair_vendor_name?.message} />
          <Input label="Repair Vendor Phone *" {...register('repair_vendor_phone')} error={errors.repair_vendor_phone?.message} />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Date Sent *" type="date" {...register('date_sent')} error={errors.date_sent?.message} />
          <Input label="Expected Return Date *" type="date" {...register('expected_return_date')} error={errors.expected_return_date?.message} />
        </div>

        <Input
          label="Estimated Cost (PKR)"
          type="number"
          min={0}
          {...register('estimated_cost_pkr', { valueAsNumber: true, setValueAs: (v) => v === '' ? null : Number(v) })}
          error={errors.estimated_cost_pkr?.message}
        />
      </form>
    </Modal>
  )
}
