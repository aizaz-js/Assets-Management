import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { repairSchema, type RepairFormValues } from '@/lib/validations'
import { useCreateRepair } from '@/hooks/useRepairs'
import type { Asset } from '@/types'
import { ASSET_TYPE_LABELS } from '@/lib/constants'

interface StartRepairModalProps {
  open: boolean
  onClose: () => void
  asset: Asset
}

export function StartRepairModal({ open, onClose, asset }: StartRepairModalProps) {
  const createRepair = useCreateRepair()
  const today = new Date().toISOString().slice(0, 10)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RepairFormValues>({
    resolver: zodResolver(repairSchema),
    defaultValues: {
      date_sent: today,
    },
  })

  async function onSubmit(values: RepairFormValues) {
    try {
      await createRepair.mutateAsync({
        asset_id: asset.id,
        fault_description: values.fault_description,
        repair_vendor_name: values.repair_vendor_name,
        repair_vendor_phone: values.repair_vendor_phone,
        date_sent: values.date_sent,
        expected_return_date: values.expected_return_date,
        estimated_cost_pkr: values.estimated_cost_pkr ?? null,
        damage_cause: 'unknown',
        warranty_claim: false,
        warranty_claim_ref: null,
        insurance_claim: false,
        status: 'open' as const,
        created_by: '',
      })
      toast.success('Repair record created. Asset moved to In Repair.')
      reset()
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create repair')
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose() }}
      title="Start Repair"
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={() => { reset(); onClose() }}>Cancel</Button>
          <Button variant="primary" onClick={handleSubmit(onSubmit)} loading={createRepair.isPending}>
            Confirm & Send to Repair
          </Button>
        </>
      }
    >
      <div className="mb-4 p-3 bg-[var(--color-repair-light)] rounded-lg">
        <p className="text-sm font-semibold text-[var(--color-repair)]">
          {asset.asset_tag} — {ASSET_TYPE_LABELS[asset.asset_type]}
        </p>
        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{asset.specs}</p>
      </div>

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
