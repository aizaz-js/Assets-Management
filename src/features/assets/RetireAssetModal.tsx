import { useForm, Controller } from 'react-hook-form'
import toast from 'react-hot-toast'
import { Archive } from 'lucide-react'
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
          <button
            type="button"
            disabled={changeStatus.isPending}
            onClick={handleSubmit(onSubmit)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
          >
            <Archive className="w-4 h-4" />
            {changeStatus.isPending ? 'Retiring…' : 'Retire Asset'}
          </button>
        </>
      }
    >
      <div className="space-y-5">
        <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 border border-amber-200">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
            <Archive className="w-5 h-5 text-amber-700" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">
              Retiring <span className="font-mono">{asset.asset_tag}</span>
            </p>
            <p className="text-xs text-amber-800 mt-1 leading-relaxed">
              Retired assets are kept in the system for audit history but are removed from
              active inventory and cannot be reassigned. To remove the asset entirely, use
              <span className="font-semibold"> Delete</span> instead.
            </p>
          </div>
        </div>

        <Controller
          name="retirement_reason"
          control={control}
          rules={{ required: 'Please select a reason' }}
          render={({ field }) => (
            <Select
              label="Reason for retirement *"
              options={RETIREMENT_REASON_OPTIONS}
              value={field.value}
              onValueChange={field.onChange}
              error={errors.retirement_reason?.message}
              placeholder="Select a reason..."
            />
          )}
        />
      </div>
    </Modal>
  )
}
