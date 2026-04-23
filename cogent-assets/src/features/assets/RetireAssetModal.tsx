import { useForm, Controller } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { useChangeAssetStatus } from '@/hooks/useAssets'
import { RETIREMENT_REASON_OPTIONS } from '@/lib/constants'
import type { Asset } from '@/types'

interface RetireAssetModalProps {
  open: boolean
  onClose: () => void
  asset: Asset
}

export function RetireAssetModal({ open, onClose, asset }: RetireAssetModalProps) {
  const changeStatus = useChangeAssetStatus()
  const { control, handleSubmit, reset, formState: { errors } } = useForm<{ retirement_reason: string }>()

  async function onSubmit(values: { retirement_reason: string }) {
    try {
      await changeStatus.mutateAsync({
        id: asset.id,
        newStatus: 'retired',
        before: asset,
        extra: { retirement_reason: values.retirement_reason as Asset['retirement_reason'] },
      })
      toast.success('Asset retired')
      reset()
      onClose()
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to retire asset')
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose() }}
      title="Retire Asset"
      size="md"
      footer={
        <>
          <Button variant="secondary" onClick={() => { reset(); onClose() }}>Cancel</Button>
          <Button variant="danger" onClick={handleSubmit(onSubmit)} loading={changeStatus.isPending}>
            Confirm Retirement
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-[var(--color-text-secondary)]">
          Retiring <strong className="font-mono text-[var(--color-primary)]">{asset.asset_tag}</strong> is permanent. Please select a reason.
        </p>
        <Controller
          name="retirement_reason"
          control={control}
          rules={{ required: 'Reason is required' }}
          render={({ field }) => (
            <Select
              label="Retirement Reason *"
              options={RETIREMENT_REASON_OPTIONS}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.retirement_reason?.message}
            />
          )}
        />
      </div>
    </Modal>
  )
}
